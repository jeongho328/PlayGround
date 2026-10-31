import { useState } from 'react'
import type { GameMode, GameSave } from '../types'
import { useGameStore } from '../store'
import { GameButton, Modal, ScreenHeader, toast } from '../components/UI'
import { Icon } from '../components/Icon'
import { sfx } from '../audio'

const MODES: { id: GameMode; label: string; emoji: string; desc: string; tags: string[] }[] = [
  { id: 'general', label: '일반 모드', emoji: '🎮', desc: '모든 연령이 편안하게 즐기는 기본 모드입니다.', tags: ['표준 UI', '전체 콘텐츠'] },
  { id: 'kids', label: '어린이 모드', emoji: '🧒', desc: '쉬운 단어와 큰 글씨, 짧은 문장으로 안전을 배워요.', tags: ['쉬운 말', '큰 글씨', '친근한 피드백'] },
  { id: 'senior', label: '시니어 모드', emoji: '🧓', desc: '고대비 화면과 큰 버튼, 시간 압박 없는 학습에 최적화합니다.', tags: ['고대비', '큰 버튼', '시간 제한 완화'] },
  { id: 'educator', label: '교육자 모드', emoji: '🧑‍🏫', desc: '수업 시연을 위해 모든 미션을 개방하고 해설을 강조합니다.', tags: ['전체 미션 개방', '해설 강조', '단체 시연'] },
]

