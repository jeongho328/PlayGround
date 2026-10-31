import type { CompletionReport, MissionDef, MissionResult } from '../types'
import { BADGES } from '../data/city'
import { KNOWLEDGE } from '../data/knowledge'
import { GameButton, Confetti, ScoreRing, Stars, ProgressBar } from '../components/UI'
import { Mascot } from '../components/Mascot'
import { Icon } from '../components/Icon'

export function ResultScreen({
  mission,
  result,
  report,
  nextMission,
  onRetry,
  onNext,
  onCity,
  onMissions,
  onCodex,
}: {
  mission: MissionDef
  result: MissionResult
  report: CompletionReport
  nextMission?: MissionDef
  onRetry: () => void
  onNext: () => void
  onCity: () => void
  onMissions: () => void
  onCodex: () => void
}) {
  const failed = Boolean(result.failed)
  const percent = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0
  const newBadges = report.newBadges.map((id) => BADGES.find((badge) => badge.id === id)).filter(Boolean)
  const newKnowledge = report.newKnowledge.map((id) => KNOWLEDGE.find((article) => article.id === id)).filter(Boolean)
  const levelUp = report.levelAfter > report.levelBefore
  const isPerfect = !failed && result.stars === 3 && percent >= 90

  return (
    <div className={`result-screen ${failed ? 'result-failed' : 'result-success'}`}>
      {!failed && <Confetti count={isPerfect ? 64 : 44} />}
      <div className="result-sky" aria-hidden="true">
        <span className="result-sun" />
        <span className="result-cloud rc1" />
        <span className="result-cloud rc2" />
        <span className="result-rays" />
      </div>

      <div className="result-inner">
        <div className="result-topline">
          <span className="result-mode">{mission.category} · {mission.shortTitle}</span>
          <span className={`result-status ${failed ? 'failed' : 'success'}`}>
            {failed ? '미션 실패' : isPerfect ? '완벽한 판단!' : '미션 완료'}
          </span>
        </div>

        <section className="result-hero">
          <div className={`result-mascot ${failed ? 'is-worried' : ''}`}>
            <Mascot name={failed ? 'fire' : 'fire'} mood={failed ? 'worry' : 'cheer'} size={148} />
          </div>
          <div className="result-title-block">
            <span className="eyebrow">{failed ? 'TRY AGAIN' : 'MISSION COMPLETE'}</span>
            <h1>{failed ? '조금 더 연습해 볼까요?' : isPerfect ? '완벽해요, 안전지킴이!' : '미션을 완료했어요!'}</h1>
            <p>{failed ? result.failureReason || '이번 판단을 다시 돌아보고 안전한 행동을 골라 보세요.' : result.detail || `${mission.title}의 안전 판단을 모두 연습했어요.`}</p>
            {!failed && <Stars value={result.stars} size={38} animated />}
          </div>
          {!failed && (
            <div className="result-score-card">
              <ScoreRing value={result.score} max={result.maxScore} size={128} label="판단 점수" />
              <div className="result-score-meta">
                <span>점수 <b>{result.score}</b> / {result.maxScore}</span>
                <span>첫 시도 정답 <b>{result.correctCount}</b> / {result.totalCount}</span>
              </div>
            </div>
          )}
          {failed && (
            <div className="result-fail-card">
              <span className="result-fail-icon">!</span>
              <div>
                <b>이번 미션은 기록되지 않았어요</b>
                <p>실패해도 괜찮아요. 안전 수칙을 다시 확인하고 도전하면 더 잘할 수 있어요.</p>
              </div>
            </div>
          )}
        </section>

        {!failed ? (
          <>
            <section className="result-reward-row">
              <div className="result-reward-card coin">
                <span className="reward-icon">₩</span>
                <div><small>안전코인</small><b>+{report.coinsGained.toLocaleString()}</b></div>
                <span className="reward-note">별 {result.stars}개 보너스 포함</span>
              </div>
              <div className="result-reward-card xp">
                <span className="reward-icon"><Icon name="xp" size={22} /></span>
                <div><small>경험치</small><b>+{report.xpGained}</b></div>
                <span className="reward-note">Lv.{report.levelAfter}까지 성장</span>
              </div>
              <div className="result-reward-card best">
                <span className="reward-icon"><Icon name="trophy" size={22} /></span>
                <div><small>최고 기록</small><b>{report.newBest ? '갱신!' : '도전 중'}</b></div>
                <span className="reward-note">{report.isReplay ? '재도전 보상 30% 적용' : '첫 완료 보상'}</span>
              </div>
            </section>

            {(levelUp || newBadges.length > 0 || newKnowledge.length > 0) && (
              <section className="result-unlocks">
                {levelUp && (
                  <div className="unlock-row level-up-row">
                    <span className="unlock-icon">🎉</span>
                    <div><b>레벨 업! Lv.{report.levelAfter}</b><p>새로운 안전지킴이 등급에 도전했어요. 계속 미션을 완료해 보세요.</p></div>
                    <div className="levelup-track"><ProgressBar value={report.levelAfter} max={20} height={7} color="#ffcf4a" /></div>
                  </div>
                )}
                {newBadges.map((badge) => badge && (
                  <div className="unlock-row badge-unlock" key={badge.id}>
                    <span className="unlock-icon" style={{ background: badge.color }}>{badge.emoji}</span>
                    <div><b>새 배지 · {badge.name}</b><p>{badge.description}</p></div>
                    <span className="unlock-tag">배지 획득</span>
                  </div>
                ))}
                {newKnowledge.map((article) => article && (
                  <div className="unlock-row knowledge-unlock" key={article.id}>
                    <span className="unlock-icon knowledge">{article.emoji}</span>
                    <div><b>안전도감 · {article.title}</b><p>{article.summary}</p></div>
                    <button type="button" className="unlock-link" onClick={onCodex}>읽기 <Icon name="arrow" size={14} /></button>
                  </div>
                ))}
              </section>
            )}

            <section className="result-breakdown">
              <div><span>정확도</span><b>{result.totalCount > 0 ? Math.round((result.correctCount / result.totalCount) * 100) : 0}%</b></div>
              <div><span>힌트 사용</span><b>{result.hintsUsed}회</b></div>
              <div><span>소요 시간</span><b>{Math.floor(result.durationSec / 60)}분 {result.durationSec % 60}초</b></div>
              <div><span>별점</span><b>{result.stars} / 3</b></div>
            </section>
          </>
        ) : (
          <section className="result-retry-tips">
            <div className="retry-tip-head"><span>🧭</span><div><b>다시 도전할 때 기억하세요</b><p>정답을 서두르지 말고, 상황 조건과 안전 수칙을 먼저 읽어 보세요.</p></div></div>
            <ul>
              <li><span>1</span>상황 조건을 끝까지 읽고 가장 안전한 행동을 골라요.</li>
              <li><span>2</span>불이 크거나 연기가 많으면 장비보다 대피와 119 신고가 먼저예요.</li>
              <li><span>3</span>실제 상황에서는 현장 소방대원과 119 상담원의 안내를 따라요.</li>
            </ul>
          </section>
        )}

        <div className="result-actions">
          <GameButton variant="secondary" icon="reset" onClick={onRetry}>{failed ? '다시 도전' : '한 번 더'}</GameButton>
          {!failed && nextMission && (
            <GameButton variant="primary" icon="play" onClick={onNext}>다음 미션 · {nextMission.shortTitle}</GameButton>
          )}
          <GameButton variant="soft" icon="home" onClick={onCity}>도시로 돌아가기</GameButton>
          <GameButton variant="ghost" icon="mission" onClick={onMissions}>미션 목록</GameButton>
        </div>

        <p className="result-disclaimer">
          <Icon name="shield" size={14} /> 이 결과는 교육용 시뮬레이션 기록입니다. 실제 긴급상황에서는 119 신고와 현장 지시가 우선입니다.
        </p>
      </div>
    </div>
  )
}
