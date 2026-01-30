// 完整扫描器 V2 - 价格 + Fear Index + ToriTradez 趋势线 (100%)
// 每30分钟运行一次

const COINS = {
  'WLDUSD': 'WLD',
  'PEPEUSD': 'PEPE',
  'XXBTZUSD': 'BTC',
  'SOLUSD': 'SOL',
  'XXRPZUSD': 'XRP',
  'BONKUSD': 'BONK',
  'XETHZUSD': 'ETH'
};

// ============== 价格扫描 ==============
async function fetchPrices() {
  const pairs = Object.keys(COINS).join(',');
  const url = `https://api.kraken.com/0/public/Ticker?pair=${pairs}`;
  const res = await fetch(url);
  const data = await res.json();

  const prices = {};
  for (const [pair, info] of Object.entries(data.result)) {
    const symbol = COINS[pair] || pair;
    const current = parseFloat(info.c[0]);
    const open = parseFloat(info.o);
    const high24h = parseFloat(info.h[1]);
    const low24h = parseFloat(info.l[1]);
    const change24h = ((current - open) / open * 100).toFixed(2);

    prices[symbol] = {
      price: current,
      open,
      high24h,
      low24h,
      change24h: parseFloat(change24h)
    };
  }
  return prices;
}

async function fetchFearIndex() {
  const res = await fetch('https://api.alternative.me/fng/');
  const data = await res.json();
  return {
    value: parseInt(data.data[0].value),
    classification: data.data[0].value_classification
  };
}

// ============== ToriTradez V2 趋势线分析 ==============
async function fetchOHLC(pair, interval = 240) {
  const url = `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`;
  const res = await fetch(url);
  const data = await res.json();

  const resultKey = Object.keys(data.result).find(k => k !== 'last');
  return data.result[resultKey].map(c => ({
    time: new Date(c[0] * 1000),
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    volume: parseFloat(c[6])
  }));
}

function findSignificantSwingHighs(candles, minStrength = 3) {
  const swingHighs = [];

  for (let i = minStrength; i < candles.length - minStrength; i++) {
    let isSwingHigh = true;
    let strength = 0;

    for (let j = 1; j <= minStrength; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) {
        isSwingHigh = false;
        break;
      }
      strength++;
    }

    if (!isSwingHigh) continue;

    for (let j = 1; j <= minStrength; j++) {
      if (candles[i].high <= candles[i + j].high) {
        isSwingHigh = false;
        break;
      }
      strength++;
    }

    if (isSwingHigh) {
      const avgNearby = (candles.slice(i - minStrength, i + minStrength + 1)
        .reduce((sum, c) => sum + c.high, 0)) / (minStrength * 2 + 1);
      const prominence = (candles[i].high - avgNearby) / avgNearby * 100;

      swingHighs.push({
        index: i,
        price: candles[i].high,
        time: candles[i].time,
        strength,
        prominence
      });
    }
  }

  return swingHighs.sort((a, b) => b.prominence - a.prominence);
}

function findSignificantSwingLows(candles, minStrength = 3) {
  const swingLows = [];

  for (let i = minStrength; i < candles.length - minStrength; i++) {
    let isSwingLow = true;
    let strength = 0;

    for (let j = 1; j <= minStrength; j++) {
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) {
        isSwingLow = false;
        break;
      }
      strength++;
    }

    if (!isSwingLow) continue;

    for (let j = 1; j <= minStrength; j++) {
      if (candles[i].low >= candles[i + j].low) {
        isSwingLow = false;
        break;
      }
      strength++;
    }

    if (isSwingLow) {
      const avgNearby = (candles.slice(i - minStrength, i + minStrength + 1)
        .reduce((sum, c) => sum + c.low, 0)) / (minStrength * 2 + 1);
      const prominence = (avgNearby - candles[i].low) / avgNearby * 100;

      swingLows.push({
        index: i,
        price: candles[i].low,
        time: candles[i].time,
        strength,
        prominence
      });
    }
  }

  return swingLows.sort((a, b) => b.prominence - a.prominence);
}

function drawTrendline(point1, point2) {
  const slope = (point2.price - point1.price) / (point2.index - point1.index);
  const intercept = point1.price - slope * point1.index;
  return { slope, intercept, point1, point2 };
}

