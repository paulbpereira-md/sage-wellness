# Sage — AI Wellness Companion

A calm, always-on AI wellness companion. Private, local-first, no account.

**Features**

- AI chat powered by Anthropic's Claude (through a server-side proxy — key never reaches the browser)
- 7-day mood tracker with visual chart
- Journaling with AI-generated prompts tailored to your mood
- Daily habit tracker with streaks
- Guided 4-4-6 breathing exercise
- Installable PWA (works offline after first load)
- 988 Suicide & Crisis Lifeline surfaced in chat

All user data (moods, journals, habits, chat history) is stored in `localStorage`. Nothing is sent to any server except the current chat message when the user sends one.

---

## Tech stack

| Layer              | Choice                                |
|--------------------|---------------------------------------|
| Framework          | React 18 + Vite                       |
| Styling            | Vanilla CSS (no runtime dependency)   |
| PWA                | `vite-plugin-pwa` (Workbox)           |
| Hosting            | Vercel (static + Edge Functions)      |
| AI                 | Anthropic Claude Haiku 4.5            |
| Storage            | Browser `localStorage` only           |
| Android            | Your existing Median.co APK wrapper   |

---

## Project structure

```
Sage-Wellness/
├── api/
│   ├── chat.js          # Edge function: proxies chat to Anthropic
│   └── prompt.js        # Edge function: generates a journal prompt
├── public/
│   ├── favicon.svg
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── App.jsx          # Entire app (Onboarding, Chat, Mood, Journal, Habits, Breathing)
│   ├── main.jsx
│   ├── styles.css
│   └── lib/
│       └── storage.js
├── docs/                # Launch docs from the Wellness App zip
├── index.html
├── package.json
├── vercel.json          # Vercel build + SPA rewrite + cache headers
├── vite.config.js       # React + PWA plugin config
└── .env.example
```

---

## Local development

```bash
npm install
copy .env.example .env.local     # paste your real ANTHROPIC_API_KEY
npm run dev                      # Vite dev server on http://localhost:5173
```

For testing the `/api/*` functions locally you'll want the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

---

## Deploying to your existing Vercel project

You already have a Vercel project at `vercel.com/paulbpereira-5186s-projects/sage-wellness`.
This project will replace the current (broken) deploy and keep the same URL, which means
**your existing Android APK will start working automatically** once you repoint Median.

### One-time setup

1. **Add your Anthropic API key to Vercel**
   - Go to your project → **Settings → Environment Variables**
   - Add `ANTHROPIC_API_KEY` = *your real key*
   - Scope: Production, Preview, Development (all three)
   - Save

2. **Install the Vercel CLI** (if you don't have it)
   ```bash
   npm i -g vercel
   vercel login
   ```

3. **Link this folder to your existing project**
   From inside the `Sage-Wellness` folder in PowerShell:
   ```bash
   vercel link
   ```
   When prompted:
   - "Set up and link?" → **Y**
   - "Which scope?" → **paulbpereira-5186s-projects**
   - "Link to existing project?" → **Y**
   - "What's the name of your existing project?" → **sage-wellness**

### Deploy

```bash
vercel --prod
```

That's it. The URL `sage-wellness-dusky.vercel.app` will start serving the real app.

---

## Android (Median.co APK)

Your existing APK loads from a deployment-specific Vercel URL that currently 404s.

### Fix the APK:

1. Log in to [median.co](https://median.co) (public key `nmjjdzw`)
2. In **App Config → General**, change `Initial URL` to:
   `https://sage-wellness-dusky.vercel.app`
3. Rebuild the APK from Median
4. Install on your phone to test → then upload to Play Console

---

## Safety & privacy

- **Local-only storage**: all user data stays in the browser's localStorage
- **Chat proxy**: API key lives only on Vercel's servers as an environment variable
- **Crisis escalation**: the chat system prompt routes crisis language to the 988 Lifeline
- **No tracking**: no analytics, no ads, no third-party scripts

> Sage is **not** a medical or therapeutic service.
