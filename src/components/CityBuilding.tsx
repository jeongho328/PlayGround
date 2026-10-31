import { useId } from 'react'
import type { BuildingDef } from '../types'

export function CityBuildingArt({ building, level }: { building: BuildingDef; level: number }) {
  const uid = useId().replace(/:/g, '')
  const kind = building.kind
  const heightBoost = Math.min(20, (level - 1) * 8)
  return (
    <svg className={`building-art art-${kind} level-${level}`} viewBox="0 0 240 280" role="img" aria-label={`${building.name} 레벨 ${level}`}>
      <defs>
        <linearGradient id={`wall-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff7e8" />
          <stop offset="1" stopColor="#f2dfc4" />
        </linearGradient>
        <linearGradient id={`red-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7a56" />
          <stop offset="1" stopColor="#df4936" />
        </linearGradient>
        <linearGradient id={`blue-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ad9ed" />
          <stop offset="1" stopColor="#35a8cd" />
        </linearGradient>
        <linearGradient id={`roof-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb65e" />
          <stop offset="1" stopColor="#ee7f40" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6c9" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffe16f" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="122" cy="263" rx="88" ry="13" fill="#305b47" opacity=".18" />

      {kind === 'firestation' && <FireStation uid={uid} level={level} heightBoost={heightBoost} />}
      {kind === 'apartment' && <Apartment uid={uid} level={level} heightBoost={heightBoost} />}
      {kind === 'school' && <School uid={uid} level={level} heightBoost={heightBoost} />}
      {kind === 'house' && <House uid={uid} level={level} heightBoost={heightBoost} />}
      {kind === 'store' && <Store uid={uid} level={level} heightBoost={heightBoost} />}
      {kind === 'park' && <Park uid={uid} level={level} />}
      {kind === 'safety' && <SafetyCenter uid={uid} level={level} heightBoost={heightBoost} />}
      {kind === 'hospital' && <Hospital uid={uid} level={level} heightBoost={heightBoost} />}
      {kind === 'community' && <Community uid={uid} level={level} heightBoost={heightBoost} />}
    </svg>
  )
}

function Windows({ x, y, cols, rows, gapX = 24, gapY = 26, lit = true, round = 3 }: { x: number; y: number; cols: number; rows: number; gapX?: number; gapY?: number; lit?: boolean; round?: number }) {
  return (
    <g>
      {Array.from({ length: rows }).flatMap((_, row) =>
        Array.from({ length: cols }).map((_, col) => (
          <g key={`${row}-${col}`}>
            <rect x={x + col * gapX} y={y + row * gapY} width="14" height="16" rx={round} fill="#fff1bb" opacity={lit && (row + col) % 3 !== 0 ? 0.96 : 0.25} />
            <rect x={x + col * gapX + 3} y={y + row * gapY + 3} width="4" height="7" rx="1" fill="#ffffff" opacity=".55" />
          </g>
        )),
      )}
    </g>
  )
}

function LevelDecor({ level, x = 194, y = 64 }: { level: number; x?: number; y?: number }) {
  return (
    <g>
      {level >= 2 && (
        <g transform={`translate(${x} ${y})`}>
          <path d="M0 16V5" stroke="#e39b3e" strokeWidth="3" />
          <path d="M0 6c8-6 13 2 21-2v9c-8 4-13-4-21 2V6Z" fill="#ffcf4a" />
        </g>
      )}
      {level >= 3 && (
        <g transform={`translate(${x - 30} ${y + 10})`} className="building-sparkle">
          <path d="M0-9 3-3 9 0 3 3 0 9-3 3-9 0-3-3Z" fill="#fff0a1" />
          <circle cx="12" cy="-12" r="2.5" fill="#fff" />
        </g>
      )}
    </g>
  )
}

function FireStation({ uid, level, heightBoost }: { uid: string; level: number; heightBoost: number }) {
  return (
    <g>
      <rect x="38" y="104" width="138" height="144" rx="10" fill={`url(#red-${uid})`} />
      <rect x="154" y="116" width="28" height="132" rx="8" fill="#bd3e30" />
      <rect x="38" y="104" width="138" height="17" rx="8" fill="#ffb28b" opacity=".7" />
      <rect x="52" y="124" width="34" height="38" rx="6" fill="#fff1d5" />
      <rect x="92" y="124" width="68" height="38" rx="6" fill="#5e352e" />
      <text x="126" y="150" textAnchor="middle" fill="#ffcf4a" fontSize="21" fontWeight="800" fontFamily="Jua, sans-serif">119</text>
      <rect x="52" y="171" width="110" height="57" rx="6" fill="#f5e8d4" />
      <rect x="64" y="178" width="86" height="42" rx="3" fill="#b7cbd4" />
      {[72, 86, 100, 114, 128].map((x) => (
        <rect key={x} x={x} y="183" width="8" height="37" rx="2" fill="#d6e9ee" opacity=".72" />
      ))}
      <rect x="64" y="214" width="24" height="8" rx="4" fill="#ef5741" />
      <rect x="64" y="214" width="8" height="8" fill="#ffbe3f" />
      <rect x="38" y="238" width="138" height="10" rx="4" fill="#d6bba1" />
      <path d="M42 93h37V66h20v27h20V54h20v39h32v17H42V93Z" fill="#f6e4c7" />
      <path d="M37 109h144" stroke="#b92f26" strokeWidth="4" />
      <circle cx="192" cy="88" r="6" fill="#ffbe3f" stroke="#fff" strokeWidth="2" />
      <path d="M190 84c2-3 5-3 6 0 2 2 1 5-2 6-2-2-4-4-4-6Z" fill="#fff" />
      <LevelDecor level={level} x={196} y={62} />
      {level >= 2 && (
        <g>
          <rect x="31" y="157" width="7" height="24" rx="3" fill="#f1e0c4" />
          <circle cx="34" cy="154" r="7" fill="#ffe9a8" />
          {level >= 3 && <circle cx="34" cy="154" r="12" fill="#ffdd70" opacity=".28" />}
        </g>
      )}
      {level >= 3 && (
        <g transform="translate(43 224)">
          <rect x="0" y="0" width="29" height="9" rx="4" fill="#ffcf4a" />
          <text x="14.5" y="7" textAnchor="middle" fontSize="6" fontWeight="700" fill="#8f3b28">SAFE</text>
        </g>
      )}
    </g>
  )
}

function Apartment({ uid, level, heightBoost }: { uid: string; level: number; heightBoost: number }) {
  const top = 64 - heightBoost
  return (
    <g>
      <rect x="58" y={top + 28} width="118" height={218 - heightBoost} rx="9" fill="#f5e8d5" />
      <rect x="161" y={top + 38} width="20" height={205 - heightBoost} rx="5" fill="#ddc7ab" />
      <rect x="58" y={top + 28} width="118" height="13" fill="#d9c3a6" />
      <rect x="63" y={top + 48} width="108" height="24" rx="5" fill="#3aa0c5" />
      <text x="117" y={top + 65} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="Jua, sans-serif">세이프 아파트 103</text>
      <g>
        {[0, 1, 2, 3, 4, 5].map((row) =>
          [0, 1, 2].map((col) => (
            <g key={`${row}-${col}`}>
              <rect
                x={73 + col * 31}
                y={top + 84 + row * 26}
                width="22"
                height="17"
                rx="3"
                fill={(row + col) % 4 === 0 ? '#ffe9a6' : '#8ac8db'}
                opacity={(row + col) % 4 === 0 ? 0.95 : 0.68}
              />
              <rect x={73 + col * 31} y={top + 97 + row * 26} width="22" height="4" rx="2" fill="#d1b89b" />
            </g>
          )),
        )}
      </g>
      <rect x="97" y={top + 201} width="31" height="45" rx="5" fill="#9b7654" />
      <rect x="104" y={top + 210} width="17" height="17" rx="8" fill="#6f9ab0" />
      <rect x="63" y={top + 28} width="118" height="10" rx="5" fill="#c6af93" />
      <path d="M65 54h104l-7-17H72l-7 17Z" fill={`url(#roof-${uid})`} opacity=".9" />
      <rect x="105" y={top + 22} width="24" height="10" rx="4" fill="#8d6d53" />
      {level >= 2 && (
        <g>
          <path d="M160 106h13v36h-13z" fill="#fff8da" opacity=".9" />
          <path d="M163 108h7v7h-7zM163 120h7v7h-7z" fill="#ffbe3f" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <path d="M50 126h11v11h-11z" fill="#fff" />
          <path d="M53 129h5v5h-5z" fill="#ff6b45" />
          <circle cx="164" cy="61" r="4" fill="#ffdf71" />
        </g>
      )}
      <LevelDecor level={level} x={196} y={82} />
    </g>
  )
}

function School({ uid, level, heightBoost }: { uid: string; level: number; heightBoost: number }) {
  const top = 94 - heightBoost
  return (
    <g>
      <rect x="33" y={top + 24} width="172" height={132 + heightBoost} rx="10" fill="#f8e7b8" />
      <rect x="33" y={top + 24} width="172" height="18" fill="#f1cf7f" />
      <path d="M26 50 120 4l94 46v16H26V50Z" fill={`url(#roof-${uid})`} />
      <path d="M42 57 120 20l78 37" fill="none" stroke="#ffd9a0" strokeWidth="4" opacity=".5" />
      <rect x="99" y="25" width="43" height="22" rx="11" fill="#fff8e9" stroke="#d5a553" strokeWidth="3" />
      <circle cx="120.5" cy="36" r="7" fill="#fff" stroke="#4a7d94" strokeWidth="2" />
      <path d="M120.5 36v-4M120.5 36l3 2" stroke="#4a7d94" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="48" y={top + 64} width="39" height="31" rx="4" fill="#7ac8df" />
      <rect x="98" y={top + 64} width="44" height="31" rx="4" fill="#7ac8df" />
      <rect x="153" y={top + 64} width="35" height="31" rx="4" fill="#7ac8df" />
      <path d="M53 69h26M102 69h32M157 69h24" stroke="#dff8ff" strokeWidth="3" opacity=".6" strokeLinecap="round" />
      <rect x="96" y={top + 108} width="46" height="48" rx="5" fill="#a6744d" />
      <rect x="104" y={top + 115} width="30" height="21" rx="3" fill="#d6eef4" />
      <path d="M120 115v21M104 125h30" stroke="#fff" strokeWidth="2" />
      <rect x="41" y={top + 140} width="42" height="16" rx="4" fill="#8dbb6b" />
      <rect x="156" y={top + 140} width="42" height="16" rx="4" fill="#8dbb6b" />
      {level >= 2 && (
        <g>
          <path d="M51 202h19v10H51z" fill="#fff" />
          <path d="M57 205h7v4h-7z" fill="#f26b4b" />
          <path d="M192 170v32" stroke="#c49a59" strokeWidth="3" />
          <path d="M189 170c5-10 10-5 15-12v9c-5 7-10 2-15 11v-8Z" fill="#68c3d8" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <circle cx="205" cy="121" r="9" fill="#ffdd70" />
          <path d="M205 114v14M198 121h14" stroke="#fff5bd" strokeWidth="2" />
        </g>
      )}
      <LevelDecor level={level} x={205} y={88} />
    </g>
  )
}

function House({ uid, level, heightBoost }: { uid: string; level: number; heightBoost: number }) {
  const top = 146 - heightBoost
  return (
    <g>
      <rect x="58" y={top + 42} width="113" height={86 + heightBoost} rx="5" fill="#f1e1c7" />
      <path d="M45 197 113 122l69 75v13H45v-13Z" fill={`url(#roof-${uid})`} />
      <path d="M58 197v-19l55-56 55 56v19H58Z" fill="#e4c8a4" />
      <path d="M53 188h128" stroke="#c07d3c" strokeWidth="4" />
      <rect x="88" y="204" width="38" height="41" rx="4" fill="#8a6649" />
      <circle cx="118" cy="224" r="3" fill="#ffcf4a" />
      <rect x="66" y="170" width="28" height="30" rx="4" fill="#9ad6e2" />
      <path d="M80 170v30M66 185h28" stroke="#fff" strokeWidth="2.5" />
      <rect x="137" y="170" width="25" height="24" rx="4" fill="#9ad6e2" />
      <path d="M158 132h18v45h-18z" fill="#d7b58a" />
      <path d="M158 130h18v10h-18z" fill="#a77a52" />
      <g className="chimney-smoke">
        <circle cx="168" cy="120" r="5" fill="#fff" opacity=".55" />
        <circle cx="175" cy="110" r="7" fill="#fff" opacity=".4" />
        <circle cx="166" cy="100" r="9" fill="#fff" opacity=".25" />
      </g>
      <path d="M47 205c6 9 15 15 27 17" fill="none" stroke="#8bbd70" strokeWidth="5" strokeLinecap="round" />
      {level >= 2 && (
        <g>
          <rect x="64" y="238" width="7" height="13" rx="2" fill="#fff3d7" />
          <circle cx="67.5" cy="235" r="6" fill="#ffd86e" />
          <rect x="165" y="235" width="7" height="15" rx="2" fill="#fff3d7" />
          <circle cx="168.5" cy="232" r="6" fill="#ffd86e" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <rect x="160" y="201" width="36" height="13" rx="4" fill="#8dbb6b" />
          {[166, 175, 184].map((x) => (
            <path key={x} d={`M${x} 201c-6-8 3-12 0-18 7 4 8 12 0 18Z`} fill="#f27b6b" />
          ))}
        </g>
      )}
      <LevelDecor level={level} x={199} y={141} />
    </g>
  )
}

function Store({ uid, level, heightBoost }: { uid: string; level: number; heightBoost: number }) {
  const top = 120 - heightBoost
  return (
    <g>
      <rect x="51" y={top + 50} width="146" height={108 + heightBoost} rx="7" fill="#f3e6d0" />
      <rect x="51" y={top + 50} width="146" height="17" rx="7" fill="#d5b994" />
      <rect x="60" y={top + 72} width="54" height="62" rx="5" fill="#9ad6df" />
      <rect x="123" y={top + 72} width="66" height="39" rx="5" fill="#f8f0dc" />
      <path d="M123 72h66v10h-66z" fill="#e9a45d" />
      <rect x="132" y={top + 123} width="50" height="34" rx="4" fill="#8a6649" />
      <rect x="73" y={top + 138} width="31" height="20" rx="3" fill="#8a6649" />
      <rect x="57" y={top + 167} width="128" height="18" rx="5" fill="#ffb454" />
      <path d="M57 176h128" stroke="#f08b3c" strokeWidth="3" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <path key={index} d={`M${62 + index * 16} 169h13l-3 15h-7l-3-15Z`} fill={index % 2 ? '#ff7b6a' : '#fff6dd'} />
      ))}
      <rect x="93" y={top + 34} width="61" height="23" rx="11" fill="#5a7f94" />
      <text x="123.5" y={top + 50} textAnchor="middle" fill="#fff8dc" fontSize="11" fontWeight="800" fontFamily="Jua, sans-serif">SAFE MART</text>
      {level >= 2 && (
        <g>
          <path d="M188 199h19v14h-19z" fill="#fff" />
          <path d="M192 203h11v6h-11z" fill="#42b7d1" />
          <circle cx="197.5" cy="215" r="3" fill="#4b4b4b" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <rect x="53" y="214" width="42" height="18" rx="5" fill="#8dbb6b" />
          {[59, 69, 79].map((x) => (
            <circle key={x} cx={x} cy="216" r="4" fill="#ff8e72" />
          ))}
        </g>
      )}
      <LevelDecor level={level} x={199} y={88} />
    </g>
  )
}

