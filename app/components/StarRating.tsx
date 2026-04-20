'use client'

interface Props {
  rating: number
  maxStars?: number
  interactive?: boolean
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ rating, maxStars = 5, interactive = false, onChange, size = 'md' }: Props) {
  const sizeClass = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }[size]

  return (
    <div className={`flex gap-0.5 ${sizeClass}`}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <span
          key={i}
          className={`${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'} ${interactive ? 'cursor-pointer hover:text-yellow-300' : ''}`}
          onClick={() => interactive && onChange?.(i + 1)}
        >
          ★
        </span>
      ))}
    </div>
  )
}
