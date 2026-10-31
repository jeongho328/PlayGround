import type { GameSave, MissionDef } from '../types'
import { KNOWLEDGE } from '../data/knowledge'
import { FIRE_STAGES, EMERGENCY_SCENARIOS } from '../data/missions'
import { HAZARD_ROOMS } from '../data/hazards'
import { GameButton, Modal } from '../components/UI'
import { Mascot } from '../components/Mascot'
import { Icon } from '../components/Icon'

const SKILL_LABELS: Record<string, string> = {
  prevention: '예방',
  evacuation: '대피',
  report: '신고',
  firstAid: '응급',
  equipment: '장비',
}

const MODE_LABELS: Record<MissionDef['mode'], string> = {
  fire: '화재탈출',
  hazard: '위험 찾기',
  equipment: '안전장비',
  call: '119 신고',
}

const MODE_TIPS: Record<MissionDef['mode'], string[]> = {
  fire: ['문 손잡이는 손등으로 온도를 확인해요.', '불이 난 건물에서는 엘리베이터를 타지 않아요.', '연기가 있으면 자세를 낮추고 젖은 천으로 코와 입을 가려요.'],
  hazard: ['평범해 보이는 물건도 위험할 수 있어요.', '대피로를 막는 물건은 즉시 치워요.', '전열기 주변과 콘센트를 꼼꼼히 살펴봐요.'],
  equipment: ['불이 크거나 연기가 많으면 장비보다 대피가 먼저예요.', '장비 사용 전 119 신고와 주변 안전을 확인해요.', '실습은 교육용이며 실제 상황에서는 119 안내를 따라요.'],
  call: ['위치와 사고 종류를 먼저 말해요.', '사람 수와 상태를 차분히 알려요.', '상담원이 요청하면 전화를 끊지 않아요.'],
}

export function MissionBrief({
  open,
  mission,
  save,
  onClose,
  onStart,
}: {
  open: boolean
  mission: MissionDef | null
  save: GameSave
  onClose: () => void
  onStart: () => void
}) {
  if (!mission) return null
  const stage = FIRE_STAGES[mission.id]
  const room = Object.values(HAZARD_ROOMS).find((item) => item.missionId === mission.id)
  const scenario = EMERGENCY_SCENARIOS[mission.id]
  const articles = mission.knowledgeIds.map((id) => KNOWLEDGE.find((article) => article.id === id)).filter(Boolean)
  const intro = stage?.intro || room?.subtitle || scenario?.intro || mission.description
  const sources = Array.from(new Set(articles.map((article) => article?.source).filter(Boolean))) as string[]
  const sourceDates = Array.from(new Set(articles.map((article) => article?.sourceDate).filter(Boolean))) as string[]
  const reviewed = articles.length > 0 && articles.every((article) => article?.reviewed)
  const progress = save.missions[mission.id]
  const priorUnlocked = save.settings.mode === 'educator' || progress?.completed || !mission.requires
  const tips = MODE_TIPS[mission.mode]

  return (
    <Modal open={open} onClose={onClose} className="mission-brief-modal" wide hideClose={false} title="출동 브리핑">
      <div className="brief-hero" style={{ background: `linear-gradient(135deg, ${mission.accent}, ${mission.accent2})` }}>
        <div className="brief-hero-art" aria-hidden="true">
          <span className="brief-emoji">{mission.emoji}</span>
          <span className="brief-sun" />
          <span className="brief-cloud bc1" />
          <span className="brief-cloud bc2" />
          <span className="brief-hill bh1" />
          <span className="brief-hill bh2" />
        </div>
        <div className="brief-hero-copy">
          <span className="brief-badge">{MODE_LABELS[mission.mode]} · {mission.category}</span>
          <h2>{mission.title}</h2>
          <p>{mission.subtitle}</p>
          <div className="brief-meta">
            <span><Icon name="clock" size={15} /> {mission.minutes}</span>
            <span><Icon name="mission" size={15} /> {mission.steps}단계</span>
            <span className="brief-difficulty">난이도 {'●'.repeat(mission.difficulty)}{'○'.repeat(3 - mission.difficulty)}</span>
            {progress?.completed && <span className="brief-complete"><Icon name="check" size={14} /> 완료 · 최고 {progress.bestScore}점</span>}
          </div>
        </div>
        <div className="brief-mascot" aria-hidden="true"><Mascot name="safi" mood="talk" size={108} /></div>
      </div>

      <div className="brief-grid">
        <section className="brief-story">
          <span className="eyebrow">MISSION STORY</span>
          <h3>이런 상황이에요</h3>
          <p>{intro}</p>
          <div className="brief-location"><Icon name="info" size={16} /><span>{mission.location}</span></div>
          <div className="brief-tips">
            <h4>안전 포인트</h4>
            <ul>
              {tips.map((tip) => <li key={tip}><span>✓</span>{tip}</li>)}
            </ul>
          </div>
        </section>

        <aside className="brief-side">
          <div className="brief-rewards">
            <span className="brief-side-label">첫 완료 보상</span>
            <div className="brief-reward-row">
              <span className="brief-reward coin">₩ <b>{mission.rewards.coins}</b><small>안전코인</small></span>
              <span className="brief-reward xp">XP <b>{mission.rewards.xp}</b><small>경험치</small></span>
            </div>
            <p>별 3개를 받으면 보너스 코인과 XP가 추가돼요.</p>
          </div>
          <div className="brief-skills">
            <span className="brief-side-label">훈련 역량</span>
            <div className="brief-skill-chips">
              {mission.skills.map((skill) => <span key={skill}>{SKILL_LABELS[skill]}</span>)}
            </div>
          </div>
          <div className="brief-learn">
            <span className="brief-side-label">배우는 안전지식</span>
            <ul>
              {articles.slice(0, 3).map((article) => (
                <li key={article!.id}><span>{article!.emoji}</span>{article!.title}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="brief-source">
        <div className="brief-verify">
          <span className={`verify-pill ${reviewed ? 'verified' : ''}`}>
            <Icon name={reviewed ? 'check' : 'info'} size={13} /> {reviewed ? '검수 완료' : '교육용 자료'}
          </span>
          <p>근거 자료 · {sources.slice(0, 2).join(' / ') || '소방청 · 교육부 안전교육 자료'}</p>
        </div>
        <span className="brief-source-date">자료 기준일 {sourceDates[0] || '2026-10-01'}</span>
      </div>

      {!priorUnlocked && (
        <div className="brief-lock-note">
          <Icon name="lock" size={16} />
          이 미션은 아직 잠겨 있어요. 미션 센터에서 선행 조건을 확인해 주세요.
        </div>
      )}

      <div className="modal-actions brief-actions">
        <GameButton variant="ghost" onClick={onClose}>나중에</GameButton>
        <GameButton variant="primary" size="lg" icon="play" onClick={onStart} disabled={!priorUnlocked}>
          {progress?.completed ? '다시 도전하기' : '출동 시작'}
        </GameButton>
      </div>

      <p className="brief-disclaimer">
        <Icon name="shield" size={14} /> 교육용 시뮬레이션입니다. 실제 긴급상황에서는 119 신고와 현장 지시가 가장 우선입니다.
      </p>
    </Modal>
  )
}
