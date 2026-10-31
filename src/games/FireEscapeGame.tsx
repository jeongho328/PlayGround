import { useEffect, useMemo, useRef, useState } from 'react'
import type { FireStage, MissionResult, SkillKey, SkillCount } from '../types'
import { missionStars } from '../data/missions'
import { FireScene } from './FireScene'
import { GameButton, ProgressBar, toast } from '../components/UI'
import { Icon } from '../components/Icon'
import { sfx } from '../audio'

export function FireEscapeGame({
  stage,
  onComplete,
  onQuit,
}: {
  stage: FireStage
  onComplete: (result: MissionResult) => void
  onQuit: () => void
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [wrongCount, setWrongCount] = useState(0)
  const [hints, setHints] = useState(0)
  const [hintUsedThisStep, setHintUsedThisStep] = useState(false)
  const [eliminated, setEliminated] = useState<string[]>([])
  const [safety, setSafety] = useState(100)
  const [score, setScore] = useState(0)
  const [firstTryCorrect, setFirstTryCorrect] = useState(0)
  const [firstAttempt, setFirstAttempt] = useState(false)
  const [showQuit, setShowQuit] = useState(false)
  const [outcomeFlash, setOutcomeFlash] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const startedAt = useRef(Date.now())
  const skillRef = useRef<Partial<Record<SkillKey, SkillCount>>>({})
  const wrongThisStep = useRef(0)
  const step = stage.steps[stepIndex]
  const total = stage.steps.length
  const isLast = stepIndex === total - 1
  const selectedChoice = useMemo(() => step.choices.find((choice) => choice.id === selectedId), [step, selectedId])

  const recordSkill = (skill: SkillKey, correct: boolean) => {
    const current = skillRef.current[skill] || { correct: 0, total: 0 }
    skillRef.current[skill] = { correct: current.correct + (correct ? 1 : 0), total: current.total + 1 }
  }

  useEffect(() => {
    setSelectedId(null)
    setFeedback(null)
    setHintUsedThisStep(false)
    setEliminated([])
    setFirstAttempt(false)
    setOutcomeFlash(false)
    wrongThisStep.current = 0
  }, [stepIndex])

  const choose = (choiceId: string) => {
    if (feedback === 'correct' || eliminated.includes(choiceId)) return
    const choice = step.choices.find((item) => item.id === choiceId)
    if (!choice) return
    setSelectedId(choiceId)
    if (!firstAttempt) {
      recordSkill(step.skill, choice.correct)
      setFirstAttempt(true)
      if (choice.correct) setFirstTryCorrect((value) => value + 1)
    }
    if (choice.correct) {
      const points = Math.max(30, 100 - wrongThisStep.current * 25)
      setEarnedPoints(points)
      setFeedback('correct')
      setScore((value) => value + points)
      setOutcomeFlash(true)
      sfx('correct')
      window.setTimeout(() => setOutcomeFlash(false), 1000)
    } else {
      setFeedback('wrong')
      wrongThisStep.current += 1
      setWrongCount((value) => value + 1)
      setSafety((value) => Math.max(26, value - 16))
      sfx('wrong')
    }
  }

  const retry = () => {
    setSelectedId(null)
    setFeedback(null)
  }

  const useHint = () => {
    if (hintUsedThisStep || feedback === 'correct') return
    const wrongChoices = step.choices.filter((choice) => !choice.correct && !eliminated.includes(choice.id))
    if (wrongChoices.length <= 1) return
    const remove = wrongChoices[Math.floor(Math.random() * wrongChoices.length)]
    setEliminated((value) => [...value, remove.id])
    setHintUsedThisStep(true)
    setHints((value) => value + 1)
    sfx('hint')
    toast('위험한 선택지 하나를 지웠어요.', 'info')
  }

  const finish = () => {
    const maxScore = total * 100
    const finalScore = Math.max(0, Math.min(maxScore, score - hints * 8))
    const stars = missionStars(stage.id, finalScore, maxScore, wrongCount)
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000)
    onComplete({
      missionId: stage.id,
      score: finalScore,
      maxScore,
      stars,
      correctCount: firstTryCorrect,
      totalCount: total,
      hintsUsed: hints,
      durationSec,
      skills: skillRef.current,
      detail: wrongCount === 0 ? '모든 판단을 한 번에 해냈어요!' : `${wrongCount}번의 판단을 다시 점검했어요.`,
    })
  }

  const advance = () => {
    if (isLast) {
      finish()
      return
    }
    sfx('click')
    setStepIndex((value) => value + 1)
  }

  return (
    <div className="fire-game game-shell">
      <div className="game-status-bar">
        <div className="game-status-left">
          <button type="button" className="game-quit" onClick={() => setShowQuit(true)} aria-label="미션 나가기">
            <Icon name="back" size={17} /> 나가기
          </button>
          <span className="mission-live-title"><span>🔥</span>{stage.title}</span>
        </div>
        <div className="stage-progress">
          <span className="stage-progress-label">상황 {stepIndex + 1} / {total}</span>
          <div className="stage-dots">
            {stage.steps.map((item, index) => (
              <span key={item.id} className={`${index < stepIndex ? 'done' : ''} ${index === stepIndex ? 'active' : ''}`} />
            ))}
          </div>
        </div>
        <div className="safety-meter">
          <span className="safety-meter-label">안전 상태</span>
          <div className="safety-meter-track"><span style={{ width: `${safety}%`, background: safety > 70 ? '#42c88f' : safety > 45 ? '#ffb340' : '#ef5b5b' }} /></div>
          <b>{safety}</b>
        </div>
      </div>

      <div className="fire-game-layout">
        <div className="fire-scene-column">
          <FireScene scene={step.scene} danger={step.danger} stepId={step.id} />
          <div className="scene-condition">
            <span className="condition-icon"><Icon name="info" size={16} /></span>
            <div><b>상황 조건</b><p>{step.condition || '차분히 주변을 살피고 판단하세요.'}</p></div>
          </div>
          <div className="scene-bottom-note">
            <span>실제 상황에서는 119 상담원과 현장 지시가 가장 우선입니다.</span>
            <button type="button" onClick={onQuit}>미션 목록</button>
          </div>
        </div>

        <div className="decision-panel">
          <div className="decision-header">
            <div className="decision-step-chip">STEP {stepIndex + 1}</div>
            <span className="decision-topic">화재대피 판단</span>
            <button
              type="button"
              className={`hint-button ${hintUsedThisStep ? 'used' : ''}`}
              onClick={useHint}
              disabled={hintUsedThisStep || feedback === 'correct'}
            >
              <Icon name="hint" size={16} /> {hintUsedThisStep ? '힌트 사용됨' : '힌트'}
            </button>
          </div>

          <div className="narrative-chip">
            <span className="narrative-icon">📖</span>
            <p>{step.situation}</p>
          </div>

          <h2 className="decision-question">{step.prompt}</h2>

          <div className="choice-list" role="group" aria-label="행동 선택">
            {step.choices.map((choice, index) => {
              const isSelected = selectedId === choice.id
              const isCorrect = feedback === 'correct' && choice.correct
              const isWrong = feedback === 'wrong' && isSelected
              const isEliminated = eliminated.includes(choice.id)
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={`choice-card ${isSelected ? 'is-selected' : ''} ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''} ${isEliminated ? 'is-eliminated' : ''}`}
                  onClick={() => choose(choice.id)}
                  disabled={feedback === 'correct' || isEliminated}
                >
                  <span className="choice-marker">{String.fromCharCode(65 + index)}</span>
                  <span className="choice-copy">
                    <b>{choice.label}</b>
                    {choice.detail && <small>{choice.detail}</small>}
                  </span>
                  {isCorrect && <span className="choice-result-icon correct"><Icon name="check" size={18} /></span>}
                  {isWrong && <span className="choice-result-icon wrong"><Icon name="close" size={18} /></span>}
                  {isEliminated && <span className="choice-eliminated-label">위험</span>}
                </button>
              )
            })}
          </div>

          {feedback && (
            <div className={`feedback-card feedback-${feedback}`} role="status" aria-live="polite">
              <div className="feedback-head">
                <span className="feedback-icon">{feedback === 'correct' ? '✓' : '!'}</span>
                <div>
                  <b>{feedback === 'correct' ? '좋은 판단이에요!' : '잠깐, 다시 생각해 볼까요?'}</b>
                  <span>{feedback === 'correct' ? selectedChoice?.outcome : '이 행동은 위험할 수 있어요.'}</span>
                </div>
                <span className="feedback-xp">{feedback === 'correct' ? `+${earnedPoints}` : '-16 안전'}</span>
              </div>
              <p>{selectedChoice?.feedback}</p>
              {feedback === 'correct' && (
                <>
                  <div className="explanation-box">
                    <span className="explain-label"><Icon name="info" size={14} /> 안전 해설</span>
                    <p>{step.explanation}</p>
                  </div>
                  <div className="caution-line"><Icon name="shield" size={14} /> {step.caution}</div>
                  <div className="source-line">근거 · {step.source} <span>{step.sourceDate}</span> <i className="verified">검수 완료</i></div>
                  <div className="feedback-actions">
                    <GameButton variant={isLast ? 'gold' : 'primary'} trailingIcon={isLast ? 'star' : 'arrow'} onClick={advance}>
                      {isLast ? '미션 결과 보기' : '다음 상황으로'}
                    </GameButton>
                  </div>
                </>
              )}
              {feedback === 'wrong' && (
                <div className="feedback-actions">
                  <button type="button" className="text-action" onClick={() => setShowQuit(true)}>그만하기</button>
                  <GameButton variant="secondary" icon="reset" onClick={retry}>다시 판단하기</GameButton>
                </div>
              )}
            </div>
          )}

          {!feedback && (
            <div className="decision-footnote">
              <Icon name="info" size={14} />
              <span>정답을 서두르지 마세요. 상황 조건을 읽고 가장 안전한 행동을 고르면 됩니다.</span>
            </div>
          )}
        </div>
      </div>

      {showQuit && (
        <div className="quit-overlay" role="dialog" aria-modal="true" aria-label="미션 나가기 확인">
          <div className="quit-panel">
            <span className="quit-emoji">🚪</span>
            <h2>미션을 나갈까요?</h2>
            <p>지금까지의 진행은 저장되지 않아요. 언제든 다시 도전할 수 있습니다.</p>
            <div className="modal-actions">
              <GameButton variant="ghost" onClick={() => setShowQuit(false)}>계속하기</GameButton>
              <GameButton variant="danger" onClick={() => { setShowQuit(false); onQuit() }}>나가기</GameButton>
            </div>
          </div>
        </div>
      )}
      <span className="sr-only" aria-live="polite">{feedback === 'correct' ? '정답입니다' : feedback === 'wrong' ? '다시 생각해 보세요' : ''}</span>
    </div>
  )
}
