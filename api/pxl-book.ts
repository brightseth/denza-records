/**
 * api/pxl-book.ts — public, read-only "PXL Book" for any wallet.
 *
 * Kim Asendorf's collectors (and anyone) can look up what PXL a single address holds:
 * decks and pods with their attached pixels + rank, plus each deck's *unexercised mint
 * allowance* — the standout, easy-to-miss fact that every intact deck is a 500k-PXL call
 * option at the fixed 0.000001 ETH/PXL rate.
 *
 *   GET /api/pxl-book?wallet=<0x… | name.eth>
 *     → { input, address, ens, decks:[{id,attached,allowance,rank}],
 *         pods:[{id,attached,rank}],
 *         totals:{deckCount,podCount,attachedPxl,unexercisedAllowance,
 *                 pixelPriceEth,attachedValueEth,mintCostEth},
 *         snapshotAt, generatedAt }
 *
 * Strictly per-wallet. No aggregation across wallets, no signature, no writes — this reads
 * the same public on-chain facts anyone can read, for one address at a time. It never logs
 * the queried address. Rate-limited to protect the shared RPC key.
 *
 * Read layer: viem multicall in 64-call chunks with allowFailure + per-result status check.
 * ownerOf(1..256) enumerates holdings (the contracts are not ERC721Enumerable); held decks
 * then get a live pixels/allowance read, held pods a live getPixels read. Collection-wide
 * rank comes from the precomputed snapshot (public/market/pxl-tokens.json).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, http, getAddress, isAddress } from "viem";
import { mainnet } from "viem/chains";

const DECK = "0x81345761670fc8b90665466a94c196e26b92ecfb";
const POD = "0xaee022552b539db18297d7481b6d547c622488b3";
const abiDeck = [
  { name: "ownerOf", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
  { name: "pixels", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const;
const abiPod = [
  { name: "ownerOf", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
  { name: "getPixels", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256[]" }] },
] as const;

const IDS = Array.from({ length: 256 }, (_, i) => BigInt(i + 1));

function client() {
  const rpc = process.env.ALCHEMY_RPC_URL;
  if (!rpc) throw new Error("no_rpc");
  return createPublicClient({ chain: mainnet, transport: http(rpc) });
}

// Chunked (64) multicall with strict null-checking: a failed sub-call throws rather than
// silently decoding to 0. `allowFailure:true` is only so one reverting id doesn't nuke the
// batch — we still treat any non-success as fatal for ownerOf/allowance reads.
async function multiChunked(c: ReturnType<typeof client>, contracts: any[]): Promise<any[]> {
  const out: any[] = [];
  for (let i = 0; i < contracts.length; i += 64) {
    const chunk = contracts.slice(i, i + 64);
    const res = await c.multicall({ contracts: chunk, allowFailure: true });
    res.forEach((r, j) => {
      if (r.status !== "success") throw new Error(`call ${i + j} failed`);
      out.push(r.result);
    });
  }
  return out;
}

function loadSnapshot() {
  const p = join(process.cwd(), "public", "market", "pxl-tokens.json");
  if (!existsSync(p)) throw new Error("no_snapshot");
  return JSON.parse(readFileSync(p, "utf8"));
}

// simple per-IP rate limit (protects the RPC key; per-wallet reads are ~cheap but bounded)
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now(), win = 60_000, max = 20;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if ((req.method || "GET").toUpperCase() !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ error: "rate_limited" });

  const raw = String(req.query.wallet || "").trim();
  if (!raw) return res.status(400).json({ error: "missing_wallet" });
  if (raw.length > 100) return res.status(400).json({ error: "bad_wallet" });

  let c: ReturnType<typeof client>;
  try { c = client(); } catch { return res.status(500).json({ error: "rpc_unconfigured" }); }

  // Resolve input → checksummed address. Accept a raw 0x address or an ENS name.
  let address: string, ens: string | null = null;
  try {
    if (isAddress(raw)) {
      address = getAddress(raw);
    } else if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(raw)) {
      const resolved = await c.getEnsAddress({ name: raw.toLowerCase() });
      if (!resolved) return res.status(404).json({ error: "ens_not_found", input: raw });
      address = getAddress(resolved);
      ens = raw.toLowerCase();
    } else {
      return res.status(400).json({ error: "bad_wallet" });
    }
  } catch (e: any) {
    console.error("pxl-book resolve_failed:", e?.message);
    return res.status(400).json({ error: "resolve_failed" });
  }

  let snapshot: any;
  try { snapshot = loadSnapshot(); } catch { return res.status(500).json({ error: "snapshot_unavailable" }); }

  const target = address.toLowerCase();
  try {
    // 1) enumerate ownership across both collections (512 ownerOf calls)
    const deckOwners = await multiChunked(c, IDS.map((id) => ({ address: DECK, abi: abiDeck, functionName: "ownerOf", args: [id] })));
    const podOwners = await multiChunked(c, IDS.map((id) => ({ address: POD, abi: abiPod, functionName: "ownerOf", args: [id] })));
    const heldDeckIds = IDS.filter((_, i) => String(deckOwners[i]).toLowerCase() === target).map((id) => Number(id));
    const heldPodIds = IDS.filter((_, i) => String(podOwners[i]).toLowerCase() === target).map((id) => Number(id));

    // 2) live reads for held tokens only
    const deckReads = heldDeckIds.length
      ? await multiChunked(c, heldDeckIds.flatMap((id) => [
          { address: DECK, abi: abiDeck, functionName: "pixels", args: [BigInt(id)] },
          { address: DECK, abi: abiDeck, functionName: "allowance", args: [BigInt(id)] },
        ]))
      : [];
    const podReads = heldPodIds.length
      ? await multiChunked(c, heldPodIds.map((id) => ({ address: POD, abi: abiPod, functionName: "getPixels", args: [BigInt(id)] })))
      : [];

    const decks = heldDeckIds.map((id, i) => ({
      id,
      attached: Number(deckReads[i * 2]),
      allowance: Number(deckReads[i * 2 + 1]),
      rank: snapshot.decks?.[id]?.rank ?? null,
    })).sort((a, b) => b.attached - a.attached);

    const pods = heldPodIds.map((id, i) => ({
      id,
      attached: (podReads[i] as bigint[]).reduce((s, x) => s + Number(x), 0),
      rank: snapshot.pods?.[id]?.rank ?? null,
    })).sort((a, b) => b.attached - a.attached);

    const attachedPxl = decks.reduce((s, d) => s + d.attached, 0) + pods.reduce((s, p) => s + p.attached, 0);
    const unexercisedAllowance = decks.reduce((s, d) => s + d.allowance, 0);
    const pxe = Number(snapshot.pixelPriceEth) || 0.000001;
    const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

    return res.status(200).json({
      input: raw,
      address,
      ens,
      decks,
      pods,
      totals: {
        deckCount: decks.length,
        podCount: pods.length,
        attachedPxl,
        unexercisedAllowance,
        pixelPriceEth: pxe,
        attachedValueEth: round4(attachedPxl * pxe),
        mintCostEth: round4(unexercisedAllowance * pxe),
      },
      snapshotAt: snapshot.generatedAt || null,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("pxl-book chain_read_failed:", e?.message);
    return res.status(502).json({ error: "chain_read_failed" });
  }
}
