import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  BuildingState,
  CompletionReport,
  DailyState,
  GameMode,
  GameSave,
  MissionResult,
  PlayerStats,
  Settings,
  SkillKey,
} from './types'
import { BUILDINGS, BADGES, DAILY_POOL, DAILY_STARTER_POOL, dailyMissionsForDate } from './data/city'
import { MISSIONS, missionById } from './data/missions'

const SAVE_KEY = 'safe-city-119-save-v1'
const SAVE_VERSION = 1
const TODAY = () => new Date().toLocaleDateString('sv-SE')

export function xpNeededForLevel(level: number): number {
  return 100 + (level - 1) * 70
}

export function getLevelInfo(xp: number) {
  let level = 1
  let remaining = Math.max(0, xp)
  let needed = xpNeededForLevel(level)
  while (remaining >= needed) {
    remaining -= needed
    level += 1
    needed = xpNeededForLevel(level)
  }
  return { level, current: remaining, needed, progress: Math.min(1, remaining / needed) }
}

export function getSafetyGrade(level: number): { name: string; short: string; emoji: string; next: number } {
  if (level >= 20) return { name: '119 히어로', short: '히어로', emoji: '🦸', next: 20 }
  if (level >= 15) return { name: '안전 마스터', short: '마스터', emoji: '🏅', next: 20 }
  if (level >= 10) return { name: '안전 요원', short: '요원', emoji: '🛡️', next: 15 }
  if (level >= 5) return { name: '안전 탐험가', short: '탐험가', emoji: '🧭', next: 10 }
  return { name: '안전 새싹', short: '새싹', emoji: '🌱', next: 5 }
}

export function calculateSafetyIndex(save: GameSave): number {
  const buildingScore = BUILDINGS.reduce((sum, building) => {
    const state = save.buildings[building.id]
    if (!state?.built) return sum
    return sum + state.level * building.safetyPerLevel
  }, 0)
  const missionScore = Object.values(save.missions).reduce((sum, m) => sum + (m.bestStars || 0) * 1.2, 0)
  return Math.min(99, Math.round(18 + buildingScore * 0.82 + missionScore))
}

export function getSkillScores(stats: PlayerStats): Record<SkillKey, number> {
  const base: Record<SkillKey, number> = {
    prevention: 42,
    evacuation: 42,
    report: 42,
    firstAid: 42,
    equipment: 42,
  }
  ;(Object.keys(base) as SkillKey[]).forEach((key) => {
    const item = stats.skill[key]
    if (item.total > 0) {
      base[key] = Math.round(35 + (item.correct / item.total) * 65)
    }
  })
  return base
}

export function hasCompletedAll(missions: Record<string, { completed: boolean }>, ids: string[]) {
  return ids.every((id) => missions[id]?.completed)
}

function initialDaily(): DailyState {
  const date = TODAY()
  return {
    date,
    missionIds: dailyMissionsForDate(date, DAILY_STARTER_POOL),
    completedIds: [],
    claimed: false,
    streak: 0,
    totalClaims: 0,
  }
}

function initialBuildings(): Record<string, BuildingState> {
  const result: Record<string, BuildingState> = {}
  BUILDINGS.forEach((building) => {
    result[building.id] = { built: building.initial, level: 1 }
  })
  return result
}

function initialStats(): PlayerStats {
  return {
    missionsPlayed: 0,
    missionsCompleted: 0,
    totalScore: 0,
    decisions: 0,
    correct: 0,
    hints: 0,
    fireMissions: 0,
    hazardsFound: 0,
    callsMade: 0,
    cprSessions: 0,
    timePlayedSec: 0,
    skill: {
      prevention: { correct: 0, total: 0 },
      evacuation: { correct: 0, total: 0 },
      report: { correct: 0, total: 0 },
      firstAid: { correct: 0, total: 0 },
      equipment: { correct: 0, total: 0 },
    },
  }
}

function initialSettings(): Settings {
  return {
    sound: true,
    music: true,
    reducedMotion: false,
    textScale: 1,
    mode: 'general',
  }
}

export function createInitialSave(playerName = '안전지킴이', started = false): GameSave {
  const now = new Date().toISOString()
  return {
    version: SAVE_VERSION,
    started,
    playerName,
    xp: 0,
    coins: 180,
    createdAt: now,
    updatedAt: now,
    buildings: initialBuildings(),
    missions: {},
    badges: {},
    knowledge: [],
    daily: initialDaily(),
    settings: initialSettings(),
    stats: initialStats(),
    history: [],
  }
}

