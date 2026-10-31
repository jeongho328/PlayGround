import { useRef, useState } from 'react'
import type { MissionResult } from '../types'
import { GameButton, toast } from '../components/UI'
import { Icon } from '../components/Icon'
import { sfx } from '../audio'

type AedPhase = 'check' | 'power' | 'pads' | 'clear' | 'analyze' | 'shock' | 'cpr' | 'done'
type PadId = 'right' | 'left'

export function AedGame({
  onComplete,
  onQuit,
}: {
  onComplete: (result: MissionResult) => void
  onQuit: () => void
}) {
  const [phase, setPhase] = useState<AedPhase>('check')
  const [check, setCheck] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [hints, setHints] = useState(0)
  const [powerOn, setPowerOn] = useState(false)
  const [placed, setPlaced] = useState<Record<PadId, boolean>>({ right: false, left: false })
  const [selectedPad, setSelectedPad] = useState<PadId | null>(null)
  const [dragging, setDragging] = useState<PadId | null>(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [voice, setVoice] = useState('AED 전원을 켜 주세요.')
  const [cleared, setCleared] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [shockReady, setShockReady] = useState(false)
  const [shockPressed, setShockPressed] = useState(false)
  const [resumeTimer, setResumeTimer] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showQuit, setShowQuit] = useState(false)
  const startedAt = useRef(Date.now())
  const shockTimer = useRef<number | null>(null)
  const finishedRef = useRef(false)
  const mistake = (message: string) => {
    setMistakes((value) => value + 1)
    sfx('wrong')
    toast(message, 'error')
  }

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
    onComplete({
      missionId: 'equip-aed',
      score: Math.max(130, 500 - mistakes * 40 - hints * 15),
      maxScore: 500,
      stars,
      correctCount: 5 - Math.min(4, mistakes),
      totalCount: 5,
      hintsUsed: hints,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      skills: { firstAid: { correct: 5 - Math.min(4, mistakes), total: 5 }, equipment: { correct: 4, total: 4 } },
      detail: 'AED 분석과 충격, 이어서 가슴압박까지 경험했어요.',
    })
  }

  const checkChoice = (id: string) => {
    setCheck(id)
    if (id === 'a') {
      sfx('correct')
      setPhase('power')
      setVoice('AED 전원을 켜 주세요.')
      window.setTimeout(() => toast('좋아요. 119 신고와 가슴압박을 먼저 시작했어요.', 'success'), 100)
    } else {
      setMistakes((value) => value + 1)
      sfx('wrong')
    }
  }

  const power = () => {
    if (powerOn || phase !== 'power') return
    setPowerOn(true)
    sfx('correct')
    setVoice('가슴에 패드를 붙이세요. 오른쪽 쇄골 아래와 왼쪽 겨드랑이 아래입니다.')
    setPhase('pads')
  }

  const tryPlace = (pad: PadId, zone: string) => {
    if (placed[pad]) return
    const correct = (pad === 'right' && zone === 'rightUpper') || (pad === 'left' && zone === 'leftLower')
    if (correct) {
      const next = { ...placed, [pad]: true }
      setPlaced(next)
      setSelectedPad(null)
      sfx('correct')
      if (next.right && next.left) {
        setPhase('clear')
        setVoice('분석을 시작합니다. 아무도 환자에게 손대지 마세요.')
        toast('패드 부착 완료! 이제 모두 손을 떼세요.', 'success')
      } else {
        toast(pad === 'right' ? '오른쪽 패드가 제자리에 붙었어요.' : '왼쪽 패드가 제자리에 붙었어요.', 'success')
      }
    } else {
      mistake('패드 위치를 다시 확인하세요. 오른쪽 쇄골 아래와 왼쪽 겨드랑이 아래입니다.')
    }
  }

  const startDrag = (pad: PadId, event: React.PointerEvent) => {
    if (placed[pad]) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(pad)
    setSelectedPad(pad)
    setDragPos({ x: event.clientX, y: event.clientY })
  }
  const moveDrag = (event: React.PointerEvent) => {
    if (!dragging) return
    setDragPos({ x: event.clientX, y: event.clientY })
  }
  const endDrag = (event: React.PointerEvent) => {
    if (!dragging) return
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null
    const zone = element?.closest('[data-aed-zone]')?.getAttribute('data-aed-zone')
    if (zone) tryPlace(dragging, zone)
    setDragging(null)
  }

  const clearPatient = () => {
    setCleared(true)
    sfx('correct')
    setPhase('analyze')
    setVoice('모두 환자에게서 떨어지세요. 분석 중입니다.')
    window.setTimeout(() => {
      setAnalyzing(true)
      window.setTimeout(() => {
        setAnalyzing(false)
        setShockReady(true)
        setPhase('shock')
        setVoice('충격이 필요합니다. 다시 한번 모두 떨어지세요. 충격 버튼을 누르세요.')
        sfx('correct')
      }, 1600)
    }, 500)
  }

  const shock = () => {
    if (!shockReady) return
    setShockPressed(true)
    sfx('success')
    setVoice('충격 완료. 즉시 가슴압박을 다시 시작하세요.')
    setPhase('cpr')
    let count = 0
    if (shockTimer.current) window.clearInterval(shockTimer.current)
    shockTimer.current = window.setInterval(() => {
      count += 1
      setResumeTimer(count)
      if (count >= 8) {
        if (shockTimer.current) window.clearInterval(shockTimer.current)
        setPhase('done')
      }
    }, 500)
  }

  const currentStep = phase === 'check' ? 1 : phase === 'power' ? 2 : phase === 'pads' ? 3 : phase === 'clear' || phase === 'analyze' ? 4 : 5

  return (
    <div className="aed-game game-shell">
      <div className="game-status-bar">
        <div className="game-status-left">
          <button type="button" className="game-quit" onClick={() => setShowQuit(true)}><Icon name="back" size={17} /> 나가기</button>
          <span className="mission-live-title"><span>⚡</span>AED 사용 마스터</span>
        </div>
        <div className="aed-top-progress">
          {['상황 판단', '전원 켜기', '패드 부착', '안전 확보', '충격·압박'].map((label, index) => (
            <span key={label} className={`${index + 1 < currentStep ? 'done' : ''} ${index + 1 === currentStep ? 'active' : ''}`}><i>{index + 1 < currentStep ? '✓' : index + 1}</i>{label}</span>
          ))}
        </div>
        <button type="button" className="hint-button" onClick={() => { setHints((value) => value + 1); setShowHint(true); sfx('hint') }}><Icon name="hint" size={16} /> 힌트</button>
      </div>

      <div className="aed-layout">
        <div className="aed-scene">
          <div className="aed-scene-head">
            <span className="training-pill"><i /> 안전교육용 마네킹</span>
            <span className="aed-location">안전체험관 · 응급실습실</span>
          </div>
          <div className="aed-scene-body">
            <div className="aed-patient-area">
              <div className="patient-floor" />
              <PatientTorso
                placed={placed}
                phase={phase}
                selectedPad={selectedPad}
                onZone={(zone) => selectedPad && tryPlace(selectedPad, zone)}
                analyzing={analyzing}
                shockReady={shockReady}
                shockPressed={shockPressed}
                cleared={cleared}
              />
              {phase === 'cpr' && <div className="compression-wave"><span>COMPRESSION</span><i /><i /><i /><i /><i /></div>}
              {phase === 'done' && (
                <div className="aed-done-badge">
                  <span>✓</span>
                  <b>AED 훈련 완료</b>
                  <small>가슴압박을 다시 시작했어요</small>
                </div>
              )}
            </div>

            <div className="aed-device-area">
              <div className={`aed-device ${powerOn ? 'is-on' : ''}`}>
                <div className="aed-handle" />
                <div className="aed-screen">
                  <div className="aed-logo"><span>⚡</span>AED</div>
                  {powerOn ? (
                    <div className={`aed-wave ${analyzing ? 'is-analyzing' : ''}`}>
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <b>{analyzing ? '분석 중...' : shockPressed ? '충격 완료' : shockReady ? '충격 가능' : '대기'}</b>
                    </div>
                  ) : (
                    <b className="aed-off">OFF</b>
                  )}
                  <button
                    type="button"
                    className={`aed-power ${powerOn ? 'on' : ''}`}
                    onClick={power}
                    disabled={phase !== 'power'}
                    aria-label="AED 전원 켜기"
                  >
                    <i /> 전원
                  </button>
                  <button
                    type="button"
                    className={`aed-shock-btn ${shockReady ? 'ready' : ''} ${shockPressed ? 'pressed' : ''}`}
                    onClick={shock}
                    disabled={!shockReady}
                  >
                    <span>⚡</span>충격
                  </button>
                </div>
                <div className="aed-speaker"><i /><i /><i /></div>
                <div className="aed-brand">세이프 AED</div>
              </div>

              {phase === 'pads' && (
                <div className="pad-tray">
                  <span className="pad-tray-label">패드 선택 후 드래그</span>
                  {(['right', 'left'] as PadId[]).map((pad) => (
                    <button
                      key={pad}
                      type="button"
                      className={`aed-pad pad-${pad} ${placed[pad] ? 'is-placed' : ''} ${selectedPad === pad ? 'is-selected' : ''}`}
                      onPointerDown={(event) => startDrag(pad, event)}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onClick={() => !placed[pad] && setSelectedPad(pad)}
                      disabled={placed[pad]}
                    >
                      <span className="pad-shape" />
                      <span>{pad === 'right' ? '오른쪽 패드' : '왼쪽 패드'}</span>
                    </button>
                  ))}
                  <span className="pad-note">그림을 보고 위치를 확인하세요</span>
                </div>
              )}

              {phase === 'clear' && (
                <div className="clear-controls">
                  <div className="clear-warning"><span>⚠️</span><p>분석 전, 환자에게 닿은 사람이 없는지 확인하세요.</p></div>
                  <GameButton variant="gold" icon="check" onClick={clearPatient}>모두 손 떼기 · 분석 시작</GameButton>
                </div>
              )}

              {phase === 'analyze' && (
                <div className="analyze-overlay">
                  <div className="analyze-scan"><span /><span /><span /></div>
                  <b>심장 리듬 분석 중</b>
                  <p>아무도 환자에게 손대지 마세요</p>
                </div>
              )}

              {phase === 'shock' && (
                <div className="shock-controls">
                  <div className="shock-warning"><span>⚡</span><p>모두 물러나세요! 충격 버튼을 누르세요.</p></div>
                  <GameButton variant="danger" icon="spark" onClick={shock}>충격 버튼 누르기</GameButton>
                </div>
              )}

              {phase === 'cpr' && (
                <div className="cpr-resume">
                  <div className="cpr-beat"><span>1</span><span>2</span><span>3</span></div>
                  <b>즉시 가슴압박을 다시 시작!</b>
                  <p>분당 100~120회 속도로 {resumeTimer}/8회</p>
                </div>
              )}
            </div>
          </div>

          {dragging && (
            <div className="pad-drag-ghost" style={{ left: dragPos.x, top: dragPos.y }}>
              <span className={`pad-shape pad-${dragging}`} />
            </div>
          )}

          <div className="aed-dialogue">
            <span className="aed-voice-icon">🔊</span>
            <div><span>AED 음성 안내</span><p>{voice}</p></div>
            <div className="voice-wave"><i /><i /><i /><i /></div>
          </div>
        </div>

        <aside className="aed-side">
          {phase === 'check' && (
            <div className="aed-check">
              <span className="eyebrow">BEFORE AED</span>
              <h2>쓰러진 환자를 발견했어요</h2>
              <p>환자는 반응이 없고 정상 호흡이 없어 보입니다. AED를 가져오기 전에 무엇을 해야 할까요?</p>
              <div className="aed-check-choices">
                {[
                  { id: 'a', label: '119에 신고하고 즉시 가슴압박을 시작하며 AED를 요청한다', correct: true },
                  { id: 'b', label: 'AED가 올 때까지 아무것도 하지 않는다', correct: false },
                  { id: 'c', label: '환자를 세게 흔들어 깨운다', correct: false },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${check === option.id ? (option.correct ? 'is-correct' : 'is-wrong') : ''}`}
                    onClick={() => checkChoice(option.id)}
                    disabled={check !== null}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {check && check !== 'a' && (
                <div className="aed-check-feedback">
                  <p>반응과 호흡이 없다면 119 신고와 가슴압박, AED 사용이 동시에 필요합니다.</p>
                  <button type="button" onClick={() => setCheck(null)}>다시 선택</button>
                </div>
              )}
            </div>
          )}

          {phase !== 'check' && (
            <>
              <div className="aed-side-title">
                <span className="eyebrow">CURRENT STEP</span>
                <h2>{phase === 'power' ? 'AED 전원 켜기' : phase === 'pads' ? '패드 부착하기' : phase === 'clear' ? '안전 확보' : phase === 'analyze' ? '리듬 분석' : phase === 'shock' ? '충격 전달' : phase === 'cpr' ? '가슴압박 재개' : '훈련 완료'}</h2>
                <p>{phase === 'power' ? '기기 전원을 누르고 음성 안내를 들어요.' : phase === 'pads' ? '두 패드를 그림 위치에 정확히 붙여요.' : phase === 'clear' ? '모두가 환자에게서 떨어져야 합니다.' : phase === 'analyze' ? '기기가 심장 리듬을 확인합니다.' : phase === 'shock' ? '안전을 확인한 뒤 충격 버튼을 눌러요.' : phase === 'cpr' ? '충격 후에는 지체 없이 압박을 다시 시작해요.' : '모든 단계를 완료했습니다.'}</p>
              </div>
              <div className="aed-pad-diagram">
                <div className="diagram-body">
                  <span className="diagram-head" />
                  <span className="diagram-chest" />
                  <span className="diagram-pad right"><i>R</i></span>
                  <span className="diagram-pad left"><i>L</i></span>
                </div>
                <div>
                  <b>패드 위치</b>
                  <p>오른쪽 쇄골 아래 + 왼쪽 겨드랑이 아래</p>
                </div>
              </div>
              <div className="aed-reminders">
                <div><span>1</span><p>젖은 가슴은 수건으로 닦아요.</p></div>
                <div><span>2</span><p>분석·충격 중에는 아무도 닿지 않게 해요.</p></div>
                <div><span>3</span><p>충격 후 즉시 가슴압박을 다시 시작해요.</p></div>
              </div>
              {phase === 'done' && (
                <div className="aed-finish-box">
                  <div className="aed-finish-stars">★★★</div>
                  <GameButton variant="gold" full icon="star" onClick={finish}>훈련 결과 보기</GameButton>
                </div>
              )}
            </>
          )}

          <div className="aed-side-bottom">
            <span><Icon name="heart" size={15} /> 이 콘텐츠는 교육용이며 실제 응급상황에서는 119 안내를 따르세요.</span>
            <GameButton size="sm" variant="ghost" onClick={() => setShowQuit(true)}>나가기</GameButton>
          </div>
        </aside>
      </div>

      {showHint && (
        <div className="hint-popover">
          <span>💡</span>
          <p>{phase === 'check' ? '119 신고 후 즉시 가슴압박을 시작하고 AED를 요청하세요.' : phase === 'power' ? '기기 왼쪽 아래의 전원 버튼을 누르세요.' : phase === 'pads' ? '오른쪽 패드는 오른쪽 쇄골 아래, 왼쪽 패드는 왼쪽 겨드랑이 아래에 붙입니다.' : phase === 'clear' ? '분석 전 모든 사람이 환자에게서 떨어져야 합니다.' : phase === 'shock' ? '충격 버튼은 안전을 확인한 뒤 누릅니다.' : '충격 후 즉시 가슴압박을 다시 시작하세요.'}</p>
          <button type="button" onClick={() => setShowHint(false)}>확인</button>
        </div>
      )}

      {showQuit && (
        <div className="quit-overlay">
          <div className="quit-panel">
            <span className="quit-emoji">⚡</span>
            <h2>훈련을 나갈까요?</h2>
            <p>진행 중인 훈련은 저장되지 않아요.</p>
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

function PatientTorso({
  placed,
  phase,
  selectedPad,
  onZone,
  analyzing,
  shockReady,
  shockPressed,
  cleared,
}: {
  placed: Record<PadId, boolean>
  phase: AedPhase
  selectedPad: PadId | null
  onZone: (zone: string) => void
  analyzing: boolean
  shockReady: boolean
  shockPressed: boolean
  cleared: boolean
}) {
  return (
    <div className={`patient-torso-wrap ${analyzing ? 'is-analyzing' : ''} ${shockPressed ? 'shock-flash' : ''}`}>
      <svg viewBox="0 0 360 380" className="patient-svg" aria-label="AED 패드 부착 연습용 마네킹">
        <ellipse cx="180" cy="345" rx="115" ry="23" fill="#32445a" opacity=".12" />
        <path d="M111 100c12-29 38-43 69-43s57 14 69 43l22 98c7 32-6 52-32 60l-43 13v91h-31v-91l-43-13c-26-8-39-28-32-60l21-98Z" fill="#f3cba9" />
        <path d="M126 74c12-20 31-31 54-31s42 11 54 31c-7 7-19 12-32 9-11 17-33 20-44 0-10 8-21 7-32-9Z" fill="#4b392f" />
        <circle cx="180" cy="84" r="48" fill="#f6d5b5" />
        <path d="M138 72c13-28 38-39 62-32 17 5 28 18 33 34-12-9-23-12-34-11-25 3-41 13-61 9Z" fill="#4b392f" />
        <path d="M165 90c0 5 4 8 8 8M195 90c0 5 4 8 8 8" stroke="#a27055" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M173 107c5-3 11-3 16 0" stroke="#b77c68" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M144 129c22 10 50 10 72 0" fill="none" stroke="#c58c6f" strokeWidth="2" opacity=".5" />
        <path d="M121 146c-16 24-24 57-26 93M239 146c16 24 24 57 26 93" fill="none" stroke="#e1ae8a" strokeWidth="17" strokeLinecap="round" />
        <path d="M103 236c-10 28-16 53-14 70M257 236c10 28 16 53 14 70" fill="none" stroke="#f3cba9" strokeWidth="18" strokeLinecap="round" />
        <path d="M149 188c9-5 53-5 62 0l5 69c-18 8-54 8-72 0l5-69Z" fill="#f8dec6" opacity=".62" />
        <path d="M180 198v59" stroke="#e2b696" strokeWidth="2" opacity=".45" />
        <path d="M157 208c6 7 14 10 23 10s17-3 23-10" fill="none" stroke="#e2b696" strokeWidth="2" opacity=".45" />
        {[0, 1, 2, 3].map((row) => (
          <path key={row} d={`M156 ${228 + row * 9}c15 4 33 4 48 0`} fill="none" stroke="#e2b696" strokeWidth="2" opacity=".35" />
        ))}
        {placed.right && <g className="placed-pad right-pad"><rect x="207" y="154" width="49" height="63" rx="9" transform="rotate(-14 231 185)" fill="#f7f3df" stroke="#d2c9ab" strokeWidth="2" /><path d="M224 171h21M224 182h13" stroke="#df624c" strokeWidth="3" strokeLinecap="round" /><circle cx="232" cy="197" r="8" fill="#e85b4b" /><path d="M228 197h8M232 193v8" stroke="#fff" strokeWidth="2" /></g>}
        {placed.left && <g className="placed-pad left-pad"><rect x="109" y="225" width="51" height="63" rx="9" transform="rotate(12 134 256)" fill="#f7f3df" stroke="#d2c9ab" strokeWidth="2" /><path d="M124 242h21M124 253h13" stroke="#df624c" strokeWidth="3" strokeLinecap="round" /><circle cx="133" cy="268" r="8" fill="#e85b4b" /><path d="M129 268h8M133 264v8" stroke="#fff" strokeWidth="2" /></g>}
        {phase === 'pads' && !cleared && (
          <g className="aed-zones">
            <g data-aed-zone="rightUpper" className={`aed-zone zone-right ${selectedPad ? 'selectable' : ''}`} onClick={() => onZone('rightUpper')} role="button" tabIndex={0} aria-label="오른쪽 쇄골 아래 패드 위치" onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onZone('rightUpper')}>
              <circle cx="232" cy="184" r="38" fill="rgba(255,215,86,.28)" stroke="#efbd3c" strokeDasharray="7 6" strokeWidth="2.5" />
              <text x="232" y="188" textAnchor="middle" fontSize="10" fontWeight="700" fill="#996f19">R</text>
            </g>
            <g data-aed-zone="leftLower" className={`aed-zone zone-left ${selectedPad ? 'selectable' : ''}`} onClick={() => onZone('leftLower')} role="button" tabIndex={0} aria-label="왼쪽 겨드랑이 아래 패드 위치" onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onZone('leftLower')}>
              <circle cx="136" cy="256" r="38" fill="rgba(255,215,86,.28)" stroke="#efbd3c" strokeDasharray="7 6" strokeWidth="2.5" />
              <text x="136" y="260" textAnchor="middle" fontSize="10" fontWeight="700" fill="#996f19">L</text>
            </g>
            <g data-aed-zone="center" className="aed-zone zone-center" onClick={() => onZone('center')} role="button" tabIndex={0} aria-label="가슴 중앙" onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onZone('center')}>
              <circle cx="183" cy="218" r="28" fill="none" stroke="rgba(255,255,255,.35)" strokeDasharray="5 6" strokeWidth="2" />
            </g>
            <g data-aed-zone="abdomen" className="aed-zone zone-abdomen" onClick={() => onZone('abdomen')} role="button" tabIndex={0} aria-label="배 부위" onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onZone('abdomen')}>
              <circle cx="183" cy="292" r="23" fill="none" stroke="rgba(255,255,255,.28)" strokeDasharray="5 6" strokeWidth="2" />
            </g>
          </g>
        )}
        {analyzing && (
          <g className="analysis-ring">
            <circle cx="180" cy="205" r="80" fill="none" stroke="#64e3c2" strokeWidth="3" strokeDasharray="10 15" />
            <circle cx="180" cy="205" r="105" fill="none" stroke="#64e3c2" strokeWidth="1.5" strokeDasharray="4 18" opacity=".5" />
          </g>
        )}
        {shockReady && !shockPressed && (
          <g className="shock-target">
            <circle cx="180" cy="205" r="112" fill="none" stroke="#ffd552" strokeWidth="3" strokeDasharray="12 10" />
          </g>
        )}
      </svg>
      <div className="patient-label">안전교육용 마네킹 · 실제 환자와 다릅니다</div>
    </div>
  )
}
