const API_ANALYZE = "/.netlify/functions/analyze";
const API_SYMBOLS = "/.netlify/functions/symbols";

const els = {
  symbolSelect: document.getElementById("symbolSelect"),
  capital: document.getElementById("capital"),
  riskPercent: document.getElementById("riskPercent"),
  leverageMode: document.getElementById("leverageMode"),
  leverage: document.getElementById("leverage"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  refreshSymbols: document.getElementById("refreshSymbols"),
  loading: document.getElementById("loading"),
  errorBox: document.getElementById("errorBox"),
  signalBadge: document.getElementById("signalBadge"),
  signalMain: document.getElementById("signalMain"),
  confidencePreview: document.getElementById("confidencePreview"),
  confidenceMain: document.getElementById("confidenceMain"),
  reasonText: document.getElementById("reasonText"),
  rrRatio: document.getElementById("rrRatio"),
  marketCondition: document.getElementById("marketCondition"),
  volumeCondition: document.getElementById("volumeCondition"),
  tapeMomentum: document.getElementById("tapeMomentum"),
  entryPrice: document.getElementById("entryPrice"),
  stopLoss: document.getElementById("stopLoss"),
  tp1: document.getElementById("tp1"),
  tp2: document.getElementById("tp2"),
  tp3: document.getElementById("tp3"),
  suggestedLev: document.getElementById("suggestedLev"),
  currentPrice: document.getElementById("currentPrice"),
  spreadInfo: document.getElementById("spreadInfo"),
  orderbookPressure: document.getElementById("orderbookPressure"),
  tapeInfo: document.getElementById("tapeInfo"),
  volumeInfo: document.getElementById("volumeInfo"),
  feeInfo: document.getElementById("feeInfo"),
  indicatorList: document.getElementById("indicatorList"),
  bidVolume: document.getElementById("bidVolume"),
  askVolume: document.getElementById("askVolume"),
  bestBid: document.getElementById("bestBid"),
  bestAsk: document.getElementById("bestAsk"),
  riskAmount: document.getElementById("riskAmount"),
  qtyEstimate: document.getElementById("qtyEstimate"),
  notionalEstimate: document.getElementById("notionalEstimate"),
  precisionInfo: document.getElementById("precisionInfo"),
  sourceTag: document.getElementById("sourceTag"),
  marketPreview: document.getElementById("marketPreview"),
  volumePreview: document.getElementById("volumePreview"),
  pressurePreview: document.getElementById("pressurePreview"),
};

const fmt = (v, d = 4) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "--";
  const n = Number(v);
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: d });
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: d });
};

function setLoading(loading) {
  els.loading.classList.toggle("hidden", !loading);
  els.analyzeBtn.disabled = loading;
  els.refreshSymbols.disabled = loading;
  els.analyzeBtn.textContent = loading ? "Analyzing..." : "Start Analysis";
}

function setError(message) {
  if (!message) {
    els.errorBox.classList.add("hidden");
    els.errorBox.textContent = "";
    return;
  }
  els.errorBox.classList.remove("hidden");
  els.errorBox.textContent = message;
}

function setSignal(signal) {
  const classes = ["signal-badge", "big"];
  if (signal === "BUY") classes.push("buy");
  else if (signal === "SELL") classes.push("sell");
  else classes.push("neutral");
  els.signalBadge.className = classes.join(" ");
  els.signalMain.className = classes.join(" ");
  els.signalBadge.textContent = signal;
  els.signalMain.textContent = signal;
}

function updateIndicators(indicators = {}) {
  const items = [
    ["EMA 9", fmt(indicators.ema9), "Fast trend line."],
    ["EMA 21", fmt(indicators.ema21), "Confirmation trend line."],
    ["SMA 50", fmt(indicators.sma50), "Structure bias."],
    ["RSI 14", fmt(indicators.rsi14, 2), "Momentum strength."],
    ["MACD", indicators.macd ? `L ${fmt(indicators.macd.macdLine, 6)} / S ${fmt(indicators.macd.signalLine, 6)} / H ${fmt(indicators.macd.histogram, 6)}` : "--", "Trend acceleration."],
    ["Bollinger Bands", indicators.bollinger_bands ? `U ${fmt(indicators.bollinger_bands.upper)} / M ${fmt(indicators.bollinger_bands.middle)} / L ${fmt(indicators.bollinger_bands.lower)}` : "--", "Volatility envelope."],
    ["ATR 14", fmt(indicators.atr14), "Average true range."],
    ["EMA gap %", fmt(indicators.ema_gap_pct, 4) + "%", "Separation between EMA 9 and 21."],
  ];

  els.indicatorList.innerHTML = items.map(([title, value, note]) => `
    <div class="indicator-item">
      <span class="subtle">${title}</span>
      <strong>${value}</strong>
      <span class="note">${note}</span>
    </div>
  `).join("");
}