function getTrendlinePrice(trendline, index) {
  return trendline.slope * index + trendline.intercept;
}

function validateTrendline(candles, trendline, type = 'down', tolerance = 0.01) {
  let touches = 0;
  let respects = 0;
  let violations = 0;

  const startIdx = Math.min(trendline.point1.index, trendline.point2.index);
  const endIdx = candles.length - 1;

  for (let i = startIdx; i <= endIdx; i++) {
    const trendPrice = getTrendlinePrice(trendline, i);
    const candle = candles[i];

    if (type === 'down') {
      const distanceHigh = (candle.high - trendPrice) / trendPrice;
      const distanceClose = (candle.close - trendPrice) / trendPrice;

      if (Math.abs(distanceHigh) < tolerance) {
        touches++;
      } else if (distanceHigh < 0) {
        respects++;
      }

      if (distanceClose > tolerance) {
        violations++;
      }
    } else {
      const distanceLow = (trendPrice - candle.low) / trendPrice;
      const distanceClose = (trendPrice - candle.close) / trendPrice;

      if (Math.abs(distanceLow) < tolerance) {
        touches++;
      } else if (distanceLow < 0) {
        respects++;
      }

      if (distanceClose > tolerance) {
        violations++;
      }
    }
  }

  return {
    touches,
    respects,
    violations,
    isValid: touches >= 2 && violations < 3,
    quality: touches + respects * 0.5 - violations * 2
  };
}

function findBestDowntrendLine(candles, swingHighs) {
  if (swingHighs.length < 2) return null;

  const recentHighs = swingHighs
    .filter(h => h.index > candles.length * 0.3)
    .slice(0, 8)
    .sort((a, b) => a.index - b.index);

  let bestLine = null;
  let bestScore = -Infinity;

  for (let i = 0; i < recentHighs.length - 1; i++) {
    for (let j = i + 1; j < recentHighs.length; j++) {
      const line = drawTrendline(recentHighs[i], recentHighs[j]);

      if (line.slope >= 0) continue;

      const validation = validateTrendline(candles, line, 'down');

      if (!validation.isValid) continue;

      const recency = recentHighs[j].index / candles.length;
      const score = validation.quality * 10 + recency * 5;

      if (score > bestScore) {
        bestScore = score;
        bestLine = { ...line, validation };
      }
    }
  }

  return bestLine;
}

function findBestUptrendLine(candles, swingLows) {
  if (swingLows.length < 2) return null;

  const recentLows = swingLows
    .filter(l => l.index > candles.length * 0.3)
    .slice(0, 8)
    .sort((a, b) => a.index - b.index);

  let bestLine = null;
  let bestScore = -Infinity;

  for (let i = 0; i < recentLows.length - 1; i++) {
    for (let j = i + 1; j < recentLows.length; j++) {
      const line = drawTrendline(recentLows[i], recentLows[j]);

      if (line.slope <= 0) continue;

      const validation = validateTrendline(candles, line, 'up');

      if (!validation.isValid) continue;

      const recency = recentLows[j].index / candles.length;
      const score = validation.quality * 10 + recency * 5;

      if (score > bestScore) {
        bestScore = score;
        bestLine = { ...line, validation };
      }
    }
  }

  return bestLine;
}

