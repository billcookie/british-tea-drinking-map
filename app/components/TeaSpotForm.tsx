'use client'

import { SubmitEvent, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { TeaSpot } from '../types'

interface TeaSpotFormProps {
  selectedLocation: { lat: number; lng: number } | null
  setSelectedLocation: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>
  onSpotAdded?: (spot: TeaSpot) => void
}

export default function TeaSpotForm({ selectedLocation, setSelectedLocation, onSpotAdded }: TeaSpotFormProps) {
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedLocation) {
      setStatus('地図をクリックして位置を選択してください')
      return
    }

    setPending(true)
    setStatus('')

    try {
      const form = e.currentTarget
      const formData = new FormData(form)

      const photoInput =
        form.querySelector<HTMLInputElement>('input[type="file"]')
      const assetIds: string[] = []
      if (photoInput?.files?.length) {
        for (const file of Array.from(photoInput.files)) {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch('/api/assets', { method: 'POST', body: fd })
          const data = await res.json()
          if (data.success) assetIds.push(data.data.id)
        }
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            name: formData.get('name'),
            category: formData.get('category'),
            description: formData.get('description'),
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lng,
            status: formData.get('status'),
            rating: formData.get('rating'),
            assetIds,
          },
        }),
      })

      const result = await res.json()
      if (result.success) {
        setStatus('投稿が完了しました！')
        onSpotAdded?.({
          id: result.data?.id ?? '',
          name: (formData.get('name') as string) || '',
          category: (formData.get('category') as string) || '',
          description: (formData.get('description') as string) || '',
          rating: Number(formData.get('rating')) || 0,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          photos: [],
        })
        form.reset()
        setSelectedLocation(null)
      } else {
        setStatus('エラーが発生しました')
      }
    } catch {
      setStatus('エラーが発生しました')
    } finally {
      setPending(false)
    }
  }

  const fieldClass =
    'w-full rounded-md bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (

      <form
        onSubmit={handleSubmit}
        className="absolute top-3 left-3 z-1000 w-72 rounded-xl bg-gray-900 border border-gray-700 shadow-2xl p-4 flex flex-col gap-3 font-sans"
      >
        <h3 className="text-white font-semibold text-base tracking-wide">
          🇬🇧ティースポットを追加する🇬🇧
        </h3>

        <input
          name="name"
          type="text"
          placeholder="店名"
          className={fieldClass}
        />

        <select name="category" className={fieldClass}>
          <option value="" className="bg-gray-800">カテゴリを選択</option>
          <option value="Cafe" className="bg-gray-800">カフェ</option>
          <option value="Tea Room" className="bg-gray-800">ティールーム</option>
          <option value="Hotel" className="bg-gray-800">ホテル</option>
          <option value="Chain" className="bg-gray-800">チェーン</option>
        </select>

        <textarea
          name="description"
          placeholder="説明"
          rows={3}
          className={fieldClass}
        />

        <input
          name="rating"
          type="number"
          max={5}
          min={1}
          placeholder="評価"
          className={fieldClass}
        />

        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">写真</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="text-xs text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-gray-700 file:text-gray-200 file:cursor-pointer hover:file:bg-gray-600"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium py-2 text-sm transition-colors"
        >
          {pending ? '送信中…' : '送信'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          地図をクリックして位置を設定してください
        </p>

        {status && (
          <p className={`text-xs text-center font-medium ${status.includes('完了') ? 'text-emerald-400' : 'text-red-400'}`}>
            {status}
          </p>
        )}
      </form>
  )
}
