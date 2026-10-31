import { useMemo, useState } from 'react'
import type { BuildingDef, GameSave, MissionDef, ScreenName } from '../types'
import { buildingById, BUILDINGS } from '../data/city'
import { missionById, MISSIONS } from '../data/missions'
import { calculateSafetyIndex, getAvailableMissions, getLevelInfo, getSafetyGrade, getSkillScores, useGameStore } from '../store'
import { CityScene } from '../components/CityScene'
import { CityBuildingArt } from '../components/CityBuilding'
import { Mascot } from '../components/Mascot'
import { GameButton, IconButton, Modal, ProgressBar, Stars, toast } from '../components/UI'
import { Icon } from '../components/Icon'

export function CityScreen({
  save,
  onNavigate,
  onLaunch,
  onOpenBuild,
  recentlyBuilt,
}: {
  save: GameSave
  onNavigate: (screen: ScreenName) => void
  onLaunch: (mission: MissionDef) => void
  onOpenBuild: (buildingId?: string) => void
  recentlyBuilt?: string | null
}) {
  const [selected, setSelected] = useState<BuildingDef | null>(null)
  const store = useGameStore()
  const level = getLevelInfo(save.xp)
  const grade = getSafetyGrade(level.level)
  const safetyIndex = calculateSafetyIndex(save)
  const completedFire = MISSIONS.filter((mission) => mission.mode === 'fire' && save.missions[mission.id]?.completed).length
  const dailyProgress = save.daily.completedIds.length
  const dailyMissions = save.daily.missionIds.map((id) => missionById[id]).filter(Boolean)
  const firstDaily = dailyMissions.find((mission) => !save.daily.completedIds.includes(mission.id)) || dailyMissions[0]
  const skillScores = getSkillScores(save.stats)
  const coachTip = useMemo(() => {
    const entries = Object.entries(skillScores) as [keyof typeof skillScores, number][]
    const weakest = entries.sort((a, b) => a[1] - b[1])[0]
    const map: Record<string, string> = {
      prevention: '위험 찾기로 생활 속 불씨를 먼저 발견해 보세요.',
      evacuation: '화재탈출 챌린지에서 상황별 대피 판단을 연습해 보세요.',
      report: '119 신고 미션으로 위치와 인원 전달을 익혀 보세요.',
      firstAid: '응급처치 미션에서 골든타임 행동을 복습해 보세요.',
      equipment: '소화기와 AED 체험으로 장비 사용 순서를 익혀 보세요.',
    }
    return map[weakest[0]]
  }, [skillScores])

  const nextMission = useMemo(() => {
    const available = getAvailableMissions(save)
    return available.find(({ mission, unlocked }) => unlocked && !save.missions[mission.id]?.completed)?.mission || MISSIONS[0]
  }, [save])

  const handleUpgrade = () => {
    if (!selected) return
    const result = store.upgradeBuilding(selected.id)
    if (result.ok) {
      toast(result.message, 'success')
      const updatedBuilding = buildingById[selected.id]
      const current = useGameStore.getState().buildings[selected.id]
      setSelected({ ...updatedBuilding, name: selected.name })
      void current
    } else {
      toast(result.message, 'error')
    }
  }

  return (
    <div className="city-screen">
      <div className="city-topline">
        <div className="city-title-block">
          <span className="eyebrow">MAIN CITY</span>
          <h1>세이프시티 <span className="city-title-level">Lv.{level.level}</span></h1>
          <p>안녕하세요, <b>{save.playerName}</b> 지킴이님. 오늘도 도시가 기다리고 있어요.</p>
        </div>
        <div className="city-quick-stats">
          <div className="quick-stat">
            <span className="quick-icon coin-bg"><Icon name="coin" size={18} /></span>
            <div><b>{save.coins.toLocaleString()}</b><span>안전코인</span></div>
          </div>
          <div className="quick-stat">
            <span className="quick-icon flame-bg"><Icon name="flame" size={18} /></span>
            <div><b>{completedFire}/5</b><span>화재탈출</span></div>
          </div>
          <div className="quick-stat">
            <span className="quick-icon streak-bg"><Icon name="trophy" size={18} /></span>
            <div><b>{save.daily.streak}일</b><span>연속 챌린지</span></div>
          </div>
        </div>
      </div>

      <div className="city-main">
        <div className="city-overlay-card city-greeting-card">
          <div className="greeting-mascot"><Mascot name="fire" mood="happy" size={72} /></div>
          <div>
            <span className="overlay-label">오늘의 안전 브리핑</span>
            <b>{grade.emoji} {grade.name}</b>
            <div className="mini-xp">
              <ProgressBar value={level.current} max={level.needed} height={6} />
              <span>{level.current}/{level.needed} XP</span>
            </div>
          </div>
        </div>

        <div className="city-overlay-card safety-index-card">
          <span className="overlay-label">도시 안전지수</span>
          <div className="safety-gauge">
            <svg viewBox="0 0 100 64" aria-hidden="true">
              <path d="M12 57a38 38 0 0 1 76 0" fill="none" stroke="rgba(28,53,85,.1)" strokeWidth="9" strokeLinecap="round" />
              <path
                d="M12 57a38 38 0 0 1 76 0"
                fill="none"
                stroke="url(#safetyGrad)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray="119.4"
                strokeDashoffset={119.4 * (1 - safetyIndex / 100)}
              />
              <defs>
                <linearGradient id="safetyGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#45c98c" />
                  <stop offset="1" stopColor="#ffc73d" />
                </linearGradient>
              </defs>
            </svg>
            <strong>{safetyIndex}</strong>
            <span>/ 100</span>
          </div>
          <div className="safety-status">{safetyIndex >= 80 ? '아주 안전' : safetyIndex >= 60 ? '안전 성장 중' : '안전돌봄 필요'}</div>
          <button type="button" className="link-button" onClick={() => onNavigate('profile')}>자세히 <Icon name="chevron" size={14} /></button>
        </div>

        <CityScene
          save={save}
          onSelectBuilding={setSelected}
          onBuild={(id) => onOpenBuild(id)}
          recentlyBuilt={recentlyBuilt}
        />

        <div className="city-action-dock">
          <div className="daily-docket">
            <div className="daily-docket-top">
              <span className="daily-icon">📅</span>
              <div>
                <b>오늘의 안전 챌린지</b>
                <span>{dailyProgress}/3 완료 · {save.daily.streak}일 연속</span>
              </div>
              <div className="daily-dots">
                {[0, 1, 2].map((index) => <i key={index} className={index < dailyProgress ? 'done' : ''} />)}
              </div>
            </div>
            {firstDaily && (
              <button type="button" className="daily-mission-link" onClick={() => onLaunch(firstDaily)}>
                <span>{firstDaily.emoji}</span>
                <span className="daily-mission-text">
                  <b>{firstDaily.shortTitle}</b>
                  <small>{save.daily.completedIds.includes(firstDaily.id) ? '완료!' : '이어서 플레이'}</small>
                </span>
                <Icon name="chevron" size={16} />
              </button>
            )}
            {dailyProgress >= 3 && !save.daily.claimed && (
              <button type="button" className="daily-claim-strip" onClick={() => {
                const result = store.claimDaily()
                toast(result.message, result.ok ? 'success' : 'error')
              }}>
                보상 받기 +180 ₩
              </button>
            )}
          </div>

          <div className="next-mission-card">
            <span className="next-mission-label"><Icon name="spark" size={14} /> 다음 추천 미션</span>
            <div className="next-mission-main">
              <span className="next-mission-emoji" style={{ background: `linear-gradient(135deg, ${nextMission.accent}, ${nextMission.accent2})` }}>{nextMission.emoji}</span>
              <div>
                <b>{nextMission.title}</b>
                <span>{nextMission.subtitle}</span>
              </div>
            </div>
            <GameButton size="sm" variant="primary" trailingIcon="arrow" onClick={() => onLaunch(nextMission)}>
              출동하기
            </GameButton>
          </div>

          <div className="city-tip-line">
            <span className="coach-mini">🤖</span>
            <span><b>AI 안전코치</b> · {coachTip}</span>
            <IconButton icon="chevron" label="프로필에서 코치 보기" onClick={() => onNavigate('profile')} size={16} />
          </div>
        </div>

        <div className="city-floating-actions">
          <IconButton icon="mission" label="미션 센터" onClick={() => onNavigate('missions')} />
          <IconButton icon="build" label="도시 건설" onClick={() => onOpenBuild()} />
        </div>
      </div>

      <div className="city-bottom-hints">
        <span><Icon name="info" size={14} /> 건물을 눌러 미션과 업그레이드를 확인하세요.</span>
        <span className="desktop-only">건물 {Object.values(save.buildings).filter((b) => b.built).length}개 · 완료 미션 {Object.values(save.missions).filter((m) => m.completed).length}개</span>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        className="building-modal"
        hideClose
      >
        {selected && (
          <>
            <div className="building-modal-hero">
              <div className="building-hero-art">
                <CityBuildingArt building={selected} level={save.buildings[selected.id]?.level || 1} />
              </div>
              <div className="building-hero-info">
                <span className="eyebrow">CITY BUILDING</span>
                <h2>{selected.name}</h2>
                <div className="building-level-row">
                  <span className="level-chip">Lv.{save.buildings[selected.id]?.level || 1}</span>
                  <Stars value={Math.min(3, save.buildings[selected.id]?.level || 1)} size={17} />
                </div>
                <p>{selected.description}</p>
                <div className="benefit-box">
                  <Icon name="shield" size={18} />
                  <span>{selected.benefit}</span>
                </div>
              </div>
              <IconButton icon="close" label="닫기" onClick={() => setSelected(null)} className="modal-x-light" />
            </div>
            <div className="building-modal-body">
              <div className="building-mission-list">
                <h3>연결된 미션</h3>
                {selected.missions.map((missionId) => {
                  const mission = missionById[missionId]
                  if (!mission) return null
                  const progress = save.missions[missionId]
                  const isBuildingRequirement =
                    mission.requires?.building?.id === selected.id
                  const unlocked = save.settings.mode === 'educator' || progress?.completed || (() => {
                    if (mission.requires?.missionId && !save.missions[mission.requires.missionId]?.completed) return false
                    if (mission.requires?.building) {
                      const b = save.buildings[mission.requires.building.id]
                      if (!b?.built || b.level < mission.requires.building.level) return false
                    }
                    return true
                  })()
                  return (
                    <button
                      key={missionId}
                      type="button"
                      className={`building-mission-row ${unlocked ? '' : 'is-locked'}`}
                      onClick={() => {
                        if (!unlocked) {
                          toast(isBuildingRequirement ? '건물을 업그레이드하면 미션이 열려요.' : '선행 미션이 필요해요.', 'info')
                          return
                        }
                        setSelected(null)
                        onLaunch(mission)
                      }}
                    >
                      <span className="mission-row-emoji" style={{ background: `${mission.accent}1a` }}>{mission.emoji}</span>
                      <span className="mission-row-text">
                        <b>{mission.title}</b>
                        <small>{progress?.completed ? '완료 · 다시 도전 가능' : unlocked ? '플레이 가능' : isBuildingRequirement ? `Lv.${mission.requires?.building?.level} 업그레이드 필요` : '선행 미션 필요'}</small>
                      </span>
                      {progress?.completed ? <Stars value={progress.bestStars} size={15} /> : unlocked ? <Icon name="chevron" size={16} /> : <Icon name="lock" size={16} />}
                    </button>
                  )
                })}
              </div>
              <div className="building-upgrade-box">
                <h3>시설 관리</h3>
                <div className="upgrade-visual-row">
                  {[1, 2, 3].map((stage) => (
                    <span key={stage} className={stage <= (save.buildings[selected.id]?.level || 1) ? 'current' : ''}>{stage}</span>
                  ))}
                </div>
                <p>업그레이드하면 도시 안전지수 <b>+{selected.safetyPerLevel}</b>와 새로운 혜택이 적용됩니다.</p>
                {(save.buildings[selected.id]?.level || 1) < selected.maxLevel ? (
                  <GameButton
                    variant="gold"
                    full
                    icon="build"
                    onClick={handleUpgrade}
                    disabled={save.coins < Math.round(selected.upgradeCost * (1 + ((save.buildings[selected.id]?.level || 1) - 1) * 0.8))}
                  >
                    Lv.{((save.buildings[selected.id]?.level || 1) + 1)} 업그레이드 · ₩{Math.round(selected.upgradeCost * (1 + ((save.buildings[selected.id]?.level || 1) - 1) * 0.8)).toLocaleString()}
                  </GameButton>
                ) : (
                  <div className="max-level-note"><Icon name="check" size={17} /> 최고 레벨 시설입니다</div>
                )}
                <button type="button" className="modal-text-link" onClick={() => { setSelected(null); onNavigate('build') }}>
                  도시 건설 화면으로 <Icon name="arrow" size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