interface GameStore extends GameSave {
  hydrated: boolean
  setHydrated: (value: boolean) => void
  newGame: (name?: string) => void
  renamePlayer: (name: string) => void
  completeMission: (result: MissionResult) => CompletionReport
  unlockKnowledge: (id: string) => void
  ensureDaily: () => void
  claimDaily: () => { ok: boolean; coins: number; xp: number; message: string }
  buildBuilding: (id: string) => { ok: boolean; message: string }
  upgradeBuilding: (id: string) => { ok: boolean; message: string }
  updateSettings: (patch: Partial<Settings>) => void
  setMode: (mode: GameMode) => void
  resetProgress: () => void
  addCoins: (amount: number) => void
}

function evaluateBadges(save: GameSave): string[] {
  const earned: string[] = []
  const add = (id: string) => {
    if (!save.badges[id]) earned.push(id)
  }
  const fireIds = MISSIONS.filter((mission) => mission.mode === 'fire').map((mission) => mission.id)
  const hazardIds = MISSIONS.filter((mission) => mission.mode === 'hazard').map((mission) => mission.id)
  const callIds = MISSIONS.filter((mission) => mission.mode === 'call').map((mission) => mission.id)

  if (hasCompletedAll(save.missions, fireIds)) add('fire-king')
  if (hasCompletedAll(save.missions, hazardIds)) add('hazard-detective')
  if (callIds.every((id) => (save.missions[id]?.bestStars || 0) >= 2)) add('call-master')
  if (['equip-aed', 'equip-cpr'].every((id) => (save.missions[id]?.bestStars || 0) >= 2)) add('first-aid-master')
  if (Object.values(save.buildings).filter((building) => building.built).length >= 8) add('city-builder')
  if (save.daily.streak >= 7) add('seven-day')
  return earned
}

