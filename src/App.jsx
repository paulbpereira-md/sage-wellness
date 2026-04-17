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
  { id: 'games',    label: 'Games',   icon: '🧩' },
  { id: 'plan',     label: 'Plan',    icon: '✨' },
  { id: 'mood',     label: 'Mood',    icon: '🌤' },
  { id: 'journal',  label: 'Journal', icon: '📓' },
  { id: 'habits',   label: 'Habits',  icon: '🌱' },
  { id: 'breathe',  label: 'Breathe', icon: '🫁' },
  { id: 'courses',  label: 'Courses', icon: '🎓' }
]

const FOCUS_AREAS = [
  { id: 'meditation', label: 'Meditation & Mindfulness', sub: 'Stress reduction, mental clarity', emoji: '🧘' },
  { id: 'fitness',    label: 'Fitness & Movement',       sub: 'Strength, cardio, flexibility', emoji: '💪' },
  { id: 'nutrition',  label: 'Nutrition & Gut Health',   sub: 'Meal planning, anti-inflammatory', emoji: '🥗' },
  { id: 'sleep',      label: 'Sleep & Recovery',         sub: 'Circadian rhythm, deep rest', emoji: '😴' },
  { id: 'habits',     label: 'Habit Building',           sub: 'Daily routines, consistency', emoji: '🌱' }
]

