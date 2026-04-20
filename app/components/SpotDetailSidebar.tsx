'use client'

import { useState } from 'react'
import { TeaSpot, LocalReview } from '../types'
import StarRating from './StarRating'

interface Props {
  spot: TeaSpot
  onClose: () => void
}

function getReviews(spotId: string): LocalReview[] {
  try {
    const all: LocalReview[] = JSON.parse(localStorage.getItem('tea-reviews') || '[]')
    return all.filter(r => r.spotId === spotId)
  } catch {
    return []
  }
}

function saveReview(review: LocalReview) {
  try {
    const all: LocalReview[] = JSON.parse(localStorage.getItem('tea-reviews') || '[]')
    all.push(review)
    localStorage.setItem('tea-reviews', JSON.stringify(all))
  } catch {}
}

export default function SpotDetailSidebar({ spot, onClose }: Props) {
  const [currentSpotId, setCurrentSpotId] = useState(spot.id)
  const [reviews, setReviews] = useState<LocalReview[]>(() => getReviews(spot.id))
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')

  if (spot.id !== currentSpotId) {
    setCurrentSpotId(spot.id)
    setReviews(getReviews(spot.id))
    setNewRating(5)
    setNewComment('')
  }

  function handleAddReview() {
    if (!newComment.trim()) return
    const review: LocalReview = {
      spotId: spot.id,
      rating: newRating,
      comment: newComment.trim(),
      date: new Date().toISOString(),
    }
    saveReview(review)
    setReviews(prev => [...prev, review])
    setNewComment('')
    setNewRating(5)
  }

  const allRatings = [spot.rating, ...reviews.map(r => r.rating)].filter(Boolean)
  const avgRating = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0

  const fieldClass = 'w-full rounded bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="absolute top-0 right-0 h-full w-80 z-[1000] bg-gray-900 border-l border-gray-700 shadow-2xl overflow-y-auto flex flex-col font-sans">
      <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900">
        <h2 className="text-white font-semibold text-base truncate pr-2">{spot.name}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none flex-shrink-0">×</button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {spot.category && (
          <span className="inline-block bg-indigo-900 text-indigo-200 text-xs px-2 py-1 rounded w-fit">
            {spot.category}
          </span>
        )}

        <div className="flex items-center gap-2">
          <StarRating rating={avgRating} size="lg" />
          <span className="text-gray-400 text-sm">
            {avgRating > 0 ? avgRating.toFixed(1) : '–'} ({allRatings.length}件の評価)
          </span>
        </div>

        {spot.description && (
          <p className="text-gray-300 text-sm leading-relaxed">{spot.description}</p>
        )}

        {spot.photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {spot.photos.map((photo, i) => {
              const url = typeof photo === 'string' ? photo : photo.url
              return url ? (
                <img key={i} src={url} alt={spot.name} className="w-24 h-24 object-cover rounded" />
              ) : null
            })}
          </div>
        )}

        <div>
          <h3 className="text-white font-medium text-sm mb-2">
            レビュー ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-xs">まだレビューがありません。最初の投稿者になりましょう！</p>
          ) : (
            <div className="flex flex-col gap-2">
              {reviews.map((r, i) => (
                <div key={i} className="bg-gray-800 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={r.rating} size="sm" />
                    <span className="text-gray-500 text-xs">
                      {new Date(r.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-white font-medium text-sm mb-3">レビューを追加</h3>
          <div className="flex flex-col gap-2">
            <StarRating rating={newRating} interactive onChange={setNewRating} size="lg" />
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="体験を共有してください..."
              rows={3}
              className={fieldClass}
            />
            <button
              onClick={handleAddReview}
              disabled={!newComment.trim()}
              className="w-full rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium py-2 transition-colors"
            >
              レビューを投稿
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
