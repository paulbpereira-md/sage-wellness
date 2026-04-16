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
  { id: 'breathe',  label: 'Breathe', icon: '🫁' },
  { id: 'plan',     label: 'Plan',    icon: '✨' },
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
            <>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--sage-accent)' }}>${c.price}</div>
              <div className="sub" style={{ marginBottom: 12 }}>One-time payment · Lifetime access.</div>
              <button className="btn full warm" disabled>Checkout coming soon</button>
              <p className="sub" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.78rem' }}>
                Paid checkout needs Stripe setup. Free lessons are unlocked above.
              </p>
            </>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="course-grid">
        {COURSES.map(c => {
          const priceLabel = c.free ? 'Free' : `$${c.price}`
          return (
            <button key={c.id} className="course-card" onClick={() => openDetail(c.id)}>
              <div className="course-thumb">
                <span className="course-emoji">{c.emoji}</span>
                <span className={`course-badge ${c.free ? 'free' : 'paid'}`}>{priceLabel}</span>
              </div>
              <div className="course-body">
                <div className="course-cat">{c.cat}</div>
                <div className="course-name">{c.name}</div>
                <div className="course-desc">{c.desc}</div>
                <div className="course-footer">
                  <span className={`course-price ${c.free ? 'free' : ''}`}>{priceLabel}</span>
                  <span className="course-lessons-count">{c.lessons.length} lessons</span>
                </div>
              </div>
            </button>
          )
        })}
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