export function SettingsScreen({
  save,
  onReset,
  onNewGame,
}: {
  save: GameSave
  onReset: () => void
  onNewGame: () => void
}) {
  const store = useGameStore()
  const [name, setName] = useState(save.playerName)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)

  const updateName = () => {
    if (!name.trim()) {
      toast('이름을 입력해 주세요.', 'error')
      return
    }
    store.renamePlayer(name)
    toast('안전지킴이 이름을 변경했어요.')
  }

  return (
    <div className="settings-screen screen-pad">
      <ScreenHeader
        eyebrow="SETTINGS"
        title="설정"
        subtitle="나에게 맞는 화면과 소리로 세이프시티를 즐겨 보세요."
      />

      <div className="settings-layout">
        <section className="settings-card mode-settings">
          <div className="settings-card-head">
            <span className="settings-head-icon">🎛️</span>
            <div><h2>플레이 모드</h2><p>대상에 맞춰 글자 크기와 안내 방식을 조절합니다.</p></div>
          </div>
          <div className="mode-grid">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`mode-option ${save.settings.mode === mode.id ? 'is-active' : ''}`}
                onClick={() => {
                  store.setMode(mode.id)
                  sfx('click')
                  toast(`${mode.label}로 변경했어요.`, 'info')
                }}
              >
                <span className="mode-emoji">{mode.emoji}</span>
                <div className="mode-copy">
                  <b>{mode.label}</b>
                  <p>{mode.desc}</p>
                  <span className="mode-tags">{mode.tags.map((tag) => <i key={tag}>{tag}</i>)}</span>
                </div>
                <span className="mode-radio">{save.settings.mode === mode.id && <Icon name="check" size={14} />}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-head">
            <span className="settings-head-icon">🔊</span>
            <div><h2>소리</h2><p>모든 효과음과 배경음은 언제든 끌 수 있습니다.</p></div>
          </div>
          <div className="setting-row">
            <div><b>효과음</b><span>버튼, 정답, 코인, 건설 효과음</span></div>
            <button type="button" role="switch" aria-checked={save.settings.sound} className={`toggle ${save.settings.sound ? 'on' : ''}`} onClick={() => { store.updateSettings({ sound: !save.settings.sound }); if (!save.settings.sound) sfx('correct') }}>
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div><b>배경음악</b><span>세이프시티의 부드러운 일상 음악</span></div>
            <button type="button" role="switch" aria-checked={save.settings.music} className={`toggle ${save.settings.music ? 'on' : ''}`} onClick={() => { store.updateSettings({ music: !save.settings.music }); if (!save.settings.music) sfx('coin') }}>
              <span />
            </button>
          </div>
          <div className="audio-note"><Icon name="info" size={14} /> 브라우저 정책에 따라 첫 터치 후 소리가 시작됩니다.</div>
        </section>

        <section className="settings-card">
          <div className="settings-card-head">
            <span className="settings-head-icon">♿</span>
            <div><h2>접근성</h2><p>편안하게 플레이할 수 있도록 화면을 조절하세요.</p></div>
          </div>
          <div className="setting-row">
            <div><b>움직임 줄이기</b><span>화면 전환과 장식 애니메이션을 최소화합니다.</span></div>
            <button type="button" role="switch" aria-checked={save.settings.reducedMotion} className={`toggle ${save.settings.reducedMotion ? 'on' : ''}`} onClick={() => store.updateSettings({ reducedMotion: !save.settings.reducedMotion })}>
              <span />
            </button>
          </div>
          <div className="setting-row text-size-row">
            <div><b>글자 크기</b><span>모든 화면의 기본 글자 크기를 조절합니다.</span></div>
            <div className="text-size-options">
              {[0.92, 1, 1.12, 1.24].map((scale, index) => (
                <button key={scale} type="button" className={save.settings.textScale === scale ? 'is-active' : ''} onClick={() => store.updateSettings({ textScale: scale })}>
                  {['작게', '보통', '크게', '아주 크게'][index]}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-row">
            <div><b>고대비 안내</b><span>선택지와 결과를 더 명확히 구분합니다.</span></div>
            <span className={`status-chip ${save.settings.mode === 'senior' ? 'on' : ''}`}>{save.settings.mode === 'senior' ? '시니어 모드에서 켜짐' : '시니어 모드에서 자동'}</span>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-head">
            <span className="settings-head-icon">🧑‍🚒</span>
            <div><h2>안전지킴이 정보</h2><p>저장된 프로필과 플레이 데이터를 관리합니다.</p></div>
          </div>
          <div className="name-edit-row">
            <label htmlFor="settings-name">이름</label>
            <input id="settings-name" className="text-input compact" value={name} maxLength={12} onChange={(event) => setName(event.target.value)} />
            <GameButton size="sm" variant="soft" onClick={updateName}>변경</GameButton>
          </div>
          <div className="save-info-grid">
            <div><span>저장 방식</span><b>이 브라우저 자동 저장</b></div>
            <div><span>마지막 저장</span><b>{new Date(save.updatedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</b></div>
            <div><span>플레이 기록</span><b>{save.stats.missionsCompleted}개 미션 완료</b></div>
            <div><span>데이터 버전</span><b>v{save.version}.0</b></div>
          </div>
          <div className="data-actions">
            <GameButton variant="ghost" icon="reset" onClick={() => setConfirmReset(true)}>진행 초기화</GameButton>
            <GameButton variant="ghost" icon="spark" onClick={() => setConfirmNew(true)}>새 게임 시작</GameButton>
          </div>
        </section>

        <section className="settings-card about-card">
          <div className="settings-card-head">
            <span className="settings-head-icon">🛡️</span>
            <div><h2>세이프시티 119 정보</h2><p>시민의 안전 행동을 키우는 교육용 웹게임</p></div>
          </div>
          <div className="about-copy">
            <p>세이프시티 119는 화재 예방, 대피 판단, 119 신고, 응급처치를 실제 상황처럼 연습하는 무료 교육 콘텐츠입니다.</p>
            <p className="about-warning"><Icon name="info" size={15} /> 이 게임은 공인된 응급처치 실습을 대체하지 않습니다. 실제 긴급상황에서는 119 신고와 현장 지시가 우선입니다.</p>
          </div>
          <div className="about-meta">
            <span>v1.0.0</span>
            <span>교육자료 기준일 2026.10</span>
            <span>무료 · 광고 없음</span>
          </div>
        </section>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="정말 진행을 초기화할까요?" subtitle="도시, 코인, 배지, 학습 기록이 모두 사라집니다.">
        <div className="danger-panel"><Icon name="info" size={20} /><span>이 작업은 되돌릴 수 없습니다. 안전지킴이 이름을 제외한 모든 데이터가 초기화됩니다.</span></div>
        <div className="modal-actions">
          <GameButton variant="ghost" onClick={() => setConfirmReset(false)}>취소</GameButton>
          <GameButton variant="danger" icon="reset" onClick={() => { store.resetProgress(); setConfirmReset(false); onReset(); toast('진행이 초기화되었어요.', 'info') }}>초기화</GameButton>
        </div>
      </Modal>

      <Modal open={confirmNew} onClose={() => setConfirmNew(false)} title="새 게임을 시작할까요?" subtitle="새로운 도시를 처음부터 다시 시작합니다.">
        <div className="danger-panel"><Icon name="info" size={20} /><span>현재 도시와 모든 미션 기록이 초기화되고 시작 화면으로 이동합니다.</span></div>
        <div className="modal-actions">
          <GameButton variant="ghost" onClick={() => setConfirmNew(false)}>취소</GameButton>
          <GameButton variant="primary" icon="play" onClick={() => { store.resetProgress(); setConfirmNew(false); onNewGame() }}>새 게임</GameButton>
        </div>
      </Modal>
    </div>
  )
}
