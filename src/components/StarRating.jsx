export function StarRating({ value = 0, onChange, max = 5, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'text-lg' : 'text-2xl'

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star === value ? 0 : star)}
          className={`${sizeClass} leading-none transition-colors ${
            star <= value ? 'text-coffee-400' : 'text-coffee-200'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function StarDisplay({ value = 0, max = 5 }) {
  return (
    <span className="text-sm">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? 'text-coffee-400' : 'text-coffee-200'}>★</span>
      ))}
    </span>
  )
}
