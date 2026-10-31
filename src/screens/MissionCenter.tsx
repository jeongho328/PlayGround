import { useMemo, useState } from 'react'
import type { GameSave, MissionDef, MissionMode } from '../types'
import { MISSION_GROUPS, MISSIONS } from '../data/missions'
import { getAvailableMissions } from '../store'
import { GameButton, ProgressBar, Stars } from '../components/UI'
import { Icon } from '../components/Icon'

const FILTERS: { id: 'all' | MissionMode; label: string; icon: string }[] = [
  { id: 'all', label: '전체', icon: '✦' },
  ...MISSION_GROUPS.map((group) => ({ id: group.mode, label: group.label, icon: group.icon })),
]

export function MissionCenter({
  save,
  onLaunch,
  onDailyReward,
}: {
  save: GameSave
  onLaunch: (mission: MissionDef) => void
  onDailyReward: () => void
}) {
  const [filter, setFilter] = useState<'all' | MissionMode>('all')
  const available = getAvailableMissions(save)
  const completedCount = Object.values(save.missions).filter((mission) => mission.completed).length
  const totalStars = Object.values(save.missions).reduce((sum, mission) => sum + mission.bestStars, 0)
  const daily = save.daily.missionIds.map((id) => MISSIONS.find((mission) => mission.id === id)).filter(Boolean) as MissionDef[]
  const list = useMemo(
    () => available.filter(({ mission }) => filter === 'all' || mission.mode === filter),
    [available, filter],
  )
  const featured = available.find(({ mission }) => mission.id === 'fire-1')?.mission || MISSIONS[0]

  return (
    <div className="mission-center screen-pad">
      <div className="mission-center-head">
        <div>
          <span className="eyebrow">MISSION CENTER</span>
          <h1>오늘은 어떤 안전을 지킬까요?</h1>
          <p>상황을 읽고 스스로 판단하는 힘, 세이프시티 미션에서 키워 보세요.</p>
        </div>
        <div className="mission-summary-card">
          <div className="summary-stat"><span>완료 미션</span><b>{completedCount}<i>/{MISSIONS.length}</i></b></div>
          <div className="summary-divider" />
          <div className="summary-stat"><span>획득 별</span><b>{totalStars}<i>/45</i></b></div>
          <div className="summary-divider" />
          <div className="summary-stat streak"><span>연속 출동</span><b>{save.daily.streak}<i>일</i></b></div>
        </div>
      </div>

      <section className="daily-mission-banner">
        <div className="daily-banner-left">
          <span className="daily-calendar">
            <b>{new Date().getDate()}</b>
            <small>{new Date().toLocaleDateString('ko-KR', { month: 'short' })}</small>
          </span>
          <div>
            <span className="eyebrow">DAILY SAFETY QUEST</span>
            <h2>오늘의 안전 챌린지</h2>
            <p>3개를 완료하면 <b>180 안전코인</b>과 <b>70 XP</b>를 받아요.</p>
          </div>
        </div>
        <div className="daily-banner-missions">
          {daily.map((mission) => {
            const done = save.daily.completedIds.includes(mission.id)
            const isUnlocked = available.find((item) => item.mission.id === mission.id)?.unlocked
            return (
              <button key={mission.id} type="button" className={`daily-chip ${done ? 'is-done' : ''}`} onClick={() => isUnlocked && onLaunch(mission)}>
                <span>{done ? '✓' : mission.emoji}</span>
                <b>{mission.shortTitle}</b>
                {!done && isUnlocked && <Icon name="play" size={12} />}
                {!isUnlocked && <Icon name="lock" size={12} />}
              </button>
            )
          })}
        </div>
        <div className="daily-banner-reward">
          <div className="daily-progress-copy">
            <b>{save.daily.completedIds.length}/3</b>
            <span>{save.daily.claimed ? '보상 수령 완료' : save.daily.completedIds.length >= 3 ? '보상 받을 수 있어요!' : '미션 진행 중'}</span>
          </div>
          <ProgressBar value={save.daily.completedIds.length} max={3} color="#ffcf4a" height={8} />
          <GameButton
            variant={save.daily.claimed ? 'soft' : 'gold'}
            size="sm"
            onClick={onDailyReward}
            disabled={save.daily.claimed || save.daily.completedIds.length < 3}
          >
            {save.daily.claimed ? '오늘 완료' : '보상 받기'}
          </GameButton>
        </div>
      </section>

      {save.settings.mode === 'educator' && (
        <div className="educator-open-banner">
          <Icon name="spark" size={18} />
          <span><b>교육자 모드</b>가 켜져 있어 모든 미션이 개방됩니다. 수업 시연에 활용해 보세요.</span>
        </div>
      )}

      <section className="featured-mission" style={{ '--accent': featured.accent, '--accent2': featured.accent2 } as React.CSSProperties}>
        <div className="featured-copy">
          <span className="eyebrow"><Icon name="flame" size={14} /> 이번 주 추천 미션</span>
          <h2>{featured.title}</h2>
          <p>{featured.description}</p>
          <div className="featured-meta">
            <span><Icon name="clock" size={15} /> {featured.minutes}</span>
            <span><Icon name="mission" size={15} /> {featured.steps}단계</span>
            <span>난이도 {'●'.repeat(featured.difficulty)}{'○'.repeat(3 - featured.difficulty)}</span>
            <span className="reward-mini">₩ {featured.rewards.coins}</span>
          </div>
          <GameButton variant="primary" icon="play" onClick={() => onLaunch(featured)}>미션 시작</GameButton>
        </div>
        <div className="featured-art" aria-hidden="true">
          <div className="featured-sun" />
          <div className="featured-building">
            <span className="fb-window" /><span className="fb-door" /><span className="fb-smoke one" /><span className="fb-smoke two" />
            <span className="fb-flame">🔥</span>
          </div>
          <div className="featured-mascot">🧑‍🚒</div>
          <span className="featured-blob blob-one" />
          <span className="featured-blob blob-two" />
        </div>
      </section>

      <div className="mission-filter-row">
        <div className="mission-filters" role="tablist" aria-label="미션 종류">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`filter-chip ${filter === item.id ? 'is-active' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              <span>{item.icon}</span>{item.label}
              <small>{item.id === 'all' ? MISSIONS.length : MISSIONS.filter((mission) => mission.mode === item.id).length}</small>
            </button>
          ))}
        </div>
        <span className="mission-sort-note">진행도 순 · 추천</span>
      </div>

      <div className="mission-grid">
        {list.map(({ mission, unlocked, reasons }) => {
          const progress = save.missions[mission.id]
          const isDaily = save.daily.missionIds.includes(mission.id) && !save.daily.completedIds.includes(mission.id)
          return (
            <article key={mission.id} className={`mission-card ${!unlocked ? 'is-locked' : ''} ${progress?.completed ? 'is-complete' : ''}`}>
              <div className="mission-card-art" style={{ background: `linear-gradient(145deg, ${mission.accent}, ${mission.accent2})` }}>
                <span className="mission-card-emoji">{mission.emoji}</span>
                <span className="mission-art-hill hill-one" />
                <span className="mission-art-hill hill-two" />
                <span className="mission-art-spark s1">✦</span>
                <span className="mission-art-spark s2">✦</span>
                <span className="mission-card-tag">{mission.category}</span>
                {isDaily && <span className="mission-daily-tag">오늘의 챌린지</span>}
                {progress?.completed && <span className="mission-complete-ribbon"><Icon name="check" size={12} /> 완료</span>}
                {!unlocked && (
                  <span className="mission-lock-overlay">
                    <Icon name="lock" size={26} />
                    <small>{reasons.join(' · ')}</small>
                  </span>
                )}
              </div>
              <div className="mission-card-body">
                <div className="mission-card-title-row">
                  <div>
                    <h3>{mission.title}</h3>
                    <p>{mission.subtitle}</p>
                  </div>
                  {progress?.completed && <Stars value={progress.bestStars} size={16} />}
                </div>
                <div className="mission-card-meta">
                  <span><Icon name="clock" size={13} /> {mission.minutes}</span>
                  <span><Icon name="spark" size={13} /> {mission.steps}단계</span>
                  <span className={`difficulty d-${mission.difficulty}`}>{'●'.repeat(mission.difficulty)}{'○'.repeat(3 - mission.difficulty)}</span>
                </div>
                <div className="mission-card-footer">
                  <div className="mission-rewards">
                    <span className="reward coin">₩ {mission.rewards.coins}</span>
                    <span className="reward xp">+{mission.rewards.xp} XP</span>
                  </div>
                  <GameButton
                    size="sm"
                    variant={unlocked ? (progress?.completed ? 'soft' : 'primary') : 'ghost'}
                    onClick={() => unlocked && onLaunch(mission)}
                    disabled={!unlocked}
                    icon={unlocked ? 'play' : 'lock'}
                  >
                    {unlocked ? (progress?.completed ? '다시 도전' : '출동') : '잠김'}
                  </GameButton>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
