// Vercel Serverless Function — /api/prompt
// Returns a single gentle journal prompt tailored to the user's
// current mood (1=low ... 5=great). Falls back to a curated default
// if ANTHROPIC_API_KEY is not set.

export const config = { runtime: 'edge' }

const FALLBACK = {
  1: "What is weighing heaviest right now? You don't have to fix it — just name it.",
  2: "What is one small thing that felt off today, and one that felt okay?",
  3: "If today had a color, what would it be — and why?",
  4: "What went right today, even something tiny?",
  5: "What contributed to this good feeling? How might you carry a little of it into tomorrow?"
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body
  try { body = await req.json() } catch { body = {} }
  const moodRaw = Number(body?.mood)
  const mood = [1,2,3,4,5].includes(moodRaw) ? moodRaw : 3

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return json({ prompt: FALLBACK[mood] })
  }

  const moodLabel = { 1: 'very low', 2: 'off', 3: 'okay', 4: 'good', 5: 'great' }[mood]

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system:
          "You generate one short, gentle, open-ended journaling prompt tailored to the user's current mood. " +
          "The prompt should be warm, non-prescriptive, never advice-like, and under 25 words. " +
          "Respond with ONLY the prompt sentence — no preamble, no quotes, no emoji.",
        messages: [{
          role: 'user',
          content: `My mood today is ${moodLabel}. Give me one gentle journaling prompt.`
        }]
      })
    })

    if (!r.ok) return json({ prompt: FALLBACK[mood] })
    const data = await r.json()
    const text = data?.content?.[0]?.text?.trim().replace(/^["']|["']$/g, '')
    return json({ prompt: text || FALLBACK[mood] })
  } catch {
    return json({ prompt: FALLBACK[mood] })
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}
