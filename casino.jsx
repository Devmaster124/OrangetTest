// ================= BLOOK CASINO =================
const CW = 1800, CH = 1300
const CGAMES = [
  { id: 'slots', name: 'Slots', ic: '🎰', x: 300, y: 260, c: '#e8423a' },
  { id: 'flip', name: 'Coin Flip', ic: '🪙', x: 900, y: 200, c: '#e0a800' },
  { id: 'roulette', name: 'Roulette', ic: '🎡', x: 1500, y: 260, c: '#7a3cd8' },
  { id: 'dice', name: 'Dice', ic: '🎲', x: 300, y: 700, c: '#2a8de0' },
  { id: 'bj', name: 'Blackjack', ic: '🃏', x: 1500, y: 700, c: '#1f8a4c' },
  { id: 'crash', name: 'Crash', ic: '🚀', x: 450, y: 1100, c: '#e0568a' },
  { id: 'hilo', name: 'Hi-Lo', ic: '🔼', x: 1350, y: 1100, c: '#d86a1e' },
]
const clampN = (v, a, b) => Math.max(a, Math.min(b, v))
const rnd = (n) => Math.floor(Math.random() * n)
const SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const drawCard = () => ({ r: RANKS[rnd(13)], s: SUITS[rnd(4)] })
const cardVal = (r) => (r === 'A' ? 11 : 'JQK'.includes(r) ? 10 : +r)
const handVal = (h) => { let t = h.reduce((a, c) => a + cardVal(c.r), 0), a = h.filter((c) => c.r === 'A').length; while (t > 21 && a > 0) { t -= 10; a-- } return t }
const PCard = ({ c, hide }) => hide ? <span className="cz-pc" style={{ background: '#5a2ea0', color: '#fff' }}>?</span> : <span className={`cz-pc ${c.s === '♥' || c.s === '♦' ? 'r' : ''}`}>{c.r}{c.s}</span>
const CasinoI = mk(<><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.3" fill="currentColor" /><circle cx="16" cy="16" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /></>)

function BetBar({ bet, setBet, stack, disabled }) {
  return (
    <div className="flex flex-wrap items-center gap-2"><span className="chunk">Bet</span>
      <input type="number" min="1" value={bet || ''} disabled={disabled} onChange={(e) => setBet(Math.max(0, Math.floor(+e.target.value || 0)))} />
      {[10, 50, 100, 500].map((v) => <button key={v} className="cz-btn" disabled={disabled || v > stack} onClick={() => setBet(v)}>{v}</button>)}
      <button className="cz-btn" disabled={disabled || stack < 1} onClick={() => setBet(stack)}>Max</button></div>
  )
}
function GameShell({ title, stack, onClose, busy, children }) {
  return ReactDOM.createPortal(
    <div className="cz-card"><div className="cz-panel" role="dialog" aria-label={title}>
      <div className="flex items-center justify-between gap-2"><h3 className="display text-2xl">{title}</h3><span className="chunk flex items-center gap-1"><Coins size={22} />{stack.toLocaleString()}</span><button className="cz-btn" disabled={busy} onClick={onClose}>Close</button></div>
      <div className="mt-3 space-y-3">{children}</div></div></div>, document.body)
}
const Msg = ({ m }) => <div className="chunk min-h-[2rem] text-center text-xl" style={{ color: m && m.startsWith('+') ? '#7dff9a' : m && m.startsWith('-') ? '#ff8a8a' : '#fff' }}>{m || ' '}</div>

function Slots({ stack, setStack, onClose }) {
  const S = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'], PAY = { '🍒': 5, '🍋': 8, '🔔': 12, '⭐': 20, '💎': 40, '7️⃣': 90 }
  const [bet, setBet] = useState(Math.min(10, stack)), [r, setR] = useState(['🍒', '🍋', '🔔']), [busy, setBusy] = useState(false), [msg, setMsg] = useState('')
  const ok = bet >= 1 && bet <= stack
  const spin = () => {
    if (!ok || busy) return
    setBusy(true); setMsg('')
    const fin = [S[rnd(6)], S[rnd(6)], S[rnd(6)]]
    const iv = setInterval(() => setR([S[rnd(6)], S[rnd(6)], S[rnd(6)]]), 80)
    setTimeout(() => {
      clearInterval(iv); setR(fin)
      let mult = 0
      if (fin[0] === fin[1] && fin[1] === fin[2]) mult = PAY[fin[0]]
      else if (fin.filter((x) => x === '🍒').length === 2) mult = 2
      const d = Math.round(bet * (mult - 1))
      setStack((s) => s + d); setMsg(mult ? `+${d} (${mult}x)` : `-${bet}`); setBusy(false)
    }, 1100)
  }
  useEffect(() => { if (bet > stack) setBet(stack) }, [stack])
  return <GameShell title="🎰 Slots" stack={stack} onClose={onClose} busy={busy}>
    <div className="flex justify-center gap-2">{r.map((x, i) => <div key={i} className="cz-reel">{x}</div>)}</div>
    <p className="text-center text-xs opacity-70">3 match: 🍒5x 🍋8x 🔔12x ⭐20x 💎40x 7️⃣90x · two 🍒 = 2x</p>
    <Msg m={msg} /><BetBar bet={bet} setBet={setBet} stack={stack} disabled={busy} />
    <button className="cz-btn w-full" disabled={!ok || busy} onClick={spin}>Spin</button></GameShell>
}
function Flip({ stack, setStack, onClose }) {
  const [bet, setBet] = useState(Math.min(10, stack)), [side, setSide] = useState('H'), [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [face, setFace] = useState('🪙'), [spin, setSpin] = useState(0)
  const ok = bet >= 1 && bet <= stack
  const go = () => {
    if (!ok || busy) return
    setBusy(true); setMsg(''); setFace('🪙'); setSpin((n) => n + 1)
    const res = Math.random() < 0.5 ? 'H' : 'T'
    setTimeout(() => {
      setFace(res === 'H' ? '👑 Heads' : '🦅 Tails')
      const d = res === side ? Math.round(bet * 0.95) : -bet
      setStack((s) => s + d); setMsg(d > 0 ? `+${d}` : `${d}`); setBusy(false)
    }, 1200)
  }
  return <GameShell title="🪙 Coin Flip" stack={stack} onClose={onClose} busy={busy}>
    <div key={spin} className="grid h-28 place-items-center text-5xl" style={{ animation: busy ? 'coinsp 1.2s ease-in-out' : 'none' }}>{face}</div>
    <style>{'@keyframes coinsp{to{transform:rotateY(1800deg)}}'}</style>
    <div className="flex justify-center gap-2">{[['H', 'Heads'], ['T', 'Tails']].map(([k, l]) => <button key={k} className="cz-btn" style={{ outline: side === k ? '3px solid #fff' : 'none' }} disabled={busy} onClick={() => setSide(k)}>{l}</button>)}</div>
    <Msg m={msg} /><BetBar bet={bet} setBet={setBet} stack={stack} disabled={busy} />
    <button className="cz-btn w-full" disabled={!ok || busy} onClick={go}>Flip (1.95x)</button></GameShell>
}
function Roulette({ stack, setStack, onClose }) {
  const col = (n) => (n === 0 ? 'green' : n <= 7 ? 'red' : 'black'), HEX = { red: '#d11', black: '#111', green: '#0a9a3a' }
  const [bet, setBet] = useState(Math.min(10, stack)), [pick, setPick] = useState('red'), [n, setN] = useState(0), [busy, setBusy] = useState(false), [msg, setMsg] = useState('')
  const ok = bet >= 1 && bet <= stack
  const go = () => {
    if (!ok || busy) return
    setBusy(true); setMsg('')
    const res = rnd(15), iv = setInterval(() => setN(rnd(15)), 90)
    setTimeout(() => {
      clearInterval(iv); setN(res)
      const mult = col(res) === pick ? (pick === 'green' ? 14 : 2) : 0, d = Math.round(bet * (mult - 1))
      setStack((s) => s + d); setMsg(mult ? `+${d}` : `-${bet}`); setBusy(false)
    }, 1600)
  }
  return <GameShell title="🎡 Roulette" stack={stack} onClose={onClose} busy={busy}>
    <div className="mx-auto grid h-24 w-24 place-items-center rounded-full text-4xl font-black" style={{ background: HEX[col(n)], border: '5px solid #ffb347' }}>{n}</div>
    <div className="flex justify-center gap-2">{[['red', 'Red 2x'], ['black', 'Black 2x'], ['green', 'Green 14x']].map(([k, l]) => <button key={k} className="cz-btn" style={{ outline: pick === k ? '3px solid #fff' : 'none' }} disabled={busy} onClick={() => setPick(k)}>{l}</button>)}</div>
    <p className="text-center text-xs opacity-70">Numbers 0–14 · 0 green · 1–7 red · 8–14 black</p>
    <Msg m={msg} /><BetBar bet={bet} setBet={setBet} stack={stack} disabled={busy} />
    <button className="cz-btn w-full" disabled={!ok || busy} onClick={go}>Spin</button></GameShell>
}
function Dice({ stack, setStack, onClose }) {
  const [bet, setBet] = useState(Math.min(10, stack)), [t, setT] = useState(50), [over, setOver] = useState(true), [roll, setRoll] = useState(null), [busy, setBusy] = useState(false), [msg, setMsg] = useState('')
  const p = over ? (100 - t) / 100 : (t - 1) / 100, mult = 0.96 / p, ok = bet >= 1 && bet <= stack
  const go = () => {
    if (!ok || busy) return
    setBusy(true); setMsg('')
    const res = 1 + rnd(100), iv = setInterval(() => setRoll(1 + rnd(100)), 70)
    setTimeout(() => {
      clearInterval(iv); setRoll(res)
      const win = over ? res > t : res < t, d = win ? Math.round(bet * (mult - 1)) : -bet
      setStack((s) => s + d); setMsg(win ? `+${d}` : `${d}`); setBusy(false)
    }, 1000)
  }
  return <GameShell title="🎲 Dice" stack={stack} onClose={onClose} busy={busy}>
    <div className="grid h-24 place-items-center text-6xl font-black">{roll ?? '?'}</div>
    <div className="flex items-center justify-center gap-2">
      <button className="cz-btn" style={{ outline: over ? '3px solid #fff' : 'none' }} disabled={busy} onClick={() => setOver(true)}>Over {t}</button>
      <button className="cz-btn" style={{ outline: !over ? '3px solid #fff' : 'none' }} disabled={busy} onClick={() => setOver(false)}>Under {t}</button></div>
    <input type="range" min="5" max="95" value={t} disabled={busy} onChange={(e) => setT(+e.target.value)} style={{ width: '100%' }} />
    <p className="text-center text-sm">Win chance {(p * 100).toFixed(0)}% · pays {mult.toFixed(2)}x</p>
    <Msg m={msg} /><BetBar bet={bet} setBet={setBet} stack={stack} disabled={busy} />
    <button className="cz-btn w-full" disabled={!ok || busy} onClick={go}>Roll</button></GameShell>
}
function Blackjack({ stack, setStack, onClose }) {
  const [bet, setBet] = useState(Math.min(10, stack)), [g, setG] = useState(null), [msg, setMsg] = useState('')
  const live = g && g.live, ok = bet >= 1 && bet <= stack
  const end = (p, d, b, how) => {
    const pv = handVal(p), dv = handVal(d); let pay = 0, m
    if (how === 'bj') { pay = Math.floor(b * 2.5); m = `Blackjack! +${pay - b}` }
    else if (pv > 21) m = `Bust -${b}`
    else if (dv > 21 || pv > dv) { pay = b * 2; m = `You win +${b}` }
    else if (pv === dv) { pay = b; m = 'Push' }
    else m = `Dealer wins -${b}`
    if (pay) setStack((s) => s + pay)
    setMsg(m.replace(/^(Blackjack! |You win )/, '$1')); setG({ p, d, b, live: false })
  }
  const deal = () => {
    if (!ok || live) return
    setStack((s) => s - bet); setMsg('')
    const p = [drawCard(), drawCard()], d = [drawCard(), drawCard()]
    if (handVal(p) === 21) end(p, d, bet, 'bj'); else setG({ p, d, b: bet, live: true })
  }
  const hit = () => { const p = [...g.p, drawCard()]; if (handVal(p) > 21) end(p, g.d, g.b); else setG({ ...g, p }) }
  const stand = () => { const d = [...g.d]; while (handVal(d) < 17) d.push(drawCard()); end(g.p, d, g.b) }
  const dbl = () => { if (stack < g.b) return; setStack((s) => s - g.b); const b = g.b * 2, p = [...g.p, drawCard()], d = [...g.d]; if (handVal(p) <= 21) while (handVal(d) < 17) d.push(drawCard()); end(p, d, b) }
  const col = msg.startsWith('Bust') || msg.startsWith('Dealer') ? '-' : msg.startsWith('Push') ? '' : msg ? '+' : ''
  return <GameShell title="🃏 Blackjack" stack={stack} onClose={onClose} busy={!!live}>
    {g && <div className="text-center"><div className="text-sm opacity-70">Dealer {live ? '' : handVal(g.d)}</div><div>{g.d.map((c, i) => <PCard key={i} c={c} hide={live && i === 1} />)}</div>
      <div className="mt-2 text-sm opacity-70">You {handVal(g.p)}</div><div>{g.p.map((c, i) => <PCard key={i} c={c} />)}</div></div>}
    <Msg m={msg ? col + msg : ''} />
    {live ? <div className="flex gap-2"><button className="cz-btn flex-1" onClick={hit}>Hit</button><button className="cz-btn flex-1" onClick={stand}>Stand</button><button className="cz-btn flex-1" disabled={g.p.length !== 2 || stack < g.b} onClick={dbl}>Double</button></div>
      : <><BetBar bet={bet} setBet={setBet} stack={stack} /><button className="cz-btn w-full" disabled={!ok} onClick={deal}>Deal</button></>}
  </GameShell>
}
function Crash({ stack, setStack, onClose }) {
  const [bet, setBet] = useState(Math.min(10, stack)), [m, setM] = useState(1), [st, setSt] = useState('idle'), [msg, setMsg] = useState('')
  const cp = useRef(1), mm = useRef(1), iv = useRef(), cur = useRef(0), ok = bet >= 1 && bet <= stack
  useEffect(() => () => clearInterval(iv.current), [])
  const start = () => {
    if (!ok || st === 'run') return
    cur.current = bet; setStack((s) => s - bet); setMsg(''); mm.current = 1; setM(1)
    cp.current = Math.min(200, Math.max(1, Math.floor((96 / (1 - Math.random()))) / 100)); setSt('run')
    iv.current = setInterval(() => {
      mm.current = +(mm.current * 1.018).toFixed(4)
      if (mm.current >= cp.current) { clearInterval(iv.current); setM(cp.current); setSt('crashed'); setMsg(`-${cur.current}`) } else setM(mm.current)
    }, 60)
  }
  const cash = () => { if (st !== 'run') return; clearInterval(iv.current); const pay = Math.floor(cur.current * mm.current); setStack((s) => s + pay); setSt('cashed'); setMsg(`+${pay - cur.current}`) }
  return <GameShell title="🚀 Crash" stack={stack} onClose={onClose} busy={st === 'run'}>
    <div className="grid h-28 place-items-center text-6xl font-black" style={{ color: st === 'crashed' ? '#ff6b6b' : st === 'cashed' ? '#7dff9a' : '#fff' }}>{m.toFixed(2)}x</div>
    <p className="text-center text-sm opacity-70">{st === 'crashed' ? 'CRASHED!' : st === 'run' ? 'Cash out before it crashes!' : 'Cash out before the rocket crashes.'}</p>
    <Msg m={msg} />
    {st === 'run' ? <button className="cz-btn w-full" onClick={cash}>Cash out ({Math.floor(cur.current * m)})</button>
      : <><BetBar bet={bet} setBet={setBet} stack={stack} /><button className="cz-btn w-full" disabled={!ok} onClick={start}>Launch</button></>}</GameShell>
}
function HiLo({ stack, setStack, onClose }) {
  const [bet, setBet] = useState(Math.min(10, stack)), [r, setR] = useState(2 + rnd(13)), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const lab = (n) => (n === 14 ? 'A' : n === 11 ? 'J' : n === 12 ? 'Q' : n === 13 ? 'K' : String(n)), ok = bet >= 1 && bet <= stack
  const pH = (14 - r) / 13, pL = (r - 2) / 13
  const guess = (hi) => {
    if (!ok || busy) return
    const p = hi ? pH : pL; if (p <= 0) return
    setBusy(true)
    const nx = 2 + rnd(13), win = hi ? nx > r : nx < r, d = win ? Math.round(bet * (0.95 / p - 1)) : -bet
    setTimeout(() => { setStack((s) => s + d); setMsg(win ? `+${d}` : `${d} (${lab(nx)})`); setR(nx); setBusy(false) }, 500)
  }
  return <GameShell title="🔼 Hi-Lo" stack={stack} onClose={onClose} busy={busy}>
    <div className="text-center"><span className="cz-pc" style={{ width: 80, height: 110, fontSize: 36 }}>{lab(r)}</span></div>
    <Msg m={msg} /><BetBar bet={bet} setBet={setBet} stack={stack} disabled={busy} />
    <div className="flex gap-2"><button className="cz-btn flex-1" disabled={!ok || busy || pH <= 0} onClick={() => guess(true)}>Higher ({pH > 0 ? (0.95 / pH).toFixed(2) : '-'}x)</button><button className="cz-btn flex-1" disabled={!ok || busy || pL <= 0} onClick={() => guess(false)}>Lower ({pL > 0 ? (0.95 / pL).toFixed(2) : '-'}x)</button></div>
    <p className="text-center text-xs opacity-70">Ties lose.</p></GameShell>
}
const GAME_C = { slots: Slots, flip: Flip, roulette: Roulette, dice: Dice, bj: Blackjack, crash: Crash, hilo: HiLo }

function CasinoWorld({ name, blook, srv, stack, setStack, onLeave }) {
  const wrap = useRef(), world = useRef(), meEl = useRef(), jr = useRef(), knob = useRef()
  const pos = useRef({ x: CW / 2, y: CH / 2 + 120 }), keys = useRef({}), joy = useRef({ x: 0, y: 0 }), nearRef = useRef(null), gameRef = useRef(null)
  const [near, setNear] = useState(null), [game, setGame] = useState(null), [others, setOthers] = useState([]), [online, setOnline] = useState('connecting'), [, bump] = useState(0)
  gameRef.current = game
  useEffect(() => {
    const MOVE = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd']
    const dn = (e) => {
      const k = e.key.toLowerCase(), inp = /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')
      if (inp || gameRef.current) return
      if (MOVE.includes(k)) { e.preventDefault(); keys.current[k] = 1 }
      if ((k === 'e' || k === 'enter' || k === ' ') && nearRef.current) { e.preventDefault(); setGame(nearRef.current.id) }
    }
    const up = (e) => { delete keys.current[e.key.toLowerCase()] }
    addEventListener('keydown', dn); addEventListener('keyup', up)
    let raf, last = performance.now()
    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t
      const k = keys.current, p = pos.current
      let dx = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0) + joy.current.x, dy = (k.s || k.arrowdown ? 1 : 0) - (k.w || k.arrowup ? 1 : 0) + joy.current.y
      const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m }
      if (!gameRef.current && m > 0.05) { p.x = clampN(p.x + dx * 280 * dt, 30, CW - 30); p.y = clampN(p.y + dy * 280 * dt, 40, CH - 30) }
      const w = wrap.current ? wrap.current.clientWidth : 800, h = wrap.current ? wrap.current.clientHeight : 600
      const cx = CW > w ? clampN(p.x - w / 2, 0, CW - w) : (CW - w) / 2, cy = CH > h ? clampN(p.y - h / 2, 0, CH - h) : (CH - h) / 2
      if (world.current) world.current.style.transform = `translate(${-cx}px,${-cy}px)`
      if (meEl.current) meEl.current.style.transform = `translate(${p.x}px,${p.y}px)`
      let nr = null, bd = 120
      for (const g of CGAMES) { const d = Math.hypot(g.x - p.x, g.y + 20 - p.y); if (d < bd) { bd = d; nr = g } }
      if ((nr && nr.id) !== (nearRef.current && nearRef.current.id)) { nearRef.current = nr; setNear(nr) }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', dn); removeEventListener('keyup', up) }
  }, [])
  useEffect(() => { // online presence: players on the same server see each other
    if (!FB || !FB.auth.currentUser) { setOnline('offline'); return }
    const uid = FB.auth.currentUser.uid, ref = FB.db.collection('casino').doc(srv + '_' + uid)
    let lx = -1, ly = -1, lt = 0
    const push = () => {
      const p = pos.current, x = Math.round(p.x), y = Math.round(p.y), now = Date.now()
      if (x === lx && y === ly && now - lt < 6000) return
      lx = x; ly = y; lt = now
      ref.set({ srv, uid, name, blook, x, y, at: now }).catch((e) => { console.warn('casino presence failed', e); setOnline('offline') })
    }
    push(); const iv = setInterval(push, 600), iv2 = setInterval(() => bump((n) => n + 1), 5000)
    const off = FB.db.collection('casino').where('srv', '==', srv).onSnapshot((snap) => { setOnline('online'); setOthers(snap.docs.map((d) => d.data())) }, (e) => { console.warn('casino listen failed', e); setOnline('offline') })
    return () => { clearInterval(iv); clearInterval(iv2); off(); ref.delete().catch(() => {}) }
  }, [srv])
  const jm = (e) => {
    if (!jr.current || !(e.buttons || e.pointerType === 'touch')) return
    const r = jr.current.getBoundingClientRect(), R = r.width / 2
    let x = e.clientX - (r.left + R), y = e.clientY - (r.top + R); const m = Math.hypot(x, y); if (m > R) { x = x / m * R; y = y / m * R }
    joy.current = { x: x / R, y: y / R }; if (knob.current) knob.current.style.transform = `translate(${x}px,${y}px)`
  }
  const jend = () => { joy.current = { x: 0, y: 0 }; if (knob.current) knob.current.style.transform = 'translate(0,0)' }
  const G = game ? GAME_C[game] : null, now = Date.now()
  const live = others.filter((o) => FB && FB.auth.currentUser && o.uid !== FB.auth.currentUser.uid && now - (o.at || 0) < 15000)
  const Pl = ({ n, b, me, st, r }) => <div ref={r} className={`cz-pl ${me ? '' : 'o'}`} style={st}><div className={`cz-nm ${nmCls(n)}`}>{n}</div><div style={{ position: 'absolute', left: -32, top: -30 }}><Blook id={b} size={64} /></div></div>
  return (
    <div ref={wrap} className="relative h-full w-full overflow-hidden select-none" style={{ background: '#52bf6f', touchAction: 'none' }}>
      <div ref={world} className="cz-world" style={{ width: CW, height: CH }}>
        <div style={{ position: 'absolute', inset: 0, border: '12px solid #2e8f4d', pointerEvents: 'none' }} />
        <div className="cz-st" style={{ left: CW / 2 - 70, top: CH / 2 - 330, width: 140 }}><div style={{ fontSize: 30 }}>BLOOK CASINO</div></div>
        {CGAMES.map((g) => <div key={g.id} className="cz-st" style={{ left: g.x - 60, top: g.y - 50, width: 120 }}><div className="ic" style={{ background: g.c, outline: near && near.id === g.id ? '4px solid #fff' : 'none' }}>{g.ic}</div><div style={{ fontSize: 16, marginTop: 6 }}>{g.name}</div></div>)}
        {live.map((o) => <Pl key={o.uid} n={String(o.name || '?').slice(0, 16)} b={o.blook} st={{ transform: `translate(${o.x}px,${o.y}px)` }} />)}
        <Pl me n={name} b={blook} r={meEl} />
      </div>
      <div className="absolute left-2 top-2 z-10 flex flex-wrap items-center gap-2 rounded-xl bg-black/55 px-3 py-2 text-white">
        <span className="chunk flex items-center gap-1 text-lg"><Coins size={26} />{stack.toLocaleString()}</span>
        <span className="text-xs opacity-80">Server {srv.replace('s', '')} · {online === 'online' ? `${live.length + 1} online` : online === 'offline' ? 'offline (solo)' : 'connecting…'}</span>
        <button className="cz-btn" onClick={onLeave}>Cash out &amp; leave</button></div>
      <div className="absolute right-3 top-3 z-10 hidden rounded-xl bg-black/45 px-3 py-1 text-xs text-white sm:block">WASD / arrows to move · E to play</div>
      {near && !game && <button className="cz-btn absolute bottom-6 right-5 z-10 text-lg" onClick={() => setGame(near.id)}>{near.ic} Play {near.name} (E)</button>}
      <div ref={jr} className="cz-joy" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); jm(e) }} onPointerMove={jm} onPointerUp={jend} onPointerCancel={jend}><i ref={knob} /></div>
      {G && <G stack={stack} setStack={setStack} onClose={() => setGame(null)} />}
    </div>
  )
}

