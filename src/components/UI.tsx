import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconName } from './Icon'
import { sfx } from '../audio'

export function GameButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  disabled,
  full,
  className = '',
  type = 'button',
  ariaLabel,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'soft' | 'white'
  size?: 'sm' | 'md' | 'lg'
  icon?: IconName
  trailingIcon?: IconName
  disabled?: boolean
  full?: boolean
  className?: string
  type?: 'button' | 'submit'
  ariaLabel?: string
}) {
  return (
    <button
      type={type}
      className={`game-btn btn-${variant} btn-${size} ${full ? 'btn-full' : ''} ${className}`}
      onClick={() => {
        if (disabled) return
        sfx('click')
        onClick?.()
      }}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 19} />}
      <span>{children}</span>
      {trailingIcon && <Icon name={trailingIcon} size={size === 'lg' ? 22 : 19} />}
    </button>
  )
}

export function IconButton({
  icon,
  onClick,
  label,
  active,
  className = '',
  size = 20,
}: {
  icon: IconName
  onClick: () => void
  label: string
  active?: boolean
  className?: string
  size?: number
}) {
  return (
    <button
      type="button"
      className={`icon-btn ${active ? 'is-active' : ''} ${className}`}
      onClick={() => {
        sfx('click')
        onClick()
      }}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}

export function Stars({ value, size = 22, animated = false }: { value: number; size?: number; animated?: boolean }) {
  return (
    <span className={`stars ${animated ? 'stars-animated' : ''}`} aria-label={`별 ${value}개`}>
      {[1, 2, 3].map((index) => (
        <Icon
          key={index}
          name="star"
          size={size}
          className={`star ${index <= value ? 'star-filled' : 'star-empty'}`}
          // A filled star uses the same SVG with a CSS class rather than a second icon set.
        />
      ))}
    </span>
  )
}

export function ProgressBar({
  value,
  max = 100,
  color = 'var(--primary)',
  height = 10,
  label,
}: {
  value: number
  max?: number
  color?: string
  height?: number
  label?: string
}) {
  const percent = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <div className="progress-track" style={{ height }} aria-label={label} role={label ? 'progressbar' : undefined} aria-valuenow={value} aria-valuemax={max}>
      <div className="progress-fill" style={{ width: `${percent}%`, background: color }} />
    </div>
  )
}

export function CoinPill({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <span className={`resource-pill coin-pill ${compact ? 'compact' : ''}`} aria-label={`안전코인 ${value}`}>
      <span className="coin-icon">₩</span>
      {!compact && <span className="resource-label">코인</span>}
      <b>{value.toLocaleString()}</b>
    </span>
  )
}

export function XpPill({ value }: { value: number }) {
  return (
    <span className="resource-pill xp-pill" aria-label={`경험치 ${value}`}>
      <Icon name="xp" size={16} />
      <b>{value.toLocaleString()}</b>
    </span>
  )
}

export function Modal({
  open,
  onClose,
  children,
  title,
  subtitle,
  className = '',
  hideClose = false,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  subtitle?: string
  className?: string
  hideClose?: boolean
  wide?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => panelRef.current?.focus(), 50)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="modal-backdrop" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className={`modal-panel ${wide ? 'modal-wide' : ''} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || '대화상자'}
        ref={panelRef}
        tabIndex={-1}
      >
        {(title || !hideClose) && (
          <div className="modal-head">
            <div>
              {title && <h2>{title}</h2>}
              {subtitle && <p>{subtitle}</p>}
            </div>
            {!hideClose && (
              <IconButton
                icon="close"
                label="닫기"
                onClick={() => {
                  sfx('click')
                  onClose()
                }}
              />
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function MascotBubble({
  children,
  name = 'fire',
  label,
  compact = false,
  className = '',
}: {
  children: ReactNode
  name?: string
  label?: string
  compact?: boolean
  className?: string
}) {
  return (
    <div className={`mascot-bubble ${compact ? 'compact' : ''} ${className}`}>
      {label && <span className="bubble-label">{label}</span>}
      <div className="bubble-content">{children}</div>
      {name && <span className={`bubble-tail tail-${name}`} />}
    </div>
  )
}

export function Confetti({ count = 40 }: { count?: number }) {
  return (
    <div className="confetti-layer" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={
            {
              '--x': `${(index * 37 + 7) % 100}%`,
              '--delay': `${(index % 9) * 0.11}s`,
              '--duration': `${1.8 + (index % 5) * 0.24}s`,
              '--rotate': `${(index * 47) % 360}deg`,
              '--color': ['#ffce4a', '#ff6b4a', '#57c7ff', '#6ee7c8', '#ff9ac1'][index % 5],
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <header className="screen-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {right && <div className="screen-header-right">{right}</div>}
    </header>
  )
}

export function BadgePill({ icon, children, tone = 'blue' }: { icon?: IconName; children: ReactNode; tone?: string }) {
  return (
    <span className={`mini-pill tone-${tone}`}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  )
}

export function ScoreRing({ value, max, size = 100, color = '#ffc73d', label }: { value: number; max: number; size?: number; color?: string; label?: string }) {
  const percentage = Math.max(0, Math.min(1, value / Math.max(1, max)))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(29,52,86,.09)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percentage)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="score-ring-text">
        <strong>{Math.round(percentage * 100)}%</strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  )
}

/* Lightweight toast host shared across the app. */
type ToastKind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}
const toastListeners = new Set<(items: ToastItem[]) => void>()
let toastItems: ToastItem[] = []
let toastId = 0

export function toast(message: string, kind: ToastKind = 'success') {
  const item = { id: ++toastId, message, kind }
  toastItems = [...toastItems, item].slice(-3)
  toastListeners.forEach((listener) => listener(toastItems))
  window.setTimeout(() => {
    toastItems = toastItems.filter((toastItem) => toastItem.id !== item.id)
    toastListeners.forEach((listener) => listener(toastItems))
  }, 3000)
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>(toastItems)
  useEffect(() => {
    toastListeners.add(setItems)
    return () => {
      toastListeners.delete(setItems)
    }
  }, [])
  return createPortal(
    <div className="toast-host" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`toast toast-${item.kind}`}>
          <span className="toast-icon">{item.kind === 'success' ? '✓' : item.kind === 'error' ? '!' : 'i'}</span>
          <span>{item.message}</span>
        </div>
      ))}
    </div>,
    document.body,
  )
}
