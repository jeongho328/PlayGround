import { useEffect, useMemo, useRef, useState } from 'react'
import type { CompletionReport, GameSave, MissionDef, MissionResult, ScreenName } from './types'
import { useGameStore, hasSavedGame, getAvailableMissions, getLevelInfo, getSafetyGrade } from './store'
import { BADGES } from './data/city'
import { FIRE_STAGES } from './data/missions'
import { HAZARD_ROOMS } from './data/hazards'
import { EMERGENCY_SCENARIOS } from './data/missions'
import { audio, sfx } from './audio'
import { Icon, type IconName } from './components/Icon'
import { CoinPill, ToastHost, toast, ProgressBar } from './components/UI'
import { Mascot } from './components/Mascot'
import { TitleScreen } from './screens/TitleScreen'
import { CityScreen } from './screens/CityScreen'
import { MissionCenter } from './screens/MissionCenter'
import { BuildScreen } from './screens/BuildScreen'
import { CodexScreen } from './screens/CodexScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { MissionBrief } from './screens/MissionBrief'
import { ResultScreen } from './screens/ResultScreen'
import { FireEscapeGame } from './games/FireEscapeGame'
import { HazardHuntGame } from './games/HazardHuntGame'
import { ExtinguisherGame } from './games/ExtinguisherGame'
import { AedGame } from './games/AedGame'
import { CprGame } from './games/CprGame'
import { EmergencyCallGame } from './games/EmergencyCallGame'

type LastResult = {
  mission: MissionDef
  result: MissionResult
  report: CompletionReport
}

const NAV_ITEMS: { screen: ScreenName; label: string; icon: IconName }[] = [
  { screen: 'city', label: '도시', icon: 'home' },
  { screen: 'missions', label: '미션', icon: 'mission' },
  { screen: 'build', label: '건설', icon: 'build' },
  { screen: 'codex', label: '안전도감', icon: 'book' },
  { screen: 'profile', label: '프로필', icon: 'user' },
]

function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-label="세이프시티 119 불러오는 중">
      <div className="loading-sky" aria-hidden="true">
        <span className="loading-cloud lc1" />
        <span className="loading-cloud lc2" />
        <span className="loading-sun" />
      </div>
      <div className="loading-logo">
        <span className="loading-mark">119</span>
        <div>
          <b>SAFE CITY</b>
          <span>세이프시티 119</span>
        </div>
      </div>
      <div className="loading-road" aria-hidden="true">
        <span className="loading-truck">🚒</span>
        <span className="loading-road-line" />
      </div>
      <div className="loading-progress">
        <span />
      </div>
      <p className="loading-tip">오늘도 시민의 안전을 지킬 준비 중이에요</p>
      <p className="loading-disclaimer">교육용 콘텐츠 · 실제 긴급상황에서는 119</p>
    </div>
  )
}

function AppHeader({
  game,
  screen,
  onNavigate,
  onSettings,
  onToggleSound,
}: {
  game: GameSave
  screen: ScreenName
  onNavigate: (screen: ScreenName) => void
  onSettings: () => void
  onToggleSound: () => void
}) {
  const level = getLevelInfo(game.xp)
  const grade = getSafetyGrade(level.level)
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button type="button" className="app-brand" onClick={() => onNavigate('city')} aria-label="세이프시티 홈">
          <span className="app-brand-mark" aria-hidden="true">
            <span>🔥</span>
            <b>119</b>
          </span>
          <span className="app-brand-copy">
            <b>SAFE CITY <i>119</i></b>
            <small>세이프시티</small>
          </span>
        </button>

        <nav className="app-nav" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.screen}
              type="button"
              className={screen === item.screen ? 'is-active' : ''}
              onClick={() => onNavigate(item.screen)}
              aria-current={screen === item.screen ? 'page' : undefined}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="app-header-right">
          <div className="header-level" title={`${grade.name} · Lv.${level.level}`}>
            <span className="header-grade">{grade.emoji}</span>
            <div>
              <b>Lv.{level.level}</b>
              <ProgressBar value={level.current} max={level.needed} height={4} />
            </div>
          </div>
          <CoinPill value={game.coins} compact />
          <button type="button" className="header-icon-btn" onClick={onToggleSound} aria-label={game.settings.sound ? '소리 끄기' : '소리 켜기'} title={game.settings.sound ? '소리 끄기' : '소리 켜기'}>
            <Icon name={game.settings.sound ? 'sound' : 'mute'} size={19} />
          </button>
          <button type="button" className={`header-icon-btn ${screen === 'settings' ? 'is-active' : ''}`} onClick={onSettings} aria-label="설정" title="설정">
            <Icon name="settings" size={19} />
          </button>
          <button type="button" className="header-profile" onClick={() => onNavigate('profile')} aria-label="프로필 열기">
            <Mascot name="fire" mood="happy" size={29} />
          </button>
        </div>
      </div>
    </header>
  )
}