const COURSES = [
  {
    id: 'calm', emoji: '🧘', cat: 'Mindfulness', name: '7-Day Calm Foundation',
    price: 0, free: true,
    desc: 'Build a lasting daily meditation practice from scratch. This gentle 7-day program guides you from complete beginner to confident meditator.',
    meta: ['7 lessons', '1.5 hours', '4.9 stars (214 reviews)', 'Free forever'],
    lessons: [
      { t: 'Why Meditation Changes Everything',      d: '8 min',  free: true },
      { t: 'Your First 5-Minute Breath Meditation',  d: '12 min', free: true },
      { t: 'Body Scan for Deep Relaxation',          d: '15 min', free: false },
      { t: 'Dealing with a Busy Mind',               d: '10 min', free: false },
      { t: 'Morning Calm Ritual',                    d: '14 min', free: false },
      { t: 'Mindful Movement Flow',                  d: '18 min', free: false },
      { t: 'Building Your Daily Practice',           d: '11 min', free: false }
    ]
  },
  {
    id: 'strength', emoji: '💪', cat: 'Fitness', name: 'Strength Without the Gym',
    price: 9.99, free: false,
    desc: 'A complete bodyweight strength training system built on progressive overload. No equipment needed.',
    meta: ['24 lessons', '6 hours', '4.8 stars (189 reviews)', 'Lifetime access'],
    lessons: [
      { t: 'The Bodyweight Strength Pyramid',  d: '14 min', free: true },
      { t: 'Perfect Push-Up Mastery',          d: '18 min', free: true },
      { t: 'Pull-Up Progression System',       d: '22 min', free: false },
      { t: 'Squat Mechanics and Variations',   d: '20 min', free: false },
      { t: 'Core Without Crunches',            d: '16 min', free: false },
      { t: 'Progressive Overload Explained',   d: '12 min', free: false },
      { t: 'Week 1-4 Training Plan',           d: '25 min', free: false },
      { t: 'Recovery and Mobility Work',       d: '19 min', free: false }
    ]
  },
  {
    id: 'nutrition', emoji: '🥗', cat: 'Nutrition', name: 'Eat to Thrive',
    price: 14.99, free: false,
    desc: 'A science-backed nutrition system focused on anti-inflammatory eating, gut health, and building sustainable habits.',
    meta: ['18 lessons', '4.5 hours', '4.9 stars (97 reviews)', 'Lifetime access'],
    lessons: [
      { t: 'The Anti-Inflammatory Food Framework', d: '16 min', free: true },
      { t: 'Understanding Your Gut Microbiome',    d: '20 min', free: true },
      { t: 'Building a Balanced Plate',            d: '14 min', free: false },
      { t: 'Meal Prep Mastery Under 2 Hours',      d: '28 min', free: false },
      { t: 'Reading Labels Like a Nutritionist',   d: '12 min', free: false },
      { t: 'Gut-Healing Foods and Protocols',      d: '18 min', free: false },
      { t: 'Managing Sugar Cravings',              d: '15 min', free: false },
      { t: 'Your 30-Day Eating Blueprint',         d: '22 min', free: false }
    ]
  },
  {
    id: 'sleep', emoji: '😴', cat: 'Sleep and Recovery', name: 'Deep Sleep Protocol',
    price: 9.99, free: false,
    desc: 'A comprehensive sleep optimization system backed by circadian biology. Fall asleep faster, stay asleep longer, wake up refreshed.',
    meta: ['12 lessons', '3 hours', '4.7 stars (143 reviews)', 'Lifetime access'],
    lessons: [
      { t: 'The Science of Sleep Architecture', d: '15 min', free: true },
      { t: 'Circadian Rhythm Reset Protocol',   d: '18 min', free: true },
      { t: 'Sleep Environment Optimization',    d: '14 min', free: false },
      { t: 'Evening Wind-Down Ritual',          d: '20 min', free: false },
      { t: 'Managing Blue Light Exposure',      d: '10 min', free: false },
      { t: 'The Temperature Sleep Hack',        d: '8 min',  free: false },
      { t: 'Stress and Cortisol at Night',      d: '16 min', free: false },
      { t: 'Your Personal Sleep Protocol',      d: '12 min', free: false }
    ]
  },
  {
    id: 'rewire', emoji: '🌱', cat: 'Habit Building', name: 'The 90-Day Rewire',
    price: 19.99, free: false,
    desc: 'A neuroscience-backed habit transformation system to build 3-5 keystone habits in 90 days.',
    meta: ['30 lessons', '8 hours', '4.9 stars (62 reviews)', 'Lifetime access'],
    lessons: [
      { t: 'Why Habits Fail',                     d: '14 min', free: true },
      { t: 'The Identity-Based Habit Framework',  d: '18 min', free: true },
      { t: 'Habit Stacking Architecture',         d: '16 min', free: false },
      { t: 'Designing Your Environment',          d: '20 min', free: false },
      { t: 'The Minimum Viable Habit',            d: '12 min', free: false },
      { t: 'Tracking Without Obsessing',          d: '10 min', free: false },
      { t: 'Navigating Streaks and Setbacks',     d: '14 min', free: false },
      { t: 'Month 1 Foundation Phase',            d: '22 min', free: false },
      { t: 'Month 2 Momentum Phase',              d: '22 min', free: false },
      { t: 'Month 3 Integration Phase',           d: '22 min', free: false }
    ]
  }
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
        {tab === 'games'   && <MindGames />}
        {tab === 'plan'    && <Plan />}
        {tab === 'courses' && <Courses />}
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
// Plan — AI Wellness Planner (from Lumina)
// ------------------------------------------------------------------

function Plan() {
  const [selected, setSelected] = useState(() => storage.get('plan.focus', []))
  const [goal, setGoal] = useState(() => storage.get('plan.goal', ''))
  const [plan, setPlan] = useState(() => storage.get('plan.last', ''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]
    setSelected(next)
    storage.set('plan.focus', next)
  }

  const generate = async () => {
    if (selected.length === 0 && !goal.trim()) {
      setError('Pick at least one focus area or describe a goal.')
      return
    }
    setLoading(true); setError(null)
    storage.set('plan.goal', goal)
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus: selected.map(id => FOCUS_AREAS.find(f => f.id === id)?.label).filter(Boolean),
          goal
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      const text = data?.plan || ''
      setPlan(text)
      storage.set('plan.last', text)
    } catch (e) {
      setError(`Couldn't generate plan: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="card">
        <h2>Your Personal Wellness Planner</h2>
        <p className="sub">Pick focus areas and describe what you're working toward. I'll draft a 7-day plan tuned to you.</p>

        <div className="focus-grid">
          {FOCUS_AREAS.map(f => (
            <button
              key={f.id}
              className={`focus-opt ${selected.includes(f.id) ? 'selected' : ''}`}
              onClick={() => toggle(f.id)}
            >
              <span className="focus-emoji">{f.emoji}</span>
              <span className="focus-label">{f.label}</span>
              <span className="focus-sub">{f.sub}</span>
            </button>
          ))}
        </div>

        <textarea
          className="textarea"
          placeholder="What are you hoping to change or feel this week?"
          value={goal}
          onChange={e => setGoal(e.target.value)}
          maxLength={600}
          style={{ marginTop: 12 }}
        />

        <button className="btn full" onClick={generate} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Generating…' : '\u2728 Generate My Wellness Plan'}
        </button>

        {error && (
          <div style={{ marginTop: 10, color: 'var(--sage-danger)', fontSize: '0.85rem' }}>{error}</div>
        )}
      </div>

      {plan && (
        <div className="card">
          <h2>Your 7-Day Plan</h2>
          <div className="plan-body">{plan}</div>
        </div>
      )}
    </>
  )
}

// ------------------------------------------------------------------
// Courses — Lumina marketplace + Income dashboard
// ------------------------------------------------------------------

function Courses() {
  const [detailId, setDetailId] = useState(null)
  const [enrolled, setEnrolled] = useState(() => storage.get('courses.enrolled', []))

  const openDetail = (id) => { setDetailId(id) }
  const backToBrowse = () => { setDetailId(null) }

  const enroll = (id) => {
    if (enrolled.includes(id)) return
    const next = [...enrolled, id]
    setEnrolled(next)
    storage.set('courses.enrolled', next)
  }

  // Volume discount: the more paid courses you own, the bigger the discount on the next one
  const paidOwned = enrolled.filter(id => { const c = COURSES.find(x => x.id === id); return c && !c.free }).length
  const discountPct = paidOwned >= 3 ? 25 : paidOwned >= 2 ? 15 : paidOwned >= 1 ? 10 : 0
  const applyDiscount = (price) => {
    if (discountPct === 0) return { final: price, saved: 0 }
    const final = Math.round(price * (1 - discountPct / 100) * 100) / 100
    return { final, saved: Math.round((price - final) * 100) / 100 }
  }

  if (detailId) {
    const c = COURSES.find(x => x.id === detailId)
    if (!c) { backToBrowse(); return null }
    const isEnrolled = enrolled.includes(c.id)
    return (
      <>
        <button className="course-back" onClick={backToBrowse}>← Back to Courses</button>
        <div className="card">
          <div className="course-hero">
            <div className="course-hero-emoji">{c.emoji}</div>
            <div className="course-hero-cat">{c.cat}</div>
            <h2 style={{ marginTop: 4 }}>{c.name}</h2>
            <p className="sub" style={{ marginBottom: 10 }}>{c.desc}</p>
            <div className="course-meta">
              {c.meta.map((m, i) => <span key={i}>📌 {m}</span>)}
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Lessons</h2>
          {c.lessons.map((l, i) => {
            const unlocked = c.free || l.free || isEnrolled
            return (
              <div key={i} className="lesson-row">
                <div className={`lesson-num ${unlocked ? 'free' : ''}`}>{i + 1}</div>
                <div className="lesson-info">
                  <div className="lesson-title">{l.t}</div>
                  <div className="lesson-dur">{l.d}</div>
                </div>
                <div>{unlocked ? '▶' : '🔒'}</div>
              </div>
            )
          })}
        </div>

        <div className="card">
          {c.free ? (
            <>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--sage-accent)' }}>Free</div>
              <div className="sub" style={{ marginBottom: 12 }}>No credit card required.</div>
              <button
                className="btn full"
                onClick={() => enroll(c.id)}
                disabled={isEnrolled}
              >
                {isEnrolled ? '✓ Enrolled' : 'Enroll Free'}
              </button>
            </>
          ) : (
            (() => {
              const { final, saved } = applyDiscount(c.price)
              const hasDiscount = discountPct > 0 && !isEnrolled
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    {hasDiscount && (
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--sage-muted)', textDecoration: 'line-through' }}>${c.price}</div>
                    )}
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--sage-accent)' }}>
                      ${hasDiscount ? final.toFixed(2) : c.price}
                    </div>
                    {hasDiscount && (
                      <span className="discount-tag">{discountPct}% off</span>
                    )}
                  </div>
                  <div className="sub" style={{ marginBottom: 12 }}>
                    One-time payment · Lifetime access.
                    {hasDiscount && ` You save $${saved.toFixed(2)}!`}
                  </div>
                  <button className="btn full warm" disabled>Checkout coming soon</button>
                  <p className="sub" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.78rem' }}>
                    Paid checkout needs Stripe setup. Free lessons are unlocked above.
                  </p>
                </>
              )
            })()
          )}
        </div>
      </>
    )
  }

  return (
    <>
      {discountPct > 0 && (
        <div className="discount-banner">
          🎉 You've unlocked <strong>{discountPct}% off</strong> your next course!
          {discountPct < 25 && ' Buy more to unlock up to 25% off.'}
        </div>
      )}

      <div className="course-grid">
        {COURSES.map(c => {
          const isOwned = enrolled.includes(c.id)
          const showDiscount = !c.free && !isOwned && discountPct > 0
          const { final } = applyDiscount(c.price)
          const priceLabel = c.free ? 'Free' : showDiscount ? `$${final.toFixed(2)}` : `$${c.price}`
          return (
            <button key={c.id} className="course-card" onClick={() => openDetail(c.id)}>
              <div className="course-thumb">
                <span className="course-emoji">{c.emoji}</span>
                <span className={`course-badge ${c.free ? 'free' : 'paid'}`}>
                  {isOwned ? '✓ Owned' : priceLabel}
                </span>
                {showDiscount && <span className="course-badge-discount">{discountPct}% off</span>}
              </div>
              <div className="course-body">
                <div className="course-cat">{c.cat}</div>
                <div className="course-name">{c.name}</div>
                <div className="course-desc">{c.desc}</div>
                <div className="course-footer">
                  {showDiscount ? (
                    <span className="course-price">
                      <span style={{ textDecoration: 'line-through', color: 'var(--sage-muted)', marginRight: 4 }}>${c.price}</span>
                      ${final.toFixed(2)}
                    </span>
                  ) : (
                    <span className={`course-price ${c.free ? 'free' : ''}`}>{isOwned ? 'Enrolled' : priceLabel}</span>
                  )}
                  <span className="course-lessons-count">{c.lessons.length} lessons</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2>Bundle & Save</h2>
        <p className="sub">The more you learn, the more you save. Discounts apply automatically.</p>
        <div className="discount-tiers">
          <div className={`discount-tier ${paidOwned >= 1 ? 'active' : ''} ${paidOwned === 1 ? 'current' : ''}`}>
            <div className="tier-pct">10%</div>
            <div className="tier-label">After 1st course</div>
            {paidOwned >= 1 && <div className="tier-check">✓</div>}
          </div>
          <div className={`discount-tier ${paidOwned >= 2 ? 'active' : ''} ${paidOwned === 2 ? 'current' : ''}`}>
            <div className="tier-pct">15%</div>
            <div className="tier-label">After 2nd course</div>
            {paidOwned >= 2 && <div className="tier-check">✓</div>}
          </div>
          <div className={`discount-tier ${paidOwned >= 3 ? 'active' : ''} ${paidOwned === 3 ? 'current' : ''}`}>
            <div className="tier-pct">25%</div>
            <div className="tier-label">After 3rd course</div>
            {paidOwned >= 3 && <div className="tier-check">✓</div>}
          </div>
        </div>
        {paidOwned === 0 && <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Purchase your first course to start unlocking discounts!</p>}
        {paidOwned > 0 && paidOwned < 3 && <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>You're getting {discountPct}% off — {3 - paidOwned} more course{3 - paidOwned > 1 ? 's' : ''} to unlock 25%!</p>}
        {paidOwned >= 3 && <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>You've reached the maximum 25% discount on all courses!</p>}
      </div>
    </>
  )
}

// ------------------------------------------------------------------
// Mind Games — hub + 4 games
// ------------------------------------------------------------------

const GAME_LIST = [
  { id: 'memory',   emoji: '🃏', name: 'Memory Match',      desc: 'Flip cards and find matching pairs — trains short-term memory.' },
  { id: 'breathe-rhythm', emoji: '🌊', name: 'Breath Flow', desc: 'Tap in rhythm with calming breath patterns — combines play with mindfulness.' },
  { id: 'word',     emoji: '🔤', name: 'Word Unscramble',   desc: 'Unscramble wellness-themed words — keeps your mind sharp.' },
  { id: 'focus',    emoji: '🎯', name: 'Focus Tap',         desc: 'Tap the targets as they appear — tests attention and reaction speed.' },
  { id: 'gem-crush', emoji: '💎', name: 'Gem Crush',        desc: 'Swap gems to match 3+ in a row — relaxing, colorful, and satisfying.' },
  { id: 'zen-stack', emoji: '🧱', name: 'Zen Stack',        desc: 'Stack falling blocks to clear lines — a calming twist on a classic.' },
  { id: 'lily-hop',  emoji: '🐸', name: 'Lily Hop',         desc: 'Guide the frog across roads and rivers — tests timing and focus.' }
]

function MindGames() {
  const [activeGame, setActiveGame] = useState(null)
  const [bestScores, setBestScores] = useState(() => storage.get('games.best', {}))

  const saveBest = (gameId, score) => {
    const current = bestScores[gameId] || 0
    if (score > current) {
      const next = { ...bestScores, [gameId]: score }
      setBestScores(next)
      storage.set('games.best', next)
    }
  }

  if (activeGame === 'memory') return <MemoryGame onBack={() => setActiveGame(null)} onScore={(s) => saveBest('memory', s)} best={bestScores.memory || 0} />
  if (activeGame === 'breathe-rhythm') return <BreatheRhythmGame onBack={() => setActiveGame(null)} onScore={(s) => saveBest('breathe-rhythm', s)} best={bestScores['breathe-rhythm'] || 0} />
  if (activeGame === 'word') return <WordGame onBack={() => setActiveGame(null)} onScore={(s) => saveBest('word', s)} best={bestScores.word || 0} />
  if (activeGame === 'focus') return <FocusGame onBack={() => setActiveGame(null)} onScore={(s) => saveBest('focus', s)} best={bestScores.focus || 0} />
  if (activeGame === 'gem-crush') return <GemCrushGame onBack={() => setActiveGame(null)} onScore={(s) => saveBest('gem-crush', s)} best={bestScores['gem-crush'] || 0} />
  if (activeGame === 'zen-stack') return <ZenStackGame onBack={() => setActiveGame(null)} onScore={(s) => saveBest('zen-stack', s)} best={bestScores['zen-stack'] || 0} />
  if (activeGame === 'lily-hop') return <LilyHopGame onBack={() => setActiveGame(null)} onScore={(s) => saveBest('lily-hop', s)} best={bestScores['lily-hop'] || 0} />

  return (
    <>
      <div className="card">
        <h2>Mind Games</h2>
        <p className="sub">Take a mental break. Pick a game and play at your own pace.</p>
      </div>
      <div className="game-hub">
        {GAME_LIST.map(g => (
          <button key={g.id} className="game-card" onClick={() => setActiveGame(g.id)}>
            <div className="game-card-emoji">{g.emoji}</div>
            <div className="game-card-info">
              <div className="game-card-name">{g.name}</div>
              <div className="game-card-desc">{g.desc}</div>
              {bestScores[g.id] > 0 && <div className="game-card-best">Best: {bestScores[g.id]}</div>}
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

// --- Memory Match ---
function MemoryGame({ onBack, onScore, best }) {
  const SYMBOLS = ['🧘','💚','🌿','🌸','🦋','🌙','☀️','💧']
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const deck = [...SYMBOLS, ...SYMBOLS]
      .map((s, i) => ({ id: i, symbol: s }))
      .sort(() => Math.random() - 0.5)
    setCards(deck)
    setFlipped([]); setMatched([]); setMoves(0); setFinished(false)
  }, [])

  const flip = (idx) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return
    const next = [...flipped, idx]
    setFlipped(next)
    if (next.length === 2) {
      setMoves(m => m + 1)
      if (cards[next[0]].symbol === cards[next[1]].symbol) {
        const newMatched = [...matched, next[0], next[1]]
        setMatched(newMatched)
        setFlipped([])
        if (newMatched.length === cards.length) {
          setFinished(true)
          const score = Math.max(100 - (moves * 3), 10)
          onScore(score)
        }
      } else {
        setTimeout(() => setFlipped([]), 700)
      }
    }
  }

  const restart = () => {
    const deck = [...SYMBOLS, ...SYMBOLS]
      .map((s, i) => ({ id: i, symbol: s }))
      .sort(() => Math.random() - 0.5)
    setCards(deck)
    setFlipped([]); setMatched([]); setMoves(0); setFinished(false)
  }

  return (
    <>
      <button className="course-back" onClick={onBack}>← Back to Games</button>
      <div className="card">
        <h2>🃏 Memory Match</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="sub" style={{ margin: 0 }}>Moves: {moves}</span>
          <span className="sub" style={{ margin: 0 }}>Matched: {matched.length / 2} / {SYMBOLS.length}</span>
        </div>
        <div className="memory-grid">
          {cards.map((c, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(i)
            return (
              <button
                key={i}
                className={`memory-cell ${isFlipped ? 'flipped' : ''} ${matched.includes(i) ? 'matched' : ''}`}
                onClick={() => flip(i)}
              >
                {isFlipped ? c.symbol : '?'}
              </button>
            )
          })}
        </div>
        {finished && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--sage-accent)', fontFamily: 'var(--font-serif)' }}>
              Nice! Completed in {moves} moves
            </div>
            {best > 0 && <div className="sub" style={{ margin: '4px 0 0' }}>Best score: {best}</div>}
            <button className="btn" onClick={restart} style={{ marginTop: 12 }}>Play Again</button>
          </div>
        )}
      </div>
    </>
  )
}

// --- Breath Flow (Rhythm) ---
function BreatheRhythmGame({ onBack, onScore, best }) {
  const PATTERN = [1200, 800, 1200, 800, 1500, 800, 1500, 800, 1200, 800]
  const [phase, setPhase] = useState('ready') // ready | playing | results
  const [targetIdx, setTargetIdx] = useState(0)
  const [showTarget, setShowTarget] = useState(false)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const start = () => {
    setPhase('playing'); setTargetIdx(0); setScore(0); setFeedback('')
    runTarget(0)
  }

  const runTarget = (idx) => {
    if (idx >= PATTERN.length) {
      setPhase('results')
      return
    }
    setShowTarget(true)
    startTimeRef.current = Date.now()
    setTargetIdx(idx)
    timerRef.current = setTimeout(() => {
      setShowTarget(false)
      setFeedback('Missed!')
      setTimeout(() => { setFeedback(''); runTarget(idx + 1) }, 500)
    }, PATTERN[idx] + 400)
  }

  const tap = () => {
    if (phase !== 'playing' || !showTarget) return
    clearTimeout(timerRef.current)
    const elapsed = Date.now() - startTimeRef.current
    const target = PATTERN[targetIdx]
    const diff = Math.abs(elapsed - target)
    let pts = 0
    if (diff < 100) { pts = 10; setFeedback('Perfect!') }
    else if (diff < 250) { pts = 7; setFeedback('Great!') }
    else if (diff < 500) { pts = 4; setFeedback('Good') }
    else { pts = 1; setFeedback('Off beat') }
    const newScore = score + pts
    setScore(newScore)
    setShowTarget(false)
    const nextIdx = targetIdx + 1
    if (nextIdx >= PATTERN.length) {
      onScore(newScore)
      setTimeout(() => setPhase('results'), 600)
    } else {
      setTimeout(() => { setFeedback(''); runTarget(nextIdx) }, 600)
    }
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <>
      <button className="course-back" onClick={onBack}>← Back to Games</button>
      <div className="card">
        <h2>🌊 Breath Flow</h2>
        <p className="sub">A glowing circle will pulse. Tap when it reaches full size. The closer your timing, the higher your score.</p>
        <div className="rhythm-area" onClick={tap}>
          {phase === 'ready' && (
            <div style={{ textAlign: 'center' }}>
              <div className="rhythm-circle idle">Ready</div>
              <button className="btn" onClick={start} style={{ marginTop: 20 }}>Start</button>
            </div>
          )}
          {phase === 'playing' && (
            <div style={{ textAlign: 'center' }}>
              <div className={`rhythm-circle ${showTarget ? 'pulse' : ''}`}>
                {showTarget ? 'Tap!' : '...'}
              </div>
              <div className="rhythm-feedback">{feedback}</div>
              <div className="sub" style={{ margin: '10px 0 0' }}>Score: {score} · Round {targetIdx + 1}/{PATTERN.length}</div>
            </div>
          )}
          {phase === 'results' && (
            <div style={{ textAlign: 'center' }}>
              <div className="rhythm-circle idle">Done</div>
              <div style={{ fontSize: '1.3rem', color: 'var(--sage-accent)', fontFamily: 'var(--font-serif)', marginTop: 16 }}>
                Score: {score} / {PATTERN.length * 10}
              </div>
              {best > 0 && <div className="sub" style={{ margin: '4px 0 0' }}>Best: {best}</div>}
              <button className="btn" onClick={start} style={{ marginTop: 12 }}>Play Again</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// --- Word Unscramble ---
const WORD_BANK = [
  'CALM','PEACE','FOCUS','BREATHE','MINDFUL','BALANCE','GENTLE',
  'GRATITUDE','SERENE','RESTORE','WELLNESS','NATURE','HARMONY',
  'COURAGE','KINDNESS','PATIENCE','HEALING','STILLNESS','GROWTH','RESILIENCE'
]

function WordGame({ onBack, onScore, best }) {
  const [wordIdx, setWordIdx] = useState(0)
  const [scrambled, setScrambled] = useState('')
  const [guess, setGuess] = useState('')
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [feedback, setFeedback] = useState('')
  const [done, setDone] = useState(false)
  const [words] = useState(() => [...WORD_BANK].sort(() => Math.random() - 0.5).slice(0, 8))
  const TOTAL = 8

  useEffect(() => {
    scramble(words[0])
  }, [])

  const scramble = (word) => {
    let s = word.split('').sort(() => Math.random() - 0.5).join('')
    while (s === word && word.length > 1) s = word.split('').sort(() => Math.random() - 0.5).join('')
    setScrambled(s)
  }

  const check = () => {
    if (guess.trim().toUpperCase() === words[wordIdx]) {
      const pts = score + 10
      setScore(pts)
      setFeedback('Correct!')
      if (round >= TOTAL) {
        onScore(pts)
        setTimeout(() => setDone(true), 800)
      } else {
        setTimeout(() => {
          const nextIdx = wordIdx + 1
          setWordIdx(nextIdx)
          scramble(words[nextIdx])
          setGuess('')
          setFeedback('')
          setRound(r => r + 1)
        }, 800)
      }
    } else {
      setFeedback('Not quite — try again!')
    }
  }

  const skip = () => {
    setFeedback(`It was: ${words[wordIdx]}`)
    if (round >= TOTAL) {
      onScore(score)
      setTimeout(() => setDone(true), 1200)
    } else {
      setTimeout(() => {
        const nextIdx = wordIdx + 1
        setWordIdx(nextIdx)
        scramble(words[nextIdx])
        setGuess('')
        setFeedback('')
        setRound(r => r + 1)
      }, 1200)
    }
  }

  const restart = () => {
    const newWords = [...WORD_BANK].sort(() => Math.random() - 0.5).slice(0, 8)
    words.splice(0, words.length, ...newWords)
    setWordIdx(0); scramble(newWords[0]); setGuess(''); setScore(0); setRound(1); setFeedback(''); setDone(false)
  }

  return (
    <>
      <button className="course-back" onClick={onBack}>← Back to Games</button>
      <div className="card">
        <h2>🔤 Word Unscramble</h2>
        {!done ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="sub" style={{ margin: 0 }}>Round {round}/{TOTAL}</span>
              <span className="sub" style={{ margin: 0 }}>Score: {score}</span>
            </div>
            <div className="word-scramble">{scrambled}</div>
            <input
              className="input"
              placeholder="Type your answer…"
              value={guess}
              onChange={e => setGuess(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') check() }}
              autoFocus
              style={{ marginTop: 16, textAlign: 'center', fontSize: '1.1rem', textTransform: 'uppercase' }}
            />
            {feedback && <div className="word-feedback">{feedback}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn full" onClick={check} disabled={!guess.trim()}>Check</button>
              <button className="btn secondary" onClick={skip}>Skip</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '1.3rem', color: 'var(--sage-accent)', fontFamily: 'var(--font-serif)' }}>
              Final score: {score} / {TOTAL * 10}
            </div>
            {best > 0 && <div className="sub" style={{ margin: '4px 0 0' }}>Best: {best}</div>}
            <button className="btn" onClick={restart} style={{ marginTop: 12 }}>Play Again</button>
          </div>
        )}
      </div>
    </>
  )
}

// --- Focus Tap ---
function FocusGame({ onBack, onScore, best }) {
  const ROUNDS = 15
  const [phase, setPhase] = useState('ready')
  const [targetPos, setTargetPos] = useState(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [lastReaction, setLastReaction] = useState(null)
  const timerRef = useRef(null)
  const areaRef = useRef(null)

  const spawnTarget = () => {
    const x = 10 + Math.random() * 75
    const y = 10 + Math.random() * 75
    setTargetPos({ x, y })
    setStartTime(Date.now())
    timerRef.current = setTimeout(() => {
      setTargetPos(null)
      setLastReaction(null)
      if (round + 1 < ROUNDS) {
        setRound(r => r + 1)
        setTimeout(spawnTarget, 300 + Math.random() * 800)
      } else {
        onScore(score)
        setPhase('results')
      }
    }, 1500)
  }

  const start = () => {
    setPhase('playing'); setRound(0); setScore(0); setLastReaction(null)
    setTimeout(spawnTarget, 500)
  }

  const hitTarget = () => {
    clearTimeout(timerRef.current)
    const reaction = Date.now() - startTime
    setLastReaction(reaction)
    let pts = 0
    if (reaction < 300) pts = 10
    else if (reaction < 500) pts = 7
    else if (reaction < 800) pts = 4
    else pts = 2
    const newScore = score + pts
    setScore(newScore)
    setTargetPos(null)
    const nextRound = round + 1
    if (nextRound >= ROUNDS) {
      onScore(newScore)
      setTimeout(() => setPhase('results'), 400)
    } else {
      setRound(nextRound)
      setTimeout(spawnTarget, 300 + Math.random() * 800)
    }
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <>
      <button className="course-back" onClick={onBack}>← Back to Games</button>
      <div className="card">
        <h2>🎯 Focus Tap</h2>
        <p className="sub">Tap the green circles as fast as you can. Speed matters!</p>
        {phase === 'ready' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <button className="btn" onClick={start}>Start</button>
          </div>
        )}
        {phase === 'playing' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="sub" style={{ margin: 0 }}>Round {round + 1}/{ROUNDS}</span>
              <span className="sub" style={{ margin: 0 }}>Score: {score}</span>
            </div>
            {lastReaction && <div className="sub" style={{ margin: '0 0 4px', textAlign: 'center' }}>{lastReaction}ms</div>}
            <div className="focus-area" ref={areaRef}>
              {targetPos && (
                <button
                  className="focus-target"
                  style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
                  onClick={hitTarget}
                />
              )}
            </div>
          </>
        )}
        {phase === 'results' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '1.3rem', color: 'var(--sage-accent)', fontFamily: 'var(--font-serif)' }}>
              Score: {score} / {ROUNDS * 10}
            </div>
            {best > 0 && <div className="sub" style={{ margin: '4px 0 0' }}>Best: {best}</div>}
            <button className="btn" onClick={start} style={{ marginTop: 12 }}>Play Again</button>
          </div>
        )}
      </div>
    </>
  )
}

// --- Gem Crush (match-3) ---
const GEM_COLS = 7
const GEM_ROWS = 8
const GEM_ICONS = ['🔮','💎','🌺','🍃','💧','☀️','🦋']

function createBoard() {
  const b = []
  for (let r = 0; r < GEM_ROWS; r++) {
    const row = []
    for (let c = 0; c < GEM_COLS; c++) {
      row.push(GEM_ICONS[Math.floor(Math.random() * GEM_ICONS.length)])
    }
    b.push(row)
  }
  return b
}

function findMatches(board) {
  const matched = new Set()
  // horizontal
  for (let r = 0; r < GEM_ROWS; r++) {
    for (let c = 0; c < GEM_COLS - 2; c++) {
      const g = board[r][c]
      if (g && g === board[r][c+1] && g === board[r][c+2]) {
        let end = c + 2
        while (end + 1 < GEM_COLS && board[r][end+1] === g) end++
        for (let i = c; i <= end; i++) matched.add(`${r},${i}`)
      }
    }
  }
  // vertical
  for (let c = 0; c < GEM_COLS; c++) {
    for (let r = 0; r < GEM_ROWS - 2; r++) {
      const g = board[r][c]
      if (g && g === board[r+1][c] && g === board[r+2][c]) {
        let end = r + 2
        while (end + 1 < GEM_ROWS && board[end+1][c] === g) end++
        for (let i = r; i <= end; i++) matched.add(`${i},${c}`)
      }
    }
  }
  return matched
}

function removeAndDrop(board, matched) {
  const b = board.map(r => [...r])
  // remove matched
  matched.forEach(key => {
    const [r, c] = key.split(',').map(Number)
    b[r][c] = null
  })
  // gravity: drop nulls
  for (let c = 0; c < GEM_COLS; c++) {
    let writeRow = GEM_ROWS - 1
    for (let r = GEM_ROWS - 1; r >= 0; r--) {
      if (b[r][c] !== null) {
        b[writeRow][c] = b[r][c]
        if (writeRow !== r) b[r][c] = null
        writeRow--
      }
    }
    // fill empty top with new gems
    for (let r = writeRow; r >= 0; r--) {
      b[r][c] = GEM_ICONS[Math.floor(Math.random() * GEM_ICONS.length)]
    }
  }
  return b
}

function settleBoard(board) {
  let b = board.map(r => [...r])
  let totalCleared = 0
  let m = findMatches(b)
  while (m.size > 0) {
    totalCleared += m.size
    b = removeAndDrop(b, m)
    m = findMatches(b)
  }
  return { board: b, cleared: totalCleared }
}

function GemCrushGame({ onBack, onScore, best }) {
  const TOTAL_MOVES = 25
  const [board, setBoard] = useState(() => {
    const { board: settled } = settleBoard(createBoard())
    return settled
  })
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [movesLeft, setMovesLeft] = useState(TOTAL_MOVES)
  const [matched, setMatched] = useState(new Set())
  const [gameOver, setGameOver] = useState(false)

  const isAdjacent = (r1, c1, r2, c2) =>
    Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && (r1 !== r2 || c1 !== c2)

  const handleTap = (r, c) => {
    if (gameOver) return
    if (!selected) {
      setSelected({ r, c })
      return
    }
    const { r: sr, c: sc } = selected
    if (sr === r && sc === c) { setSelected(null); return }
    if (!isAdjacent(sr, sc, r, c)) { setSelected({ r, c }); return }

    // try swap
    const b = board.map(row => [...row])
    ;[b[sr][sc], b[r][c]] = [b[r][c], b[sr][sc]]
    const m = findMatches(b)
    if (m.size === 0) {
      // invalid swap — revert
      setSelected(null)
      return
    }
    // valid swap
    setMatched(m)
    setSelected(null)
    const ml = movesLeft - 1

    setTimeout(() => {
      const { board: settled, cleared } = settleBoard(b)
      const pts = cleared * 10
      const newScore = score + pts
      setBoard(settled)
      setScore(newScore)
      setMovesLeft(ml)
      setMatched(new Set())
      if (ml <= 0) {
        onScore(newScore)
        setGameOver(true)
      }
    }, 250)
  }

  const restart = () => {
    const { board: settled } = settleBoard(createBoard())
    setBoard(settled)
    setSelected(null)
    setScore(0)
    setMovesLeft(TOTAL_MOVES)
    setMatched(new Set())
    setGameOver(false)
  }

  return (
    <>
      <button className="course-back" onClick={onBack}>← Back to Games</button>
      <div className="card">
        <h2>💎 Gem Crush</h2>
        <p className="sub">Swap adjacent gems to match 3 or more in a row.</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="sub" style={{ margin: 0 }}>Moves: {movesLeft}</span>
          <span className="sub" style={{ margin: 0 }}>Score: {score}</span>
        </div>
        <div className="gem-grid">
          {board.map((row, r) =>
            row.map((gem, c) => (
              <button
                key={`${r}-${c}`}
                className={
                  'gem-cell' +
                  (selected && selected.r === r && selected.c === c ? ' selected' : '') +
                  (matched.has(`${r},${c}`) ? ' clearing' : '')
                }
                onClick={() => handleTap(r, c)}
              >
                {gem}
              </button>
            ))
          )}
        </div>
        {gameOver && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '1.3rem', color: 'var(--sage-accent)', fontFamily: 'var(--font-serif)' }}>
              Score: {score}
            </div>
            {best > 0 && <div className="sub" style={{ margin: '4px 0 0' }}>Best: {best}</div>}
            <button className="btn" onClick={restart} style={{ marginTop: 12 }}>Play Again</button>
          </div>
        )}
      </div>
    </>
  )
}

// --- Zen Stack (Tetris-style) ---
const ZS_COLS = 10
const ZS_ROWS = 18
const ZS_SHAPES = [
  { blocks: [[0,0],[0,1],[1,0],[1,1]], color: '#f0c040' },           // O
  { blocks: [[0,0],[0,1],[0,2],[0,3]], color: '#40c0e0' },           // I
  { blocks: [[0,0],[1,0],[1,1],[1,2]], color: '#4080e0' },           // J
  { blocks: [[0,2],[1,0],[1,1],[1,2]], color: '#e0a040' },           // L
  { blocks: [[0,1],[0,2],[1,0],[1,1]], color: '#60c060' },           // S
  { blocks: [[0,0],[0,1],[1,1],[1,2]], color: '#d05050' },           // Z
  { blocks: [[0,1],[1,0],[1,1],[1,2]], color: '#a060d0' }            // T
]

function ZenStackGame({ onBack, onScore, best }) {
  const boardRef = useRef(Array.from({ length: ZS_ROWS }, () => Array(ZS_COLS).fill(null)))
  const pieceRef = useRef(null)
  const posRef = useRef({ r: 0, c: 3 })
  const scoreRef = useRef(0)
  const gameOverRef = useRef(false)
  const intervalRef = useRef(null)
  const [, forceRender] = useState(0)
  const [phase, setPhase] = useState('ready')
  const [displayScore, setDisplayScore] = useState(0)
  const canvasRef = useRef(null)

  const rerender = () => forceRender(n => n + 1)

  const randomPiece = () => {
    const shape = ZS_SHAPES[Math.floor(Math.random() * ZS_SHAPES.length)]
    return { blocks: shape.blocks.map(b => [...b]), color: shape.color }
  }

  const fits = (board, piece, pos) => {
    return piece.blocks.every(([br, bc]) => {
      const r = pos.r + br, c = pos.c + bc
      return r >= 0 && r < ZS_ROWS && c >= 0 && c < ZS_COLS && !board[r][c]
    })
  }

  const lockPiece = useCallback(() => {
    const board = boardRef.current
    const piece = pieceRef.current
    const pos = posRef.current
    piece.blocks.forEach(([br, bc]) => {
      const r = pos.r + br, c = pos.c + bc
      if (r >= 0 && r < ZS_ROWS) board[r][c] = piece.color
    })
    // clear full rows
    let cleared = 0
    for (let r = ZS_ROWS - 1; r >= 0; r--) {
      if (board[r].every(cell => cell !== null)) {
        board.splice(r, 1)
        board.unshift(Array(ZS_COLS).fill(null))
        cleared++
        r++ // recheck same row
      }
    }
    const linePts = [0, 40, 100, 300, 1200]
    scoreRef.current += (linePts[cleared] || 0)
    setDisplayScore(scoreRef.current)

    // spawn next
    const next = randomPiece()
    const nextPos = { r: 0, c: Math.floor((ZS_COLS - 3) / 2) }
    if (!fits(board, next, nextPos)) {
      gameOverRef.current = true
      clearInterval(intervalRef.current)
      onScore(scoreRef.current)
      setPhase('results')
      return
    }
    pieceRef.current = next
    posRef.current = nextPos
    rerender()
  }, [onScore])

  const tick = useCallback(() => {
    if (gameOverRef.current) return
    const newPos = { r: posRef.current.r + 1, c: posRef.current.c }
    if (fits(boardRef.current, pieceRef.current, newPos)) {
      posRef.current = newPos
      rerender()
    } else {
      lockPiece()
    }
  }, [lockPiece])

  const start = () => {
    boardRef.current = Array.from({ length: ZS_ROWS }, () => Array(ZS_COLS).fill(null))
    pieceRef.current = randomPiece()
    posRef.current = { r: 0, c: Math.floor((ZS_COLS - 3) / 2) }
    scoreRef.current = 0
    setDisplayScore(0)
    gameOverRef.current = false
    setPhase('playing')
    rerender()
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(tick, 600)
  }

  const move = (dc) => {
    if (gameOverRef.current) return
    const newPos = { r: posRef.current.r, c: posRef.current.c + dc }
    if (fits(boardRef.current, pieceRef.current, newPos)) {
      posRef.current = newPos
      rerender()
    }
  }

  const rotate = () => {
    if (gameOverRef.current) return
    const piece = pieceRef.current
    const rotated = piece.blocks.map(([r, c]) => [c, -r])
    const minR = Math.min(...rotated.map(b => b[0]))
    const minC = Math.min(...rotated.map(b => b[1]))
    const normalized = rotated.map(([r, c]) => [r - minR, c - minC])
    const testPiece = { blocks: normalized, color: piece.color }
    if (fits(boardRef.current, testPiece, posRef.current)) {
      pieceRef.current = testPiece
      rerender()
    }
  }

  const drop = () => {
    if (gameOverRef.current) return
    while (fits(boardRef.current, pieceRef.current, { r: posRef.current.r + 1, c: posRef.current.c })) {
      posRef.current = { r: posRef.current.r + 1, c: posRef.current.c }
    }
    lockPiece()
  }

  useEffect(() => {
    const handler = (e) => {
      if (phase !== 'playing') return
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1) }
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1) }
      if (e.key === 'ArrowUp') { e.preventDefault(); rotate() }
      if (e.key === 'ArrowDown') { e.preventDefault(); tick() }
      if (e.key === ' ') { e.preventDefault(); drop() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, tick])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  // Build display grid
  const displayGrid = boardRef.current.map(r => [...r])
  if (pieceRef.current && !gameOverRef.current) {
    pieceRef.current.blocks.forEach(([br, bc]) => {
      const r = posRef.current.r + br, c = posRef.current.c + bc
      if (r >= 0 && r < ZS_ROWS && c >= 0 && c < ZS_COLS) {
        displayGrid[r][c] = pieceRef.current.color
      }
    })
  }

  return (
    <>
      <button className="course-back" onClick={onBack}>← Back to Games</button>
      <div className="card">
        <h2>🧱 Zen Stack</h2>
        <p className="sub">Stack the falling blocks and clear full lines.</p>
        {phase === 'ready' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <button className="btn" onClick={start}>Start</button>
          </div>
        )}
        {phase === 'playing' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="sub" style={{ margin: 0 }}>Score: {displayScore}</span>
            </div>
            <div className="zen-board">
              {displayGrid.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={'zen-cell' + (cell ? ' filled' : '')}
                    style={cell ? { background: cell } : undefined}
                  />
                ))
              )}
            </div>
            <div className="zen-controls">
              <button className="zen-btn" onClick={() => move(-1)}>←</button>
              <button className="zen-btn" onClick={rotate}>↻</button>
              <button className="zen-btn" onClick={() => tick()}>↓</button>
              <button className="zen-btn" onClick={drop}>⤓</button>
              <button className="zen-btn" onClick={() => move(1)}>→</button>
            </div>
          </>
        )}
        {phase === 'results' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '1.3rem', color: 'var(--sage-accent)', fontFamily: 'var(--font-serif)' }}>
              Score: {displayScore}
            </div>
            {best > 0 && <div className="sub" style={{ margin: '4px 0 0' }}>Best: {best}</div>}
            <button className="btn" onClick={start} style={{ marginTop: 12 }}>Play Again</button>
          </div>
        )}
      </div>
    </>
  )
}

// --- Lily Hop (Frogger-style) ---
const LH_COLS = 9
const LH_ROWS = 13
const LH_TICK = 200

function buildLanes() {
  // Row 0 = goal, rows 1-5 = river (logs), row 6 = safe, rows 7-11 = road (cars), row 12 = start
  return [
    { type: 'goal' },
    { type: 'river', items: [{c:0,w:3},{c:5,w:2}],  dir: 1,  speed: 1 },
    { type: 'river', items: [{c:2,w:4}],             dir: -1, speed: 1 },
    { type: 'river', items: [{c:0,w:2},{c:4,w:3}],  dir: 1,  speed: 2 },
    { type: 'river', items: [{c:1,w:3},{c:6,w:2}],  dir: -1, speed: 1 },
    { type: 'river', items: [{c:0,w:4},{c:6,w:3}],  dir: 1,  speed: 1 },
    { type: 'safe' },
    { type: 'road',  items: [{c:1,w:1},{c:4,w:1},{c:7,w:1}], dir: -1, speed: 1 },
    { type: 'road',  items: [{c:0,w:1},{c:3,w:1},{c:6,w:1}], dir: 1,  speed: 2 },
    { type: 'road',  items: [{c:2,w:1},{c:5,w:1},{c:8,w:1}], dir: -1, speed: 1 },
    { type: 'road',  items: [{c:1,w:2},{c:6,w:2}],            dir: 1,  speed: 1 },
    { type: 'road',  items: [{c:0,w:1},{c:3,w:1},{c:7,w:1}], dir: -1, speed: 2 },
    { type: 'start' }
  ]
}

function LilyHopGame({ onBack, onScore, best }) {
  const [phase, setPhase] = useState('ready')
  const [frogR, setFrogR] = useState(12)
  const [frogC, setFrogC] = useState(4)
  const [lanes, setLanes] = useState(() => buildLanes())
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [bestRow, setBestRow] = useState(12)
  const intervalRef = useRef(null)
  const frogRef = useRef({ r: 12, c: 4 })
  const lanesRef = useRef(lanes)
  const livesRef = useRef(3)
  const scoreRef = useRef(0)
  const bestRowRef = useRef(12)

  const resetFrog = () => {
    frogRef.current = { r: 12, c: 4 }
    setFrogR(12)
    setFrogC(4)
  }

  const die = useCallback(() => {
    const l = livesRef.current - 1
    livesRef.current = l
    setLives(l)
    if (l <= 0) {
      clearInterval(intervalRef.current)
      onScore(scoreRef.current)
      setPhase('results')
    } else {
      resetFrog()
    }
  }, [onScore])

  const checkCollision = useCallback((r, c, currentLanes) => {
    const lane = currentLanes[r]
    if (!lane) return false
    if (lane.type === 'road') {
      // hit by car?
      for (const item of lane.items) {
        const ic = ((item.c % LH_COLS) + LH_COLS) % LH_COLS
        for (let w = 0; w < item.w; w++) {
          if (((ic + w) % LH_COLS) === ((c % LH_COLS) + LH_COLS) % LH_COLS) return true
        }
      }
    }
    if (lane.type === 'river') {
      // must be on a log
      let onLog = false
      for (const item of lane.items) {
        const ic = ((item.c % LH_COLS) + LH_COLS) % LH_COLS
        for (let w = 0; w < item.w; w++) {
          if (((ic + w) % LH_COLS) === ((c % LH_COLS) + LH_COLS) % LH_COLS) onLog = true
        }
      }
      if (!onLog) return true
    }
    return false
  }, [])

  const tick = useCallback(() => {
    setLanes(prev => {
      const next = prev.map((lane, idx) => {
        if (lane.type !== 'road' && lane.type !== 'river') return lane
        const moved = {
          ...lane,
          items: lane.items.map(item => ({
            ...item,
            c: ((item.c + lane.dir * lane.speed) % LH_COLS + LH_COLS) % LH_COLS
          }))
        }
        return moved
      })
      lanesRef.current = next

      // If frog on river, move with log
      const fr = frogRef.current.r
      const fc = frogRef.current.c
      const fLane = next[fr]
      if (fLane && fLane.type === 'river') {
        const newC = ((fc + fLane.dir * fLane.speed) % LH_COLS + LH_COLS) % LH_COLS
        frogRef.current.c = newC
        setFrogC(newC)
      }

      // Check collision after movement
      if (checkCollision(frogRef.current.r, frogRef.current.c, next)) {
        die()
      }

      return next
    })
  }, [checkCollision, die])

  const start = () => {
    const freshLanes = buildLanes()
    setLanes(freshLanes)
    lanesRef.current = freshLanes
    livesRef.current = 3
    setLives(3)
    scoreRef.current = 0
    setScore(0)
    bestRowRef.current = 12
    setBestRow(12)
    resetFrog()
    setPhase('playing')
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(tick, LH_TICK)
  }

  const moveFrog = useCallback((dr, dc) => {
    if (phase !== 'playing') return
    const nr = Math.max(0, Math.min(LH_ROWS - 1, frogRef.current.r + dr))
    const nc = ((frogRef.current.c + dc) % LH_COLS + LH_COLS) % LH_COLS

    frogRef.current = { r: nr, c: nc }
    setFrogR(nr)
    setFrogC(nc)

    // Score for forward progress
    if (nr < bestRowRef.current) {
      const pts = (bestRowRef.current - nr) * 10
      bestRowRef.current = nr
      setBestRow(nr)
      scoreRef.current += pts
      setScore(scoreRef.current)
    }

    // Reached goal!
    if (nr === 0) {
      scoreRef.current += 50
      setScore(scoreRef.current)
      resetFrog()
      bestRowRef.current = 12
      setBestRow(12)
    }

    // Check collision
    if (checkCollision(nr, nc, lanesRef.current)) {
      die()
    }
  }, [phase, checkCollision, die])

  useEffect(() => {
    const handler = (e) => {
      if (phase !== 'playing') return
      if (e.key === 'ArrowUp')    { e.preventDefault(); moveFrog(-1, 0) }
      if (e.key === 'ArrowDown')  { e.preventDefault(); moveFrog(1, 0) }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); moveFrog(0, -1) }
      if (e.key === 'ArrowRight') { e.preventDefault(); moveFrog(0, 1) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, moveFrog])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const getCellContent = (r, c) => {
    if (frogR === r && frogC === c) return '🐸'
    const lane = lanes[r]
    if (lane.type === 'goal') return r === 0 ? '🌸' : ''
    if (lane.type === 'road') {
      for (const item of lane.items) {
        const ic = ((item.c % LH_COLS) + LH_COLS) % LH_COLS
        for (let w = 0; w < item.w; w++) {
          if (((ic + w) % LH_COLS) === c) return lane.dir > 0 ? '🚗' : '🚙'
        }
      }
    }
    if (lane.type === 'river') {
      for (const item of lane.items) {
        const ic = ((item.c % LH_COLS) + LH_COLS) % LH_COLS
        for (let w = 0; w < item.w; w++) {
          if (((ic + w) % LH_COLS) === c) return '🪵'
        }
      }
      return '🌊'
    }
    return ''
  }

  const getCellClass = (r, c) => {
    const lane = lanes[r]
    if (lane.type === 'goal') return 'lh-goal'
    if (lane.type === 'safe' || lane.type === 'start') return 'lh-safe'
    if (lane.type === 'road') return 'lh-road'
    if (lane.type === 'river') return 'lh-water'
    return ''
  }

  return (
    <>
      <button className="course-back" onClick={onBack}>← Back to Games</button>
      <div className="card">
        <h2>🐸 Lily Hop</h2>
        <p className="sub">Guide the frog to the flowers. Avoid cars, ride logs!</p>
        {phase === 'ready' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <button className="btn" onClick={start}>Start</button>
          </div>
        )}
        {phase === 'playing' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="sub" style={{ margin: 0 }}>Lives: {'🐸'.repeat(lives)}</span>
              <span className="sub" style={{ margin: 0 }}>Score: {score}</span>
            </div>
            <div className="lh-board">
              {Array.from({ length: LH_ROWS }, (_, r) =>
                Array.from({ length: LH_COLS }, (_, c) => (
                  <div key={`${r}-${c}`} className={`lh-cell ${getCellClass(r, c)}`}>
                    {getCellContent(r, c)}
                  </div>
                ))
              )}
            </div>
            <div className="zen-controls" style={{ marginTop: 12 }}>
              <button className="zen-btn" onClick={() => moveFrog(0, -1)}>←</button>
              <button className="zen-btn" onClick={() => moveFrog(-1, 0)}>↑</button>
              <button className="zen-btn" onClick={() => moveFrog(1, 0)}>↓</button>
              <button className="zen-btn" onClick={() => moveFrog(0, 1)}>→</button>
            </div>
          </>
        )}
        {phase === 'results' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '1.3rem', color: 'var(--sage-accent)', fontFamily: 'var(--font-serif)' }}>
              Score: {score}
            </div>
            {best > 0 && <div className="sub" style={{ margin: '4px 0 0' }}>Best: {best}</div>}
            <button className="btn" onClick={start} style={{ marginTop: 12 }}>Play Again</button>
          </div>
        )}
      </div>
    </>
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
