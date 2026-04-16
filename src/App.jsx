import { useState, useEffect, useRef, useCallback } from 'react'
import { storage, today, lastNDays } from './lib/storage.js'

// ------------------------------------------------------------------
// Sage — AI Wellness Companion
// Single-file React app. All data is stored locally. AI chat goes
// through /api/chat which proxies to Anthropic so the key stays
// server-side.
// ------------------------------------------------------------------

const TABS = [
  { id: 'chat',     label: 'Chat',    icon: '💬' },
  { id: 'mood',     label: 'Mood',    icon: '🌤' },
  { id: 'journal',  label: 'Journal', icon: '📓' },
  { id: 'habits',   label: 'Habits',  icon: '🌱' },
  { id: 'breathe',  label: 'Breathe', icon: '🫁' }
]

const MOODS = [
  { score: 1, emoji: '😞', label: 'Low' },
  { score: 2, emoji: '😕', label: 'Off' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😊', label: 'Great' }
]

const DEFAULT_HABITS = [
  { id: 'breathing',  name: 'Breathing practice' },
  { id: 'hydration',  name: 'Drink enough water' },
  { id: 'gratitude',  name: 'Write one gratitude' },
  { id: 'movement',   name: 'Move my body' },
  { id: 'sleepwind',  name: 'Sleep wind-down' }
]

// Default prompts if the AI prompt endpoint fails or is unused
const FALLBACK_PROMPTS = {
  1: "What is weighing heaviest right now? You don't have to fix it — just name it.",
  2: "What is one small thing that felt off today, and one that felt okay?",
  3: "If today had a color, what would it be — and why?",
  4: "What went right today, even something tiny?",
  5: "What contributed to this good feeling? How might you carry a little of it into tomorrow?"
}

const SAGE_SYSTEM_PROMPT =
  "You are Sage, a calm, warm, non-judgmental AI wellness companion. " +
  "You talk like a thoughtful friend, not a therapist or chatbot. " +
  "Keep replies concise (2-5 sentences usually). Reflect feelings, ask gentle open questions, " +
  "and offer practical grounding or breathing suggestions when relevant. " +
  "You are NOT a medical provider. If the user mentions self-harm, suicide, or immediate crisis, " +
  "respond with care and clearly direct them to the 988 Suicide & Crisis Lifeline (call or text 988 in the US) " +
  "or local emergency services. Never minimize distress. Never give medical or diagnostic advice."

// ------------------------------------------------------------------
// Root App
// ------------------------------------------------------------------

export default function App() {
  const [name, setName] = useState(() => storage.get('name', ''))
  const [tab, setTab] = useState('chat')

  if (!name) {
    return <Onboarding onDone={(n) => { storage.set('name', n); setName(n) }} />
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">Sa<span className="leaf">ge</span></div>
        <div className="greeting">Hi, {name}</div>
      </header>

      <main className="main">
        {tab === 'chat'    && <Chat name={name} />}
        {tab === 'mood'    && <Mood />}
        {tab === 'journal' && <Journal />}
        {tab === 'habits'  && <Habits />}
        {tab === 'breathe' && <Breathing />}
      </main>

      <nav className="nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
            aria-label={t.label}
          >
            <span className="icon" aria-hidden>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ------------------------------------------------------------------
// Onboarding
// ------------------------------------------------------------------

function Onboarding({ onDone }) {
  const [value, setValue] = useState('')
  return (
    <div className="onboard">
      <div className="logo">Sa<span className="leaf">ge</span></div>
      <div className="tagline">Your calm, always-on companion.</div>
      <h1>What should I call you?</h1>
      <input
        className="input"
        placeholder="Your name"
        value={value}
        onChange={e => setValue(e.target.value)}
        maxLength={30}
        autoFocus
      />
      <button
        className="btn full"
        onClick={() => value.trim() && onDone(value.trim())}
        disabled={!value.trim()}
      >
        Start
      </button>
      <p className="tagline" style={{ marginTop: 40, fontSize: '0.78rem' }}>
        Everything you share stays on this device.<br/>
        No account. No ads. No tracking.
      </p>
    </div>
  )
}

// ------------------------------------------------------------------
// Chat
// ------------------------------------------------------------------

function Chat({ name }) {
  const [messages, setMessages] = useState(() =>
    storage.get('chat.messages', [
      {
        role: 'assistant',
        content: `Hi ${name} — I'm Sage. I'm here to listen whenever you need. What's on your mind today?`
      }
    ])
  )
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const logRef = useRef(null)

  useEffect(() => { storage.set('chat.messages', messages) }, [messages])
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages, sending])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          userName: name
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = data?.error || `HTTP ${res.status}`
        throw new Error(detail)
      }
      const reply = data?.reply || "I'm not sure what to say right now, but I'm here."
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(`AI error: ${e.message}`)
    } finally {
      setSending(false)
    }
  }

  const clear = () => {
    if (!confirm('Clear this conversation? It will be removed from this device.')) return
    setMessages([{
      role: 'assistant',
      content: `Hi ${name} — I'm Sage. What's on your mind today?`
    }])
  }

  return (
    <div className="card chat">
      <CrisisBanner />
      <div className="chat-log" ref={logRef}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.content}</div>
        ))}
        {sending && <div className="msg assistant typing">Sage is typing…</div>}
        {error && <div className="msg assistant" style={{ color: 'var(--sage-danger)' }}>{error}</div>}
      </div>
      <div className="chat-input">
        <input
          className="input"
          placeholder="Say anything…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          disabled={sending}
        />
        <button className="btn" onClick={send} disabled={sending || !input.trim()}>Send</button>
      </div>
      <button
        onClick={clear}
        style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--sage-muted)', alignSelf: 'flex-end' }}
      >
        Clear conversation
      </button>
    </div>
  )
}

