import { useId } from 'react'

export type MascotName = 'fire' | 'safi' | 'medi'
export type MascotMood = 'happy' | 'talk' | 'worry' | 'cheer' | 'idle'

const palette = {
  fire: {
    suit: '#e84a3a',
    suitDark: '#bd3229',
    accent: '#ffbe3f',
    helmet: '#f04b3a',
    trim: '#ffe4a8',
    boot: '#233250',
  },
  safi: {
    suit: '#2e8fe8',
    suitDark: '#1d6fbd',
    accent: '#f4d35e',
    helmet: '#2e8fe8',
    trim: '#dff5ff',
    boot: '#273a59',
  },
  medi: {
    suit: '#27b5a4',
    suitDark: '#178b80',
    accent: '#ff7188',
    helmet: '#ffffff',
    trim: '#e8fffb',
    boot: '#2b4160',
  },
}

export function Mascot({
  name = 'fire',
  mood = 'happy',
  size = 150,
  className = '',
}: {
  name?: MascotName
  mood?: MascotMood
  size?: number
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const colors = palette[name]
  const label = name === 'fire' ? '소방 안전지킴이 파이어' : name === 'safi' ? '안전 안내 친구 세이피' : '응급처치 전문가 메디'
  const eyeY = 92
  const smiling = mood === 'happy' || mood === 'cheer' || mood === 'talk'
  return (
    <svg
      className={`mascot mascot-${name} mood-${mood} ${className}`}
      width={size}
      height={size * 1.22}
      viewBox="0 0 180 220"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={`suit-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.suit} />
          <stop offset="1" stopColor={colors.suitDark} />
        </linearGradient>
        <linearGradient id={`helmet-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.helmet} />
          <stop offset="1" stopColor={name === 'medi' ? '#d7f1ee' : colors.suitDark} />
        </linearGradient>
        <radialGradient id={`skin-${uid}`} cx="45%" cy="32%" r="80%">
          <stop offset="0" stopColor="#ffe6cd" />
          <stop offset="1" stopColor="#f4bb92" />
        </radialGradient>
      </defs>

      <ellipse className="mascot-shadow" cx="90" cy="211" rx="47" ry="8" fill="#233250" opacity="0.16" />

      <g className="mascot-body">
        <g className="mascot-legs">
          <rect x="66" y="174" width="17" height="31" rx="8" fill={colors.boot} />
          <rect x="97" y="174" width="17" height="31" rx="8" fill={colors.boot} />
          <ellipse cx="72" cy="204" rx="15" ry="7" fill="#192742" />
          <ellipse cx="104" cy="204" rx="15" ry="7" fill="#192742" />
        </g>

        <g className="mascot-arms">
          <rect x="43" y="139" width="16" height="48" rx="8" fill={colors.suitDark} transform="rotate(9 51 139)" />
          <rect x="121" y="136" width="16" height="48" rx="8" fill={colors.suitDark} transform="rotate(-9 129 136)" />
          <circle cx="58" cy="178" r="9" fill="#ffe0c2" />
          <circle cx="130" cy="175" r="9" fill="#ffe0c2" />
        </g>

        <path d="M58 136c8-10 22-14 32-14s25 4 33 14l-4 51c-7 7-18 10-29 10s-22-3-29-10l-3-51Z" fill={`url(#suit-${uid})`} />
        <path d="M65 147h50v10H65z" fill={colors.trim} opacity="0.88" />
        <path d="M65 163h50v7H65z" fill={colors.trim} opacity="0.58" />
        <path d="M88 122h5v22h-5z" fill="#ffffff" opacity="0.22" />
        <circle cx="90" cy="153" r="9" fill={colors.accent} />
        {name === 'fire' && <path d="M90 148c3 2 4 4 3 6 2 0 3 2 2 4-1 2-3 2-5 0-2-2-2-6 0-10Z" fill="#f04b3a" />}
        {name === 'safi' && <path d="M86 152h8M90 148v8" stroke="#1d6fbd" strokeWidth="2.5" strokeLinecap="round" />}
        {name === 'medi' && <path d="M86 153h8M90 149v8" stroke="#ff7188" strokeWidth="3" strokeLinecap="round" />}

        <g className="mascot-head">
          <ellipse cx="59" cy="100" rx="12" ry="16" fill="#ffe0c2" />
          <ellipse cx="121" cy="100" rx="12" ry="16" fill="#ffe0c2" />
          <ellipse cx="60" cy="100" rx="6" ry="9" fill="#f0b28b" opacity="0.55" />
          <ellipse cx="120" cy="100" rx="6" ry="9" fill="#f0b28b" opacity="0.55" />
          <circle cx="90" cy="93" r="44" fill={`url(#skin-${uid})`} />
          <path d="M52 84c0-13 17-23 38-23s38 10 38 23c-7-7-20-11-38-11s-31 4-38 11Z" fill="#573b30" opacity="0.9" />

          <g className="mascot-face">
            {mood === 'worry' ? (
              <>
                <circle cx="76" cy={eyeY} r="4.2" fill="#22304b" />
                <circle cx="104" cy={eyeY} r="4.2" fill="#22304b" />
                <path d="M68 84c4-3 9-3 13-1M99 83c4-2 9-2 13 1" stroke="#573b30" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M83 107c4-3 10-3 14 0" stroke="#8d3d34" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="76" cy={eyeY} rx="4.3" ry="5" fill="#22304b" />
                <ellipse cx="104" cy={eyeY} rx="4.3" ry="5" fill="#22304b" />
                <circle cx="77.5" cy={eyeY - 1.8} r="1.5" fill="#fff" />
                <circle cx="105.5" cy={eyeY - 1.8} r="1.5" fill="#fff" />
                <ellipse cx="65" cy="103" rx="8" ry="4" fill="#ff8b8b" opacity="0.35" />
                <ellipse cx="115" cy="103" rx="8" ry="4" fill="#ff8b8b" opacity="0.35" />
                {mood === 'talk' ? (
                  <ellipse cx="90" cy="108" rx="6" ry="7" fill="#8d3d34" />
                ) : smiling ? (
                  <path d="M82 105c3 6 13 6 16 0" stroke="#8d3d34" strokeWidth="3" strokeLinecap="round" fill="none" />
                ) : (
                  <path d="M85 108h10" stroke="#8d3d34" strokeWidth="3" strokeLinecap="round" />
                )}
              </>
            )}
          </g>

          {name === 'fire' && (
            <g className="mascot-helmet">
              <path d="M46 85c0-27 20-43 44-43s44 16 44 43v5H46v-5Z" fill={`url(#helmet-${uid})`} />
              <path d="M42 82c0-5 4-8 9-8h78c5 0 9 3 9 8v7H42v-7Z" fill={colors.suitDark} />
              <path d="M83 35h14v13H83z" fill="#ffd66b" />
              <path d="M90 39c5 3 6 9 2 14 7-1 9 5 6 9-4 4-11 1-12-4-1-6 1-13 4-19Z" fill="#fff2b8" />
              <path d="M48 79c4-21 20-32 42-32s38 11 42 32" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.2" />
              <circle cx="120" cy="66" r="5" fill="#ffdf71" opacity="0.9" />
            </g>
          )}

          {name === 'safi' && (
            <g className="mascot-cap">
              <path d="M55 60c2-17 17-27 36-27 17 0 30 8 34 23-14-4-31-5-47-4-9 .4-16 3-23 8Z" fill="#2e8fe8" />
              <path d="M48 62c0-4 3-7 7-7h72c5 0 8 4 6 8l-5 7H53l-5-8Z" fill="#1d6fbd" />
              <path d="M88 37h5v9h-5z" fill="#f4d35e" />
              <circle cx="90" cy="45" r="4" fill="#f4d35e" />
            </g>
          )}

          {name === 'medi' && (
            <g className="mascot-nurse">
              <path d="M58 55c8-18 24-25 38-24 16 1 28 10 33 25-20-8-50-8-71-1Z" fill="#ffffff" />
              <path d="M55 57h70v9H55z" fill="#d7f1ee" />
              <path d="M86 38h8v8h8v8h-8v8h-8v-8h-8v-8h8v-8Z" fill="#ff7188" />
            </g>
          )}

          {name === 'medi' && (
            <path d="M59 126c0-5 4-8 8-8s8 3 8 8v7H59v-7Z" fill="#ffffff" opacity="0.8" />
          )}
        </g>
      </g>
    </svg>
  )
}
