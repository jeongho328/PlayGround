import type { BadgeDef, BuildingDef } from '../types'

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'firestation',
    name: '세이프 소방서',
    shortName: '소방서',
    description: '도시의 화재와 응급상황을 책임지는 심장부입니다.',
    kind: 'firestation',
    initial: true,
    maxLevel: 3,
    upgradeCost: 180,
    safetyPerLevel: 8,
    missions: ['fire-1', 'fire-2', 'fire-3', 'equip-ext'],
    benefit: 'Lv.2에서 AED 체험실이 열리고 화재 대응 훈련이 강화됩니다.',
    position: { left: '4%', top: '47%', width: '20%', z: 40 },
  },
  {
    id: 'apartment',
    name: '세이프 아파트',
    shortName: '아파트',
    description: '많은 시민이 함께 사는 공간. 층별 대피 훈련이 필요합니다.',
    kind: 'apartment',
    initial: true,
    maxLevel: 3,
    upgradeCost: 200,
    safetyPerLevel: 7,
    missions: ['fire-1', 'fire-2', 'fire-3'],
    benefit: 'Lv.2에서 비상대피 유도등이 설치되어 안전지수가 크게 오릅니다.',
    position: { left: '24%', top: '15%', width: '18%', z: 50 },
  },
  {
    id: 'school',
    name: '세이프초등학교',
    shortName: '학교',
    description: '아이들의 안전 교육이 시작되는 배움터입니다.',
    kind: 'school',
    initial: true,
    maxLevel: 3,
    upgradeCost: 160,
    safetyPerLevel: 7,
    missions: ['fire-school'],
    benefit: 'Lv.2에서 학교 화재 대피 미션이 열립니다.',
    position: { left: '50%', top: '13%', width: '21%', z: 35 },
  },
  {
    id: 'house',
    name: '안전 주택가',
    shortName: '주택',
    description: '생활 속 작은 위험을 점검하는 우리 집입니다.',
    kind: 'house',
    initial: true,
    maxLevel: 3,
    upgradeCost: 140,
    safetyPerLevel: 5,
    missions: ['hazard-kitchen', 'hazard-living', 'hazard-bedroom'],
    benefit: 'Lv.2에서 우리 집 위험 찾기 공간이 추가됩니다.',
    position: { left: '70%', top: '44%', width: '15%', z: 45 },
  },
  {
    id: 'store',
    name: '세이프 마트',
    shortName: '상점',
    description: '동네 주민이 모이는 생활 편의 공간입니다.',
    kind: 'store',
    initial: true,
    maxLevel: 3,
    upgradeCost: 150,
    safetyPerLevel: 5,
    missions: ['hazard-kitchen'],
    benefit: 'Lv.2에서 소방안전 점검과 소화기 비치가 강화됩니다.',
    position: { left: '82%', top: '57%', width: '14%', z: 55 },
  },
  {
    id: 'park',
    name: '세이프 공원',
    shortName: '공원',
    description: '시민이 쉬어가는 초록 공간. 응급상황 대응 거점입니다.',
    kind: 'park',
    initial: true,
    maxLevel: 3,
    upgradeCost: 130,
    safetyPerLevel: 5,
    missions: ['call-medical'],
    benefit: 'Lv.2에서 AED가 설치되어 공원 응급 대응력이 올라갑니다.',
    position: { left: '39%', top: '57%', width: '22%', z: 40 },
  },
  {
    id: 'safety',
    name: '안전체험관',
    shortName: '안전체험관',
    description: '소화기와 AED, 심폐소생술을 직접 체험하는 특별 시설입니다.',
    kind: 'safety',
    initial: false,
    maxLevel: 3,
    buildCost: 320,
    upgradeCost: 240,
    safetyPerLevel: 10,
    missions: ['equip-ext', 'equip-aed', 'equip-cpr'],
    benefit: '건설하면 도시 안전지수 +10, 특별 장비 훈련 보상이 증가합니다.',
    position: { left: '58%', top: '52%', width: '17%', z: 30 },
  },
  {
    id: 'hospital',
    name: '세이프 응급의료센터',
    shortName: '의료센터',
    description: '골든타임을 지키는 응급의료 거점입니다.',
    kind: 'hospital',
    initial: false,
    maxLevel: 3,
    buildCost: 480,
    upgradeCost: 300,
    safetyPerLevel: 12,
    missions: ['call-medical', 'equip-aed'],
    benefit: '건설하면 도시 안전지수 +12, 응급 미션 코인 보상이 증가합니다.',
    position: { left: '79%', top: '23%', width: '18%', z: 25 },
  },
  {
    id: 'community',
    name: '시민안전센터',
    shortName: '안전센터',
    description: '주민이 함께 안전을 배우고 돌보는 커뮤니티 공간입니다.',
    kind: 'community',
    initial: false,
    maxLevel: 3,
    buildCost: 620,
    upgradeCost: 360,
    safetyPerLevel: 15,
    missions: ['call-fire', 'call-scene'],
    benefit: '건설하면 도시 안전지수 +15, 일일 챌린지 보상이 증가합니다.',
    position: { left: '21%', top: '61%', width: '17%', z: 20 },
  },
]