function Park({ uid, level }: { uid: string; level: number }) {
  return (
    <g>
      <path d="M28 225c24-31 42-31 63-17 24-22 55-19 69 5 25-13 48 1 55 25 6 18-18 27-92 27-60 0-80-6-95-17-8-6-7-15 0-23Z" fill="#8ecf76" opacity=".82" />
      <path d="M32 235c27-9 55-11 83-6 32 6 61 4 91-4" fill="none" stroke="#e9d9a8" strokeWidth="12" strokeLinecap="round" />
      <ellipse cx="76" cy="237" rx="43" ry="9" fill="#4f8a5c" opacity=".24" />
      <rect x="69" y="166" width="14" height="65" rx="7" fill="#8c6040" />
      <circle cx="76" cy="146" r="44" fill="#5fb46d" />
      <circle cx="49" cy="160" r="23" fill="#78c77f" />
      <circle cx="98" cy="158" r="27" fill="#4ca968" />
      <circle cx="73" cy="124" r="23" fill="#71c47b" />
      {level >= 2 && (
        <g>
          <ellipse cx="166" cy="210" rx="33" ry="12" fill="#d8c9a6" />
          <ellipse cx="166" cy="207" rx="26" ry="9" fill="#64c6df" />
          <path d="M166 192v14" stroke="#fff8d7" strokeWidth="4" />
          <path d="M161 192c0-7 10-7 10 0" fill="none" stroke="#fff8d7" strokeWidth="4" />
          <circle cx="198" cy="210" r="2.5" fill="#9ee6ff" />
          <circle cx="138" cy="214" r="2" fill="#9ee6ff" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <rect x="158" y="231" width="28" height="6" rx="3" fill="#c18555" />
          <rect x="161" y="237" width="4" height="9" fill="#8c6040" />
          <rect x="179" y="237" width="4" height="9" fill="#8c6040" />
          <circle cx="198" cy="155" r="10" fill="#ffdd70" opacity=".85" />
          <path d="M198 149v12M192 155h12" stroke="#fff8cf" strokeWidth="2" />
        </g>
      )}
      <path d="M31 250c14-20 36-28 57-30" fill="none" stroke="#5baa69" strokeWidth="4" strokeLinecap="round" opacity=".7" />
      {level >= 2 && (
        <g transform="translate(206 236)">
          <rect x="0" y="0" width="20" height="14" rx="3" fill="#fff8e6" />
          <path d="M3 4h14M3 8h10" stroke="#89a7b8" strokeWidth="1.5" />
        </g>
      )}
    </g>
  )
}

