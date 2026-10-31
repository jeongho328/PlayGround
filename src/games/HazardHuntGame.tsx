import { useEffect, useMemo, useRef, useState } from 'react'
import type { HazardItem, HazardRoom, MissionResult } from '../types'
import { GameButton } from '../components/UI'
import { Icon } from '../components/Icon'
import { sfx } from '../audio'
import { useGameStore } from '../store'
import { toast } from '../components/UI'

const HAZARD_SLOTS: Record<string, Record<string, { left: string; top: string; scale?: number; rotate?: number }>> = {
  kitchen: {
    'k-multitap': { left: '17%', top: '45%', scale: 1.05 },
    'k-paper-stove': { left: '38%', top: '39%', scale: 1 },
    'k-candle': { left: '61%', top: '31%', scale: 0.95 },
    'k-cord': { left: '77%', top: '68%', scale: 1, rotate: -9 },
    'k-pan': { left: '47%', top: '62%', scale: 1.1 },
    'k-towel': { left: '69%', top: '52%', scale: 0.9 },
    'k-trash': { left: '21%', top: '77%', scale: 1.05 },
    'k-gas': { left: '87%', top: '43%', scale: 0.95 },
  },
  living: {
    'l-heater': { left: '16%', top: '58%', scale: 1.05 },
    'l-candle': { left: '81%', top: '34%', scale: 1 },
    'l-multitap': { left: '51%', top: '31%', scale: 0.9 },
    'l-lighter': { left: '52%', top: '61%', scale: 0.9 },
    'l-exit': { left: '9%', top: '43%', scale: 1 },
    'l-cord': { left: '29%', top: '72%', scale: 0.9 },
    'l-ashtray': { left: '37%', top: '61%', scale: 0.85 },
    'l-curtain': { left: '85%', top: '49%', scale: 0.9 },
  },
  bedroom: {
    'b-charger': { left: '45%', top: '59%', scale: 0.95 },
    'b-blanket': { left: '54%', top: '48%', scale: 1.05 },
    'b-candle': { left: '25%', top: '49%', scale: 0.9 },
    'b-heater': { left: '76%', top: '56%', scale: 0.95 },
    'b-exit': { left: '18%', top: '76%', scale: 1 },
    'b-smoke': { left: '65%', top: '12%', scale: 1 },
    'b-outlet': { left: '58%', top: '50%', scale: 0.9 },
    'b-window': { left: '86%', top: '40%', scale: 1 },
  },
}

const DECOY_SLOTS = [
  { left: '11%', top: '60%' },
  { left: '35%', top: '31%' },
  { left: '57%', top: '76%' },
  { left: '71%', top: '38%' },
]

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

