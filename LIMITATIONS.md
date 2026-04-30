# ThetaDhan — Platform Limitations & Free Tier Constraints

> This document outlines all known limitations of the ThetaDhan platform when deployed on
> Cloudflare's free tier. Review this before scaling or adding new broker integrations.

---

## 1. Cloudflare Workers (Backend API)

| Constraint | Free Tier Limit | Impact |
|-----------|----------------|--------|
| **Requests/day** | 100,000 | ~3,300/hour. Sufficient for 1 user trading 6 hours/day (~15K req). Multi-user would exceed this. |
| **CPU time/request** | 10 ms | Only measures compute, NOT I/O wait. Dhan API proxy calls are mostly I/O (network), so actual CPU is ~2-5ms. Safe. |
| **Worker size** | 1 MB (compressed) | Hono + routes + TOTP = ~200KB. Comfortable. |
| **Subrequests** | 50 per request | Each Worker invocation can make max 50 outbound fetch calls. We use 1-2 per request (to Dhan). Fine. |
| **Request body size** | 100 MB | Orders are tiny JSON payloads (~1KB). No issue. |
| **Environment variables** | 64 per Worker | We use ~10. Fine. |
| **Cron Triggers** | 5 per Worker | Used for daily instrument sync. Fine. |

### ⚠️ Key Risk
- **No static IP**: Cloudflare Workers run on shared edge IPs. Dhan's SEBI-mandated static IP whitelisting for **order placement** may block orders. Data APIs (quotes, positions, funds) work without IP restriction.
- **Mitigation**: If orders are blocked, route order placement through a static-IP VPS proxy.

---

## 2. Cloudflare D1 (Database — SQLite)

| Constraint | Free Tier Limit | Impact |
|-----------|----------------|--------|
| **Databases/account** | 10 | We use 1. Fine. |
| **Storage/database** | 500 MB | Dhan instrument master CSV = ~15-20MB. Settings + watchlists < 1MB. Fine. |
| **Total storage** | 5 GB (account) | Fine. |
| **Rows read/day** | 5,000,000 | Instrument lookups: ~50K/day max. Fine. |
| **Rows written/day** | 100,000 | Settings changes + trade journal: ~500/day. Fine. |
| **Max row size** | 1 MB (single row) | No large blobs needed. Fine. |
| **Batch size** | 100 statements per batch | Instrument sync needs batching (20K+ rows in 200 batches). |

### ⚠️ Key Risk
- **No real-time replication**: D1 is eventually consistent across edge locations. Not an issue for a single-user tool.
- **No stored procedures**: All logic lives in the Worker. SQL is read/write only.

---

## 3. Cloudflare Durable Objects (WebSocket Relay)

| Constraint | Free Tier Limit | Impact |
|-----------|----------------|--------|
| **Availability** | ✅ Free (SQLite-backed only) | We use SQLite-backed DO. Fine. |
| **WebSocket connections** | No hard limit (hibernation used) | We maintain 1 browser + 1 Dhan feed. Fine. |
| **Storage per DO** | 1 GB | We store minimal state (subscribed instruments). Fine. |
| **CPU per request** | 30s wall-clock (with hibernation) | WebSocket message handling is <1ms. Fine. |

### ⚠️ Key Risk
- **Cold start**: First WebSocket connection after idle period may take 200-500ms. Not visible to user.
- **Single region**: Free-tier DO runs in one region. Latency from India to nearest Cloudflare PoP is ~20-50ms.

---

## 4. Cloudflare Pages (Frontend)

| Constraint | Free Tier Limit | Impact |
|-----------|----------------|--------|
| **Sites** | Unlimited | Fine. |
| **Bandwidth** | Unlimited | Fine. |
| **Build time** | 20 minutes/build | React+Vite build takes ~30s. Fine. |
| **Builds/month** | 500 | Plenty for development. |
| **File size** | 25 MB per file | Our largest file (index.css) is ~42KB. Fine. |
| **Max files** | 20,000 | We have ~100 files. Fine. |

---

## 5. Dhan API Limits

| Constraint | Limit | Impact |
|-----------|-------|--------|
| **Rate limit** | 20 requests/second | Must throttle during batch operations (instrument sync, multi-symbol quotes) |
| **Market data subscriptions** | 5,000 instruments per WebSocket | More than enough for ~220 F&O symbols |
| **WebSocket connections** | 5 max per account | Feed relay uses 1. Browser testing uses 1. Safe. If >5, oldest disconnects. |
| **Token validity** | 24 hours | TOTP auto-renewal handles this. No issue. |
| **Order types** | MARKET, LIMIT, SL, SL-M | Covers all standard F&O needs |
| **Static IP** | Required for order APIs | ⚠️ **CRITICAL** — see Section 1 |
| **Historical data** | Based on data plan | Free plan: limited candle data. Paid plan: full history. |

---

## 6. Browser-Side Constraints

| Constraint | Details | Mitigation |
|-----------|---------|------------|
| **Binary parsing** | Dhan feed sends Little Endian binary packets. Browser must decode via `DataView`. | Optimized parser in `binaryParser.js` |
| **WebSocket limit** | Browsers allow ~6 WS connections per domain | We use 1 (to Durable Object relay) |
| **Token in memory** | Dhan access token stored in browser memory (Zustand store) | Acceptable for personal trading tool. Token refreshes every 24h. |
| **No background execution** | Browser tab must stay open for live feed | Standard for web trading terminals |

---

## 7. Multi-Broker Readiness

| Broker | Status | Notes |
|--------|--------|-------|
| **Dhan** | 🟢 Live | Full integration (TOTP auto-login + feed + trading) |
| **Upstox** | 🔲 Planned | OAuth2 flow. REST API similar structure. |
| **XTS (SRE)** | 🔲 Planned | Interactive token. WebSocket feed format differs. |
| **Groww** | 🔲 Future | Limited API access. |
| **Shoonya** | 🔲 Future | REST + WebSocket. |
| **Fyers** | 🔲 Future | OAuth2 + WebSocket. |

### Architecture for Multi-Broker
```
Worker routes are broker-agnostic:
  /api/auth/login     → picks adapter based on { broker: "dhan" | "upstox" | ... }
  /api/orders/place   → routes to correct broker adapter
  /api/positions      → normalizes response from any broker

Each broker adapter is a separate file:
  worker/src/adapters/dhan.js
  worker/src/adapters/upstox.js    (future)
  worker/src/adapters/xts.js       (future)
```

---

## 8. What You CAN'T Do on Free Tier

1. **Multi-user SaaS** — 100K requests/day is for ONE active trader. Adding users requires Workers Paid ($5/mo).
2. **Tick-by-tick recording** — D1 write limit (100K/day) prevents storing every tick. Use aggregated snapshots.
3. **Heavy backtesting** — 10ms CPU limit prevents complex calculations. Use a separate compute service.
4. **Large file uploads** — 100MB body limit. Not needed for trading.
5. **Real-time alerts via push** — No background Workers on free tier. Cron triggers run max every 1 minute.

---

*Last updated: 2026-04-30*
*ThetaDhan v1.0 — Cloudflare Edge Deployment*
