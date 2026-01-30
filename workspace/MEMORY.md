# MEMORY.md - Long-Term Memory

## Daily Tasks

### 🐦 Twitter Posts (2-3/day)
- **Frequency:** 每天2-3条
- **Language:** 1中文 + 2英文
- **Topic:** AI/科技热点 (Hacker News, X热门, 新产品发布, 研究论文)
- **Process:**
  1. 找素材写草稿
  2. 发给Kathy审批
  3. 她说 "ok" / "发" 后再发布
- **Account:** @kathysyock (DearMe)
- **Added:** 2026-01-29

### 🔄 Twitter Retweets/Quote Tweets (2-4/day)
- **Frequency:** 每天2-4条转推
- **Language:** 最好1中文 + 其余英文
- **Style:** 可以从很小的点入手，加点评
- **Source:** 刷X找好内容，或者问Kathy要素材
- **Process:** 同上，先发草稿审批
- **Added:** 2026-01-29

### 📧 Clinic Email + Calendar
- **Inbox:** qihatc@gmail.com
- **Frequency:** ⏰ 每小时检查一次
- **Task:** 检查新联系表单提交，过滤垃圾，草拟回复给Kathy审批
- **Script:** `node clinic-email.mjs contacts 10`
- **预约流程:** 跟病人确认预约后，加到 qihatc@gmail.com 的 Google Calendar
- **Calendar方式:** 用浏览器添加
- **预约格式:**
  - 标题：`姓, 名 电话 邮箱 主诉` (例: Tang, Marian (647) 284-0252 marian.tang8@gmail.com Fertility)
  - 时间：日期 + 时段
  - 不用填诊所地址
  - **每个时段可以约2个病人！** 看日历时，只有1人的时段还能加1个
  - **周六4点以后不约人**

- **诊所邮件检查:**
  - **每小时检查一次** qihatc@gmail.com
  - 用 `node clinic-email.mjs contacts 10` 查看
  - 过滤垃圾邮件，真实病人咨询发草稿给 Kathy 批准

---

## Projects

### CNS Endpoint Platform
- **Location:** `D:\clinicaltrial`
- **Stack:** React + TypeScript + Vite + Tailwind
- **Features:** 历史试验分析, 疾病轨迹, 试验设计器, AI成功预测, PRISMA报告
- **Deliverables:** Created `CNS_Endpoint_Platform.pptx` (11 slides) on 2026-01-28

### Trading System
- RSI 30/65 + Tiered Lock strategy
- Previously had Telegram bot token conflict with Clawdbot

---

## Important Dates
- 2026-01-28: First day online, named "Big Fork" 🍴
- 2026-01-29: First Twitter post, daily tweet task established
