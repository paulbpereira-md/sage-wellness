// Vercel Serverless Function — /api/plan
// Generates a personalized 7-day wellness plan via Anthropic.
// Keeps ANTHROPIC_API_KEY on the server.

export const config = { runtime: 'edge' }

const PLAN_SYSTEM =
  "You are a warm, practical holistic wellness coach. " +
  "Create concise, personalized 7-day wellness plans. " +
  "Use the exact section headings the user asks for. " +
  "Be encouraging but not preachy. Ground advice in common-sense best practices. " +
  "Never give medical, diagnostic, or clinical advice."

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return json({ error: 'Server is missing ANTHROPIC_API_KEY' }, 500)

  let body
  try { body = await req.json() }
  catch { return json({ error: 'Invalid JSON' }, 400) }

  const focus = Array.isArray(body?.focus) ? body.focus.slice(0, 8).map(s => String(s).slice(0, 60)) : []
  const goal = typeof body?.goal === 'string' ? body.goal.slice(0, 600) : ''

  if (focus.length === 0 && !goal.trim()) {
    return json({ error: 'Pick at least one focus area or describe a goal' }, 400)
  }

  const userPrompt =
    `Create a personalized 7-day wellness plan.\n` +
    (focus.length ? `Focus areas: ${focus.join(', ')}.\n` : '') +
    (goal ? `Goal: "${goal}".\n` : '') +
    `\nFormat with these sections exactly:\n` +
    `🌅 MORNING ROUTINE (3-4 bullet points)\n` +
    `💪 MOVEMENT & FITNESS (3-4 bullet points)\n` +
    `🥗 NUTRITION GUIDANCE (3-4 bullet points)\n` +
    `🧘 MINDFULNESS PRACTICE (3-4 bullet points)\n` +
    `😴 EVENING WIND-DOWN (3-4 bullet points)\n` +
    `⭐ YOUR WEEK 1 FOCUS (1-2 sentences)\n` +
    `Keep it practical, warm, and motivating.`

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
        max_tokens: 900,
        system: PLAN_SYSTEM,
        messages: [{ role: 'user', content: userPrompt }]
      })
    })

    if (!r.ok) {
      const errText = await r.text()
      console.error('Anthropic error:', r.status, errText)
      return json({ error: `Anthropic API returned ${r.status}: ${errText}` }, 502)
    }

    const data = await r.json()
    const plan = data?.content?.[0]?.text?.trim() || ''
    return json({ plan })
  } catch (e) {
    console.error('Plan handler error:', e)
    return json({ error: 'Unexpected error' }, 500)
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}
