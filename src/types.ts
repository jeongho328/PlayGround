export type GameMode = 'general' | 'kids' | 'senior' | 'educator'
export type ScreenName =
  | 'title'
  | 'city'
  | 'missions'
  | 'build'
  | 'codex'
  | 'profile'
  | 'settings'
  | 'mission'
  | 'result'

export type MissionMode = 'fire' | 'hazard' | 'equipment' | 'call'
export type EquipmentKind = 'extinguisher' | 'aed' | 'cpr'
export type SkillKey = 'prevention' | 'evacuation' | 'report' | 'firstAid' | 'equipment'

export interface SkillCount {
  correct: number
  total: number
}

export interface MissionProgress {
  completed: boolean
  bestScore: number
  bestStars: number
  attempts: number
  lastPlayed?: string
  completions: number
}

export interface MissionReward {
  xp: number
  coins: number
}

export interface UnlockRequirement {
  missionId?: string
  building?: { id: string; level: number }
  level?: number
}

export interface MissionDef {
  id: string
  mode: MissionMode
  equipment?: EquipmentKind
  title: string
  shortTitle: string
  subtitle: string
  description: string
  category: string
  location: string
  difficulty: 1 | 2 | 3
  minutes: string
  steps: number
  rewards: MissionReward
  skills: SkillKey[]
  knowledgeIds: string[]
  requires?: UnlockRequirement
  accent: string
  accent2: string
  emoji: string
  tags: string[]
}

export interface Choice {
  id: string
  label: string
  detail?: string
  correct: boolean
  feedback: string
  outcome?: string
}

export interface FireStep {
  id: string
  skill: SkillKey
  situation: string
  prompt: string
  scene: 'apartment' | 'corridor' | 'smokeRoom' | 'cinema' | 'school' | 'outside'
  danger: 1 | 2 | 3
  condition?: string
  choices: Choice[]
  explanation: string
  caution: string
  source: string
  sourceDate: string
  reviewed: boolean
}

export interface FireStage {
  id: string
  title: string
  subtitle: string
  location: string
  intro: string
  color: string
  steps: FireStep[]
  completionKnowledge: string
  finalSkill: SkillKey
}

export interface HazardItem {
  id: string
  label: string
  shortLabel: string
  explanation: string
  emoji: string
  knowledgeId: string
  tone: string
}

export interface HazardRoom {
  id: string
  missionId: string
  name: string
  subtitle: string
  hazards: HazardItem[]
  decoys: { label: string; emoji: string }[]
  timeLimit: number
  baseScene: 'kitchen' | 'living' | 'bedroom'
}

export interface ExtinguisherStep {
  id: string
  label: string
  hint: string
  knowledge: string
}

export interface EmergencyStep {
  id: string
  callerPrompt: string
  question: string
  skill: SkillKey
  choices: {
    id: string
    label: string
    detail?: string
    correct: boolean
    feedback: string
  }[]
}

export interface EmergencyScenario {
  id: string
  missionId: string
  title: string
  subtitle: string
  location: string
  dispatchName: string
  intro: string
  emoji: string
  steps: EmergencyStep[]
  finalKnowledge: string
  safetyNote: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  category: '화재예방' | '화재대피' | '119신고' | '응급처치' | '안전장비' | '도시안전'
  summary: string
  body: string[]
  caution: string
  source: string
  sourceDate: string
  reviewed: boolean
  emoji: string
}

export interface BuildingDef {
  id: string
  name: string
  shortName: string
  description: string
  kind: 'firestation' | 'apartment' | 'school' | 'house' | 'store' | 'park' | 'safety' | 'hospital' | 'community'
  initial: boolean
  maxLevel: number
  buildCost?: number
  upgradeCost: number
  safetyPerLevel: number
  missions: string[]
  benefit: string
  position: { left: string; top: string; width: string; z: number }
}

export interface BuildingState {
  level: number
  built: boolean
  builtAt?: string
}

export interface BadgeDef {
  id: string
  name: string
  description: string
  condition: string
  emoji: string
  color: string
}

export interface MissionResult {
  missionId: string
  score: number
  maxScore: number
  stars: number
  correctCount: number
  totalCount: number
  hintsUsed: number
  durationSec: number
  skills: Partial<Record<SkillKey, SkillCount>>
  detail?: string
  failed?: boolean
  failureReason?: string
}

export interface CompletionReport {
  xpGained: number
  coinsGained: number
  stars: number
  newBest: boolean
  levelBefore: number
  levelAfter: number
  newBadges: string[]
  newKnowledge: string[]
  isReplay: boolean
}

export interface DailyState {
  date: string
  missionIds: string[]
  completedIds: string[]
  claimed: boolean
  streak: number
  lastClaimDate?: string
  totalClaims: number
}

export interface Settings {
  sound: boolean
  music: boolean
  reducedMotion: boolean
  textScale: number
  mode: GameMode
}

export interface PlayerStats {
  missionsPlayed: number
  missionsCompleted: number
  totalScore: number
  decisions: number
  correct: number
  hints: number
  fireMissions: number
  hazardsFound: number
  callsMade: number
  cprSessions: number
  timePlayedSec: number
  skill: Record<SkillKey, SkillCount>
}

export interface GameSave {
  version: number
  started: boolean
  playerName: string
  xp: number
  coins: number
  createdAt: string
  updatedAt: string
  buildings: Record<string, BuildingState>
  missions: Record<string, MissionProgress>
  badges: Record<string, string>
  knowledge: string[]
  daily: DailyState
  settings: Settings
  stats: PlayerStats
  history: { at: string; missionId: string; stars: number; score: number }[]
}
