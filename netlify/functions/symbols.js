const BYBIT = "https://api.bybit.com";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

async function fetchJson(url, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Bybit request failed (${res.status}): ${text.slice(0, 180)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    let cursor = "";
    const symbols = [];

    for (let i = 0; i < 4; i++) {
      const qs = new URLSearchParams({ category: "linear", status: "Trading", limit: "1000" });
      if (cursor) qs.set("cursor", cursor);
      const res = await fetchJson(`${BYBIT}/v5/market/instruments-info?${qs.toString()}`);
      const list = res?.result?.list || [];
      for (const item of list) {
        if (item?.status === "Trading" && String(item.symbol || "").endsWith("USDT")) {
          symbols.push(String(item.symbol).toUpperCase());
        }
      }
      cursor = res?.result?.nextPageCursor || res?.result?.cursor || "";
      if (!cursor) break;
    }

    const preferred = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "DOGEUSDT", "AVAXUSDT", "ADAUSDT", "LINKUSDT", "TONUSDT", "SUIUSDT", "AAVEUSDT", "PEPEUSDT"];
    const merged = [...new Set([...preferred, ...symbols])].sort();

    return json(200, { symbols: merged.slice(0, 400), source: "Bybit instruments-info" });
  } catch (err) {
    return json(500, {
      error: err?.message || "Unknown error",
      symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "DOGEUSDT", "AVAXUSDT", "ADAUSDT"],
    });
  }
};