export function HazardHuntGame({
  room,
  onComplete,
  onQuit,
}: {
  room: HazardRoom
  onComplete: (result: MissionResult) => void
  onQuit: () => void
}) {
  const store = useGameStore()
  const mode = store.settings.mode
  const initialTime = mode === 'senior' ? 240 : mode === 'kids' ? 75 : room.timeLimit
  const [hiddenHazards, setHiddenHazards] = useState<HazardItem[]>(() => shuffle(room.hazards).slice(0, 6))
  const [foundIds, setFoundIds] = useState<string[]>([])
  const [wrongClicks, setWrongClicks] = useState(0)
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [score, setScore] = useState(0)
  const [hints, setHints] = useState(0)
  const [hintedId, setHintedId] = useState<string | null>(null)
  const [lastFound, setLastFound] = useState<HazardItem | null>(null)
  const [wrongShake, setWrongShake] = useState<string | null>(null)
  const [showQuit, setShowQuit] = useState(false)
  const [paused, setPaused] = useState(false)
  const startedAt = useRef(Date.now())
  const finishedRef = useRef(false)
  const finishRef = useRef<(success: boolean, reason?: string) => void>(() => {})
  const foundRef = useRef<string[]>([])
  const lastFoundAt = useRef(0)
  const timerRef = useRef<number | null>(null)
  const successThreshold = 5
  const found = hiddenHazards.filter((item) => foundIds.includes(item.id))

  const finish = (success: boolean, reason?: string) => {
    if (finishedRef.current) return
    finishedRef.current = true
    if (timerRef.current) window.clearInterval(timerRef.current)
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000)
    const stars = foundIds.length >= 6 && wrongClicks <= 1 ? 3 : foundIds.length >= successThreshold && wrongClicks <= 3 ? 2 : 1
    onComplete({
      missionId: room.missionId,
      score: Math.max(0, score),
      maxScore: 760,
      stars: success ? stars : 0,
      correctCount: foundIds.length,
      totalCount: hiddenHazards.length,
      hintsUsed: hints,
      durationSec,
      failed: !success,
      failureReason: reason || '시간 안에 위험 요소를 충분히 찾지 못했어요.',
      skills: { prevention: { correct: foundIds.length, total: hiddenHazards.length } },
      detail: success ? `${foundIds.length}개의 위험 요소를 발견했어요.` : undefined,
    })
  }
  finishRef.current = finish

  useEffect(() => {
    if (paused) return
    timerRef.current = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          if (foundRef.current.length >= successThreshold) finishRef.current(true)
          else finishRef.current(false, '시간이 다 되었어요. 위험 요소를 조금 더 빠르게 찾아보세요.')
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [paused])

  useEffect(() => {
    if (!paused) return
    if (timerRef.current) window.clearInterval(timerRef.current)
  }, [paused])

  const handleFind = (item: HazardItem) => {
    if (foundIds.includes(item.id) || finishedRef.current || paused) return
    const now = Date.now()
    const nextCombo = now - lastFoundAt.current < 5000 ? combo + 1 : 0
    lastFoundAt.current = now
    const nextFound = [...foundIds, item.id]
    foundRef.current = nextFound
    setFoundIds(nextFound)
    setCombo(nextCombo)
    setMaxCombo((value) => Math.max(value, nextCombo))
    setScore((value) => value + 100 + nextCombo * 15)
    setLastFound(item)
    setHintedId(null)
    store.unlockKnowledge(item.knowledgeId)
    sfx('correct')
    if (nextFound.length >= hiddenHazards.length) {
      window.setTimeout(() => finishRef.current(true), 750)
    }
  }

  const handleWrong = (label: string, id: string) => {
    if (paused || finishedRef.current) return
    setWrongClicks((value) => value + 1)
    setCombo(0)
    setScore((value) => Math.max(0, value - 20))
    setWrongShake(id)
    sfx('wrong')
    window.setTimeout(() => setWrongShake(null), 500)
    toast(`‘${label}’은(는) 안전해요. 다른 곳을 살펴보세요.`, 'error')
  }

  const useHint = () => {
    if (paused) return
    const unfound = hiddenHazards.filter((item) => !foundIds.includes(item.id))
    if (unfound.length === 0) return
    const target = unfound[0]
    setHintedId(target.id)
    setHints((value) => value + 1)
    setScore((value) => Math.max(0, value - 25))
    sfx('hint')
    window.setTimeout(() => setHintedId(null), 2200)
  }

  const finishNow = () => {
    if (foundIds.length >= successThreshold) finish(true)
    else finish(false, `위험 요소 ${successThreshold}개 이상을 찾아야 미션을 완료할 수 있어요.`)
  }

  const timePercent = (timeLeft / initialTime) * 100

  return (
    <div className="hazard-game game-shell">
      <div className="game-status-bar hazard-status-bar">
        <div className="game-status-left">
          <button type="button" className="game-quit" onClick={() => setShowQuit(true)}><Icon name="back" size={17} /> 나가기</button>
          <span className="mission-live-title"><span>🔎</span>{room.name} 안전점검</span>
        </div>
        <div className="hazard-mode-note">{mode === 'senior' ? '충분히 둘러볼 수 있어요' : '제한 시간 안에 위험을 찾아라!'}</div>
        <div className="hazard-hud">
          <div className={`timer-chip ${timeLeft < 15 ? 'urgent' : ''}`}>
            <Icon name="clock" size={17} />
            <b>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</b>
            <span className="timer-track"><i style={{ width: `${timePercent}%` }} /></span>
          </div>
          <div className="combo-chip"><span>🔥</span><b>{combo + 1}x</b> 콤보</div>
        </div>
      </div>

      <div className="hazard-layout">
        <div className="hazard-main">
          <div className="hazard-topline">
            <div className="hazard-progress-card">
              <span className="hazard-progress-icon">🔎</span>
              <div>
                <b>위험 요소 {found.length} / {hiddenHazards.length} 발견</b>
                <span>{room.subtitle}</span>
              </div>
              <div className="hazard-found-dots">
                {hiddenHazards.map((item) => <i key={item.id} className={foundIds.includes(item.id) ? 'done' : ''} />)}
              </div>
            </div>
            <div className="hazard-actions">
              <GameButton variant="secondary" size="sm" icon="hint" onClick={useHint}>힌트</GameButton>
              <GameButton variant="soft" size="sm" icon={paused ? 'play' : 'clock'} onClick={() => setPaused((value) => !value)}>
                {paused ? '계속' : '잠시 멈춤'}
              </GameButton>
            </div>
          </div>

          <div className={`room-canvas room-${room.baseScene} ${wrongShake ? 'room-shake' : ''}`}>
            <RoomArt room={room} />
            {hiddenHazards.map((item) => {
              const slot = HAZARD_SLOTS[room.id]?.[item.id] || { left: '50%', top: '50%' }
              const isFound = foundIds.includes(item.id)
              const isHinted = hintedId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`hazard-object ${isFound ? 'is-found' : ''} ${isHinted ? 'is-hinted' : ''}`}
                  style={{ left: slot.left, top: slot.top, '--scale': slot.scale || 1, '--rotate': `${slot.rotate || 0}deg` } as React.CSSProperties}
                  onClick={() => handleFind(item)}
                  aria-label={`숨은 위험 요소 찾기`}
                  disabled={isFound}
                >
                  <span className="object-emoji">{item.emoji}</span>
                  {isFound && <span className="found-check"><Icon name="check" size={16} /></span>}
                  {isHinted && <span className="hint-ring" />}
                </button>
              )
            })}
            {room.decoys.slice(0, 4).map((decoy, index) => {
              const slot = DECOY_SLOTS[index]
              const id = `decoy-${index}`
              return (
                <button
                  key={decoy.label}
                  type="button"
                  className={`hazard-object decoy-object ${wrongShake === id ? 'is-wrong' : ''}`}
                  style={{ left: slot.left, top: slot.top } as React.CSSProperties}
                  onClick={() => handleWrong(decoy.label, id)}
                  aria-label={decoy.label}
                >
                  <span className="object-emoji">{decoy.emoji}</span>
                  {wrongShake === id && <span className="wrong-mark">✕</span>}
                </button>
              )
            })}
            <div className="room-tip">👆 수상한 물건을 눌러 위험을 체크하세요</div>
          </div>

          <div className="hazard-bottom-row">
            <div className="hazard-clue">
              <span>💡</span>
              <p>{lastFound ? `방금 발견: ${lastFound.label} — ${lastFound.explanation}` : '가스레인지, 콘센트, 커튼, 출입구 주변을 살펴보세요. 평범한 물건처럼 보여도 위험할 수 있어요.'}</p>
            </div>
            <div className="hazard-score-chip"><b>{score}</b><span>점</span></div>
          </div>

          <div className="hazard-finish-row">
            <span>모든 위험을 찾았나요? 점검을 마칠 수 있어요.</span>
            <GameButton size="sm" variant="soft" onClick={finishNow}>점검 마치기</GameButton>
          </div>
        </div>

        <aside className="hazard-side">
          <div className="hazard-side-head">
            <span>점검 노트</span>
            <b>{found.length}/{hiddenHazards.length}</b>
          </div>
          <div className="hazard-checklist">
            {hiddenHazards.map((item) => {
              const isFound = foundIds.includes(item.id)
              return (
                <div key={item.id} className={`hazard-check-item ${isFound ? 'is-found' : ''}`}>
                  <span className="hazard-check-icon">{isFound ? '✓' : '?'}</span>
                  <div>
                    <b>{isFound ? item.label : '아직 발견하지 못한 위험'}</b>
                    <p>{isFound ? item.explanation : '방 안을 꼼꼼히 살펴보세요.'}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {found.length === hiddenHazards.length && (
            <div className="hazard-clear-note"><Icon name="check" size={18} /> 모든 위험을 찾았어요!<br /><span>잠시 후 점검 결과로 이동합니다.</span></div>
          )}
          <div className="hazard-side-tip">
            <Icon name="info" size={15} />
            <span>오답을 누르면 콤보가 초기화되고 점수가 줄어요. 힌트는 한 번에 25점을 사용합니다.</span>
          </div>
        </aside>
      </div>

      {showQuit && (
        <div className="quit-overlay" role="dialog" aria-modal="true" aria-label="미션 나가기 확인">
          <div className="quit-panel">
            <span className="quit-emoji">🔎</span>
            <h2>점검을 그만할까요?</h2>
            <p>현재 찾은 위험은 저장되지 않아요. 다시 도전할 수 있습니다.</p>
            <div className="modal-actions">
              <GameButton variant="ghost" onClick={() => setShowQuit(false)}>계속 찾기</GameButton>
              <GameButton variant="danger" onClick={onQuit}>나가기</GameButton>
            </div>
          </div>
        </div>
      )}
      {paused && (
        <div className="pause-overlay">
          <div className="pause-panel">
            <span>⏸️</span>
            <h2>잠시 멈춤</h2>
            <p>준비되면 다시 점검을 시작하세요.</p>
            <GameButton variant="primary" icon="play" onClick={() => setPaused(false)}>계속하기</GameButton>
          </div>
        </div>
      )}
    </div>
  )
}

function RoomArt({ room }: { room: HazardRoom }) {
  if (room.baseScene === 'kitchen') {
    return (
      <div className="room-art" aria-hidden="true">
        <div className="room-ceiling" />
        <div className="room-wall kitchen-wall"><span className="wall-tile-line l1" /><span className="wall-tile-line l2" /><span className="wall-tile-line l3" /></div>
        <div className="room-floor kitchen-floor" />
        <div className="room-window kitchen-window"><span className="window-curtain left" /><span className="window-view" /><span className="window-curtain right" /></div>
        <div className="kitchen-shelf"><span /><span /><span /><i /><i /></div>
        <div className="kitchen-counter"><div className="counter-top" /><div className="counter-doors"><i /><i /></div><span className="sink"><b /></span></div>
        <div className="kitchen-stove"><span className="stove-top"><i /><i /><i /><i /></span><span className="stove-front"><b /></span><span className="stove-hood" /></div>
        <div className="kitchen-fridge"><span className="fridge-handle" /><span className="fridge-note">☀</span></div>
        <div className="kitchen-table"><span className="table-top" /><span className="table-leg l" /><span className="table-leg r" /><span className="table-bowl" /></div>
        <div className="room-door kitchen-door"><span className="door-frame" /><span className="door-panel" /><span className="door-knob" /></div>
        <div className="kitchen-mat" />
        <div className="room-plant"><span className="plant-pot" /><span className="plant-leaves">🌿</span></div>
      </div>
    )
  }
  if (room.baseScene === 'living') {
    return (
      <div className="room-art" aria-hidden="true">
        <div className="room-ceiling" />
        <div className="room-wall living-wall" />
        <div className="room-floor living-floor" />
        <div className="living-window"><span className="window-view evening" /><span className="curtain-left" /><span className="curtain-right" /></div>
        <div className="living-sofa"><span className="sofa-back" /><span className="sofa-seat" /><span className="sofa-cushion c1" /><span className="sofa-cushion c2" /><span className="sofa-leg l" /><span className="sofa-leg r" /></div>
        <div className="living-tv"><span className="tv-screen" /><span className="tv-stand" /></div>
        <div className="living-table"><span className="coffee-top" /><span className="coffee-leg l" /><span className="coffee-leg r" /></div>
        <div className="living-rug" />
        <div className="living-lamp"><span className="lamp-shade" /><span className="lamp-pole" /><span className="lamp-base" /></div>
        <div className="room-door living-door"><span className="door-frame" /><span className="door-panel" /><span className="door-knob" /></div>
        <div className="living-tree"><span className="tree-top">🎄</span><span className="tree-pot" /></div>
        <div className="wall-art"><span>SAFE<br />HOME</span></div>
      </div>
    )
  }
  return (
    <div className="room-art" aria-hidden="true">
      <div className="room-ceiling" />
      <div className="room-wall bedroom-wall" />
      <div className="room-floor bedroom-floor" />
      <div className="bedroom-window"><span className="window-view night" /><span className="moon" /><span className="window-curtain" /></div>
      <div className="bedroom-bed"><span className="bed-headboard" /><span className="bed-mattress" /><span className="bed-pillow" /><span className="bed-blanket" /><span className="bed-leg l" /><span className="bed-leg r" /></div>
      <div className="bedroom-nightstand"><span className="night-lamp"><i /></span><span className="night-drawer" /></div>
      <div className="bedroom-wardrobe"><span className="wardrobe-door" /><span className="wardrobe-door" /><span className="wardrobe-handle" /></div>
      <div className="bedroom-rug" />
      <div className="room-door bedroom-door"><span className="door-frame" /><span className="door-panel" /><span className="door-knob" /></div>
      <div className="bedroom-dresser"><span className="dresser-top" /><span className="dresser-drawer" /><span className="dresser-drawer" /></div>
      <div className="bedroom-smoke-detector">•</div>
    </div>
  )
}
