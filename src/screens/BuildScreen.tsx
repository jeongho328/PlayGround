import { useMemo, useState } from 'react'
import type { BuildingDef, GameSave, ScreenName } from '../types'
import { BUILDINGS } from '../data/city'
import { calculateSafetyIndex, useGameStore } from '../store'
import { CityBuildingArt } from '../components/CityBuilding'
import { GameButton, Modal, ProgressBar, Stars, toast } from '../components/UI'
import { Icon } from '../components/Icon'

export function BuildScreen({
  save,
  onNavigate,
  onBuilt,
}: {
  save: GameSave
  onNavigate: (screen: ScreenName) => void
  onBuilt?: (id: string) => void
}) {
  const store = useGameStore()
  const [tab, setTab] = useState<'build' | 'upgrade'>('build')
  const [confirm, setConfirm] = useState<{ building: BuildingDef; action: 'build' | 'upgrade'; cost: number } | null>(null)
  const safetyIndex = calculateSafetyIndex(save)
  const nextIndex = Math.min(99, safetyIndex + 4)
  const buildable = BUILDINGS.filter((building) => !building.initial)
  const initial = BUILDINGS.filter((building) => building.initial)
  const builtCount = Object.values(save.buildings).filter((state) => state.built).length
  const maxed = BUILDINGS.filter((building) => (save.buildings[building.id]?.level || 1) >= building.maxLevel).length
  const totalLevels = useMemo(
    () => BUILDINGS.reduce((sum, building) => sum + (save.buildings[building.id]?.built ? save.buildings[building.id].level : 0), 0),
    [save.buildings],
  )

  const requestAction = (building: BuildingDef, action: 'build' | 'upgrade') => {
    const state = save.buildings[building.id]
    const cost = action === 'build'
      ? building.buildCost || 0
      : Math.round(building.upgradeCost * (1 + ((state?.level || 1) - 1) * 0.8))
    setConfirm({ building, action, cost })
  }

  const execute = () => {
    if (!confirm) return
    const result = confirm.action === 'build' ? store.buildBuilding(confirm.building.id) : store.upgradeBuilding(confirm.building.id)
    toast(result.message, result.ok ? 'success' : 'error')
    if (result.ok) {
      if (confirm.action === 'build') onBuilt?.(confirm.building.id)
      const button = document.querySelector(`[data-building="${confirm.building.id}"]`)
      button?.classList.add('just-updated')
      window.setTimeout(() => button?.classList.remove('just-updated'), 1500)
    }
    setConfirm(null)
  }

  return (
    <div className="build-screen screen-pad">
      <div className="build-head">
        <div>
          <span className="eyebrow">CITY BUILDER</span>
          <h1>나만의 안전도시</h1>
          <p>미션으로 모은 코인을 사용해 도시를 더 안전하고 활기차게 만들어 보세요.</p>
        </div>
        <div className="build-wallet">
          <span>보유 안전코인</span>
          <b><span className="coin-icon">₩</span>{save.coins.toLocaleString()}</b>
        </div>
      </div>

      <section className="build-overview">
        <div className="build-index-panel">
          <div className="build-index-copy">
            <span className="overlay-label">현재 도시 안전지수</span>
            <div className="build-index-number">{safetyIndex}<small>/100</small></div>
            <span className="build-index-status"><Icon name="shield" size={15} /> {safetyIndex >= 80 ? '안전도시 완성에 가까워요' : '시설을 늘리면 더 안전해져요'}</span>
          </div>
          <div className="build-index-bar">
            <ProgressBar value={safetyIndex} max={100} height={14} color="linear-gradient(90deg,#4ed19a,#ffce4a)" />
            <div className="build-index-labels"><span>현재 {safetyIndex}</span><span>다음 목표 {nextIndex}</span></div>
          </div>
        </div>
        <div className="build-mini-stats">
          <div><span>건설된 시설</span><b>{builtCount}<small> / {BUILDINGS.length}</small></b></div>
          <div><span>총 시설 레벨</span><b>{totalLevels}</b></div>
          <div><span>최고 레벨</span><b>{maxed}</b></div>
          <div><span>연결 미션</span><b>{Object.values(save.missions).filter((m) => m.completed).length}</b></div>
        </div>
        <div className="build-blueprint" aria-hidden="true">
          <span className="blueprint-grid" />
          <span className="bp-building bp-a" /><span className="bp-building bp-b" /><span className="bp-building bp-c" />
          <span className="bp-building bp-d" /><span className="bp-building bp-e" />
          <span className="bp-flag">+</span>
        </div>
      </section>

      <div className="build-tabs">
        <button type="button" className={tab === 'build' ? 'is-active' : ''} onClick={() => setTab('build')}>
          <Icon name="build" size={18} /> 신규 건설 <small>{buildable.filter((b) => !save.buildings[b.id]?.built).length}</small>
        </button>
        <button type="button" className={tab === 'upgrade' ? 'is-active' : ''} onClick={() => setTab('upgrade')}>
          <Icon name="spark" size={18} /> 시설 업그레이드 <small>{BUILDINGS.filter((b) => save.buildings[b.id]?.built).length}</small>
        </button>
      </div>

      {tab === 'build' ? (
        <div className="build-grid">
          {buildable.map((building) => {
            const state = save.buildings[building.id]
            const canAfford = save.coins >= (building.buildCost || 0)
            return (
              <article key={building.id} data-building={building.id} className={`build-card ${state?.built ? 'is-built' : ''}`}>
                <div className={`build-art ${state?.built ? 'built-art' : 'empty-art'}`}>
                  {state?.built ? (
                    <CityBuildingArt building={building} level={state.level} />
                  ) : (
                    <div className="construction-placeholder">
                      <span className="construction-crane">🏗️</span>
                      <span className="construction-lines" />
                      <span className="construction-sign">CONSTRUCTION</span>
                    </div>
                  )}
                  <span className="build-status-pill">{state?.built ? `Lv.${state.level} 운영 중` : '건설 가능'}</span>
                </div>
                <div className="build-card-body">
                  <div className="build-card-title">
                    <div>
                      <h3>{building.name}</h3>
                      <p>{building.description}</p>
                    </div>
                    {state?.built && <Stars value={state.level} size={15} />}
                  </div>
                  <div className="build-benefit">
                    <Icon name="shield" size={16} />
                    <span>{building.benefit}</span>
                  </div>
                  <div className="build-cost-row">
                    <span>안전지수 <b>+{building.safetyPerLevel}</b></span>
                    {state?.built ? (
                      <span className="built-label"><Icon name="check" size={14} /> 건설 완료</span>
                    ) : (
                      <span className={`cost-label ${canAfford ? '' : 'not-enough'}`}><span className="coin-icon">₩</span>{building.buildCost?.toLocaleString()}</span>
                    )}
                  </div>
                  {!state?.built ? (
                    <GameButton
                      variant={canAfford ? 'gold' : 'ghost'}
                      full
                      icon="build"
                      disabled={!canAfford}
                      onClick={() => requestAction(building, 'build')}
                    >
                      {canAfford ? '건설하기' : `코인 ${((building.buildCost || 0) - save.coins).toLocaleString()} 부족`}
                    </GameButton>
                  ) : (
                    <GameButton variant="soft" full icon="spark" onClick={() => onNavigate('city')}>도시에서 보기</GameButton>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="upgrade-grid">
          {initial.concat(buildable.filter((b) => save.buildings[b.id]?.built)).map((building) => {
            const state = save.buildings[building.id]
            if (!state?.built) return null
            const cost = Math.round(building.upgradeCost * (1 + (state.level - 1) * 0.8))
            const isMax = state.level >= building.maxLevel
            return (
              <article key={building.id} data-building={building.id} className="upgrade-card">
                <div className="upgrade-thumb">
                  <CityBuildingArt building={building} level={state.level} />
                  <span className="upgrade-level">Lv.{state.level}</span>
                </div>
                <div className="upgrade-info">
                  <h3>{building.shortName}</h3>
                  <div className="upgrade-stars">
                    {Array.from({ length: building.maxLevel }).map((_, index) => (
                      <span key={index} className={index < state.level ? 'on' : ''} />
                    ))}
                  </div>
                  <p>{building.benefit}</p>
                  <div className="upgrade-footer">
                    <span className="upgrade-safety">안전지수 +{building.safetyPerLevel}</span>
                    {isMax ? (
                      <span className="maxed-label"><Icon name="check" size={14} /> MAX</span>
                    ) : (
                      <GameButton size="sm" variant={save.coins >= cost ? 'gold' : 'ghost'} icon="build" onClick={() => requestAction(building, 'upgrade')} disabled={save.coins < cost}>
                        ₩ {cost.toLocaleString()}
                      </GameButton>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="build-footnote">
        <Icon name="info" size={16} />
        <span>건설과 업그레이드는 즉시 도시에 반영되며 자동 저장됩니다. 안전체험관을 건설하면 장비 훈련 보상이 강화됩니다.</span>
      </div>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.action === 'build' ? '이 부지에 건설할까요?' : '시설을 업그레이드할까요?'}
        subtitle={confirm?.building.name}
        className="confirm-modal"
      >
        {confirm && (
          <>
            <div className="confirm-building-row">
              <div className="confirm-art">
                <CityBuildingArt building={confirm.building} level={confirm.action === 'build' ? 1 : (save.buildings[confirm.building.id]?.level || 1) + 1} />
              </div>
              <div>
                <div className="confirm-stat"><span>사용 코인</span><b>₩ {confirm.cost.toLocaleString()}</b></div>
                <div className="confirm-stat"><span>안전지수</span><b className="positive">+{confirm.building.safetyPerLevel}</b></div>
                <div className="confirm-stat"><span>건설 후 잔액</span><b>₩ {(save.coins - confirm.cost).toLocaleString()}</b></div>
              </div>
            </div>
            <p className="confirm-note">{confirm.building.benefit}</p>
            <div className="modal-actions">
              <GameButton variant="ghost" onClick={() => setConfirm(null)}>취소</GameButton>
              <GameButton variant="gold" icon="build" onClick={execute}>
                {confirm.action === 'build' ? '건설 시작' : '업그레이드'}
              </GameButton>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
