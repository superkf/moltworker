# HEARTBEAT.md

## 📊 价格扫描 (每30分钟)
**Frequency: 每30分钟**
**监控:** BTC, ETH, WLD, SOL, XRP, PEPE, BONK

**执行:**
1. Run `node full-scanner.mjs`
2. 检查 BTC 和 ETH 的趋势线位置
3. 检查是否接近支撑/压力线
4. Track last scan in `memory/heartbeat-state.json`

---

## 🎯 核心交易策略 (ToriTradez 趋势线)

### BTC - 风向标 (不交易，只看方向)
```
压力线: $88,325 (1/14 $97.9K → 1/18 $95.5K 连线)
支撑线: $80,723 (1/9 → 1/29 低点连线)
```
**信号:**
- BTC 守住 $80K 支撑 → 山寨币可以买
- BTC 跌破 $80K → 全部观望，可能继续跌
- BTC 涨到 $88K 压力线 → 考虑减仓

### ETH - 主要交易标的 (波动是 BTC 的 4 倍)
```
压力线: $3,400-3,450 (近期高点区)
当前价: ~$2,730
支撑线: $2,680 (1/29 低点)
```
**交易计划:**
- ✅ 买入区: $2,680-2,800 (支撑附近)
- 🎯 目标区: $3,300-3,400 (压力线)
- 🛑 止损: $2,600 以下

**潜在收益:** +26% | **风险:** -2% | **风险回报:** 13:1

---

## 📢 提醒条件

**立刻通知 Kathy:**
- BTC 跌破 $80K → ⚠️ 危险信号
- BTC 涨到 $88K → 📈 接近压力，考虑减仓
- ETH 涨到 $3,300 以上 → 🎯 接近目标
- ETH 跌破 $2,600 → 🛑 止损提醒
- SOL 跌破 $108 → 🛑 止损提醒
- 任何币 24h 变动 > 10%

## 🤖 自动交易 (已授权)

**触发条件 → 自动执行:**
- ETH < $2,700 → 自动买入 (50% USDC)
- SOL < $114 → 自动买入 (50% USDC)

**执行脚本:** `python /data/trade_me/auto_buy_monitor.py`

**止损 (通知，不自动卖):**
- ETH < $2,600 → 通知 Kathy
- SOL < $108 → 通知 Kathy

**静默模式:** 无重大变化时不打扰

---

## 🔄 XRP 波段交易监控
**目标:** 帮 Kathy 用波段操作回本

**持仓情况:**
- Newton 上有 ~1700 XRP @ $2.00 成本
- 计划转 Kraken 后用一半 (850 XRP) 做波段

**价格提醒:**
- **卖出信号:** XRP ≥ $1.90 → 立刻通知 Kathy
- **买入信号:** XRP ≤ $1.70 → 立刻通知 Kathy

**操作记录:** 更新到 `memory/xrp-swing-trades.md`

---

## Daily Twitter Posts (2-3/day)
Goal: 1 Chinese + 2 English tweets about AI/tech hot topics

**Process:**
1. Check `memory/heartbeat-state.json` for today's tweet count
2. If < 3 tweets drafted today, find fresh AI/tech content:
   - Hacker News trending
   - X/Twitter AI community buzz
   - New product launches, research papers
3. Draft tweet in appropriate language (alternate CN/EN)
4. Send draft to Kathy for approval
5. Post only after she says "ok" / "发" / approves
6. Update tweet count in heartbeat-state.json

**Timing:** Space out drafts - morning, afternoon, evening

## Daily Retweets/Quote Tweets (2-4/day)
Goal: 1 Chinese + rest English, add commentary/insight

**Process:**
1. Browse X for interesting AI/tech content worth sharing
2. Can be small observations or hot takes
3. Draft quote tweet with commentary
4. Send to Kathy for approval (or ask her for content ideas)
5. Post after approval

**Style:** 从小点入手也可以，不用每条都是大话题

## Clinic Email Check (qihatc@gmail.com)
**Frequency: 每小时检查一次**
Check clinic inbox for new contact form submissions:
1. Run `node clinic-email.mjs contacts 10`
2. Filter out spam/ads (Book Ninja scams, inheritance scams, religious spam)
3. For real patient inquiries:
   - Draft reply in English
   - Send draft to Kathy for approval
   - Wait for "ok" before sending
4. **预约确认后** → 用浏览器加到 qihatc@gmail.com 的 Google Calendar
5. Track last checked timestamp in memory/heartbeat-state.json

## 📈 Daily Crypto Research (每天1次)
**Goal:** 持续学习，寻找交易机会

**每日研究流程：**
1. 扫描 Kraken 大涨跌币 (>15% 变动)
2. 读新闻:
   - https://decrypt.co/news
   - https://thedefiant.io
   - https://t.me/s/crypto_miami
3. 检查催化剂 (代币解锁、合作、上线)
4. 监控持仓 (WLD等)
5. 更新 `memory/crypto-research.md`

**记录内容：**
- 今日热点新闻
- 值得关注的币
- 市场观察
- 学到的教训

**规则：**
- XRP 和 BTC 不动
- WLD 可操作
- 有重大发现立刻通知 Kathy