function MobileNav({
  screen,
  onNavigate,
  onSettings,
}: {
  screen: ScreenName
  onNavigate: (screen: ScreenName) => void
  onSettings: () => void
}) {
  return (
    <nav className="mobile-nav" aria-label="모바일 주요 메뉴">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.screen}
          type="button"
          className={screen === item.screen ? 'is-active' : ''}
          onClick={() => onNavigate(item.screen)}
          aria-current={screen === item.screen ? 'page' : undefined}
        >
          <Icon name={item.icon} size={21} />
          <span>{item.label}</span>
        </button>
      ))}
      <button type="button" className={screen === 'settings' ? 'is-active' : ''} onClick={onSettings}>
        <Icon name="settings" size={21} />
        <span>설정</span>
      </button>
    </nav>
  )
}

function MissionPlayer({
  mission,
  onComplete,
  onQuit,
}: {
  mission: MissionDef
  onComplete: (result: MissionResult) => void
  onQuit: () => void
}) {
  const stage = FIRE_STAGES[mission.id]
  const room = Object.values(HAZARD_ROOMS).find((item) => item.missionId === mission.id)
  const scenario = EMERGENCY_SCENARIOS[mission.id]

  if (mission.mode === 'fire' && stage) {
    return <FireEscapeGame key={mission.id} stage={stage} onComplete={onComplete} onQuit={onQuit} />
  }
  if (mission.mode === 'hazard' && room) {
    return <HazardHuntGame key={mission.id} room={room} onComplete={onComplete} onQuit={onQuit} />
  }
  if (mission.mode === 'equipment') {
    if (mission.equipment === 'aed') return <AedGame key={mission.id} onComplete={onComplete} onQuit={onQuit} />
    if (mission.equipment === 'cpr') return <CprGame key={mission.id} onComplete={onComplete} onQuit={onQuit} />
    return <ExtinguisherGame key={mission.id} onComplete={onComplete} onQuit={onQuit} />
  }
  if (mission.mode === 'call' && scenario) {
    return <EmergencyCallGame key={mission.id} scenario={scenario} onComplete={onComplete} onQuit={onQuit} />
  }

  return (
    <div className="mission-error screen-pad">
      <span>🧯</span>
      <h1>미션 콘텐츠를 불러오지 못했어요</h1>
      <p>잠시 후 다시 시도하거나 다른 미션을 선택해 주세요.</p>
      <button type="button" className="game-btn btn-primary btn-md" onClick={onQuit}>미션 목록으로</button>
    </div>
  )
}

