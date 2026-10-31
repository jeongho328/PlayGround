import { useMemo, useState } from 'react'
import type { GameSave, KnowledgeArticle } from '../types'
import { KNOWLEDGE } from '../data/knowledge'
import { Modal } from '../components/UI'
import { Icon } from '../components/Icon'

const CATEGORIES = ['전체', '화재대피', '화재예방', '119신고', '응급처치', '안전장비', '도시안전'] as const

export function CodexScreen({ save }: { save: GameSave }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('전체')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<KnowledgeArticle | null>(null)
  const unlocked = useMemo(() => new Set(save.knowledge), [save.knowledge])
  const filtered = useMemo(
    () =>
      KNOWLEDGE.filter((article) => {
        const categoryMatch = category === '전체' || article.category === category
        const queryMatch = !query || article.title.includes(query) || article.summary.includes(query) || article.body.some((line) => line.includes(query))
        return categoryMatch && queryMatch
      }),
    [category, query],
  )
  const progress = Math.round((save.knowledge.length / KNOWLEDGE.length) * 100)

  return (
    <div className="codex-screen screen-pad">
      <div className="codex-head">
        <div>
          <span className="eyebrow">SAFETY CODEX</span>
          <h1>안전도감</h1>
          <p>미션에서 배운 안전지식을 한곳에 모았습니다. 실제 행동으로 이어질 수 있도록 다시 읽어 보세요.</p>
        </div>
        <div className="codex-progress-card">
          <div className="codex-progress-top">
            <span>도감 완성도</span>
            <b>{save.knowledge.length}<small>/{KNOWLEDGE.length}</small></b>
          </div>
          <div className="codex-progress-bar"><span style={{ width: `${progress}%` }} /></div>
          <p><Icon name="check" size={14} /> 검수 완료된 지침 · 2026.10 기준</p>
        </div>
      </div>

      <div className="codex-toolbar">
        <div className="codex-categories">
          {CATEGORIES.map((item) => (
            <button key={item} type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>
              {item}
              <small>{item === '전체' ? KNOWLEDGE.length : KNOWLEDGE.filter((article) => article.category === item).length}</small>
            </button>
          ))}
        </div>
        <label className="codex-search">
          <Icon name="search" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="안전지식 검색" aria-label="안전지식 검색" />
        </label>
      </div>

      <div className="codex-grid">
        {filtered.map((article) => {
          const isUnlocked = unlocked.has(article.id)
          return (
            <button
              key={article.id}
              type="button"
              className={`codex-card ${isUnlocked ? 'is-unlocked' : 'is-locked'}`}
              onClick={() => isUnlocked && setSelected(article)}
              disabled={!isUnlocked}
            >
              <div className="codex-card-icon">{isUnlocked ? article.emoji : <Icon name="lock" size={24} />}</div>
              <div className="codex-card-content">
                <span className="codex-category">{article.category}</span>
                <h3>{isUnlocked ? article.title : '아직 잠긴 안전지식'}</h3>
                <p>{isUnlocked ? article.summary : '관련 미션을 완료하면 안전지식이 열립니다.'}</p>
                <div className="codex-card-foot">
                  <span className={`verify ${article.reviewed ? 'verified' : ''}`}>
                    <Icon name={article.reviewed ? 'check' : 'info'} size={13} /> {article.reviewed ? '검수 완료' : '검수 필요'}
                  </span>
                  <span className="read-more">{isUnlocked ? '자세히 읽기' : '잠김'} <Icon name="chevron" size={13} /></span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="learning-records">
        <div className="records-head">
          <div>
            <span className="eyebrow">LEARNING LOG</span>
            <h2>최근 학습 기록</h2>
          </div>
          <span className="records-count">총 {save.stats.missionsCompleted}회 학습</span>
        </div>
        {save.history.length === 0 ? (
          <div className="empty-state small">
            <span>📚</span>
            <p>아직 학습 기록이 없어요. 첫 미션을 시작해 보세요!</p>
          </div>
        ) : (
          <div className="history-list">
            {[...save.history].reverse().slice(0, 6).map((record, index) => {
              const article = KNOWLEDGE.find((item) => item.title.includes(record.missionId))
              return (
                <div className="history-row" key={`${record.at}-${index}`}>
                  <span className="history-dot" />
                  <div>
                    <b>{record.missionId.startsWith('fire') ? '화재탈출 훈련' : record.missionId.startsWith('hazard') ? '위험 찾기 훈련' : record.missionId.startsWith('call') ? '119 신고 훈련' : '안전장비 훈련'}</b>
                    <span>{new Date(record.at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className="history-stars">{'★'.repeat(record.stars)}{'☆'.repeat(3 - record.stars)}</span>
                  <span className="history-score">{record.score}점</span>
                  {article && <span className="sr-only">{article.title}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title}
        subtitle={selected?.category}
        className="knowledge-modal"
      >
        {selected && (
          <div className="knowledge-detail">
            <div className="knowledge-hero">
              <span>{selected.emoji}</span>
              <p>{selected.summary}</p>
            </div>
            <div className="knowledge-body">
              {selected.body.map((paragraph, index) => (
                <p key={index}><span className="knowledge-index">{index + 1}</span>{paragraph}</p>
              ))}
            </div>
            <div className="knowledge-caution">
              <Icon name="info" size={18} />
              <div><b>안전 주의사항</b><p>{selected.caution}</p></div>
            </div>
            <div className="knowledge-source">
              <div><span>근거 출처</span><b>{selected.source}</b></div>
              <div><span>자료 기준일</span><b>{selected.sourceDate}</b></div>
              <div><span>검수 상태</span><b className="verified"><Icon name="check" size={13} /> 검수 완료</b></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