function Casino({ user, update }) {
  const ids = useMemo(() => Array.from(new Set(user.inv)), [user.inv.length])
  const [phase, setPhase] = useState('lobby'), [pick, setPick] = useState(ids.includes(user.main) ? user.main : ids[0] || null), [buy, setBuy] = useState(Math.min(100, user.tokens)), [srv, setSrv] = useState('s1'), [stack, setStack] = useState(0)
  const ur = useRef(user), sk = useRef(0), ph = useRef('lobby'), upd = useRef(update)
  ur.current = user; sk.current = stack; ph.current = phase; upd.current = update
  const payout = () => { if (ph.current === 'play') { ph.current = 'lobby'; upd.current({ ...ur.current, tokens: ur.current.tokens + Math.max(0, sk.current) }) } }
  useEffect(() => () => payout(), [])
  const enter = () => { if (!pick || buy < 10 || buy > user.tokens) return; update({ ...user, tokens: user.tokens - buy }); setStack(buy); sk.current = buy; ph.current = 'play'; setPhase('play') }
  const leave = () => { payout(); setPhase('lobby'); setBuy(10) }
  if (phase === 'play') return <CasinoWorld name={user.name} blook={pick} srv={srv} stack={stack} setStack={setStack} onLeave={leave} />
  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-3xl p-5 text-white" style={{ background: '#1d1230', border: '3px solid #ffb347' }}>
        <h2 className="display text-4xl">🎰 Blook Casino</h2>
        <p className="mt-1 text-sm opacity-80">Pick your blook, choose how many Blook Tokens to bring, then walk around and play. Cash out to bring your winnings home.</p>
        <h3 className="chunk mt-4 text-xl">1. Pick your blook</h3>
        <div className="mt-2 flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-2xl bg-black/30 p-2">
          {ids.length === 0 && <p className="p-2 text-sm">You don't own any blooks yet. Open a chest in the Market!</p>}
          {ids.map((id) => <button key={id} onClick={() => setPick(id)} className="grid h-20 w-20 place-items-center rounded-xl" style={{ outline: pick === id ? '4px solid #ffb347' : 'none', background: 'rgba(255,255,255,.08)' }} aria-label={(byId(id) || {}).name}><Blook id={id} size={60} /></button>)}</div>
        <h3 className="chunk mt-4 text-xl">2. How much will you gamble?</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input type="number" min="10" max={user.tokens} value={buy || ''} onChange={(e) => setBuy(Math.max(0, Math.floor(+e.target.value || 0)))} className="rounded-lg px-3 py-2" style={{ width: '9rem', background: '#2b1b47', color: '#fff', border: '1px solid #6a4aa0' }} />
          {[10, 100, 500, 1000].map((v) => <button key={v} className="cz-btn" disabled={v > user.tokens} onClick={() => setBuy(v)}>{v}</button>)}
          <button className="cz-btn" onClick={() => setBuy(user.tokens)}>All</button>
          <span className="chunk flex items-center gap-1"><Coins size={22} />{user.tokens.toLocaleString()} owned</span></div>
        <h3 className="chunk mt-4 text-xl">3. Choose a server</h3>
        <div className="mt-2 flex flex-wrap gap-2">{['s1', 's2', 's3', 's4'].map((s) => <button key={s} className="cz-btn" style={{ outline: srv === s ? '3px solid #fff' : 'none' }} onClick={() => setSrv(s)}>Server {s.slice(1)}</button>)}</div>
        <button className="cz-btn mt-5 w-full text-xl" disabled={!pick || buy < 10 || buy > user.tokens} onClick={enter}>Enter the casino with {buy.toLocaleString()} tokens</button>
        {buy < 10 && <p className="mt-2 text-sm opacity-80">Minimum buy-in is 10 Blook Tokens.</p>}
      </div>
    </div>
  )
}