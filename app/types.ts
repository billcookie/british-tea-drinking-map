export interface TeaSpot {
  id: string
  name: string
  category: string
  description: string
  rating: number
  lat: number
  lng: number
  photos: Array<{ url: string; id: string } | string>
}

export interface LocalReview {
  spotId: string
  rating: number
  comment: string
  date: string
}

export interface FilterState {
  category: string
  minRating: number
  search: string
}