function ensureDailyState(daily: DailyState, save?: GameSave): DailyState {
  const today = TODAY()
  if (daily.date === today) return daily
  const eligible = save
    ? getAvailableMissions(save).filter((entry) => entry.unlocked).map((entry) => entry.mission.id)
    : DAILY_STARTER_POOL
  return {
    ...daily,
    date: today,
    missionIds: dailyMissionsForDate(today, eligible),
    completedIds: [],
    claimed: false,
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialSave(),
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      newGame: (name = '안전지킴이') => {
        const save = createInitialSave(name.trim() || '안전지킴이', true)
        set({ ...save, hydrated: true })
      },
      renamePlayer: (name) => {
        const trimmed = name.trim().slice(0, 12)
        if (!trimmed) return
        set({ playerName: trimmed, updatedAt: new Date().toISOString() })
      },
      completeMission: (result) => {
        const before = get()
        const levelBefore = getLevelInfo(before.xp).level
        const mission = missionById[result.missionId]
        if (!mission) {
          return {
            xpGained: 0,
            coinsGained: 0,
            stars: 0,
            newBest: false,
            levelBefore,
            levelAfter: levelBefore,
            newBadges: [],
            newKnowledge: [],
            isReplay: false,
          }
        }

        if (result.failed) {
          set({
            stats: { ...before.stats, missionsPlayed: before.stats.missionsPlayed + 1, timePlayedSec: before.stats.timePlayedSec + result.durationSec },
            updatedAt: new Date().toISOString(),
          })
          return {
            xpGained: 0,
            coinsGained: 0,
            stars: 0,
            newBest: false,
            levelBefore,
            levelAfter: levelBefore,
            newBadges: [],
            newKnowledge: [],
            isReplay: Boolean(before.missions[result.missionId]?.completed),
          }
        }

        const daily = ensureDailyState(before.daily, before)
        const previous = before.missions[result.missionId]
        const isReplay = Boolean(previous?.completed)
        const stars = Math.max(1, Math.min(3, result.stars))
        const factor = isReplay ? 0.3 : 1
        const coinsGained = Math.round((mission.rewards.coins + stars * 15) * factor)
        const xpGained = Math.round((mission.rewards.xp + stars * 10) * factor)
        const newBest = !previous || stars > previous.bestStars || result.score > previous.bestScore
        const nextMissions = {
          ...before.missions,
          [result.missionId]: {
            completed: true,
            bestScore: Math.max(previous?.bestScore || 0, result.score),
            bestStars: Math.max(previous?.bestStars || 0, stars),
            attempts: (previous?.attempts || 0) + 1,
            completions: (previous?.completions || 0) + 1,
            lastPlayed: new Date().toISOString(),
          },
        }

        const newMissionKnowledge = mission.knowledgeIds.filter((id) => !before.knowledge.includes(id))
        const dailyCompleted = daily.missionIds.includes(result.missionId)
          ? Array.from(new Set([...daily.completedIds, result.missionId]))
          : daily.completedIds

        const skillUpdate = { ...before.stats.skill }
        ;(Object.keys(result.skills) as SkillKey[]).forEach((key) => {
          const delta = result.skills[key]
          if (!delta) return
          skillUpdate[key] = {
            correct: skillUpdate[key].correct + delta.correct,
            total: skillUpdate[key].total + delta.total,
          }
        })

        const stats: PlayerStats = {
          ...before.stats,
          missionsPlayed: before.stats.missionsPlayed + 1,
          missionsCompleted: before.stats.missionsCompleted + 1,
          totalScore: before.stats.totalScore + result.score,
          decisions: before.stats.decisions + result.totalCount,
          correct: before.stats.correct + result.correctCount,
          hints: before.stats.hints + result.hintsUsed,
          fireMissions: before.stats.fireMissions + (mission.mode === 'fire' ? 1 : 0),
          hazardsFound: before.stats.hazardsFound + (mission.mode === 'hazard' ? result.correctCount : 0),
          callsMade: before.stats.callsMade + (mission.mode === 'call' ? 1 : 0),
          cprSessions: before.stats.cprSessions + (mission.equipment === 'cpr' ? 1 : 0),
          timePlayedSec: before.stats.timePlayedSec + result.durationSec,
          skill: skillUpdate,
        }

        const candidate: GameSave = {
          ...before,
          xp: before.xp + xpGained,
          coins: before.coins + coinsGained,
          missions: nextMissions,
          knowledge: Array.from(new Set([...before.knowledge, ...newMissionKnowledge])),
          daily: {
            ...daily,
            completedIds: dailyCompleted,
          },
          stats,
          history: [
            ...before.history.slice(-49),
            {
              at: new Date().toISOString(),
              missionId: result.missionId,
              stars,
              score: result.score,
            },
          ],
          updatedAt: new Date().toISOString(),
        }

        const newBadges = evaluateBadges(candidate)
        newBadges.forEach((id) => {
          candidate.badges[id] = new Date().toISOString()
        })
        const levelAfter = getLevelInfo(candidate.xp).level

        set(candidate)
        return {
          xpGained,
          coinsGained,
          stars,
          newBest,
          levelBefore,
          levelAfter,
          newBadges,
          newKnowledge: newMissionKnowledge,
          isReplay,
        }
      },
      unlockKnowledge: (id) => {
        if (get().knowledge.includes(id)) return
        set((state) => ({ knowledge: [...state.knowledge, id], updatedAt: new Date().toISOString() }))
      },
      ensureDaily: () => {
        const state = get()
        const next = ensureDailyState(state.daily, state)
        if (next !== state.daily) set({ daily: next })
      },
      claimDaily: () => {
        const state = get()
        const daily = ensureDailyState(state.daily, state)
        if (daily.completedIds.length < 3) {
          return { ok: false, coins: 0, xp: 0, message: '오늘의 미션 3개를 먼저 완료해 주세요.' }
        }
        if (daily.claimed) {
          return { ok: false, coins: 0, xp: 0, message: '오늘의 보상은 이미 받았어요.' }
        }
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayKey = yesterday.toLocaleDateString('sv-SE')
        const nextStreak = daily.lastClaimDate === yesterdayKey ? daily.streak + 1 : 1
        const communityBonus = state.buildings.community?.built ? 30 : 0
        const coins = 180 + communityBonus
        const xp = 70
        const candidate: GameSave = {
          ...state,
          coins: state.coins + coins,
          xp: state.xp + xp,
          daily: {
            ...daily,
            claimed: true,
            streak: nextStreak,
            lastClaimDate: TODAY(),
            totalClaims: daily.totalClaims + 1,
          },
          updatedAt: new Date().toISOString(),
        }
        const newBadges = evaluateBadges(candidate)
        newBadges.forEach((id) => {
          candidate.badges[id] = new Date().toISOString()
        })
        set(candidate)
        return {
          ok: true,
          coins,
          xp,
          message:
            nextStreak >= 7
              ? `7일 연속 달성! ${coins} 안전코인을 받았어요.`
              : `${nextStreak}일 연속 챌린지! ${coins} 안전코인을 받았어요.`,
        }
      },
      buildBuilding: (id) => {
        const state = get()
        const building = BUILDINGS.find((item) => item.id === id)
        if (!building || building.initial) return { ok: false, message: '건설할 수 없는 건물입니다.' }
        const current = state.buildings[id]
        if (current?.built) return { ok: false, message: '이미 건설된 건물입니다.' }
        const cost = building.buildCost || 0
        if (state.coins < cost) return { ok: false, message: `${cost - state.coins} 코인이 더 필요해요.` }
        const candidate: GameSave = {
          ...state,
          coins: state.coins - cost,
          buildings: {
            ...state.buildings,
            [id]: { built: true, level: 1, builtAt: new Date().toISOString() },
          },
          updatedAt: new Date().toISOString(),
        }
        const newBadges = evaluateBadges(candidate)
        newBadges.forEach((badgeId) => {
          candidate.badges[badgeId] = new Date().toISOString()
        })
        set(candidate)
        return { ok: true, message: `${building.name} 건설 완료! 도시 안전지수가 올라갔어요.` }
      },
      upgradeBuilding: (id) => {
        const state = get()
        const building = BUILDINGS.find((item) => item.id === id)
        const current = state.buildings[id]
        if (!building || !current?.built) return { ok: false, message: '먼저 건물을 건설해 주세요.' }
        if (current.level >= building.maxLevel) return { ok: false, message: '이미 최고 레벨입니다.' }
        const cost = Math.round(building.upgradeCost * (1 + (current.level - 1) * 0.8))
        if (state.coins < cost) return { ok: false, message: `${cost - state.coins} 코인이 더 필요해요.` }
        const candidate: GameSave = {
          ...state,
          coins: state.coins - cost,
          buildings: {
            ...state.buildings,
            [id]: { ...current, level: current.level + 1 },
          },
          updatedAt: new Date().toISOString(),
        }
        set(candidate)
        return { ok: true, message: `${building.name} Lv.${current.level + 1} 달성!` }
      },
      updateSettings: (patch) => {
        set((state) => ({
          settings: { ...state.settings, ...patch },
          updatedAt: new Date().toISOString(),
        }))
      },
      setMode: (mode) => {
        set((state) => ({
          settings: { ...state.settings, mode },
          updatedAt: new Date().toISOString(),
        }))
      },
      resetProgress: () => {
        const fresh = createInitialSave(get().playerName, true)
        set({ ...fresh, hydrated: true })
      },
      addCoins: (amount) => {
        set((state) => ({ coins: Math.max(0, state.coins + amount) }))
      },
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const {
          hydrated,
          setHydrated,
          newGame,
          renamePlayer,
          completeMission,
          unlockKnowledge,
          ensureDaily,
          claimDaily,
          buildBuilding,
          upgradeBuilding,
          updateSettings,
          setMode,
          resetProgress,
          addCoins,
          ...save
        } = state
        return save
      },
      merge: (persisted, current) => {
        const save = persisted as Partial<GameSave>
        const base = current as GameStore
        const merged: GameSave = {
          version: save.version ?? SAVE_VERSION,
          started: save.started ?? true,
          playerName: save.playerName || base.playerName,
          xp: save.xp ?? 0,
          coins: save.coins ?? 180,
          createdAt: save.createdAt || base.createdAt,
          updatedAt: save.updatedAt || base.updatedAt,
          buildings: { ...initialBuildings(), ...(save.buildings || {}) },
          missions: save.missions || {},
          badges: save.badges || {},
          knowledge: save.knowledge || [],
          daily: save.daily || initialDaily(),
          settings: { ...initialSettings(), ...(save.settings || {}) },
          stats: {
            ...initialStats(),
            ...(save.stats || {}),
            skill: { ...initialStats().skill, ...(save.stats?.skill || {}) },
          },
          history: save.history || [],
        }
        return {
          ...base,
          ...merged,
          daily: ensureDailyState(merged.daily, merged),
        }
      },
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHydrated(true)
      },
    },
  ),
)

