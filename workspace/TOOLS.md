# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## Email Accounts

### Personal (fengbo0724@gmail.com)
- App Password: `cphk juwb hqtc zqps`
- Use for: Personal correspondence, report cards

### Clinic (qihatc@gmail.com)
- App Password: `ypmi jxud bpjj unlb`
- Use for: Clinic emails, patient scheduling
- Script: `node clinic-email.mjs`
- Calendar: Google Calendar for appointments

## Kraken API
- API Key: `6fRqQvkfJkItEmtp9vgg0uCPWedMqSIradbb+A9wH6/iMOCwKa2uZFKA`
- API Secret: `/dWq39ogunnC41vUM4zu+zIWoOvwq/hQClgR/Ex4LEFULYFdja9LgQZx2Phy5sU05OKBF8okmY/T7kywACcV1Q==`

## Scripts

### clinic-email.mjs
```bash
node clinic-email.mjs contacts 10  # View contact form submissions
node clinic-email.mjs read 10      # Read recent emails
node clinic-email.mjs send <to> <subject> <body>  # Send email
```

### full-scanner.mjs
```bash
node full-scanner.mjs  # Run full market scan with ToriTradez trendlines
```

### auto_buy_monitor.py
```bash
python /data/trade_me/auto_buy_monitor.py  # Check auto-buy triggers
```

## Clinic Info
- **Name:** Qi Herbs & Acupuncture Treatment Centre
- **Address:** Unit 202, 901 Yonge St. Toronto, M4W 2H2
- **Phone:** (416) 968-7755 / (647) 388-6232
- **Website:** www.qitcm.ca

## Calendar Appointment Format
```
Title: Last, First (phone) email@example.com ChiefComplaint
Example: Tang, Marian (647) 284-0252 marian.tang8@gmail.com Fertility
```

Rules:
- Each time slot can have up to 2 patients
- No appointments after 4pm on Saturdays
- Don't include clinic address in the event
