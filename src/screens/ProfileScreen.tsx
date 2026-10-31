import { useMemo } from 'react'
import type { GameSave, MissionDef, SkillKey } from '../types'
import { BADGES } from '../data/city'
import { MISSIONS } from '../data/missions'
import { calculateSafetyIndex, getAvailableMissions, getLevelInfo, getSafetyGrade, getSkillScores } from '../store'
import { GameButton, MascotBubble, ProgressBar, ScreenHeader, Stars } from '../components/UI'
import { Mascot } from '../components/Mascot'
import { Icon } from '../components/Icon'

const SKILL_META: Record<SkillKey, { label: string; short: string; icon: string; color: string }> = {
  prevention: { label: '화재예방 이해도', short: '예방', icon: '🛡️', color: '#f6a935' },
  evacuation: { label: '화재대피 판단력', short: '대피', icon: '🚪', color: '#f26b4b' },
  report: { label: '119 신고 능력', short: '신고', icon: '☎️', color: '#3a99df' },
  firstAid: { label: '응급처치 이해도', short: '응급', icon: '🫀', color: '#ef5b7b' },
  equipment: { label: '안전장비 이해도', short: '장비', icon: '🧯', color: '#2cc0a7' },
}

export function ProfileScreen({
  save,
  onLaunch,
  onNavigateSettings,
}: {
  save: GameSave
  onLaunch: (mission: MissionDef) => void
  onNavigateSettings: () => void
}) {
  const level = getLevelInfo(save.xp)
  const grade = getSafetyGrade(level.level)
  const skills = getSkillScores(save.stats)
  const safetyIndex = calculateSafetyIndex(save)
  const weakest = useMemo(() => (Object.entries(skills) as [SkillKey, number][]).sort((a, b) => a[1] - b[1])[0], [skills])
  const strongest = useMemo(() => (Object.entries(skills) as [SkillKey, number][]).sort((a, b) => b[1] - a[1])[0], [skills])
  const recommended = useMemo(() => {
    const modeMap: Record<SkillKey, MissionDef['mode'][]> = {
      prevention: ['hazard'],
      evacuation: ['fire'],
      report: ['call'],
      firstAid: ['equipment', 'call'],
      equipment: ['equipment'],
    }
    const available = getAvailableMissions(save).filter((entry) => entry.unlocked).map((entry) => entry.mission)
    const candidates = available.filter((mission) => modeMap[weakest[0]].includes(mission.mode))
    return candidates.find((mission) => !save.missions[mission.id]?.completed) || candidates[0] || available[0] || MISSIONS[0]
  }, [weakest, save])
  const accuracy = save.stats.decisions > 0 ? Math.round((save.stats.correct / save.stats.decisions) * 100) : 0
  const totalStars = Object.values(save.missions).reduce((sum, mission) => sum + mission.bestStars, 0)
  const earnedBadges = Object.entries(save.badges)

  const radarPoints = (Object.keys(SKILL_META) as SkillKey[]).map((key, index) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2
    const value = skills[key] / 100
    return { x: 110 + Math.cos(angle) * 80 * value, y: 110 + Math.sin(angle) * 80 * value, axisX: 110 + Math.cos(angle) * 92, axisY: 110 + Math.sin(angle) * 92, angle, key }
  })
  const polygon = radarPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const grid = [1, 0.66, 0.33].map((ratio) =>
    (Object.keys(SKILL_META) as SkillKey[])
      .map((_, index) => {
        const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2
        return `${110 + Math.cos(angle) * 80 * ratio},${110 + Math.sin(angle) * 80 * ratio}`
      })
      .join(' '),
  )

  const coachMessage = () => {
    if (save.stats.decisions === 0) {
      return '첫 미션을 플레이하면 나의 안전 역량을 분석해 드려요. 화재탈출 미션부터 시작해 볼까요?'
    }
    const strong = SKILL_META[strongest[0]].label
    const weak = SKILL_META[weakest[0]].label
    if (strongest[1] === weakest[1]) {
      return '모든 안전 분야를 고르게 경험하고 있어요. 이제 실제 상황처럼 여러 판단을 이어서 연습해 보세요.'
    }
    return `${strong}은 ${strongest[1]}점으로 아주 좋아요! 다만 ${weak}은 ${weakest[1]}점이에요. “${recommended.shortTitle}” 미션으로 조금 더 연습해 볼까요?`
  }

  return (
    <div className="profile-screen screen-pad">
      <ScreenHeader
        eyebrow="MY SAFETY PROFILE"
        title="안전지킴이 프로필"
        subtitle="나의 성장 기록과 안전 역량을 확인해 보세요."
        right={<GameButton variant="soft" size="sm" icon="settings" onClick={onNavigateSettings}>프로필 설정</GameButton>}
      />

      <div className="profile-layout">
        <section className="profile-hero-card">
          <div className="profile-card-bg" aria-hidden="true">
            <span className="profile-bg-circle c1" /><span className="profile-bg-circle c2" />
            <span className="profile-bg-star s1">✦</span><span className="profile-bg-star s2">✦</span>
          </div>
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-ring"><Mascot name="fire" mood="cheer" size={126} /></div>
            <span className="profile-grade-badge">{grade.emoji}</span>
          </div>
          <div className="profile-identity">
            <span className="profile-grade-name">{grade.name}</span>
            <h2>{save.playerName} <small>Lv.{level.level}</small></h2>
            <p>세이프시티 공식 안전지킴이</p>
            <div className="profile-xp">
              <div className="profile-xp-labels"><span>다음 레벨까지</span><b>{level.current} / {level.needed} XP</b></div>
              <ProgressBar value={level.current} max={level.needed} height={10} />
            </div>
            <div className="profile-mini-badges">
              {BADGES.map((badge) => (
                <span key={badge.id} className={`mini-badge ${save.badges[badge.id] ? 'earned' : ''}`} title={badge.name}>{badge.emoji}</span>
              ))}
            </div>
          </div>
          <div className="profile-quick-stats">
            <div><b>{safetyIndex}</b><span>안전지수</span></div>
            <div><b>{accuracy}%</b><span>판단 정확도</span></div>
            <div><b>{save.daily.streak}</b><span>연속 출동</span></div>
          </div>
        </section>

        <section className="coach-card">
          <div className="coach-head">
            <div className="coach-avatar">🤖</div>
            <div>
              <span className="eyebrow">AI SAFETY COACH</span>
              <h3>안전코치의 분석</h3>
            </div>
            <span className="coach-online">분석 완료</span>
          </div>
          <div className="coach-speech">
            <MascotBubble name="safi">
              {coachMessage()}
            </MascotBubble>
          </div>
          <div className="coach-recommend">
            <span className="coach-rec-icon">{recommended.emoji}</span>
            <div><span>다음 추천 훈련</span><b>{recommended.title}</b></div>
            <button type="button" onClick={() => onLaunch(recommended)} aria-label="추천 미션 시작"><Icon name="arrow" size={18} /></button>
          </div>
          <div className="coach-note">
            <Icon name="info" size={14} />
            규칙 기반 분석 · 검수된 교육 데이터 범위 안에서 안내합니다.
          </div>
        </section>

        <section className="skill-card">
          <div className="skill-card-head">
            <div><span className="eyebrow">SKILL ANALYSIS</span><h3>안전 역량 분석</h3></div>
            <span className="skill-sample">답변 {save.stats.decisions}개 기준</span>
          </div>
          <div className="skill-chart-wrap">
            <svg className="radar-chart" viewBox="0 0 220 220" role="img" aria-label="안전 역량 레이더 차트">
              {grid.map((points, index) => <polygon key={index} points={points} fill="none" stroke="#dce7e4" strokeWidth="1" />)}
              {radarPoints.map((point) => (
                <line key={point.key} x1="110" y1="110" x2={110 + Math.cos(point.angle) * 80} y2={110 + Math.sin(point.angle) * 80} stroke="#dce7e4" strokeWidth="1" />
              ))}
              <polygon points={polygon} fill="rgba(51,184,160,.18)" stroke="#2cb79f" strokeWidth="2.5" strokeLinejoin="round" />
              {radarPoints.map((point) => (
                <g key={point.key}>
                  <circle cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#2cb79f" strokeWidth="2" />
                  <text x={point.axisX} y={point.axisY} textAnchor="middle" dominantBaseline="middle" fontSize="10.5" fontWeight="700" fill="#657c89">{SKILL_META[point.key].short}</text>
                </g>
              ))}
            </svg>
            <div className="skill-bars">
              {(Object.keys(SKILL_META) as SkillKey[]).map((key) => (
                <div className="skill-bar-row" key={key}>
                  <span className="skill-label"><i>{SKILL_META[key].icon}</i>{SKILL_META[key].label}</span>
                  <div className="skill-bar-track"><span style={{ width: `${skills[key]}%`, background: SKILL_META[key].color }} /></div>
                  <b>{skills[key]}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="badge-collection">
          <div className="badge-head">
            <div><span className="eyebrow">ACHIEVEMENTS</span><h3>안전 배지 <small>{earnedBadges.length}/{BADGES.length}</small></h3></div>
            <span className="badge-sub">특별한 안전 행동을 완료해 보세요</span>
          </div>
          <div className="badge-grid">
            {BADGES.map((badge) => {
              const earnedAt = save.badges[badge.id]
              return (
                <div key={badge.id} className={`badge-item ${earnedAt ? 'earned' : 'locked'}`}>
                  <div className="badge-medal" style={{ background: earnedAt ? badge.color : '#e8ecec' }}>
                    <span>{badge.emoji}</span>
                    {!earnedAt && <i className="badge-lock"><Icon name="lock" size={15} /></i>}
                  </div>
                  <div className="badge-info">
                    <b>{badge.name}</b>
                    <p>{badge.description}</p>
                    <span>{earnedAt ? `${new Date(earnedAt).toLocaleDateString('ko-KR')} 획득` : badge.condition}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="stats-card">
          <div className="stats-head"><span className="eyebrow">PLAY STATISTICS</span><h3>활동 기록</h3></div>
          <div className="stats-grid">
            <div><span>총 미션</span><b>{save.stats.missionsPlayed}</b><small>회 도전</small></div>
            <div><span>완료한 미션</span><b>{save.stats.missionsCompleted}</b><small>개</small></div>
            <div><span>발견한 위험</span><b>{save.stats.hazardsFound}</b><small>개</small></div>
            <div><span>119 신고</span><b>{save.stats.callsMade}</b><small>회</small></div>
            <div><span>총 획득 별</span><b>{totalStars}</b><small>/45</small></div>
            <div><span>정확한 판단</span><b>{save.stats.correct}</b><small>/{save.stats.decisions}</small></div>
          </div>
          <div className="stats-tip"><Icon name="info" size={15} /> 미션은 언제든 다시 플레이할 수 있어요. 오답도 학습 기록에 포함됩니다.</div>
        </section>

        <section className="profile-mission-history">
          <div className="history-head"><div><span className="eyebrow">RECENT MISSIONS</span><h3>최근 도전</h3></div></div>
          {save.history.length === 0 ? (
            <div className="empty-state small"><span>🚒</span><p>첫 출동 기록을 만들어 보세요.</p></div>
          ) : (
            <div className="profile-history-rows">
              {[...save.history].reverse().slice(0, 4).map((record, index) => {
                const mission = MISSIONS.find((item) => item.id === record.missionId)
                return (
                  <div key={`${record.at}-${index}`} className="profile-history-row">
                    <span className="phr-icon">{mission?.emoji}</span>
                    <div><b>{mission?.title || record.missionId}</b><span>{new Date(record.at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span></div>
                    <Stars value={record.stars} size={14} />
                    <b className="phr-score">{record.score}</b>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
