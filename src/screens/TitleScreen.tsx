import { useState } from 'react'
import { Mascot } from '../components/Mascot'
import { GameButton, Modal, ProgressBar } from '../components/UI'
import { Icon } from '../components/Icon'
import { getLevelInfo, getSafetyGrade } from '../store'
import type { GameSave } from '../types'

export function TitleScreen({
  save,
  hasSave,
  onContinue,
  onNewGame,
  onSettings,
}: {
  save: GameSave
  hasSave: boolean
  onContinue: () => void
  onNewGame: (name: string) => void
  onSettings: () => void
}) {
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState(save.playerName || '안전지킴이')
  const level = getLevelInfo(save.xp)
  const grade = getSafetyGrade(level.level)

  return (
    <div className="title-screen">
      <div className="title-sky" aria-hidden="true">
        <span className="title-sun" />
        <span className="title-cloud tc-one" />
        <span className="title-cloud tc-two" />
        <span className="title-cloud tc-three" />
        <span className="title-birds">⌁ ⌁</span>
      </div>

      <header className="title-topbar">
        <span className="title-edu-badge"><Icon name="shield" size={16} /> 소방안전 교육 웹게임</span>
        <button type="button" className="title-settings" onClick={onSettings}>
          <Icon name="settings" size={19} />
          설정
        </button>
      </header>

      <div className="title-content">
        <section className="title-copy">
          <span className="title-kicker">당신의 선택이 도시의 안전을 바꾼다</span>
          <div className="logo-lockup">
            <div className="logo-mark" aria-hidden="true">
              <span className="logo-flame">🔥</span>
              <span className="logo-119">119</span>
            </div>
            <div>
              <h1 className="game-logo">
                <span className="logo-safe">SAFE</span>
                <span className="logo-city">CITY</span>
                <span className="logo-number">119</span>
              </h1>
              <p className="game-logo-ko">세이프시티 119</p>
            </div>
          </div>
          <p className="title-description">
            불길 앞에서의 판단부터 119 신고, 응급처치까지.<br />
            놀면서 배우고, 안전한 도시를 직접 만들어 보세요.
          </p>
          <div className="title-actions">
            {hasSave && (
              <GameButton size="lg" variant="primary" icon="play" onClick={onContinue} className="title-continue">
                이어하기
              </GameButton>
            )}
            <GameButton size="lg" variant={hasSave ? 'white' : 'primary'} icon={hasSave ? 'spark' : 'play'} onClick={() => setShowNew(true)}>
              {hasSave ? '새로 시작' : '게임 시작'}
            </GameButton>
          </div>
          {hasSave && (
            <div className="title-save-card">
              <span className={`title-avatar grade-${grade.short}`}>{grade.emoji}</span>
              <div className="title-save-info">
                <span className="title-save-name">{save.playerName} <b>Lv.{level.level}</b></span>
                <span className="title-save-meta">{grade.name} · 안전코인 {save.coins.toLocaleString()} · 배지 {Object.keys(save.badges).length}개</span>
                <ProgressBar value={level.current} max={level.needed} height={6} />
              </div>
            </div>
          )}
          <div className="title-tags">
            <span><Icon name="flame" size={15} /> 화재탈출</span>
            <span><Icon name="search" size={15} /> 위험찾기</span>
            <span><Icon name="phone" size={15} /> 119 신고</span>
            <span><Icon name="heart" size={15} /> 응급처치</span>
          </div>
        </section>

        <section className="title-visual" aria-label="세이프시티 안전지킴이 캐릭터">
          <div className="title-city-glow" />
          <div className="title-ground" />
          <div className="title-building title-firehouse" aria-hidden="true">
            <span className="tb-roof" /><span className="tb-window" /><span className="tb-door">119</span>
          </div>
          <div className="title-building title-school" aria-hidden="true">
            <span className="tb-roof" /><span className="tb-window" /><span className="tb-clock" />
          </div>
          <div className="title-character char-fire"><Mascot name="fire" mood="cheer" size={205} /></div>
          <div className="title-character char-safi"><Mascot name="safi" mood="happy" size={132} /></div>
          <div className="title-character char-medi"><Mascot name="medi" mood="happy" size={126} /></div>
          <div className="title-bubble bubble-fire">준비됐나요?</div>
          <div className="title-bubble bubble-safi">안전은 습관!</div>
          <div className="title-spark spark-a">✦</div>
          <div className="title-spark spark-b">✦</div>
          <div className="title-spark spark-c">✦</div>
        </section>
      </div>

      <footer className="title-footer">
        <span>© SAFE CITY 119 · 무료 교육용 콘텐츠</span>
        <span className="title-footer-note"><Icon name="info" size={14} /> 실제 긴급상황에서는 119 신고가 우선입니다</span>
      </footer>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title={hasSave ? '새로운 도시를 시작할까요?' : '안전지킴이 이름을 정해 주세요'}
        subtitle={hasSave ? '현재 저장된 도시와 기록은 새 게임을 시작하면 사라집니다.' : '도시를 구할 안전지킴이의 이름입니다.'}
        className="new-game-modal"
      >
        <label className="field-label" htmlFor="player-name">안전지킴이 이름</label>
        <input
          id="player-name"
          className="text-input"
          value={name}
          maxLength={12}
          onChange={(event) => setName(event.target.value)}
          placeholder="안전지킴이"
          autoFocus
        />
        <div className="new-game-note">
          <Icon name="info" size={17} />
          <span>진행 상황은 이 브라우저에 자동 저장됩니다. 개인정보는 수집하지 않아요.</span>
        </div>
        {hasSave && <p className="danger-note">기존 저장 기록은 복구할 수 없습니다. 신중하게 선택해 주세요.</p>}
        <div className="modal-actions">
          <GameButton variant="ghost" onClick={() => setShowNew(false)}>취소</GameButton>
          <GameButton variant="primary" icon="play" onClick={() => onNewGame(name || '안전지킴이')}>
            {hasSave ? '새로 시작' : '세이프시티 입장'}
          </GameButton>
        </div>
      </Modal>
    </div>
  )
}
