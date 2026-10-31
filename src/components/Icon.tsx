import type { ReactNode } from 'react'

type IconName =
  | 'home'
  | 'mission'
  | 'build'
  | 'book'
  | 'user'
  | 'settings'
  | 'sound'
  | 'mute'
  | 'coin'
  | 'xp'
  | 'shield'
  | 'flame'
  | 'star'
  | 'lock'
  | 'check'
  | 'arrow'
  | 'back'
  | 'close'
  | 'play'
  | 'spark'
  | 'clock'
  | 'hint'
  | 'phone'
  | 'heart'
  | 'fire'
  | 'paw'
  | 'expand'
  | 'reset'
  | 'trophy'
  | 'chevron'
  | 'search'
  | 'info'

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M4 11.2 12 4l8 7.2" />
      <path d="M6.5 9.5V20h11V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  mission: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M8 9h8M8 13h5M8 17h3" />
    </>
  ),
  build: (
    <>
      <path d="M4 20h16" />
      <path d="M6 20V9l6-4 6 4v11" />
      <path d="M10 20v-5h4v5M9 10h.01M15 10h.01" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.7-4 3.6-6.2 7.5-6.2s6.8 2.2 7.5 6.2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.96 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3v-4h.08A1.7 1.7 0 0 0 4.6 8.92a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.96 4.6 1.7 1.7 0 0 0 10 3.04V3h4v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.38.55.86 1.56.86H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.2c.6-.9 1.6-1.3 2.7-1.3 1.5 0 2.6.8 2.6 2s-1 1.7-2.8 2c-1.7.3-2.7.8-2.7 2.1 0 1.2 1.1 2.1 2.8 2.1 1.1 0 2.1-.4 2.7-1.2M12 6v2M12 16v2" />
    </>
  ),
  xp: (
    <>
      <path d="M12 3 14.6 8.6 21 9.5l-4.5 4.4 1.1 6.1-5.6-3-5.6 3 1.1-6.1L3 9.5l6.4-.9L12 3Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 20 6v6c0 4.5-3.3 7.6-8 9-4.7-1.4-8-4.5-8-9V6l8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  flame: (
    <>
      <path d="M12 22c4 0 7-2.5 7-6.5 0-3-1.7-5.4-4.2-7.7.2 2.2-.4 3.7-1.8 4.7.1-3.9-2.3-7.2-4-8.5.2 4.1-4 6.6-4 11.5C5 19.5 8 22 12 22Z" />
      <path d="M9.5 18c0 1.5 1 2.4 2.5 2.4s2.5-.9 2.5-2.4c0-1-.5-2-1.5-2.9 0 1-.5 1.7-1.2 2-.1-1.3-.7-2.3-1.3-2.8.1 1.5-1 2.2-1 3.7Z" />
    </>
  ),
  star: <path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.8Z" />,
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5L20 6.5" />,
  arrow: <path d="M5 12h14M14 6l6 6-6 6" />,
  back: <path d="M19 12H5M10 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" />,
  spark: (
    <>
      <path d="m12 2 1.2 5.4L18 4l-2.5 4.8L21 10l-5.5 1.2L18 18l-4.8-2.7L12 21l-1.2-5.7L6 18l2.5-4.8L3 12l5.5-1.2L6 6l4.8 1.4L12 2Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  hint: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M8.5 15.5C7 14.2 6 12.4 6 10.3a6 6 0 1 1 12 0c0 2.1-1 3.9-2.5 5.2-.6.5-.9 1.1-.9 1.8h-5.2c0-.7-.3-1.3-.9-1.8Z" />
    </>
  ),
  phone: (
    <>
      <path d="M6.6 3h3l1.2 4.1-1.9 1.4a14 14 0 0 0 6.6 6.6l1.4-1.9L21 14.4v3A2.6 2.6 0 0 1 18.4 20C10.4 20 4 13.6 4 5.6A2.6 2.6 0 0 1 6.6 3Z" />
    </>
  ),
  heart: <path d="M20.5 5.8c-2-2-5.3-1.8-7.2.3L12 7.5l-1.3-1.4C8.8 4 5.5 3.8 3.5 5.8c-2 2.1-1.8 5.4.3 7.3L12 21l8.2-7.9c2.1-1.9 2.3-5.2.3-7.3Z" />,
  fire: (
    <>
      <path d="M12 22c4 0 7-2.5 7-6.5 0-3-1.7-5.4-4.2-7.7.2 2.2-.4 3.7-1.8 4.7.1-3.9-2.3-7.2-4-8.5.2 4.1-4 6.6-4 11.5C5 19.5 8 22 12 22Z" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="8" r="2" />
      <circle cx="12" cy="5.5" r="2" />
      <circle cx="17" cy="8" r="2" />
      <path d="M7 15c0-2.8 2.2-5 5-5s5 2.2 5 5c0 2.2-1.8 4-4 4-.6 0-1-.2-1-.2s-.4.2-1 .2c-2.2 0-4-1.8-4-4Z" />
    </>
  ),
  expand: <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />,
  reset: (
    <>
      <path d="M4 4v6h6" />
      <path d="M5.5 15a7.5 7.5 0 1 0 1.6-8.4L4 10" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5h.01" />
    </>
  ),
}

export function Icon({ name, size = 22, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export type { IconName }