function SafetyCenter({ uid, level, heightBoost }: { uid: string; level: number; heightBoost: number }) {
  return (
    <g>
      <rect x="43" y={153 - heightBoost} width="155" height="100" rx="14" fill="#eaf7f3" />
      <path d="M43 164c24-36 47-57 78-73 30 16 52 37 77 73v6H43v-6Z" fill="#ffffff" opacity=".7" />
      <path d="M60 154c18-28 36-44 61-58 23 14 40 30 59 58" fill="none" stroke="#55c5b6" strokeWidth="6" opacity=".6" />
      <rect x="59" y="165" width="123" height="57" rx="9" fill="#79d7d0" opacity=".55" />
      <rect x="69" y="173" width="103" height="41" rx="5" fill="#baf0e6" opacity=".7" />
      <path d="M86 173v41M106 173v41M126 173v41M146 173v41" stroke="#fff" strokeWidth="2" opacity=".6" />
      <rect x="77" y="226" width="88" height="24" rx="7" fill="#f6a84b" />
      <text x="121" y="243" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800" fontFamily="Jua, sans-serif">안전체험관</text>
      <path d="M35 223h171" stroke="#c7e7df" strokeWidth="5" strokeLinecap="round" />
      <circle cx="55" cy="237" r="6" fill="#f26b4b" />
      <circle cx="184" cy="237" r="6" fill="#f26b4b" />
      {level >= 2 && (
        <g>
          <path d="M195 123v31" stroke="#8fb7b0" strokeWidth="4" />
          <path d="M191 123c3-8 8-4 11-10v7c-3 6-8 2-11 8v-5Z" fill="#ffcf4a" />
          <circle cx="195" cy="119" r="4" fill="#ffcf4a" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <path d="M97 84h8v16h16v8h-16v16h-8v-16H81v-8h16V84Z" fill="#ff7188" />
          <circle cx="121" cy="100" r="39" fill={`url(#glow-${uid})`} opacity=".45" />
        </g>
      )}
      <LevelDecor level={level} x={208} y={93} />
    </g>
  )
}

