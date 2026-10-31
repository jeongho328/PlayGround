import { useEffect, useMemo, useRef, useState } from 'react'
import type { EmergencyScenario, MissionResult, SkillCount, SkillKey } from '../types'
import { missionStars } from '../data/missions'
import { GameButton } from '../components/UI'
import { Icon } from '../components/Icon'
import { sfx } from '../audio'

export function EmergencyCallGame({
  scenario,
  onComplete,
  onQuit,
}: {
  scenario: EmergencyScenario
  onComplete: (result: MissionResult) => void
  onQuit: () => void
}) {
  const [phase, setPhase] = useState<'intro' | 'connecting' | 'call' | 'complete'>('intro')
  const [stepIndex, setStepIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [wrongCount, setWrongCount] = useState(0)
  const [score, setScore] = useState(0)
  const [callSeconds, setCallSeconds] = useState(0)
  const [transcript, setTranscript] = useState<{ speaker: 'dispatch' | 'caller'; text: string }[]>([])
  const [firstTryCorrect, setFirstTryCorrect] = useState(0)
  const [firstAttemptThisStep, setFirstAttemptThisStep] = useState(false)
  const [showQuit, setShowQuit] = useState(false)
  const startedAt = useRef(Date.now())
  const callTimer = useRef<number | null>(null)
  const skillRef = useRef<Partial<Record<SkillKey, SkillCount>>>({})
  const step = scenario.steps[stepIndex]
  const selected = useMemo(() => step?.choices.find((choice) => choice.id === selectedId), [step, selectedId])
  const isLast = stepIndex === scenario.steps.length - 1
  const total = scenario.steps.length

  useEffect(() => {
    if (phase !== 'call') return
    callTimer.current = window.setInterval(() => setCallSeconds((value) => value + 1), 1000)
    return () => {
      if (callTimer.current) window.clearInterval(callTimer.current)
    }
  }, [phase])

  const startCall = () => {
    sfx('phone')
    setPhase('connecting')
    window.setTimeout(() => {
      setPhase('call')
      setTranscript([{ speaker: 'dispatch', text: scenario.steps[0].callerPrompt }])
    }, 1100)
  }

  const recordSkill = (skill: SkillKey, correct: boolean) => {
    const current = skillRef.current[skill] || { correct: 0, total: 0 }
    skillRef.current[skill] = { correct: current.correct + (correct ? 1 : 0), total: current.total + 1 }
  }

  const choose = (id: string) => {
    if (feedback === 'correct') return
    const choice = step.choices.find((item) => item.id === id)
    if (!choice) return
    setSelectedId(id)
    if (!firstAttemptThisStep) {
      recordSkill(step.skill, choice.correct)
      setFirstAttemptThisStep(true)
      if (choice.correct) setFirstTryCorrect((value) => value + 1)
    }
    if (choice.correct) {
      setFeedback('correct')
      setScore((value) => value + Math.max(45, 100 - wrongCount * 20))
      sfx('correct')
      setTranscript((turns) => [...turns, { speaker: 'caller', text: choice.label.replace(/^“|”$/g, '') }])
    } else {
      setFeedback('wrong')
      setWrongCount((value) => value + 1)
      sfx('wrong')
    }
  }

  const next = () => {
    if (isLast) {
      setPhase('complete')
      if (callTimer.current) window.clearInterval(callTimer.current)
      sfx('success')
      return
    }
    const nextStep = scenario.steps[stepIndex + 1]
    setTranscript((turns) => [...turns, { speaker: 'dispatch', text: nextStep.callerPrompt }])
    setStepIndex((value) => value + 1)
    setSelectedId(null)
    setFeedback(null)
    setFirstAttemptThisStep(false)
  }

  const finish = () => {
    const maxScore = total * 100
    const finalScore = Math.max(0, score)
    const stars = missionStars(scenario.missionId, finalScore, maxScore, wrongCount)
    onComplete({
      missionId: scenario.missionId,
      score: finalScore,
      maxScore,
      stars,
      correctCount: firstTryCorrect,
      totalCount: total,
      hintsUsed: 0,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      skills: skillRef.current,
      detail: `119 신고 통화를 완료했어요. ${wrongCount === 0 ? '모든 정보를 정확히 전달했습니다.' : '다시 확인한 정보가 있어요.'}`,
    })
  }

  return (
    <div className="call-game game-shell">
      <div className="game-status-bar call-status-bar">
        <div className="game-status-left">
          <button type="button" className="game-quit" onClick={() => setShowQuit(true)}><Icon name="back" size={17} /> 나가기</button>
          <span className="mission-live-title"><span>☎️</span>{scenario.title}</span>
        </div>
        <div className="call-step-dots">
          {scenario.steps.map((item, index) => <span key={item.id} className={`${index < stepIndex ? 'done' : ''} ${index === stepIndex ? 'active' : ''}`} />)}
        </div>
        <div className="call-timer"><span className="call-live-dot" /> 119 연결 · {String(Math.floor(callSeconds / 60)).padStart(2, '0')}:{String(callSeconds % 60).padStart(2, '0')}</div>
      </div>

      <div className="call-layout">
        <div className="call-scene-column">
          <div className="call-scene">
            <CallScene id={scenario.id} />
            <div className="call-scene-overlay">
              <span className="scene-location-label"><Icon name="info" size={13} /> {scenario.location}</span>
              <span className="virtual-call-badge">가상 신고 훈련</span>
            </div>
            <div className="call-scene-caption">
              <b>{scenario.title}</b>
              <p>{scenario.intro}</p>
            </div>
          </div>
          <div className="call-safety-strip">
            <Icon name="shield" size={16} />
            <span>{scenario.safetyNote}</span>
          </div>
          <div className="call-story-notes">
            <div><span>01</span><p>당황하지 말고 <b>위치</b>부터 말해요.</p></div>
            <div><span>02</span><p>사고 종류와 <b>사람 수·상태</b>를 알려요.</p></div>
            <div><span>03</span><p>상담원이 요청하면 <b>전화를 유지</b>해요.</p></div>
          </div>
        </div>

        <div className="phone-shell">
          <div className="phone-notch" />
          <div className="phone-screen">
            {phase === 'intro' && (
              <div className="phone-intro">
                <div className="phone-intro-top">
                  <span className="phone-signal">● ● ●</span>
                  <span>{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="phone-intro-center">
                  <div className="phone-emergency-icon">119</div>
                  <h2>긴급 신고 연습</h2>
                  <p>실제 상황을 가정한 교육용 시뮬레이션입니다.<br />상담원의 질문에 가장 알맞은 답을 골라 보세요.</p>
                  <div className="phone-intro-meta">
                    <span><Icon name="clock" size={14} /> 약 2분</span>
                    <span><Icon name="phone" size={14} /> {scenario.dispatchName}</span>
                  </div>
                  <button type="button" className="call-now-button" onClick={startCall}>
                    <span className="call-icon">☎</span>
                    <b>119 전화 걸기</b>
                    <small>가상 연결</small>
                  </button>
                  <span className="phone-disclaimer">실제 전화가 연결되지 않습니다</span>
                </div>
              </div>
            )}
            {phase === 'connecting' && (
              <div className="phone-connecting">
                <div className="connecting-rings"><span /><span /><span /><i>119</i></div>
                <h2>119 상황실에 연결 중</h2>
                <p>잠시만 기다려 주세요...</p>
                <div className="connecting-wave"><i /><i /><i /><i /><i /></div>
              </div>
            )}
            {phase === 'call' && (
              <div className="phone-call-view">
                <div className="phone-call-header">
                  <span className="call-status"><i /> 연결됨</span>
                  <b>{scenario.dispatchName}</b>
                  <span className="call-timer-mini">{String(Math.floor(callSeconds / 60)).padStart(2, '0')}:{String(callSeconds % 60).padStart(2, '0')}</span>
                </div>
                <div className="call-transcript">
                  {transcript.map((turn, index) => (
                    <div key={index} className={`call-bubble ${turn.speaker}`}>
                      {turn.speaker === 'dispatch' && <span className="bubble-speaker">상담원</span>}
                      <p>{turn.text}</p>
                    </div>
                  ))}
                </div>
                <div className="call-choice-area">
                  <div className="call-question">
                    <span className="q-mark">Q</span>
                    <div>
                      <small>STEP {stepIndex + 1} / {total}</small>
                      <b>{step.question}</b>
                    </div>
                  </div>
                  <div className="call-choices">
                    {step.choices.map((choice) => {
                      const isSelected = selectedId === choice.id
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          className={`call-choice ${isSelected ? (choice.correct ? 'is-correct' : 'is-wrong') : ''}`}
                          onClick={() => choose(choice.id)}
                          disabled={feedback === 'correct'}
                        >
                          <span>{choice.label}</span>
                          {choice.detail && <small>{choice.detail}</small>}
                          <i>{isSelected && choice.correct ? '✓' : isSelected ? '!' : '›'}</i>
                        </button>
                      )
                    })}
                  </div>
                  {feedback && (
                    <div className={`call-feedback ${feedback}`}>
                      <span>{feedback === 'correct' ? '✓' : '!'}</span>
                      <div>
                        <b>{feedback === 'correct' ? '좋은 신고입니다' : '다시 말해 볼까요?'}</b>
                        <p>{selected?.feedback}</p>
                      </div>
                      <GameButton
                        size="sm"
                        variant={feedback === 'correct' ? (isLast ? 'gold' : 'primary') : 'secondary'}
                        onClick={feedback === 'correct' ? next : () => { setFeedback(null); setSelectedId(null) }}
                        trailingIcon={feedback === 'correct' && !isLast ? 'arrow' : undefined}
                      >
                        {feedback === 'correct' ? (isLast ? '신고 완료' : '다음 질문') : '다시 선택'}
                      </GameButton>
                    </div>
                  )}
                </div>
              </div>
            )}
            {phase === 'complete' && (
              <div className="phone-complete">
                <div className="complete-check">✓</div>
                <span className="eyebrow">CALL COMPLETE</span>
                <h2>신고 통화를 완료했어요</h2>
                <p>정확한 위치와 상황을 차분히 전달하는 것이 구조의 시작입니다.</p>
                <div className="call-summary">
                  <div><span>소요 시간</span><b>{Math.floor(callSeconds / 60)}분 {callSeconds % 60}초</b></div>
                  <div><span>첫 시도 정확도</span><b>{firstTryCorrect}/{total}</b></div>
                  <div><span>통화 점수</span><b>{score}점</b></div>
                </div>
                <div className="phone-tip">
                  <Icon name="info" size={15} />
                  <p>{scenario.finalKnowledge === 'call-119' ? '전화를 끊지 말고 상담원의 안내를 따라 주세요. 가능하면 안전한 곳에서 구조대를 안내합니다.' : '실제 응급상황에서는 119 상담원의 안내가 우선입니다.'}</p>
                </div>
                <GameButton variant="gold" full icon="star" onClick={finish}>결과 확인</GameButton>
                <span className="phone-disclaimer">이 통화는 교육용으로 실제 119에 연결되지 않았습니다.</span>
              </div>
            )}
          </div>
          <div className="phone-homebar" />
        </div>
      </div>

      {showQuit && (
        <div className="quit-overlay">
          <div className="quit-panel">
            <span className="quit-emoji">☎️</span>
            <h2>신고 연습을 나갈까요?</h2>
            <p>진행 중인 통화 연습은 저장되지 않아요.</p>
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

function CallScene({ id }: { id: string }) {
  if (id === 'call-fire') {
    return (
      <div className="call-art fire-call-art" aria-hidden="true">
        <div className="call-sky fire-sky"><span className="call-cloud c1" /><span className="call-cloud c2" /></div>
        <div className="call-city-building"><span className="cc-roof" /><span className="cc-window w1" /><span className="cc-window w2" /><span className="cc-window w3" /><span className="cc-door" /><span className="cc-fire">🔥</span><span className="cc-smoke s1" /><span className="cc-smoke s2" /></div>
        <div className="call-truck">🚒</div>
        <div className="call-people"><span>🧑</span><span>👩</span><span>🧒</span><span>👨‍🚒</span></div>
        <div className="call-ground" />
      </div>
    )
  }
  if (id === 'call-medical') {
    return (
      <div className="call-art medical-call-art" aria-hidden="true">
        <div className="call-sky park-sky"><span className="call-cloud c1" /><span className="call-cloud c3" /></div>
        <div className="park-tree tree-one"><span /><i /></div>
        <div className="park-tree tree-two"><span /><i /></div>
        <div className="park-bench" />
        <div className="fallen-person"><span className="fp-head" /><span className="fp-body" /><span className="fp-legs" /></div>
        <div className="bystanders"><span>🧑</span><span>👩</span></div>
        <div className="park-ground" />
        <div className="park-path" />
      </div>
    )
  }
  return (
    <div className="call-art accident-call-art" aria-hidden="true">
      <div className="call-sky accident-sky"><span className="call-cloud c2" /><span className="call-cloud c3" /></div>
      <div className="accident-road"><span /><span /><span /></div>
      <div className="accident-car"><span className="car-window" /><span className="car-light" /><i /><b /></div>
      <div className="accident-bike">🛵</div>
      <div className="accident-cone">⚠️</div>
      <div className="accident-people"><span>🧑</span><span>👩‍⚕️</span></div>
      <div className="accident-ground" />
      <div className="accident-intersection" />
    </div>
  )
}