export const buildingById = Object.fromEntries(BUILDINGS.map((building) => [building.id, building]))

export const BADGES: BadgeDef[] = [
  {
    id: 'fire-king',
    name: '화재대피왕',
    description: '다섯 개의 화재탈출 챌린지를 모두 완료했습니다.',
    condition: '화재탈출 미션 5개 완료',
    emoji: '🔥',
    color: '#ff6b45',
  },
  {
    id: 'hazard-detective',
    name: '위험탐정',
    description: '우리 집 세 공간의 숨은 위험을 모두 찾아냈습니다.',
    condition: '위험 찾기 미션 3개 완료',
    emoji: '🔎',
    color: '#ffb340',
  },
  {
    id: 'call-master',
    name: '신고달인',
    description: '119 신고 미션을 별 2개 이상으로 모두 완료했습니다.',
    condition: '119 신고 3개 별 2+',
    emoji: '☎️',
    color: '#2c7be5',
  },
  {
    id: 'first-aid-master',
    name: '응급처치 마스터',
    description: 'AED와 심폐소생술 미션을 별 2개 이상으로 완료했습니다.',
    condition: 'AED·CPR 별 2+',
    emoji: '🫀',
    color: '#ff5470',
  },
  {
    id: 'city-builder',
    name: '안전도시 건설자',
    description: '새로운 안전 시설 2곳을 도시에 건설했습니다.',
    condition: '신규 건물 2개 건설',
    emoji: '🏗️',
    color: '#22b8a7',
  },
  {
    id: 'seven-day',
    name: '7일 챌린지',
    description: '7일 연속으로 일일 챌린지를 완료했습니다.',
    condition: '일일 챌린지 7일 연속',
    emoji: '🏆',
    color: '#f9b234',
  },
]

export const badgeById = Object.fromEntries(BADGES.map((badge) => [badge.id, badge]))

export const DAILY_POOL = [
  'fire-1',
  'hazard-kitchen',
  'call-fire',
  'equip-ext',
  'fire-2',
  'hazard-living',
  'call-medical',
  'equip-aed',
  'fire-3',
  'hazard-bedroom',
  'call-scene',
  'equip-cpr',
  'fire-cinema',
  'fire-school',
]

export const DAILY_STARTER_POOL = ['fire-1', 'hazard-kitchen', 'call-fire', 'equip-ext']

export function dailyMissionsForDate(date: string, eligibleIds: string[] = DAILY_POOL): string[] {
  const eligible = Array.from(new Set(eligibleIds.filter((id) => DAILY_POOL.includes(id))))
  const pool = eligible.length >= 3 ? eligible : DAILY_STARTER_POOL
  let seed = 0
  for (let i = 0; i < date.length; i += 1) seed = (seed * 31 + date.charCodeAt(i)) >>> 0
  const score = (id: string) => {
    let value = seed
    for (let i = 0; i < id.length; i += 1) value = (value * 33 + id.charCodeAt(i) * 17) >>> 0
    return value % 10007
  }
  return [...pool].sort((a, b) => score(a) - score(b) || a.localeCompare(b)).slice(0, 3)
}