function Hospital({ uid, level, heightBoost }: { uid: string; level: number; heightBoost: number }) {
  const top = 86 - heightBoost
  return (
    <g>
      <rect x="36" y={top + 40} width="168" height={142 + heightBoost} rx="10" fill="#effaf9" />
      <rect x="36" y={top + 40} width="168" height="14" rx="6" fill="#c7ebe7" />
      <rect x="49" y={top + 66} width="52" height="30" rx="4" fill="#83d3df" />
      <rect x="111" y={top + 66} width="79" height="30" rx="4" fill="#83d3df" />
      <rect x="49" y={top + 106} width="52" height="26" rx="4" fill="#a5dde6" />
      <rect x="111" y={top + 106} width="79" height="26" rx="4" fill="#a5dde6" />
      <rect x="88" y={top + 148} width="64" height="34" rx="5" fill="#5b8796" />
      <rect x="83" y={top + 14} width="74" height="38" rx="9" fill="#fff" />
      <path d="M113 19h14v9h9v14h-9v9h-14v-9h-9V28h9v-9Z" fill="#ff6b6b" />
      <rect x="52" y={top + 166} width="80" height="16" rx="5" fill="#54b8b0" />
      <rect x="140" y={top + 166} width="48" height="16" rx="5" fill="#ffb454" />
      {level >= 2 && (
        <g>
          <rect x="35" y={top + 157} width="25" height="15" rx="4" fill="#fdfdf6" />
          <path d="M47 160v9M43 164h8" stroke="#ff6b6b" strokeWidth="2" />
          <path d="M200 177v26" stroke="#c3d2d5" strokeWidth="3" />
          <path d="M200 176c8-9 13-3 18-9v9c-5 6-10 0-18 9v-9Z" fill="#68c3d8" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <path d="M33 232h174" stroke="#c7e3df" strokeWidth="4" />
          <circle cx="48" cy="225" r="5" fill="#ffcf4a" />
          <circle cx="195" cy="225" r="5" fill="#ffcf4a" />
        </g>
      )}
      <LevelDecor level={level} x={210} y={80} />
    </g>
  )
}