export default function App() {
  const game = useGameStore()
  const save: GameSave = game
  const [screen, setScreen] = useState<ScreenName>('title')
  const [hasSave, setHasSave] = useState(false)
  const [booting, setBooting] = useState(true)
  const [brief, setBrief] = useState<MissionDef | null>(null)
  const [playing, setPlaying] = useState<MissionDef | null>(null)
  const [lastResult, setLastResult] = useState<LastResult | null>(null)
  const [recentlyBuilt, setRecentlyBuilt] = useState<string | null>(null)
  const [settingsFromTitle, setSettingsFromTitle] = useState(false)
  const completedRef = useRef(false)
  const builtTimer = useRef<number | null>(null)

  const level = getLevelInfo(save.xp)
  const grade = getSafetyGrade(level.level)

  useEffect(() => {
    setHasSave(hasSavedGame())
    const timer = window.setTimeout(() => setBooting(false), 720)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    audio.configure(save.settings.sound, save.settings.music)
  }, [save.settings.sound, save.settings.music])

  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(save.settings.textScale))
  }, [save.settings.textScale])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [screen])

  useEffect(() => {
    const titles: Partial<Record<ScreenName, string>> = {
      city: '도시',
      missions: '미션 센터',
      build: '도시 건설',
      codex: '안전도감',
      profile: '내 프로필',
      settings: '설정',
    }
    const label = titles[screen]
    document.title = label ? `${label} · 세이프시티 119` : '세이프시티 119 | SAFE CITY 119'
  }, [screen])

  useEffect(() => () => {
    if (builtTimer.current) window.clearTimeout(builtTimer.current)
  }, [])

  const navigate = (next: ScreenName) => {
    if (next === 'settings') setSettingsFromTitle(false)
    setScreen(next)
  }

  const startNewGame = (name: string) => {
    game.newGame(name)
    setHasSave(true)
    setSettingsFromTitle(false)
    setLastResult(null)
    setPlaying(null)
    setBrief(null)
    setScreen('city')
  }

  const openBrief = (mission: MissionDef) => {
    setBrief(mission)
  }

  const startMission = () => {
    if (!brief) return
    completedRef.current = false
    setPlaying(brief)
    setBrief(null)
    setLastResult(null)
    setScreen('mission')
  }

  const completeMission = (result: MissionResult) => {
    if (!playing || completedRef.current) return
    completedRef.current = true
    const report = game.completeMission(result)
    setLastResult({ mission: playing, result, report })
    setHasSave(true)
    setScreen('result')
    if (result.failed) sfx('wrong')
    else if (report.levelAfter > report.levelBefore) sfx('levelup')
    else sfx('success')
  }

  const quitMission = () => {
    completedRef.current = false
    setPlaying(null)
    setScreen('missions')
  }

  const claimDaily = () => {
    const result = game.claimDaily()
    toast(result.message, result.ok ? 'success' : 'error')
    if (result.ok) sfx('coin')
  }

  const handleBuilt = (id: string) => {
    setRecentlyBuilt(id)
    if (builtTimer.current) window.clearTimeout(builtTimer.current)
    builtTimer.current = window.setTimeout(() => setRecentlyBuilt(null), 4200)
  }

  const nextMission = useMemo(() => {
    const available = getAvailableMissions(save)
    return available.find((item) => item.unlocked && !save.missions[item.mission.id]?.completed)?.mission
  }, [save])

  if (booting && !game.hydrated) return <LoadingScreen />

  const settingsScreen = (
    <SettingsScreen
      save={save}
      onReset={() => {
        game.resetProgress()
        setHasSave(true)
        setScreen('city')
        toast('진행이 초기화되었어요. 새로운 도시를 시작해 보세요.', 'info')
      }}
      onNewGame={() => {
        game.resetProgress()
        setHasSave(true)
        setPlaying(null)
        setLastResult(null)
        setScreen('title')
      }}
    />
  )

  if (screen === 'title') {
    return (
      <div className={`app app-mode-${save.settings.mode} ${save.settings.reducedMotion ? 'reduced-motion' : ''}`}>
        <TitleScreen
          save={save}
          hasSave={hasSave}
          onContinue={() => {
            setHasSave(true)
            setScreen('city')
          }}
          onNewGame={startNewGame}
          onSettings={() => {
            setSettingsFromTitle(true)
            setScreen('settings')
          }}
        />
        <ToastHost />
      </div>
    )
  }

  if (screen === 'settings' && !hasSave) {
    return (
      <div className={`app app-mode-${save.settings.mode} ${save.settings.reducedMotion ? 'reduced-motion' : ''}`}>
        <div className="standalone-bar">
          <button type="button" onClick={() => setScreen('title')}>
            <Icon name="back" size={18} /> 시작 화면
          </button>
          <span>세이프시티 119 설정</span>
        </div>
        {settingsScreen}
        <ToastHost />
      </div>
    )
  }

  if (screen === 'mission' && playing) {
    return (
      <div className={`app app-game app-mode-${save.settings.mode} ${save.settings.reducedMotion ? 'reduced-motion' : ''}`}>
        <MissionPlayer mission={playing} onComplete={completeMission} onQuit={quitMission} />
        <ToastHost />
      </div>
    )
  }

  if (screen === 'result' && lastResult) {
    return (
      <div className={`app app-game app-mode-${save.settings.mode} ${save.settings.reducedMotion ? 'reduced-motion' : ''}`}>
        <ResultScreen
          mission={lastResult.mission}
          result={lastResult.result}
          report={lastResult.report}
          nextMission={nextMission}
          onRetry={() => {
            completedRef.current = false
            setScreen('mission')
          }}
          onNext={() => {
            if (!nextMission) {
              setScreen('missions')
              return
            }
            setBrief(nextMission)
            setScreen('missions')
          }}
          onCity={() => setScreen('city')}
          onMissions={() => setScreen('missions')}
          onCodex={() => setScreen('codex')}
        />
        <ToastHost />
      </div>
    )
  }

  return (
    <div className={`app app-mode-${save.settings.mode} ${save.settings.reducedMotion ? 'reduced-motion' : ''}`}>
      <AppHeader
        game={save}
        screen={screen}
        onNavigate={navigate}
        onSettings={() => {
          setSettingsFromTitle(false)
          setScreen('settings')
        }}
        onToggleSound={() => {
          const next = !save.settings.sound
          game.updateSettings({ sound: next })
          if (next) sfx('correct')
          toast(next ? '효과음을 켰어요.' : '효과음을 껐어요.', 'info')
        }}
      />

      <main className="app-main">
        {screen === 'city' && (
          <CityScreen
            save={save}
            onNavigate={navigate}
            onLaunch={openBrief}
            onOpenBuild={() => setScreen('build')}
            recentlyBuilt={recentlyBuilt}
          />
        )}
        {screen === 'missions' && <MissionCenter save={save} onLaunch={openBrief} onDailyReward={claimDaily} />}
        {screen === 'build' && <BuildScreen save={save} onNavigate={navigate} onBuilt={handleBuilt} />}
        {screen === 'codex' && <CodexScreen save={save} />}
        {screen === 'profile' && <ProfileScreen save={save} onLaunch={openBrief} onNavigateSettings={() => setScreen('settings')} />}
        {screen === 'settings' && (
          <div className="settings-with-shell">
            {settingsFromTitle && (
              <div className="inline-back-row">
                <button type="button" onClick={() => setScreen('title')}><Icon name="back" size={16} /> 시작 화면으로</button>
              </div>
            )}
            {settingsScreen}
          </div>
        )}
      </main>

      <MobileNav
        screen={screen}
        onNavigate={navigate}
        onSettings={() => {
          setSettingsFromTitle(false)
          setScreen('settings')
        }}
      />

      <footer className="app-footer">
        <span>© SAFE CITY 119 · 소방안전 교육 웹게임</span>
        <span><Icon name="info" size={13} /> 실제 긴급상황에서는 119 신고가 우선입니다.</span>
        <span className="footer-save"><i /> 자동 저장됨 · {grade.name} Lv.{level.level} · 배지 {Object.keys(save.badges).length}/{BADGES.length}</span>
      </footer>

      <MissionBrief
        open={Boolean(brief)}
        mission={brief}
        save={save}
        onClose={() => setBrief(null)}
        onStart={startMission}
      />

      <ToastHost />
    </div>
  )
}
