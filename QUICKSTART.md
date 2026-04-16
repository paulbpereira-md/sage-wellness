# Sage — Quickstart (Windows)

The fastest path from this folder to a live app + working APK. About 10 minutes.

---

## 1. Add your Anthropic key to Vercel (2 min)

- Open `vercel.com/paulbpereira-5186s-projects/sage-wellness`
- Settings → Environment Variables
- Add `ANTHROPIC_API_KEY` with your real key (from console.anthropic.com)
- Check Production + Preview + Development → Save

---

## 2. Deploy from PowerShell (5 min)

Open the Sage-Wellness folder in File Explorer, click the address bar, type `powershell`, hit Enter.

Run these one at a time:

```
npm install
npm install -g vercel
vercel login
vercel link
vercel --prod
```

When `vercel link` asks: Y → pick `paulbpereira-5186s-projects` → Y → `sage-wellness`.

If `npm install -g vercel` gives a permissions error, close PowerShell, reopen as Administrator (right-click → Run as administrator), run just that one line, then go back to a normal PowerShell.

---

## 3. Verify (1 min)

Open `https://sage-wellness-dusky.vercel.app` in your browser.
You should see the Sage onboarding screen.
Type your name, send a chat message — confirm you get a real AI reply.

---

## 4. Fix the APK URL in Median (3 min)

1. Log in at median.co (public key: nmjjdzw)
2. App Config → General → Initial URL → change to `https://sage-wellness-dusky.vercel.app`
3. Build → Android → download new APK
4. Install on your phone to test

---

## Done

Your Sage app is live. Your APK works. See README.md for full details.