function Community({ uid, level, heightBoost }: { uid: string; level: number; heightBoost: number }) {
  const top = 130 - heightBoost
  return (
    <g>
      <rect x="44" y={top + 48} width="153" height={112 + heightBoost} rx="12" fill="#f4e1c2" />
      <path d="M38 154 121 96l85 58v11H38v-11Z" fill="#db8b52" />
      <path d="M52 149 121 102l70 47" fill="none" stroke="#ffcf8c" strokeWidth="4" opacity=".5" />
      <rect x="63" y={top + 78} width="42" height="42" rx="4" fill="#8bc9d7" />
      <rect x="119" y={top + 78} width="56" height="42" rx="4" fill="#8bc9d7" />
      <path d="M84 78v42M119 99h56" stroke="#fff" strokeWidth="2.5" opacity=".7" />
      <rect x="94" y={top + 132} width="48" height="28" rx="4" fill="#8a6649" />
      <path d="M94 146h48" stroke="#d9b880" strokeWidth="3" />
      <rect x="50" y="211" width="56" height="16" rx="5" fill="#8dbb6b" />
      <rect x="153" y="211" width="37" height="16" rx="5" fill="#8dbb6b" />
      <path d="M177 96v46" stroke="#b78b62" strokeWidth="4" />
      <path d="M172 95c8-12 16-5 24-14v12c-8 9-16 2-24 14V95Z" fill="#ffcf4a" />
      {level >= 2 && (
        <g>
          <circle cx="193" cy="201" r="17" fill="#ebf9f2" />
          <circle cx="193" cy="201" r="12" fill="#73cfb8" />
          <path d="M193 193v16M185 201h16" stroke="#fff" strokeWidth="2.5" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <rect x="50" y="237" width="142" height="8" rx="4" fill="#d8bd9b" />
          {[62, 82, 102, 122, 142, 162, 182].map((x) => (
            <circle key={x} cx={x} cy="247" r="2.5" fill="#ffcf4a" />
          ))}
        </g>
      )}
      <LevelDecor level={level} x={209} y={98} />
    </g>
  )
}