async function analyzeTrendlines(pair, symbol) {
  try {
    const candles = await fetchOHLC(pair, 240);
    const currentPrice = candles[candles.length - 1].close;
    const prevPrice = candles[candles.length - 2].close;
    const currentIndex = candles.length - 1;

    const swingHighs = findSignificantSwingHighs(candles, 3);
    const swingLows = findSignificantSwingLows(candles, 3);

    const downtrend = findBestDowntrendLine(candles, swingHighs);
    const uptrend = findBestUptrendLine(candles, swingLows);

    const result = { symbol, currentPrice, signals: [] };

    if (downtrend) {
      const trendlinePrice = getTrendlinePrice(downtrend, currentIndex);
      const prevTrendlinePrice = getTrendlinePrice(downtrend, currentIndex - 1);
      const distance = ((currentPrice - trendlinePrice) / trendlinePrice * 100);

      result.downtrend = {
        price: trendlinePrice,
        distance: distance.toFixed(2),
        position: currentPrice > trendlinePrice ? '上方' : '下方',
        touches: downtrend.validation.touches,
        quality: downtrend.validation.quality.toFixed(1)
      };

      if (prevPrice < prevTrendlinePrice && currentPrice > trendlinePrice) {
        result.signals.push({
          type: 'BREAKOUT_UP',
          msg: `🟢 突破下降趋势线！(${downtrend.validation.touches}次触及)`
        });
      } else if (distance > 0 && distance < 3) {
        result.signals.push({
          type: 'NEAR_BREAKOUT_UP',
          msg: `⚠️ 接近突破 (${distance.toFixed(1)}%)`
        });
      }
    }

    if (uptrend) {
      const trendlinePrice = getTrendlinePrice(uptrend, currentIndex);
      const prevTrendlinePrice = getTrendlinePrice(uptrend, currentIndex - 1);
      const distance = ((currentPrice - trendlinePrice) / trendlinePrice * 100);

      result.uptrend = {
        price: trendlinePrice,
        distance: distance.toFixed(2),
        position: currentPrice > trendlinePrice ? '上方' : '下方',
        touches: uptrend.validation.touches,
        quality: uptrend.validation.quality.toFixed(1)
      };

      if (prevPrice > prevTrendlinePrice && currentPrice < trendlinePrice) {
        result.signals.push({
          type: 'BREAKOUT_DOWN',
          msg: `🔴 跌破上升趋势线！(${uptrend.validation.touches}次触及)`
        });
      } else if (distance < 0 && distance > -3) {
        result.signals.push({
          type: 'NEAR_BREAKOUT_DOWN',
          msg: `⚠️ 接近跌破 (${distance.toFixed(1)}%)`
        });
      }
    }

    return result;

  } catch (err) {
    return { symbol, error: err.message, signals: [] };
  }
}

