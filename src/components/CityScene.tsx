import type { BuildingDef, GameSave } from '../types'
import { BUILDINGS, buildingById } from '../data/city'
import { CityBuildingArt } from './CityBuilding'
import { Mascot } from './Mascot'
import { Icon } from './Icon'

export function CityScene({
  save,
  onSelectBuilding,
  onBuild,
  recentlyBuilt,
}: {
  save: GameSave
  onSelectBuilding: (building: BuildingDef) => void
  onBuild: (id: string) => void
  recentlyBuilt?: string | null
}) {
  return (
    <div className="city-scroll">
      <div className="city-stage" aria-label="세이프시티 지도">
        <CityBackground />
        <div className="city-sun" aria-hidden="true" />
        <div className="city-cloud cloud-one" aria-hidden="true" />
        <div className="city-cloud cloud-two" aria-hidden="true" />
        <div className="city-cloud cloud-three" aria-hidden="true" />

        <div className="city-road-cars" aria-hidden="true">
          <div className="toy-car car-one"><span /><i /></div>
          <div className="toy-car car-two"><span /><i /></div>
          <div className="toy-car car-three"><span /><i /></div>
        </div>

        <div className="city-citizens" aria-hidden="true">
          <span className="citizen citizen-a">🧑‍🦱</span>
          <span className="citizen citizen-b">👩‍🦰</span>
          <span className="citizen citizen-c">🧒</span>
          <span className="citizen citizen-d">🧓</span>
        </div>

        {BUILDINGS.map((building) => {
          const state = save.buildings[building.id]
          if (!state?.built) {
            return (
              <button
                key={building.id}
                type="button"
                className="city-plot"
                style={{ left: building.position.left, top: building.position.top, width: `calc(${building.position.width} * .82)`, zIndex: building.position.z }}
                onClick={() => onBuild(building.id)}
                aria-label={`${building.name} 건설 부지. ${building.buildCost} 코인으로 건설`}
              >
                <span className="plot-crane" aria-hidden="true">
                  <i className="crane-mast" />
                  <i className="crane-arm" />
                  <i className="crane-hook" />
                  <i className="crane-base" />
                </span>
                <span className="plot-pad">
                  <span className="plot-plus">+</span>
                  <span className="plot-label">건설 부지</span>
                  <span className="plot-cost"><b>₩</b>{building.buildCost}</span>
                </span>
              </button>
            )
          }
          const related = building.missions
          const completed = related.filter((id) => save.missions[id]?.completed).length
          const allDone = related.length > 0 && completed === related.length
          return (
            <button
              key={building.id}
              type="button"
              className={`city-building ${recentlyBuilt === building.id ? 'just-built' : ''}`}
              style={{ left: building.position.left, top: building.position.top, width: building.position.width, zIndex: building.position.z }}
              onClick={() => onSelectBuilding(building)}
              aria-label={`${building.name}, 레벨 ${state.level}. 클릭하여 정보 보기`}
            >
              <span className="building-bubble">
                {allDone ? <Icon name="check" size={13} /> : <Icon name="mission" size={13} />}
                {allDone ? '안전 완료' : `${completed}/${related.length} 미션`}
              </span>
              <span className="building-art-wrap">
                <CityBuildingArt building={building} level={state.level} />
              </span>
              <span className="building-nameplate">
                <span className="nameplate-star"><Icon name="star" size={12} /></span>
                {building.shortName}
                <span className="nameplate-level">Lv.{state.level}</span>
              </span>
            </button>
          )
        })}

        <div className="city-mascot city-mascot-fire" aria-hidden="true">
          <Mascot name="fire" mood="cheer" size={66} />
        </div>
        <div className="city-mascot city-mascot-safi" aria-hidden="true">
          <Mascot name="safi" mood="happy" size={54} />
        </div>

        <div className="city-flag" aria-hidden="true">
          <span className="flag-pole" />
          <span className="flag-cloth">SAFE<br />CITY</span>
        </div>

        <div className="city-map-label">
          <span className="map-dot" />
          세이프시티 중심가
        </div>
      </div>
    </div>
  )
}