function CrisisBanner() {
  return (
    <div className="crisis">
      If you're in crisis, please reach out — call or text{' '}
      <a href="tel:988">988</a> (US Suicide & Crisis Lifeline) or your local emergency services. You're not alone.
    </div>
  )
}

// ------------------------------------------------------------------
// Mood
// ------------------------------------------------------------------

function Mood() {
  const [entries, setEntries] = useState(() => storage.get('mood.entries', {}))
  const todayKey = today()
  const todayMood = entries[todayKey]

  const select = (score) => {
    const next = { ...entries, [todayKey]: score }
    setEntries(next)
    storage.set('mood.entries', next)
  }

  const days = lastNDays(7)
  const max = 5

  return (
    <>
      <div className="card">
        <h2>How are you feeling today?</h2>
        <p className="sub">One tap. That's it.</p>
        <div className="mood-grid">
          {MOODS.map(m => (
            <button
              key={m.score}
              className={`mood-btn ${todayMood === m.score ? 'selected' : ''}`}
              onClick={() => select(m.score)}
              aria-label={m.label}
            >
              <span className="mood-emoji" aria-hidden>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Last 7 days</h2>
        <div className="chart">
          {days.map(d => {
            const v = entries[d]
            const pct = v ? (v / max) * 100 : 0
            return (
              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className={`chart-bar ${v ? '' : 'empty'}`} style={{ height: `${pct}%` }}>
                  {v ? MOODS.find(m => m.score === v).emoji : ''}
                </div>
                <div className="chart-label">{d.slice(5)}</div>
              </div>
            )
          })}
        </div>
        <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>
          Patterns take a few weeks to show up. Keep checking in — no streaks to break.
        </p>
      </div>
    </>
  )
}

// ------------------------------------------------------------------
// Journal
// ------------------------------------------------------------------

function Journal() {
  const [entries, setEntries] = useState(() => storage.get('journal.entries', []))
  const [draft, setDraft] = useState('')
  const [prompt, setPrompt] = useState(() => storage.get('journal.todayPrompt', null))
  const [loadingPrompt, setLoadingPrompt] = useState(false)
  const moodEntries = storage.get('mood.entries', {})
  const todayMood = moodEntries[today()]

  const generatePrompt = useCallback(async () => {
    setLoadingPrompt(true)
    try {
      const res = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: todayMood })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const p = data?.prompt || FALLBACK_PROMPTS[todayMood || 3]
      setPrompt(p)
      storage.set('journal.todayPrompt', p)
    } catch {
      const p = FALLBACK_PROMPTS[todayMood || 3]
      setPrompt(p)
      storage.set('journal.todayPrompt', p)
    } finally {
      setLoadingPrompt(false)
    }
  }, [todayMood])

  useEffect(() => { if (!prompt) generatePrompt() }, [prompt, generatePrompt])

  const save = () => {
    const text = draft.trim()
    if (!text) return
    const entry = { id: Date.now(), date: new Date().toISOString(), prompt, body: text }
    const next = [entry, ...entries]
    setEntries(next)
    storage.set('journal.entries', next)
    setDraft('')
  }

  return (
    <>
      <div className="card">
        <h2>Today's prompt</h2>
        <p style={{ fontStyle: 'italic', color: 'var(--sage-accent)' }}>
          {loadingPrompt ? 'Finding a gentle question…' : (prompt || 'Write whatever is on your mind.')}
        </p>
        <textarea
          className="textarea"
          placeholder="Write freely. No one will read this but you."
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn" onClick={save} disabled={!draft.trim()}>Save</button>
          <button className="btn secondary" onClick={generatePrompt}>New prompt</button>
        </div>
      </div>

      <div className="card">
        <h2>Past entries</h2>
        {entries.length === 0 && <div className="empty">Your entries will appear here.</div>}
        {entries.map(e => (
          <div key={e.id} className="journal-entry">
            <div className="date">{new Date(e.date).toLocaleString()}</div>
            <div className="prompt">{e.prompt}</div>
            <div className="body">{e.body}</div>
          </div>
        ))}
      </div>
    </>
  )
}

// ------------------------------------------------------------------
// Habits
// ------------------------------------------------------------------

function Habits() {
  const [log, setLog] = useState(() => storage.get('habits.log', {}))
  const todayKey = today()
  const todayDone = log[todayKey] || []

  const toggle = (id) => {
    const done = new Set(todayDone)
    done.has(id) ? done.delete(id) : done.add(id)
    const next = { ...log, [todayKey]: Array.from(done) }
    setLog(next)
    storage.set('habits.log', next)
  }

  // streak = consecutive days where this habit was checked, ending today-or-yesterday
  const streakFor = (id) => {
    let s = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      if ((log[key] || []).includes(id)) s++
      else if (i > 0) break
    }
    return s
  }

  return (
    <div className="card">
      <h2>Today's habits</h2>
      <p className="sub">Small, daily. Check when done.</p>
      {DEFAULT_HABITS.map(h => {
        const done = todayDone.includes(h.id)
        const streak = streakFor(h.id)
        return (
          <div key={h.id} className="habit-row" onClick={() => toggle(h.id)} role="button" tabIndex={0}>
            <div className={`habit-check ${done ? 'done' : ''}`} aria-hidden>
              {done ? '✓' : ''}
            </div>
            <div className="habit-name">{h.name}</div>
            {streak > 0 && <div className="habit-streak">🔥 {streak}</div>}
          </div>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------
// Breathing (4-4-6)
// ------------------------------------------------------------------

function Breathing() {
  const phases = [
    { name: 'Inhale',  seconds: 4, cls: 'inhale'  },
    { name: 'Hold',    seconds: 4, cls: 'hold'    },
    { name: 'Exhale',  seconds: 6, cls: 'exhale'  }
  ]
  const [running, setRunning] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [count, setCount] = useState(phases[0].seconds)
  const [cycles, setCycles] = useState(0)

  useEffect(() => {
    if (!running) return
    if (count <= 1) {
      const nextIdx = (phaseIdx + 1) % phases.length
      const nextCycles = nextIdx === 0 ? cycles + 1 : cycles
      const t = setTimeout(() => {
        setPhaseIdx(nextIdx)
        setCount(phases[nextIdx].seconds)
        setCycles(nextCycles)
      }, 1000)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [running, count, phaseIdx, cycles])

  const start = () => {
    setCycles(0); setPhaseIdx(0); setCount(phases[0].seconds); setRunning(true)
  }
  const stop = () => setRunning(false)

  const phase = phases[phaseIdx]

  return (
    <div className="card">
      <h2>4-4-6 Breathing</h2>
      <p className="sub">Breathe in 4, hold 4, exhale 6. Activates your parasympathetic system — settles the body fast.</p>
      <div className="breath-wrap">
        <div className={`breath-circle ${running ? phase.cls : ''}`}>
          {running ? phase.name : 'Ready'}
        </div>
        <div className="breath-count">{running ? count : ''}</div>
        <div className="breath-phase">{running ? `Cycle ${cycles + 1}` : 'Press start when ready'}</div>
      </div>
      {!running
        ? <button className="btn full" onClick={start}>Begin</button>
        : <button className="btn secondary full" onClick={stop}>Stop</button>}
    </div>
  )
}
