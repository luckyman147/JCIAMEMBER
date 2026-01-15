import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
  disabled?: boolean
}

export default function StarRating({ 
  value, 
  onChange, 
  size = 'md',
  disabled = false 
}: StarRatingProps) {
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange?.(value === star ? 0 : star)}
          disabled={disabled || !onChange}
          className={`focus:outline-none transition-colors ${
            star <= value ? 'text-yellow-400' : 'text-gray-300'
          } ${!disabled && onChange ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
        >
          <Star className={`${starSize} fill-current`} />
        </button>
      ))}
    </div>
  )
}
