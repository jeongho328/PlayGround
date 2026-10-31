import { useCallback, useEffect, useRef, useState } from 'react'
import type { MissionResult } from '../types'
import { GameButton } from '../components/UI'
import { Icon } from '../components/Icon'
import { sfx } from '../audio'

const BPM = 110
const BEAT_MS = 60000 / BPM
const TOTAL = 30

type Rating = 'perfect' | 'good' | 'late' | 'miss'

export function CprGame({
  onComplete,
  onQuit,
}: {
  onComplete: (result: MissionResult) => void
  onQuit: () => void
}) {
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'active' | 'done'>('intro')
  const [countdown, setCountdown] = useState(3)
  const [count, setCount] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [lastRating, setLastRating] = useState<Rating | null>(null)
  const [pulse, setPulse] = useState(0)
  const [pressAnim, setPressAnim] = useState(0)
  const [hints, setHints] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showQuit, setShowQuit] = useState(false)
  const startedAt = useRef(Date.now())
  const beatStart = useRef(0)
  const lastPress = useRef(0)
  const beatTimer = useRef<number | null>(null)
  const countdownTimer = useRef<number | null>(null)
  const finishedRef = useRef(false)
  const activeRef = useRef(false)
  const resultRef = useRef({ score: 0, ratings: [] as Rating[], maxCombo: 0 })

  const cleanup = () => {
    if (beatTimer.current) window.clearInterval(beatTimer.current)
    if (countdownTimer.current) window.clearInterval(countdownTimer.current)
  }

  useEffect(() => () => cleanup(), [])

  const begin = () => {
    setPhase('countdown')
    setCountdown(3)
    let value = 3
    countdownTimer.current = window.setInterval(() => {
      value -= 1
      setCountdown(value)
      if (value <= 0) {
        if (countdownTimer.current) window.clearInterval(countdownTimer.current)
        startRhythm()
      }
    }, 800)
  }

  const startRhythm = () => {
    setPhase('active')
    activeRef.current = true
    beatStart.current = performance.now()
    const beat = () => {
      setPulse((value) => value + 1)
      sfx('beat')
    }
    beat()
    beatTimer.current = window.setInterval(beat, BEAT_MS)
  }

  const press = useCallback(() => {
    if (!activeRef.current || finishedRef.current) return
    const now = performance.now()
    if (now - lastPress.current < 110) return
    lastPress.current = now
    const elapsed = now - beatStart.current
    const phaseInBeat = ((elapsed % BEAT_MS) + BEAT_MS) % BEAT_MS
    const distance = Math.min(phaseInBeat, BEAT_MS - phaseInBeat)
    let rating: Rating
    let points = 0
    if (distance <= 75) {
      rating = 'perfect'
      points = 100
    } else if (distance <= 140) {
      rating = 'good'
      points = 72
    } else if (distance <= 230) {
      rating = 'late'
      points = 35
    } else {
      rating = 'miss'
      points = 0
    }
    const nextCount = count + 1
    setCount(nextCount)
    setPressAnim((value) => value + 1)
    setLastRating(rating)
    setRatings((value) => [...value, rating])
    setScore((value) => value + points)
    resultRef.current.ratings.push(rating)
    resultRef.current.score += points
    if (rating === 'perfect' || rating === 'good') {
      setCombo((value) => {
        const next = value + 1
        resultRef.current.maxCombo = Math.max(resultRef.current.maxCombo, next)
        setMaxCombo((current) => Math.max(current, next))
        return next
      })
      sfx(rating === 'perfect' ? 'star' : 'click')
    } else {
      setCombo(0)
      sfx('wrong')
    }
    if (nextCount >= TOTAL) {
      activeRef.current = false
      finishedRef.current = true
      cleanup()
      window.setTimeout(() => setPhase('done'), 450)
    }
  }, [count])

  useEffect(() => {
    if (phase !== 'active') return
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === 'Enter') {
        event.preventDefault()
        press()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, press])

  const finish = () => {
    if (!finishedRef.current) return
    const good = resultRef.current.ratings.filter((rating) => rating === 'perfect' || rating === 'good').length
    const misses = resultRef.current.ratings.filter((rating) => rating === 'miss').length
    const accuracy = (resultRef.current.score / (TOTAL * 100)) * 100
    const stars = accuracy >= 80 && misses <= 3 ? 3 : accuracy >= 55 ? 2 : 1
    onComplete({
      missionId: 'equip-cpr',
      score: resultRef.current.score,
      maxScore: TOTAL * 100,
      stars,
      correctCount: good,
      totalCount: TOTAL,
      hintsUsed: hints,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      skills: { firstAid: { correct: good, total: TOTAL } },
      detail: `${good}/30회의 압박이 박자에 잘 맞았어요. 분당 ${BPM}회 리듬을 기억하세요.`,
    })
  }

  const restart = () => {
    cleanup()
    setPhase('intro')
    setCountdown(3)
    setCount(0)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setRatings([])
    setLastRating(null)
    setPulse(0)
    setHints(0)
    finishedRef.current = false
    activeRef.current = false
    startedAt.current = Date.now()
    resultRef.current = { score: 0, ratings: [], maxCombo: 0 }
  }

  const accuracy = count > 0 ? Math.round((ratings.filter((rating) => rating === 'perfect' || rating === 'good').length / count) * 100) : 0
  const goodCount = ratings.filter((rating) => rating === 'perfect' || rating === 'good').length

  return (
    <div className="cpr-game game-shell">
      <div className="game-status-bar">
        <div className="game-status-left">
          <button type="button" className="game-quit" onClick={() => setShowQuit(true)}><Icon name="back" size={17} /> 나가기</button>
          <span className="mission-live-title"><span>🫀</span>심폐소생술 리듬</span>
        </div>
        <div className="cpr-top-status">
          <span className="bpm-pill">BPM <b>{BPM}</b></span>
          <span className="compression-pill">가슴압박 <b>{count}</b> / {TOTAL}</span>
        </div>
        <button type="button" className="hint-button" onClick={() => { setHints((value) => value + 1); setShowHint(true); sfx('hint') }}><Icon name="hint" size={16} /> 힌트</button>
      </div>

      <div className="cpr-layout">
        <div className="cpr-stage">
          <div className="cpr-stage-head">
            <span className="training-pill"><i /> 안전체험관 · 심폐소생술실</span>
            <span className="cpr-beat-label">METRONOME <i className={phase === 'active' ? 'on' : ''} /></span>
          </div>

          <div className="cpr-scene">
            <div className="cpr-floor" />
            <div className={`cpr-patient ${pressAnim > 0 ? 'has-press' : ''}`} key={pressAnim}>
              <div className="cpr-head" />
              <div className="cpr-body" />
              <div className="cpr-arms"><span /><span /></div>
              <div className={`cpr-hands ${phase === 'active' ? 'is-active' : ''}`}>
                <span className="hand hand-left" />
                <span className="hand hand-right" />
                <span className="compression-flash" />
              </div>
              <div className="cpr-chest-target">
                <i />
                <b>5~6cm</b>
              </div>
            </div>

            <div className="cpr-ring-wrap">
              <div className={`cpr-beat-ring ${phase === 'active' ? 'is-beating' : ''}`} key={`ring-${pulse}`}>
                <span />
                <span />
                <span />
              </div>
              {phase === 'active' && (
                <>
                  <div className={`cpr-tap-zone ${lastRating ? `rating-${lastRating}` : ''}`}>
                    <button type="button" className="cpr-tap-button" onPointerDown={press} aria-label="가슴압박 버튼">
                      <span className="tap-heart">♥</span>
                      <b>압박!</b>
                      <small>SPACE</small>
                    </button>
                  </div>
                  <div className={`rating-float rating-${lastRating}`} key={`rating-${count}`}>{lastRating === 'perfect' ? 'PERFECT!' : lastRating === 'good' ? 'GOOD' : lastRating === 'late' ? '조금 늦어요' : '박자를 놓쳤어요'}</div>
                </>
              )}
              {phase === 'intro' && (
                <div className="cpr-intro-card">
                  <span className="intro-badge">CPR TRAINING</span>
                  <h2>110 BPM,<br />생명을 잇는 박자</h2>
                  <p>가슴 중앙을 5~6cm 깊이로, 분당 110회 속도로 압박합니다. 30회에 도전하세요.</p>
                  <div className="cpr-intro-facts">
                    <span><i>1</i>중앙</span>
                    <span><i>2</i>5~6cm</span>
                    <span><i>3</i>110 BPM</span>
                  </div>
                  <GameButton variant="primary" size="lg" icon="play" onClick={begin}>리듬 시작</GameButton>
                  <small>실제 응급상황에서는 119 안내를 따르세요</small>
                </div>
              )}
              {phase === 'countdown' && (
                <div className="cpr-countdown" key={countdown}>
                  <span>{countdown > 0 ? countdown : 'GO!'}</span>
                  <p>손을 가슴 중앙에 올리고 준비하세요</p>
                </div>
              )}
              {phase === 'done' && (
                <div className="cpr-done-card">
                  <span className="done-burst">💓</span>
                  <h2>30회 압박 완료!</h2>
                  <p>정확한 리듬 {goodCount}회 · 최고 콤보 {maxCombo}회</p>
                  <div className="cpr-done-score">{score}<small>/3000</small></div>
                  <GameButton variant="gold" icon="star" onClick={finish}>결과 확인</GameButton>
                </div>
              )}
            </div>
          </div>

          <div className="cpr-bottom-info">
            <span><Icon name="info" size={15} /> 가슴이 완전히 올라오도록 압박을 풀어 주세요.</span>
            <span className="cpr-source">질병관리청 · 대한심폐소생협회 일반인 지침</span>
          </div>
        </div>

        <aside className="cpr-side">
          <div className="cpr-side-head">
            <span className="eyebrow">RHYTHM GUIDE</span>
            <h2>박자를 맞춰 보세요</h2>
            <p>초록색 원이 가장 커지는 순간, 압박 버튼을 누르면 됩니다.</p>
          </div>
          <div className="cpr-stats">
            <div><span>정확도</span><b>{accuracy}%</b></div>
            <div><span>콤보</span><b>{combo}x</b></div>
            <div><span>점수</span><b>{score}</b></div>
          </div>
          <div className="cpr-beat-visual">
            <div className="beat-circle"><i /><i /><i /><b>{phase === 'active' ? 'TAP' : 'READY'}</b></div>
            <span>100~120회/분<br /><b>약 0.55초 간격</b></span>
          </div>
          <div className="compression-progress">
            <div className="compression-progress-head"><span>압박 진행</span><b>{count}/{TOTAL}</b></div>
            <div className="compression-dots">
              {Array.from({ length: TOTAL }).map((_, index) => {
                const rating = ratings[index]
                return <i key={index} className={`${index < count ? 'filled' : ''} ${rating ? `r-${rating}` : ''}`} />
              })}
            </div>
          </div>
          <div className="cpr-ratings">
            <span className="rating-perfect"><i /> 완벽</span>
            <span className="rating-good"><i /> 좋아요</span>
            <span className="rating-late"><i /> 늦음</span>
            <span className="rating-miss"><i /> 놓침</span>
          </div>
          <div className="cpr-tips">
            <div><span>💪</span><p><b>팔을 곧게</b> 체중을 실어 압박하세요.</p></div>
            <div><span>🫁</span><p>매 압박마다 <b>가슴이 완전히</b> 올라오게 하세요.</p></div>
            <div><span>⚡</span><p>AED가 도착하면 주저 없이 사용하세요.</p></div>
          </div>
          <div className="cpr-side-foot">
            <span>교육용 콘텐츠입니다. 실제 응급상황에서는 119가 안내합니다.</span>
            <button type="button" onClick={restart}>다시 시작</button>
          </div>
        </aside>
      </div>

      {showHint && (
        <div className="hint-popover">
          <span>💡</span>
          <p>분당 110회, 초록 원이 가장 커지는 순간에 눌러 보세요. 너무 빠르면 놓치는 박자가 생겨요.</p>
          <button type="button" onClick={() => setShowHint(false)}>확인</button>
        </div>
      )}
      {showQuit && (
        <div className="quit-overlay">
          <div className="quit-panel">
            <span className="quit-emoji">🫀</span>
            <h2>훈련을 나갈까요?</h2>
            <p>진행 중인 리듬 훈련은 저장되지 않아요.</p>
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
