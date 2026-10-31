import type { FireStep } from '../types'
import { Mascot } from '../components/Mascot'

export function FireScene({ scene, danger, stepId }: { scene: FireStep['scene']; danger: FireStep['danger']; stepId: string }) {
  return (
    <div className={`fire-scene scene-${scene} danger-${danger}`} data-step={stepId}>
      <div className="scene-sky-glow" aria-hidden="true" />
      <svg viewBox="0 0 900 560" className="fire-scene-svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label={sceneLabel(scene)}>
        <defs>
          <linearGradient id={`roomWall-${stepId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f7e9d4" />
            <stop offset="1" stopColor="#e8cfad" />
          </linearGradient>
          <linearGradient id={`floor-${stepId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c99463" />
            <stop offset="1" stopColor="#a8714d" />
          </linearGradient>
          <linearGradient id={`window-${stepId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#173052" />
            <stop offset="1" stopColor="#355174" />
          </linearGradient>
          <radialGradient id={`fireGlow-${stepId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffd45e" stopOpacity=".8" />
            <stop offset=".55" stopColor="#ff7a3d" stopOpacity=".32" />
            <stop offset="1" stopColor="#ff5a2c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`smokeGrad-${stepId}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#5b6673" stopOpacity=".62" />
            <stop offset="1" stopColor="#9ba4aa" stopOpacity="0" />
          </linearGradient>
        </defs>

        {scene === 'apartment' && <ApartmentScene stepId={stepId} danger={danger} />}
        {scene === 'corridor' && <CorridorScene stepId={stepId} danger={danger} />}
        {scene === 'smokeRoom' && <SmokeRoomScene stepId={stepId} danger={danger} />}
        {scene === 'cinema' && <CinemaScene stepId={stepId} danger={danger} />}
        {scene === 'school' && <SchoolScene stepId={stepId} danger={danger} />}
        {scene === 'outside' && <OutsideScene stepId={stepId} danger={danger} />}
      </svg>

      <div className="scene-vignette" aria-hidden="true" />
      <div className={`fire-particles particles-${danger}`} aria-hidden="true">
        {Array.from({ length: danger * 5 }).map((_, index) => (
          <span key={index} style={{ '--i': index, '--x': `${12 + ((index * 23) % 72)}%`, '--delay': `${(index % 7) * 0.5}s` } as React.CSSProperties} />
        ))}
      </div>

      <div className="scene-smoke-layer" aria-hidden="true">
        <span className="smoke-puff sp1" />
        <span className="smoke-puff sp2" />
        <span className="smoke-puff sp3" />
      </div>

      <div className="scene-character">
        <Mascot name="fire" mood="worry" size={92} />
      </div>

      <div className="scene-caption">
        <span className={`danger-badge danger-${danger}`}>
          <i /> 위험도 {danger === 3 ? '높음' : danger === 2 ? '주의' : '낮음'}
        </span>
        <span className="scene-location-label">{sceneLabel(scene)}</span>
      </div>
    </div>
  )
}

function sceneLabel(scene: FireStep['scene']) {
  switch (scene) {
    case 'apartment': return '우리 집 · 거실'
    case 'corridor': return '아파트 복도 · 계단 앞'
    case 'smokeRoom': return '연기가 들어오는 방'
    case 'cinema': return '세이프시네마 3관'
    case 'school': return '세이프초등학교 3층'
    case 'outside': return '건물 밖 · 대피 집결지'
  }
}

function ApartmentScene({ stepId, danger }: { stepId: string; danger: number }) {
  return (
    <g>
      <rect width="900" height="560" fill={`url(#roomWall-${stepId})`} />
      <rect y="410" width="900" height="150" fill={`url(#floor-${stepId})`} />
      <path d="M0 410h900" stroke="#8d5f43" strokeWidth="9" opacity=".35" />
      {[70, 180, 290, 400, 510, 620, 730, 840].map((x) => (
        <path key={x} d={`M${x} 414v146`} stroke="#8d5f43" strokeWidth="3" opacity=".16" />
      ))}
      <rect x="60" y="62" width="230" height="170" rx="10" fill="#faf4e8" stroke="#d7bc98" strokeWidth="7" />
      <rect x="74" y="76" width="202" height="142" rx="5" fill={`url(#window-${stepId})`} />
      <path d="M175 76v142M74 147h202" stroke="#e5d7bd" strokeWidth="6" />
      <g className="window-fire-glow">
        <circle cx="248" cy="190" r="86" fill={`url(#fireGlow-${stepId})`} />
        <path d="M220 212c-10-27 2-44 17-56-1 15 8 18 12 29 7-7 7-17 5-23 16 12 25 29 17 50-5 14-20 21-33 15-10-4-16-9-18-15Z" fill="#ff8a42" opacity=".84" />
      </g>
      <rect x="60" y="232" width="230" height="10" rx="5" fill="#d7bc98" />
      <g className="scene-smoke-source">
        <ellipse cx="262" cy="186" rx="36" ry="20" fill="#70777d" opacity=".35" />
        <ellipse cx="282" cy="160" rx="28" ry="18" fill="#747b80" opacity=".22" />
      </g>

      <rect x="530" y="70" width="280" height="195" rx="12" fill="#f3e5cf" stroke="#d6b792" strokeWidth="8" />
      <rect x="550" y="88" width="240" height="158" rx="5" fill="#26374b" />
      <rect x="564" y="102" width="212" height="118" rx="4" fill="#45617a" opacity=".8" />
      <circle cx="670" cy="160" r="34" fill="#fff0b3" opacity=".18" />
      <path d="M572 208c30-40 62-43 89-13 27-32 54-27 80 12l22 21H572v-20Z" fill="#68a56e" opacity=".55" />
      <rect x="612" y="265" width="160" height="13" rx="6" fill="#6e5542" />
      <rect x="628" y="278" width="12" height="28" fill="#5f4a3b" />
      <rect x="746" y="278" width="12" height="28" fill="#5f4a3b" />

      <rect x="64" y="320" width="280" height="102" rx="20" fill="#708177" />
      <rect x="88" y="338" width="232" height="57" rx="14" fill="#91a39a" />
      <rect x="112" y="315" width="90" height="76" rx="16" fill="#7c8e84" />
      <rect x="205" y="315" width="90" height="76" rx="16" fill="#85988d" />
      <rect x="112" y="384" width="183" height="20" rx="8" fill="#6f8177" />

      <g>
        <rect x="690" y="300" width="140" height="200" rx="8" fill="#8f6445" />
        <rect x="704" y="315" width="112" height="185" rx="5" fill="#b78a63" />
        <circle cx="796" cy="405" r="7" fill="#f7c95f" />
        <rect x="690" y="298" width="140" height="12" rx="6" fill="#6e4a34" />
        <rect x="704" y="476" width="112" height="9" fill="#f0dcb9" opacity=".8" />
      </g>
      <g className="door-smoke">
        <ellipse cx="750" cy="482" rx="48" ry="13" fill="#6d777e" opacity=".45" />
        <ellipse cx="735" cy="464" rx="35" ry="13" fill="#6d777e" opacity=".27" />
        <ellipse cx="765" cy="447" rx="23" ry="11" fill="#6d777e" opacity=".15" />
      </g>
      <g>
        <rect x="450" y="450" width="78" height="24" rx="7" fill="#7a523b" />
        <path d="M465 450c-1-32 7-58 25-79 9 22 21 24 23 43 1 14-4 25-13 36h-35Z" fill="#5d9a68" />
        <path d="M483 449c-4-26 7-44 17-59 4 18 13 31 9 48-2 7-8 11-15 12Z" fill="#77b77d" />
        <rect x="476" y="450" width="22" height="25" rx="4" fill="#b37c52" />
      </g>
      {danger >= 2 && (
        <g className="apartment-smoke">
          <path d="M-20 330c100 30 170 7 243 24 90 21 148-15 245 7 88 20 132-13 203 2 81 17 131-9 249 14v48c-119-24-170 1-248-15-72-15-117 18-204-3-98-21-155 13-246-8-72-16-146 4-242-23v-46Z" fill="#80878a" opacity=".18" />
        </g>
      )}
    </g>
  )
}

function CorridorScene({ stepId, danger }: { stepId: string; danger: number }) {
  return (
    <g>
      <rect width="900" height="560" fill={`url(#roomWall-${stepId})`} />
      <path d="M0 0h900v560H0z" fill="#e5d8c4" />
      <path d="M0 560 205 428V162L0 40V560Z" fill="#cdb999" />
      <path d="M900 560 695 428V162L900 40V560Z" fill="#c5b08f" />
      <path d="M205 428h490v132H205z" fill="#b38a63" />
      <path d="M205 428h490L900 560H0L205 428Z" fill="#c09a72" />
      <path d="M205 162h490v266H205z" fill="#f0e3cf" />
      <path d="M205 162 0 40h900L695 162H205Z" fill="#d8c7aa" />
      <path d="M205 428 0 560M695 428l205 132M205 162 0 40M695 162 900 40" stroke="#af9675" strokeWidth="4" opacity=".5" />
      <rect x="250" y="188" width="100" height="212" rx="5" fill="#8d6649" />
      <rect x="263" y="202" width="74" height="185" rx="3" fill="#ad8660" />
      <circle cx="320" cy="299" r="5" fill="#f1c86a" />
      <rect x="424" y="211" width="115" height="217" rx="5" fill="#7e5c45" />
      <rect x="437" y="224" width="89" height="90" rx="3" fill="#b58c65" />
      <rect x="437" y="321" width="89" height="107" rx="3" fill="#a77f59" />
      <circle cx="510" cy="300" r="5" fill="#f1c86a" />
      <rect x="614" y="188" width="100" height="212" rx="5" fill="#8d6649" />
      <rect x="627" y="202" width="74" height="185" rx="3" fill="#ad8660" />
      <circle cx="639" cy="299" r="5" fill="#f1c86a" />

      <rect x="356" y="290" width="184" height="138" rx="7" fill="#546c63" />
      <rect x="372" y="305" width="152" height="72" rx="5" fill="#b7c6b9" opacity=".65" />
      <rect x="322" y="420" width="260" height="12" rx="5" fill="#9c7b5b" />
      <rect x="620" y="138" width="116" height="42" rx="9" fill="#f2f0e7" />
      <path d="M640 155h28M640 164h18" stroke="#415c57" strokeWidth="4" strokeLinecap="round" />
      <rect x="686" y="147" width="34" height="20" rx="4" fill="#e9604d" />
      <path d="M692 153h10M706 153h8M692 158h8" stroke="#fff" strokeWidth="2" />
      <rect x="646" y="126" width="63" height="11" rx="4" fill="#d9d3c4" />
      <circle cx="677" cy="120" r="8" fill="#f7e9c3" opacity=".75" />

      <g className="corridor-smoke">
        <ellipse cx="450" cy="420" rx="285" ry="74" fill="#7a8388" opacity=".28" />
        <ellipse cx="330" cy="390" rx="140" ry="56" fill="#848b8e" opacity=".22" />
        <ellipse cx="615" cy="405" rx="152" ry="62" fill="#7c8589" opacity=".2" />
        <ellipse cx="481" cy="335" rx="120" ry="58" fill="#9ca2a4" opacity=".13" />
      </g>
      {danger >= 2 && (
        <g>
          <circle cx="720" cy="485" r="80" fill={`url(#fireGlow-${stepId})`} opacity=".65" />
          <path d="M700 520c-13-27 1-44 16-57 1 13 7 19 11 28 5-8 5-17 4-23 13 13 18 30 11 47-6 14-24 19-42 5Z" fill="#ff8b45" className="scene-flame" />
        </g>
      )}
      <g>
        <rect x="612" y="447" width="118" height="18" rx="4" fill="#2e8f7e" />
        <text x="671" y="460" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800" fontFamily="Jua, sans-serif">EXIT 계단</text>
      </g>
      <g>
        <rect x="83" y="112" width="84" height="42" rx="7" fill="#f8f0dc" />
        <text x="125" y="128" textAnchor="middle" fill="#596b70" fontSize="10" fontWeight="700">ELEVATOR</text>
        <rect x="103" y="135" width="44" height="12" rx="3" fill="#b7c9c9" />
        <path d="M103 146h44" stroke="#6a7f80" strokeWidth="2" />
      </g>
    </g>
  )
}

function SmokeRoomScene({ stepId, danger }: { stepId: string; danger: number }) {
  return (
    <g>
      <rect width="900" height="560" fill={`url(#roomWall-${stepId})`} />
      <rect y="416" width="900" height="144" fill={`url(#floor-${stepId})`} />
      <path d="M0 416h900" stroke="#84583d" strokeWidth="8" opacity=".35" />
      <rect x="492" y="55" width="292" height="208" rx="10" fill="#f9f1e1" stroke="#d6bc99" strokeWidth="8" />
      <rect x="506" y="69" width="264" height="180" rx="5" fill={`url(#window-${stepId})`} />
      <path d="M638 69v180M506 159h264" stroke="#eadcc3" strokeWidth="7" />
      <g className="rescue-light">
        <circle cx="708" cy="164" r="64" fill={`url(#fireGlow-${stepId})`} />
        <rect x="700" y="174" width="15" height="25" rx="5" fill="#fff4c5" />
        <path d="M688 174c-2-12 9-22 20-22s22 10 20 22" fill="none" stroke="#5f4937" strokeWidth="5" />
        <circle cx="708" cy="148" r="7" fill="#fff7d1" />
      </g>
      <path d="M520 204c30-18 52-14 72-1" fill="none" stroke="#8bb68d" strokeWidth="6" opacity=".5" />
      <g>
        <rect x="90" y="290" width="302" height="126" rx="18" fill="#e7d7bd" />
        <rect x="70" y="255" width="338" height="55" rx="22" fill="#f7ead5" />
        <rect x="110" y="306" width="95" height="52" rx="14" fill="#ffd9a2" />
        <rect x="215" y="306" width="95" height="52" rx="14" fill="#ffce99" />
        <rect x="96" y="397" width="24" height="24" fill="#b1845b" />
        <rect x="360" y="397" width="24" height="24" fill="#b1845b" />
      </g>
      <g>
        <rect x="738" y="268" width="114" height="184" rx="7" fill="#8b6044" />
        <rect x="750" y="280" width="90" height="172" rx="4" fill="#ad805a" />
        <circle cx="764" cy="369" r="6" fill="#f2cc75" />
        <rect x="738" y="446" width="114" height="18" rx="3" fill="#f2e5c8" />
        <path d="M744 446c12 8 12 16 0 22M758 446c12 8 12 16 0 22M772 446c12 8 12 16 0 22" stroke="#f7eedb" strokeWidth="7" opacity=".9" />
      </g>
      <g className="door-smoke">
        <ellipse cx="800" cy="458" rx="45" ry="14" fill="#646f76" opacity=".5" />
        <ellipse cx="780" cy="435" rx="36" ry="16" fill="#6b747a" opacity=".35" />
        <ellipse cx="812" cy="411" rx="27" ry="14" fill="#798086" opacity=".24" />
        <ellipse cx="775" cy="382" rx="18" ry="10" fill="#868c90" opacity=".12" />
      </g>
      <g>
        <rect x="456" y="357" width="64" height="64" rx="8" fill="#fff5dd" />
        <circle cx="488" cy="389" r="17" fill="#ffd45e" />
        <path d="M488 380v9l6 4" stroke="#8e6531" strokeWidth="3" strokeLinecap="round" />
        <rect x="472" y="425" width="32" height="10" rx="4" fill="#e2cfaa" />
      </g>
      {danger >= 3 && (
        <g className="thick-smoke">
          <ellipse cx="480" cy="425" rx="327" ry="56" fill="#6e787e" opacity=".28" />
          <ellipse cx="540" cy="380" rx="180" ry="50" fill="#7c858a" opacity=".19" />
        </g>
      )}
    </g>
  )
}

function CinemaScene({ stepId, danger }: { stepId: string; danger: number }) {
  return (
    <g>
      <rect width="900" height="560" fill="#2e2b45" />
      <rect x="0" y="0" width="900" height="340" fill="#393655" />
      <rect x="110" y="42" width="680" height="278" rx="10" fill="#171d32" />
      <rect x="132" y="61" width="636" height="240" rx="5" fill="#243755" />
      <circle cx="450" cy="178" r="120" fill="#5b6fa5" opacity=".18" />
      <path d="M300 231c35-65 92-91 150-57 58-38 120-4 151 57l18 34H300l0-34Z" fill="#80a4cf" opacity=".22" />
      <circle cx="560" cy="133" r="52" fill="#ffe2a3" opacity=".16" />
      <g className="cinema-fire">
        <circle cx="700" cy="220" r="88" fill={`url(#fireGlow-${stepId})`} opacity=".9" />
        <path d="M674 262c-19-30-1-52 18-71 1 17 10 20 15 34 7-8 7-21 5-28 18 15 27 36 15 61-10 20-36 28-53 4Z" fill="#ff8e47" className="scene-flame" />
        <ellipse cx="675" cy="182" rx="37" ry="20" fill="#5e616b" opacity=".35" />
        <ellipse cx="705" cy="154" rx="27" ry="17" fill="#6d6e73" opacity=".22" />
      </g>
      <g>
        {[0, 1, 2, 3].map((row) => (
          <g key={row} transform={`translate(0 ${334 + row * 47})`}>
            <path d={`M60 ${row * 3} h780 l-50 36 H110 Z`} fill={row % 2 ? '#3f3b5d' : '#453f65'} />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((seat) => (
              <rect key={seat} x={92 + seat * 83} y="8" width="63" height="23" rx="9" fill={seat % 3 === 0 ? '#775d8d' : '#685076'} opacity={0.72 - row * 0.1} />
            ))}
          </g>
        ))}
      </g>
      <g>
        <rect x="52" y="102" width="35" height="170" rx="6" fill="#1b1a29" />
        <rect x="817" y="102" width="35" height="170" rx="6" fill="#1b1a29" />
        <rect x="755" y="108" width="86" height="37" rx="6" fill="#17765d" />
        <text x="798" y="132" textAnchor="middle" fill="#e9ffe9" fontSize="15" fontWeight="800" fontFamily="Jua, sans-serif">EXIT</text>
        <path d="M788 136h20" stroke="#fff" strokeWidth="2.5" />
        <path d="m802 132 6 4-6 4" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g opacity=".55">
        <path d="M96 156h48v20H96z" fill="#fff" />
        <path d="M103 162h18l7 8h-25z" fill="#3d7d87" />
      </g>
      {danger >= 2 && <rect width="900" height="560" fill="#38304c" opacity=".09" />}
    </g>
  )
}

function SchoolScene({ stepId, danger }: { stepId: string; danger: number }) {
  return (
    <g>
      <rect width="900" height="560" fill={`url(#roomWall-${stepId})`} />
      <rect y="430" width="900" height="130" fill={`url(#floor-${stepId})`} />
      <path d="M0 430h900" stroke="#876044" strokeWidth="7" opacity=".35" />
      <rect x="48" y="55" width="298" height="178" rx="9" fill="#f8f1e4" stroke="#d7bf9d" strokeWidth="7" />
      <rect x="62" y="69" width="270" height="150" rx="4" fill="#8fd2de" />
      <circle cx="197" cy="126" r="43" fill="#fff5bd" opacity=".55" />
      <path d="M62 202c55-51 100-50 144-13 45-45 90-43 126 1v29H62v-17Z" fill="#6fb579" opacity=".65" />
      <path d="M130 69v150M62 143h270" stroke="#f4f0e5" strokeWidth="5" />
      <rect x="590" y="70" width="236" height="178" rx="9" fill="#f8f1e4" stroke="#d7bf9d" strokeWidth="7" />
      <rect x="602" y="82" width="212" height="154" rx="4" fill="#55708b" />
      <rect x="616" y="96" width="184" height="62" rx="3" fill="#5e8a7d" opacity=".7" />
      <path d="M616 185h184v37H616z" fill="#6d876f" opacity=".7" />
      <path d="M708 82v154M602 159h212" stroke="#f0e8d8" strokeWidth="5" />
      <rect x="46" y="230" width="300" height="10" fill="#d4b994" />
      <rect x="590" y="246" width="236" height="10" fill="#d4b994" />

      <rect x="334" y="62" width="196" height="70" rx="8" fill="#2f5d60" />
      <text x="432" y="92" textAnchor="middle" fill="#eaffea" fontSize="18" fontWeight="800" fontFamily="Jua, sans-serif">과학실</text>
      <text x="432" y="113" textAnchor="middle" fill="#bfe8e3" fontSize="10">안전 수칙을 지켜요</text>

      <g>
        <rect x="280" y="322" width="340" height="54" rx="8" fill="#c59662" />
        <rect x="270" y="316" width="360" height="15" rx="7" fill="#e0b77c" />
        <rect x="300" y="376" width="18" height="70" fill="#9d744c" />
        <rect x="582" y="376" width="18" height="70" fill="#9d744c" />
        <rect x="355" y="289" width="50" height="28" rx="4" fill="#9ad2dc" />
        <rect x="423" y="285" width="38" height="32" rx="4" fill="#d5e8e0" />
        <rect x="377" y="270" width="9" height="21" rx="3" fill="#93a49a" />
        <circle cx="395" cy="263" r="10" fill="#ffe3a1" opacity=".75" />
        <rect x="488" y="291" width="72" height="26" rx="4" fill="#f2f4e7" />
        <path d="M500 298h48M500 305h35" stroke="#98aa9d" strokeWidth="2" />
      </g>

      <g>
        <rect x="56" y="288" width="102" height="150" rx="6" fill="#8b6345" />
        <rect x="68" y="300" width="78" height="122" rx="4" fill="#b4885d" />
        <circle cx="78" cy="364" r="6" fill="#f0c964" />
      </g>
      <g>
        <rect x="722" y="300" width="108" height="142" rx="6" fill="#8b6345" />
        <rect x="734" y="312" width="84" height="118" rx="4" fill="#b4885d" />
        <circle cx="746" cy="373" r="6" fill="#f0c964" />
        <rect x="734" y="421" width="84" height="10" fill="#f3e7d1" />
      </g>
      <g>
        <rect x="718" y="188" width="98" height="45" rx="8" fill="#f9f1dc" />
        <path d="M735 209h22M735 218h14" stroke="#476962" strokeWidth="4" strokeLinecap="round" />
        <rect x="775" y="197" width="31" height="24" rx="4" fill="#ef5f52" />
        <path d="M783 204h9M783 210h6" stroke="#fff" strokeWidth="2" />
      </g>
      <g className="school-fire">
        <circle cx="812" cy="340" r="64" fill={`url(#fireGlow-${stepId})`} opacity=".7" />
        <path d="M790 388c-16-22-1-39 14-50 0 12 7 15 10 24 5-7 4-14 3-20 13 12 19 29 11 45-7 15-27 19-38 1Z" fill="#ff8943" className="scene-flame" />
        <ellipse cx="800" cy="330" rx="34" ry="17" fill="#6f7578" opacity=".3" />
      </g>
      <g className="desk-label">
        <rect x="325" y="406" width="88" height="24" rx="5" fill="#fff3db" />
        <text x="369" y="422" textAnchor="middle" fill="#6a5a46" fontSize="9" fontWeight="700">대피로 →</text>
      </g>
      {danger >= 2 && <ellipse cx="450" cy="414" rx="400" ry="40" fill="#6f777b" opacity=".15" />}
    </g>
  )
}

function OutsideScene({ stepId, danger }: { stepId: string; danger: number }) {
  return (
    <g>
      <rect width="900" height="560" fill="#bce8f4" />
      <circle cx="760" cy="86" r="44" fill="#fff0a8" />
      <rect y="390" width="900" height="170" fill="#95c981" />
      <path d="M0 450c120-28 224-17 332 9 102-20 216-18 323 7 97-17 183-11 245 1v93H0v-110Z" fill="#82ba76" />
      <rect x="86" y="138" width="350" height="290" rx="12" fill="#f1ddc3" />
      <rect x="410" y="158" width="38" height="270" fill="#d9bd9b" />
      <rect x="78" y="122" width="366" height="24" rx="8" fill="#d6b88f" />
      {[0, 1, 2, 3, 4, 5, 6].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <g key={`${row}-${col}`}>
            <rect x={112 + col * 58} y={168 + row * 34} width="30" height="23" rx="3" fill={(row + col) % 4 === 0 ? '#ffdf8b' : '#7eb6ca'} opacity={(row + col) % 3 === 0 ? 0.95 : 0.65} />
            <rect x={112 + col * 58} y={185 + row * 34} width="30" height="4" fill="#caa87d" />
          </g>
        )),
      )}
      <rect x="236" y="370" width="52" height="58" rx="4" fill="#8d6847" />
      <g className="building-fire">
        <circle cx="358" cy="302" r="68" fill={`url(#fireGlow-${stepId})`} opacity=".8" />
        <path d="M338 350c-14-25 1-43 15-55 0 12 8 16 12 26 5-8 5-16 4-22 14 13 20 32 11 49-7 15-29 19-42 2Z" fill="#ff8341" className="scene-flame" />
        <ellipse cx="350" cy="260" rx="48" ry="22" fill="#5c656a" opacity=".42" />
        <ellipse cx="375" cy="230" rx="36" ry="20" fill="#667075" opacity=".3" />
        <ellipse cx="340" cy="204" rx="27" ry="16" fill="#7a8286" opacity=".2" />
        <ellipse cx="373" cy="179" rx="21" ry="13" fill="#8c9295" opacity=".12" />
      </g>

      <g>
        <rect x="520" y="360" width="280" height="82" rx="14" fill="#ee5745" />
        <rect x="536" y="374" width="93" height="42" rx="6" fill="#a2d7e5" />
        <rect x="641" y="374" width="66" height="42" rx="6" fill="#a2d7e5" />
        <rect x="715" y="374" width="67" height="42" rx="6" fill="#a2d7e5" />
        <rect x="578" y="307" width="102" height="57" rx="8" fill="#df4338" />
        <rect x="588" y="317" width="80" height="30" rx="4" fill="#b5e5ef" />
        <path d="M548 343h190v9H548z" fill="#f7dd9d" />
        <circle cx="573" cy="445" r="21" fill="#2e3a4b" />
        <circle cx="573" cy="445" r="10" fill="#d7dde0" />
        <circle cx="737" cy="445" r="21" fill="#2e3a4b" />
        <circle cx="737" cy="445" r="10" fill="#d7dde0" />
        <rect x="760" y="339" width="24" height="18" rx="3" fill="#ffcf4a" />
        <path d="M776 340c10 4 10 12 0 16" fill="none" stroke="#ffcf4a" strokeWidth="4" />
      </g>
      <g opacity=".9">
        {[180, 216, 255, 300].map((x, index) => (
          <g key={x} transform={`translate(${x} ${470 + (index % 2) * 10})`}>
            <circle cx="0" cy="0" r="11" fill={index % 2 ? '#f4c39c' : '#e7ac83'} />
            <path d={`M-9 12h18l5 32H-14l5-32Z`} fill={['#4e87b7', '#e05a4c', '#74a85e', '#6e6fa8'][index]} />
            <path d="M-6 45v22M6 45v22" stroke="#384c5d" strokeWidth="7" strokeLinecap="round" />
          </g>
        ))}
        <g transform="translate(340 476)">
          <circle cx="0" cy="0" r="11" fill="#f4c39c" />
          <path d="M-9 12h18l5 32H-14l5-32Z" fill="#f1c747" />
          <path d="M-6 45v22M6 45v22" stroke="#384c5d" strokeWidth="7" strokeLinecap="round" />
        </g>
      </g>
      <g>
        <rect x="478" y="470" width="14" height="60" rx="4" fill="#f0b947" />
        <rect x="502" y="470" width="14" height="60" rx="4" fill="#f0b947" />
        <path d="M466 462h62v16h-62z" fill="#fff4d2" />
        <path d="M476 470h42" stroke="#5b6e73" strokeWidth="4" />
      </g>
      <g>
        <rect x="20" y="438" width="45" height="82" rx="4" fill="#6dae6d" />
        <circle cx="42" cy="425" r="28" fill="#5ca95e" />
        <circle cx="20" cy="440" r="19" fill="#77bd75" />
      </g>
    </g>
  )
}
