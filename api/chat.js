// Vercel Serverless Function — /api/chat
// Proxies chat requests to the Anthropic API. Keeps ANTHROPIC_API_KEY
// on the server so it never reaches the browser.

export const config = { runtime: 'edge' }

const SYSTEM_PROMPT =
  "You are Sage, a calm, warm, non-judgmental AI wellness companion. " +
  "You talk like a thoughtful friend, not a therapist or chatbot. " +
  "Keep replies concise (2-5 sentences usually). Reflect feelings, ask gentle open questions, " +
  "and offer practical grounding or breathing suggestions when relevant. " +
  "You are NOT a medical provider. If the user mentions self-harm, suicide, or immediate crisis, " +
  "respond with care and clearly direct them to the 988 Suicide & Crisis Lifeline (call or text 988 in the US) " +
  "or local emergency services. Never minimize distress. Never give medical or diagnostic advice."

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return json({ error: 'Server is missing ANTHROPIC_API_KEY' }, 500)
  }

  let body
  try { body = await req.json() }
  catch { return json({ error: 'Invalid JSON' }, 400) }

  const messages = Array.isArray(body?.messages) ? body.messages : []
  const userName = typeof body?.userName === 'string' ? body.userName.slice(0, 40) : ''

  // Sanitize: only allow role/content, cap length, strip the initial welcome line
  const cleaned = messages
    .filter(m => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-20) // keep last 20 turns
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }))

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') {
    return json({ error: 'Last message must be from the user' }, 400)
  }

  const systemWithName = userName
    ? `${SYSTEM_PROMPT} The user's name is ${userName}.`
    : SYSTEM_PROMPT

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
        max_tokens: 400,
        system: systemWithName,
        messages: cleaned
      })
    })

    if (!r.ok) {
      const errText = await r.text()
      console.error('Anthropic error:', r.status, errText)
      return json({ error: `Anthropic API returned ${r.status}: ${errText}` }, 502)
    }

    const data = await r.json()
    const reply = data?.content?.[0]?.text?.trim() || ''
    return json({ reply })
  } catch (e) {
    console.error('Chat handler error:', e)
    return json({ error: 'Unexpected error' }, 500)
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}
