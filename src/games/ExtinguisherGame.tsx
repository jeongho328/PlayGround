import { useRef, useState } from 'react'
import type { MissionResult } from '../types'
import { GameButton, toast } from '../components/UI'
import { Icon } from '../components/Icon'
import { sfx } from '../audio'

const SEQ = [
  { title: '안전핀 뽑기', hint: '안전핀을 위로 당겨요', icon: '📌' },
  { title: '노즐 조준', hint: '불씨가 있는 아래쪽을 향해요', icon: '🎯' },
  { title: '손잡이 누르기', hint: '손잡이를 힘껏 쥐고 유지해요', icon: '✊' },
  { title: '좌우로 분사', hint: '불씨를 향해 빗자루처럼 쓸어요', icon: '💨' },
]

type Phase = 'check' | 'pin' | 'aim' | 'lever' | 'sweep' | 'done'

export function ExtinguisherGame({
  onComplete,
  onQuit,
}: {
  onComplete: (result: MissionResult) => void
  onQuit: () => void
}) {
  const [phase, setPhase] = useState<Phase>('check')
  const [checkAnswer, setCheckAnswer] = useState<string | null>(null)
  const [checkFeedback, setCheckFeedback] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [hints, setHints] = useState(0)
  const [pinProgress, setPinProgress] = useState(0)
  const [pinPulled, setPinPulled] = useState(false)
  const [aimDone, setAimDone] = useState(false)
  const [leverProgress, setLeverProgress] = useState(0)
  const [leverHolding, setLeverHolding] = useState(false)
  const [leverDone, setLeverDone] = useState(false)
  const [sprayed, setSprayed] = useState([false, false, false])
  const [sweeps, setSweeps] = useState(0)
  const [showQuit, setShowQuit] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const startedAt = useRef(Date.now())
  const pinStart = useRef(0)
  const leverTimer = useRef<number | null>(null)
  const sweepLast = useRef<number | null>(null)
  const sweepDirectionRef = useRef(1)
  const sweepsRef = useRef(0)
  const finishedRef = useRef(false)
  const lastPointerDrop = useRef(0)

  const fail = () => {
    setMistakes((value) => value + 1)
    sfx('wrong')
  }

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
    onComplete({
      missionId: 'equip-ext',
      score: Math.max(120, 400 - mistakes * 35 - hints * 10),
      maxScore: 400,
      stars,
      correctCount: 5 - Math.min(4, mistakes),
      totalCount: 5,
      hintsUsed: hints,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      skills: { equipment: { correct: 5 - Math.min(4, mistakes), total: 5 } },
      detail: '소화기 사용 4단계를 완료했어요.',
    })
  }

  const checkChoice = (id: string) => {
    setCheckAnswer(id)
    setCheckFeedback(true)
    if (id === 'a') {
      sfx('correct')
      window.setTimeout(() => setPhase('pin'), 750)
    } else {
      setMistakes((value) => value + 1)
      sfx('wrong')
    }
  }

  const startPin = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pinStart.current = event.clientY
    setPinProgress(0)
  }
  const movePin = (event: React.PointerEvent) => {
    if (!pinStart.current) return
    const delta = Math.max(0, pinStart.current - event.clientY)
    setPinProgress(Math.min(100, (delta / 70) * 100))
  }
  const endPin = () => {
    if (pinProgress >= 70) {
      setPinPulled(true)
      setPhase('aim')
      sfx('correct')
      setTimeout(() => toast('안전핀이 빠졌어요. 이제 노즐을 조준하세요.', 'success'), 100)
    } else if (pinProgress > 5) {
      toast('조금 더 위로 당겨 보세요.', 'info')
    }
    pinStart.current = 0
    setPinProgress(0)
  }

  const placeNozzle = (target: string | null) => {
    if (phase !== 'aim' || aimDone) return
    if (target === 'base') {
      setAimDone(true)
      setPhase('lever')
      sfx('correct')
      toast('불씨 아래쪽을 향했어요. 손잡이를 누르세요.', 'success')
    } else if (target) {
      fail()
      toast(target === 'smoke' ? '연기 쪽이 아니라 불씨 아래를 향해야 해요.' : '불꽃 위쪽이 아니라 불씨가 있는 아래쪽을 조준하세요.', 'error')
    }
  }

  const dropNozzle = (event: React.PointerEvent) => {
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null
    const target = element?.closest('[data-aim-target]')?.getAttribute('data-aim-target') || null
    lastPointerDrop.current = Date.now()
    placeNozzle(target)
  }

  const chooseTarget = (target: string) => {
    if (Date.now() - lastPointerDrop.current < 400) return
    placeNozzle(target)
  }

  const startLever = () => {
    if (leverDone) return
    setLeverHolding(true)
    if (leverTimer.current) window.clearInterval(leverTimer.current)
    leverTimer.current = window.setInterval(() => {
      setLeverProgress((value) => {
        if (value >= 100) {
          if (leverTimer.current) window.clearInterval(leverTimer.current)
          setLeverDone(true)
          setLeverHolding(false)
          setPhase('sweep')
          sfx('correct')
          return 100
        }
        return Math.min(100, value + 10)
      })
    }, 120)
  }
  const stopLever = () => {
    if (leverDone) return
    setLeverHolding(false)
    if (leverTimer.current) window.clearInterval(leverTimer.current)
    if (leverProgress < 100) {
      setLeverProgress(0)
      fail()
      toast('손잡이를 끝까지 유지해야 분사됩니다. 다시 시도해요.', 'error')
    }
  }

  const sweep = (event: React.PointerEvent) => {
    if (phase !== 'sweep') return
    const area = event.currentTarget.getBoundingClientRect()
    const relative = (event.clientX - area.left) / area.width
    if (relative < 0 || relative > 1) return
    const index = relative < 0.34 ? 0 : relative < 0.68 ? 1 : 2
    setSprayed((value) => {
      if (value[index]) return value
      const next = [...value]
      next[index] = true
      return next
    })
    if (sweepLast.current !== null) {
      const direction = relative > sweepLast.current ? 1 : -1
      if (direction !== sweepDirectionRef.current && Math.abs(relative - sweepLast.current) > 0.08) {
        sweepDirectionRef.current = direction
        sweepsRef.current += 1
        setSweeps(sweepsRef.current)
        if (sweepsRef.current >= 2 && !finishedRef.current) {
          setPhase('done')
          sfx('success')
        }
      }
    }
    sweepLast.current = relative
  }

  const currentIndex = phase === 'pin' ? 0 : phase === 'aim' ? 1 : phase === 'lever' ? 2 : phase === 'sweep' ? 3 : 4

  return (
    <div className="extinguisher-game game-shell">
      <div className="game-status-bar">
        <div className="game-status-left">
          <button type="button" className="game-quit" onClick={() => setShowQuit(true)}><Icon name="back" size={17} /> 나가기</button>
          <span className="mission-live-title"><span>🧯</span>소화기 마스터</span>
        </div>
        <div className="equip-progress-steps">
          {SEQ.map((item, index) => (
            <span key={item.title} className={`${index < currentIndex ? 'done' : ''} ${index === currentIndex ? 'active' : ''}`}>
              <i>{index < currentIndex ? '✓' : index + 1}</i>{item.title}
            </span>
          ))}
        </div>
        <button type="button" className="hint-button" onClick={() => { setHints((value) => value + 1); setShowHint(true); sfx('hint') }}>
          <Icon name="hint" size={16} /> 힌트
        </button>
      </div>

      <div className="extinguisher-layout">
        <div className="extinguisher-arena-wrap">
          <div className="extinguisher-arena">
            <div className="extinguisher-wall">
              <span className="eq-tile t1" /><span className="eq-tile t2" /><span className="eq-tile t3" />
            </div>
            <div className="eq-fire-glow" />
            <div className="eq-fire">
              <span className="eq-flame f1" /><span className="eq-flame f2" /><span className="eq-flame f3" />
              <span className="eq-pan" />
              <span className="eq-smoke s1" /><span className="eq-smoke s2" />
            </div>

            <div className="extinguisher-device">
              <ExtinguisherSVG pinPulled={pinPulled} pressed={leverHolding || leverDone} />
              <button
                type="button"
                className={`pin-hotspot ${pinPulled ? 'is-pulled' : ''}`}
                onPointerDown={phase === 'pin' ? startPin : undefined}
                onPointerMove={phase === 'pin' ? movePin : undefined}
                onPointerUp={phase === 'pin' ? endPin : undefined}
                onKeyDown={(event) => {
                  if (phase === 'pin' && (event.key === 'Enter' || event.key === ' ')) {
                    setPinPulled(true)
                    setPhase('aim')
                    sfx('correct')
                  }
                }}
                aria-label="안전핀을 위로 드래그해서 뽑기"
              >
                <span className="pin-ring" style={{ transform: `translateY(${-pinProgress * 0.45}px)` }} />
                {phase === 'pin' && <span className="pin-drag-hint">↑ 위로 드래그</span>}
              </button>
            </div>

            {phase === 'aim' && (
              <div className="aim-layer" onPointerUp={dropNozzle}>
                <div className="aim-hint-bubble">노즐을 불씨 아래쪽으로 드래그하세요</div>
                <div className="aim-targets">
                  <button type="button" data-aim-target="smoke" className="aim-target target-smoke" onClick={() => chooseTarget('smoke')}>연기</button>
                  <button type="button" data-aim-target="flame" className="aim-target target-flame" onClick={() => chooseTarget('flame')}>불꽃 위</button>
                  <button type="button" data-aim-target="base" className="aim-target target-base" onClick={() => chooseTarget('base')}>불씨 아래</button>
                </div>
                <div className="drag-nozzle" aria-label="노즐을 불씨 아래로 드래그">
                  <span className="nozzle-tip" />
                  <span className="nozzle-hose" />
                  <span className="nozzle-label">노즐</span>
                </div>
              </div>
            )}

            {phase === 'lever' && (
              <div className="lever-hotspot-wrap">
                <button
                  type="button"
                  className={`lever-hotspot ${leverHolding ? 'is-holding' : ''}`}
                  onPointerDown={startLever}
                  onPointerUp={stopLever}
                  onPointerLeave={stopLever}
                  onKeyDown={(event) => event.key === ' ' && startLever()}
                  onKeyUp={(event) => event.key === ' ' && stopLever()}
                  aria-label="손잡이를 눌러 유지하기"
                >
                  <span className="lever-handle" />
                  <span className="lever-progress"><i style={{ width: `${leverProgress}%` }} /></span>
                  <span className="lever-copy">{leverHolding ? '분사 중...' : '꾹 누르고 유지'}</span>
                </button>
              </div>
            )}

            {phase === 'sweep' && (
              <div
                className="sweep-layer"
                onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); sweepLast.current = null }}
                onPointerMove={(event) => event.buttons > 0 && sweep(event)}
                onPointerUp={() => { sweepLast.current = null }}
              >
                <div className="sweep-instruction">
                  <b>좌우로 2회 쓸어주세요</b>
                  <span>불씨를 향해 빗자루처럼 분사</span>
                  <div className="sweep-track">
                    {sprayed.map((item, index) => <i key={index} className={item ? 'done' : ''} />)}
                  </div>
                  <div className="sweep-count">스윕 {Math.min(2, sweeps)}/2</div>
                </div>
                <span className="spray-stream" />
              </div>
            )}

            {phase === 'done' && (
              <div className="equip-success-panel">
                <span className="success-burst">🎉</span>
                <h2>불씨를 모두 진압했어요!</h2>
                <p>소화기 사용 후에도 119에 신고하고, 재발 여부를 확인해야 합니다.</p>
                <GameButton variant="gold" icon="star" onClick={finish}>결과 확인</GameButton>
              </div>
            )}

            <div className="eq-scene-label">
              <span className="live-dot" /> 안전체험관 실습실 A · 가상 훈련
            </div>
          </div>

          <div className="equip-scene-note">
            <Icon name="shield" size={16} />
            <span>불이 작고 등 뒤 대피로가 확보된 초기 화재만 해당합니다. 연기가 많으면 즉시 대피하세요.</span>
          </div>
        </div>

        <aside className="equip-side">
          <div className="equip-step-header">
            <span className="equip-step-count">STEP {Math.min(4, currentIndex + 1)} / 4</span>
            <span className="equip-mode">실습 모드</span>
          </div>
          {phase === 'check' && (
            <div className="safety-check-box">
              <span className="check-icon">🤔</span>
              <h3>소화기를 사용해도 될까요?</h3>
              <p>주방 팬에서 작은 불꽃이 보입니다. 등 뒤 출입문은 열려 있고, 연기는 아직 적습니다.</p>
              <div className="check-choices">
                {[
                  { id: 'a', label: '불이 작고 대피로가 확보됐으니 소화기를 사용한다', correct: true },
                  { id: 'b', label: '기름 화재이므로 물을 부어 끈다', correct: false },
                  { id: 'c', label: '연기가 조금 있어도 불 가까이 들어가 직접 손으로 끈다', correct: false },
                ].map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    className={`check-choice ${checkAnswer === choice.id ? (choice.correct ? 'is-correct' : 'is-wrong') : ''}`}
                    onClick={() => checkChoice(choice.id)}
                    disabled={checkAnswer !== null}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
              {checkFeedback && checkAnswer !== 'a' && (
                <div className="check-feedback">
                  <b>다시 생각해 볼까요?</b>
                  <p>{checkAnswer === 'b' ? '기름 화재에 물을 부으면 불길이 크게 튈 수 있습니다.' : '불 가까이 접근해 직접 끄는 것은 위험합니다. 소화기를 사용하거나 대피하세요.'}</p>
                  <button type="button" onClick={() => { setCheckFeedback(false); setCheckAnswer(null) }}>다시 선택</button>
                </div>
              )}
            </div>
          )}
          {phase !== 'check' && (
            <>
              <div className="current-instruction">
                <span className={`instruction-icon ${phase === 'done' ? 'done' : ''}`}>{phase === 'done' ? '✓' : SEQ[currentIndex]?.icon || '✓'}</span>
                <div>
                  <span className="eyebrow">CURRENT ACTION</span>
                  <h2>{phase === 'done' ? '진압 완료' : SEQ[Math.min(3, currentIndex)]?.title}</h2>
                  <p>{phase === 'pin' ? '안전핀을 위로 끝까지 당기세요.' : phase === 'aim' ? '노즐을 불씨가 있는 아래쪽에 맞추세요.' : phase === 'lever' ? '손잡이를 힘껏 누르고 약 1.5초 유지하세요.' : phase === 'sweep' ? '화면을 좌우로 드래그하며 분사하세요.' : '안전하게 진압했습니다.'}</p>
                </div>
              </div>
              <div className="equip-photo-guide">
                <div className="guide-visual">
                  <span className="guide-ext">🧯</span>
                  <span className="guide-arrow">→</span>
                  <span className="guide-fire">🔥</span>
                </div>
                <span>노즐은 불꽃이 아니라 <b>불씨 아래</b>를 향해요</span>
              </div>
              <div className="equip-continuous">
                <div className="equip-fact">
                  <b>왜 이 순서일까요?</b>
                  <p>안전핀을 빼야 손잡이가 눌리고, 바람을 등지고 아래쪽부터 분사해야 불씨가 다시 타오르지 않습니다.</p>
                </div>
                <div className="equip-fact subtle">
                  <b>기억하세요</b>
                  <p>불이 천장까지 번졌거나 연기가 많다면 소화기를 버리고 즉시 대피한 뒤 119에 신고하세요.</p>
                </div>
              </div>
            </>
          )}
          <div className="equip-side-actions">
            <GameButton variant="soft" size="sm" icon="hint" onClick={() => { setHints((value) => value + 1); setShowHint(true); sfx('hint') }}>다음 행동 힌트</GameButton>
            <GameButton variant="ghost" size="sm" onClick={() => setShowQuit(true)}>나가기</GameButton>
          </div>
        </aside>
      </div>

      {showHint && (
        <div className="hint-popover">
          <span>💡</span>
          <p>{phase === 'check' ? '불이 작고 대피로가 확보된 초기 화재인지 먼저 판단하세요.' : phase === 'pin' ? '안전핀을 위로 70% 이상 당기면 빠집니다.' : phase === 'aim' ? '불씨가 있는 아래쪽을 조준하세요.' : phase === 'lever' ? '손잡이를 누른 채 유지하세요.' : '화면을 좌우로 두 번 드래그하세요.'}</p>
          <button type="button" onClick={() => setShowHint(false)}>확인</button>
        </div>
      )}

      {showQuit && (
        <div className="quit-overlay">
          <div className="quit-panel">
            <span className="quit-emoji">🧯</span>
            <h2>실습을 나갈까요?</h2>
            <p>진행 중인 실습은 저장되지 않아요.</p>
            <div className="modal-actions">
              <GameButton variant="ghost" onClick={() => setShowQuit(false)}>계속하기</GameButton>
              <GameButton variant="danger" onClick={onQuit}>나가기</GameButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExtinguisherSVG({ pinPulled, pressed }: { pinPulled: boolean; pressed: boolean }) {
  return (
    <svg viewBox="0 0 300 430" className="eq-svg" aria-hidden="true">
      <defs>
        <linearGradient id="canRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7c5f" />
          <stop offset=".45" stopColor="#e9483a" />
          <stop offset="1" stopColor="#b52d27" />
        </linearGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cad1d2" />
          <stop offset="1" stopColor="#7f8b8d" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="408" rx="83" ry="13" fill="#2a3a49" opacity=".14" />
      <path d="M106 99h88v35c24 20 38 51 38 91v131c0 30-16 45-46 45h-72c-30 0-46-15-46-45V225c0-40 14-71 38-91V99Z" fill="url(#canRed)" />
      <rect x="104" y="86" width="92" height="35" rx="13" fill="#d53d32" />
      <rect x="118" y="72" width="64" height="22" rx="8" fill="url(#metal)" />
      <rect x="132" y="55" width="36" height="26" rx="6" fill="#9ba7a8" />
      <rect x="144" y="42" width="13" height="22" rx="3" fill="#798889" />
      <g className={pressed ? 'handle-pressed' : ''}>
        <path d="M158 58c35-2 51 13 52 35" fill="none" stroke="#4a5558" strokeWidth="12" strokeLinecap="round" />
        <path d="M200 92c-9 4-18 0-21-8l-9-26" fill="none" stroke="#667375" strokeWidth="10" strokeLinecap="round" />
      </g>
      <path d="M103 103c-20 39-20 75-21 108-1 29-12 49-25 66" fill="none" stroke="#343c40" strokeWidth="11" strokeLinecap="round" />
      <path d="M55 269c-8 13-12 25-9 36 8 11 21 12 34 5 11-7 16-18 12-29-15 0-26-4-37-12Z" fill="#343c40" />
      <rect x="113" y="143" width="74" height="58" rx="6" fill="#f8eccf" />
      <text x="150" y="162" textAnchor="middle" fill="#b52d27" fontSize="11" fontWeight="800">소화기</text>
      <text x="150" y="177" textAnchor="middle" fill="#4d5e64" fontSize="8">ABC 분말</text>
      <circle cx="150" cy="188" r="9" fill="#fff" stroke="#c5b58a" strokeWidth="2" />
      <path d="M144 188h12M150 182v12" stroke="#d94f3e" strokeWidth="2" />
      <path d="M94 215c-4 33-4 83-4 117" stroke="#ffffff" strokeWidth="2" opacity=".17" />
      <path d="M110 233h80" stroke="#ffffff" strokeWidth="2" opacity=".2" />
      <rect x="106" y="313" width="88" height="54" rx="7" fill="#f4ddba" />
      <path d="M117 327h66M117 337h54M117 347h62" stroke="#8c6d52" strokeWidth="5" strokeLinecap="round" opacity=".55" />
      <circle cx="220" cy="254" r="11" fill="#f4f0d9" stroke="#6a7577" strokeWidth="3" />
      <path d="M220 254l5-6" stroke="#d74b3c" strokeWidth="2" strokeLinecap="round" />
      {pinPulled && <circle cx="235" cy="68" r="14" fill="none" stroke="#d7b549" strokeWidth="5" className="pulled-pin" />}
    </svg>
  )
}