function CityBackground() {
  return (
    <svg className="city-bg" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#94ddf6" />
          <stop offset=".56" stopColor="#d7f4fb" />
          <stop offset="1" stopColor="#f8efd4" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8d98a" />
          <stop offset="1" stopColor="#75bd73" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9b5bb" />
          <stop offset="1" stopColor="#87959e" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fd8ea" />
          <stop offset="1" stopColor="#4ebdd8" />
        </linearGradient>
      </defs>
      <rect width="1440" height="810" fill="url(#sky)" />
      <circle cx="1206" cy="136" r="57" fill="#fff2a8" opacity=".9" />
      <circle cx="1206" cy="136" r="86" fill="#fff7c9" opacity=".23" />
      <path d="M0 302c115-86 216-85 326-41 94-74 230-91 335-28 104-65 230-68 342 3 107-49 226-45 327 24 58 39 86 69 110 94H0v-52Z" fill="#b8dcb0" opacity=".72" />
      <path d="M0 354c144-64 257-54 386-18 121-52 243-51 352-6 104-46 241-45 351 6 113-31 233-22 351 27v84H0v-93Z" fill="#92cc8e" opacity=".82" />
      <path d="M0 430c159-61 284-52 414-4 101-35 210-35 311 1 120-50 253-45 369 7 113-36 227-31 346 20v356H0V430Z" fill="url(#ground)" />

      <path d="M-30 545c125-52 236-38 351-8 122-49 242-35 353 10 116-46 242-39 365 9 116-34 238-27 431 33v104c-204-59-331-66-452-31-114-47-234-55-352-9-120-45-242-57-355-16-110-38-218-43-341 3v-95Z" fill="#6fb56c" opacity=".46" />
      <path d="M-20 655c149-45 253-18 352 11 148-50 269-18 366 13 117-34 230-35 352 3 123-42 256-26 400 19v109H-20V655Z" fill="#5ba65e" opacity=".33" />

      <path d="M-40 690c210-67 343-41 478-5 150-57 280-34 416 0 123-43 253-39 405 6 102-29 172-24 241-6v125H-40v-120Z" fill="url(#road)" />
      <path d="M-40 696c210-67 343-41 478-5 150-57 280-34 416 0 123-43 253-39 405 6 102-29 172-24 241-6" fill="none" stroke="#f4e9c5" strokeWidth="6" strokeDasharray="30 30" opacity=".9" />
      <path d="M-40 784c204-51 348-43 488-16 151-40 286-25 429 10 119-26 243-18 370 11 82-18 152-22 233-7v38H-40v-36Z" fill="#d8cfb0" />

      <path d="M1066 439c69-15 129 3 149 44 18 38-16 68-72 68-60 0-106-20-119-52-12-30 13-51 42-60Z" fill="#84d6e3" opacity=".9" />
      <path d="M1084 459c45-9 85 3 96 27 10 21-12 38-48 38-41 0-70-11-79-28-8-18 8-31 31-37Z" fill="url(#river)" />
      <ellipse cx="1133" cy="498" rx="22" ry="5" fill="#fff" opacity=".35" />
      <ellipse cx="1105" cy="478" rx="17" ry="4" fill="#fff" opacity=".3" />

      <path d="M86 655c48-25 95-16 142 8 53-19 99-10 143 12" fill="none" stroke="#71b96f" strokeWidth="30" strokeLinecap="round" opacity=".4" />
      <path d="M470 560c24-13 48-9 70 3" fill="none" stroke="#dfd5b5" strokeWidth="8" strokeLinecap="round" />
      <path d="M472 636c42-17 83-12 122 4" fill="none" stroke="#e4d9b8" strokeWidth="10" strokeLinecap="round" opacity=".74" />

      {[
        [86, 563, 1], [149, 600, 0.8], [930, 612, 1.1], [985, 557, 0.8], [1258, 598, 0.9], [1355, 521, 1.1], [405, 510, 0.7],
      ].map(([x, y, scale], index) => (
        <g key={index} transform={`translate(${x} ${y}) scale(${scale})`}>
          <ellipse cx="0" cy="32" rx="22" ry="6" fill="#456d44" opacity=".2" />
          <rect x="-4" y="9" width="8" height="25" rx="4" fill="#8b6542" />
          <circle cx="-12" cy="5" r="16" fill="#5aab64" />
          <circle cx="10" cy="4" r="18" fill="#4e9f5b" />
          <circle cx="0" cy="-7" r="17" fill="#72bf75" />
        </g>
      ))}

      <g transform="translate(1242 451)">
        <ellipse cx="0" cy="87" rx="36" ry="9" fill="#3e6843" opacity=".2" />
        <rect x="-6" y="26" width="12" height="60" rx="6" fill="#8e6844" />
        <circle cx="-19" cy="16" r="24" fill="#51a35e" />
        <circle cx="17" cy="12" r="28" fill="#63b56b" />
        <circle cx="0" cy="-9" r="26" fill="#7ac87b" />
      </g>

      <g transform="translate(120 400)">
        <path d="M0 30v-18c0-6 5-10 11-10h35c5 0 8 3 8 7v21H0Z" fill="#fff5d8" />
        <path d="M8 8c6-11 18-14 29-8l-4 9H8Z" fill="#df7c59" />
        <rect x="6" y="14" width="10" height="9" rx="2" fill="#8fd6e2" />
        <rect x="22" y="14" width="10" height="9" rx="2" fill="#8fd6e2" />
        <rect x="39" y="14" width="9" height="16" rx="2" fill="#a77c56" />
      </g>
    </svg>
  )
}