export function hasSavedGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as { state?: Partial<GameSave> }
    return Boolean(parsed?.state?.started)
  } catch {
    return false
  }
}

export function getDailyReward(state: GameSave): { canClaim: boolean; progress: number; streak: number } {
  const daily = ensureDailyState(state.daily, state)
  return {
    canClaim: daily.completedIds.length >= 3 && !daily.claimed,
    progress: Math.min(3, daily.completedIds.length),
    streak: daily.streak,
  }
}

export function getAvailableMissions(save: GameSave) {
  return MISSIONS.map((mission) => {
    if (save.settings.mode === 'educator') return { mission, unlocked: true, reasons: [] as string[] }
    const reasons: string[] = []
    if (mission.requires?.missionId) {
      const required = missionById[mission.requires.missionId]
      if (!save.missions[mission.requires.missionId]?.completed) {
        reasons.push(`'${required?.shortTitle || '선행 미션'}' 완료`)
      }
    }
    if (mission.requires?.building) {
      const building = BUILDINGS.find((item) => item.id === mission.requires?.building?.id)
      const state = save.buildings[mission.requires.building.id]
      if (!state?.built || state.level < mission.requires.building.level) {
        reasons.push(`${building?.shortName || '건물'} Lv.${mission.requires.building.level}`)
      }
    }
    if (mission.requires?.level) {
      if (getLevelInfo(save.xp).level < mission.requires.level) reasons.push(`Lv.${mission.requires.level}`)
    }
    return { mission, unlocked: reasons.length === 0, reasons }
  })
}

export { SAVE_KEY, DAILY_POOL, BADGES }