// ============== 格式化 ==============
function formatPrice(symbol, price) {
  if (symbol === 'BTC') return `$${price.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
  if (symbol === 'ETH') return `$${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  if (symbol === 'SOL' || symbol === 'XRP') return `$${price.toFixed(2)}`;
  if (symbol === 'WLD') return `$${price.toFixed(4)}`;
  return `$${price.toFixed(9).replace(/\.?0+$/, '')}`;
}

function formatChange(change) {
  const arrow = change >= 0 ? '📈' : '📉';
  return `${arrow} ${change >= 0 ? '+' : ''}${change}%`;
}

// ============== 主扫描 ==============
async function fullScan() {
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Toronto',
    dateStyle: 'short',
    timeStyle: 'short'
  });

  console.log(`🔍 完整市场扫描 V2 (ToriTradez 100%) - ${timestamp}`);
  console.log('═'.repeat(55));

  // 1. Fear & Greed
  const fear = await fetchFearIndex();
  const fearEmoji = fear.value <= 25 ? '😱' : fear.value <= 45 ? '😟' : fear.value <= 55 ? '😐' : fear.value <= 75 ? '😊' : '🤑';
  const fearColor = fear.value <= 25 ? '🔴' : fear.value <= 45 ? '🟠' : fear.value <= 55 ? '🟡' : '🟢';

  console.log(`\n${fearEmoji} Fear & Greed: ${fearColor} ${fear.value} (${fear.classification})`);
  console.log(`   入场信号 (>25): ${fear.value > 25 ? '✅ YES' : '❌ NO'}`);

  // 2. 价格
  const prices = await fetchPrices();

  console.log(`\n📊 价格概览:`);
  console.log('─'.repeat(55));

  const sortedSymbols = Object.keys(prices).sort();
  for (const symbol of sortedSymbols) {
    const p = prices[symbol];
    console.log(`${symbol.padEnd(6)} ${formatPrice(symbol, p.price).padStart(18)} ${formatChange(p.change24h).padStart(15)}`);
  }

  const btcPrice = prices['BTC']?.price || 0;
  const btcStatus = btcPrice < 80000 ? '⚠️ 跌破$80K！' : btcPrice >= 85000 ? '✅ 站稳$85K' : '⏳ 在$80K-$85K之间';
  console.log(`\n   BTC 关键位: ${btcStatus}`);

  // 3. 趋势线分析
  console.log(`\n📐 趋势线分析 (ToriTradez V2 - 4H):`);
  console.log('─'.repeat(55));

  const trendResults = [];
  for (const [pair, symbol] of Object.entries(COINS)) {
    const result = await analyzeTrendlines(pair, symbol);
    trendResults.push(result);

    let line = `${symbol.padEnd(6)} `;

    if (result.downtrend) {
      line += `下降线: ${formatPrice(symbol, result.downtrend.price).padStart(15)} `;
      line += result.downtrend.position === '上方' ? '↑' : '↓';
      line += ` ${result.downtrend.distance}%`;
      line += ` [${result.downtrend.touches}触]`;
    } else {
      line += `下降线: 无有效趋势`;
    }

    console.log(line);

    for (const sig of result.signals) {
      console.log(`       ${sig.msg}`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  // 4. 总结
  console.log('\n' + '═'.repeat(55));
  console.log('📋 信号总结:');

  const allSignals = trendResults.flatMap(r => r.signals.map(s => ({ symbol: r.symbol, ...s })));
  const breakoutSignals = allSignals.filter(s => s.type.includes('BREAKOUT') && !s.type.includes('NEAR'));
  const nearSignals = allSignals.filter(s => s.type.includes('NEAR'));

  const fearOk = fear.value > 25;
  const btcOk = btcPrice >= 85000;
  const trendBreakout = breakoutSignals.length > 0;

  console.log(`\n入场条件:`);
  console.log(`  1. Fear Index > 25: ${fearOk ? '✅' : '❌'} (当前: ${fear.value})`);
  console.log(`  2. BTC 站稳 $85K:  ${btcOk ? '✅' : '❌'} (当前: ${formatPrice('BTC', btcPrice)})`);
  console.log(`  3. 趋势线突破:     ${trendBreakout ? '✅' : '❌'}`);

  if (fearOk && btcOk && trendBreakout) {
    console.log(`\n🟢🟢🟢 所有条件满足！可以入场！`);
  } else if (breakoutSignals.length > 0) {
    console.log(`\n⚠️ 有突破信号但其他条件未满足:`);
    for (const s of breakoutSignals) {
      console.log(`   ${s.symbol}: ${s.msg}`);
    }
  } else if (nearSignals.length > 0) {
    console.log(`\n⚠️ 有信号但条件未全满足:`);
    for (const s of nearSignals) {
      console.log(`   ${s.symbol}: ${s.msg}`);
    }
  } else {
    console.log(`\n⏸️ Tori 理念: "没有结构，就没有交易" - 继续等待`);
  }

  // XRP 波段
  const xrpPrice = prices['XRP']?.price || 0;
  const xrpSell = xrpPrice >= 1.90;
  const xrpBuy = xrpPrice <= 1.70;
  console.log(`\n📍 XRP 波段: $${xrpPrice.toFixed(2)} (卖$1.90 | 买$1.70)${xrpSell ? ' 🔔卖出!' : ''}${xrpBuy ? ' 🔔买入!' : ''}`);

  // JSON 输出
  const output = {
    timestamp: new Date().toISOString(),
    fear,
    prices,
    trendlines: trendResults,
    signals: allSignals,
    conditions: { fear: fearOk, btc: btcOk, trendBreakout },
    readyToEnter: fearOk && btcOk && trendBreakout,
    xrpSwing: { sellSignal: xrpSell, buySignal: xrpBuy, currentPrice: xrpPrice },
    alerts: {
      priceAlerts: Object.entries(prices).filter(([s, p]) => Math.abs(p.change24h) > 10).map(([s, p]) => ({ symbol: s, change: p.change24h })),
      fearSignal: fear.value > 25,
      btcBelow80k: btcPrice < 80000,
      btcAbove85k: btcPrice >= 85000,
      xrpSell,
      xrpBuy
    }
  };

  console.log('\n---JSON---');
  console.log(JSON.stringify(output, null, 2));

  return output;
}

// 运行
fullScan();