function fillSymbols(symbols) {
  const preferred = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "DOGEUSDT", "AVAXUSDT", "ADAUSDT"];
  const merged = [...new Set([...preferred, ...symbols])].slice(0, 250);
  els.symbolSelect.innerHTML = merged.map(sym => `<option value="${sym}">${sym}</option>`).join("");
  if (!merged.includes(els.symbolSelect.value)) els.symbolSelect.value = preferred[0];
}

async function loadSymbols() {
  setError("");
  try {
    const res = await fetch(API_SYMBOLS);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Failed to load symbols (${res.status})`);
    fillSymbols(Array.isArray(data.symbols) ? data.symbols : []);
  } catch (err) {
    fillSymbols(["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "DOGEUSDT", "AVAXUSDT", "ADAUSDT"]);
    setError(`Symbol list fallback used: ${err.message}`);
  }
}

function updateResult(data) {
  setSignal(data.signal || "NO TRADE");
  els.confidencePreview.textContent = `${fmt(data.confidence, 0)}%`;
  els.confidenceMain.textContent = `${fmt(data.confidence, 0)}%`;
  els.reasonText.textContent = data.reason || "No explanation returned.";
  els.rrRatio.textContent = data.risk_reward_ratio ? fmt(data.risk_reward_ratio, 2) : "--";
  els.marketCondition.textContent = data.market_condition || "--";
  els.volumeCondition.textContent = data.volume_condition || "--";
  els.tapeMomentum.textContent = data.tape_momentum || "--";
  els.entryPrice.textContent = data.entry_price ? fmt(data.entry_price) : "--";
  els.stopLoss.textContent = data.stop_loss ? fmt(data.stop_loss) : "--";
  els.tp1.textContent = data.tp1 ? fmt(data.tp1) : "--";
  els.tp2.textContent = data.tp2 ? fmt(data.tp2) : "--";
  els.tp3.textContent = data.tp3 ? fmt(data.tp3) : "--";
  els.suggestedLev.textContent = data.leverage ? `${data.leverage}x` : "--";
  els.currentPrice.textContent = data.market_data?.current_price ? fmt(data.market_data.current_price) : "--";
  els.spreadInfo.textContent = data.orderbook?.spread_pct !== undefined && data.orderbook?.spread_pct !== null ? `${fmt(data.orderbook.spread_pct, 4)}%` : "--";
  els.orderbookPressure.textContent = data.orderbook_pressure || "--";
  els.tapeInfo.textContent = data.tape_momentum || "--";
  els.volumeInfo.textContent = data.volume_condition || "--";
  els.feeInfo.textContent = data.market_data?.fee_estimate_round_trip !== undefined ? fmt(data.market_data.fee_estimate_round_trip, 6) + " USDT" : "--";
  els.bidVolume.textContent = data.orderbook?.bid_volume !== undefined ? fmt(data.orderbook.bid_volume, 4) : "--";
  els.askVolume.textContent = data.orderbook?.ask_volume !== undefined ? fmt(data.orderbook.ask_volume, 4) : "--";
  els.bestBid.textContent = data.orderbook?.best_bid !== undefined ? fmt(data.orderbook.best_bid) : "--";
  els.bestAsk.textContent = data.orderbook?.best_ask !== undefined ? fmt(data.orderbook.best_ask) : "--";
  els.riskAmount.textContent = data.risk?.risk_amount !== undefined ? fmt(data.risk.risk_amount, 4) + " USDT" : "--";
  els.qtyEstimate.textContent = data.market_data?.quantity_estimate !== undefined ? fmt(data.market_data.quantity_estimate, 6) : "--";
  els.notionalEstimate.textContent = data.market_data?.notional_estimate !== undefined ? fmt(data.market_data.notional_estimate, 4) + " USDT" : "--";
  const prec = data.market_data?.precision || {};
  els.precisionInfo.textContent = `tick ${prec.price_tick ?? "--"} / step ${prec.qty_step ?? "--"}`;
  els.sourceTag.textContent = `source: ${data.source || "-"}`;
  els.marketPreview.textContent = data.market_condition || "--";
  els.volumePreview.textContent = data.volume_condition || "--";
  els.pressurePreview.textContent = data.orderbook_pressure || "--";
  updateIndicators(data.indicators || {});
}

async function analyze() {
  setError("");
  setLoading(true);

  try {
    const payload = {
      symbol: els.symbolSelect.value,
      capital: Number(els.capital.value || 100),
      riskPercent: Number(els.riskPercent.value || 1),
      leverageMode: els.leverageMode.value,
      leverage: Number(els.leverage.value || 5),
    };

    const res = await fetch(API_ANALYZE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Analysis failed (${res.status})`);
    updateResult(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

els.analyzeBtn.addEventListener("click", analyze);
els.refreshSymbols.addEventListener("click", loadSymbols);
els.leverageMode.addEventListener("change", () => {
  els.leverage.disabled = els.leverageMode.value !== "manual";
});
els.leverage.disabled = els.leverageMode.value !== "manual";

loadSymbols();
