'use client'

import { FilterState, TeaSpot } from '../types'
import { exportCSV, exportGeoJSON } from '../utils'

interface Props {
  filter: FilterState
  onFilterChange: (f: FilterState) => void
  totalSpots: number
  filteredCount: number
  showHeatmap: boolean
  onHeatmapToggle: () => void
  clusterEnabled: boolean
  onClusterToggle: () => void
  onGeolocate: () => void
  spots: TeaSpot[]
}

export default function FilterPanel({
  filter, onFilterChange, totalSpots, filteredCount,
  showHeatmap, onHeatmapToggle, clusterEnabled, onClusterToggle,
  onGeolocate, spots,
}: Props) {

  const fieldClass = 'w-full rounded bg-gray-800 border border-gray-600 text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500'
  const toggleClass = (active: boolean, activeColor: string) =>
    `flex-1 text-xs py-1 rounded border transition-colors ${active ? `${activeColor} text-white` : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`

  return (
    <div className="absolute bottom-3 left-3 z-[1000] w-64 rounded-xl bg-gray-900 border border-gray-700 shadow-2xl p-3 flex flex-col gap-2 font-sans">
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-xs font-medium">紅茶スポット</span>
        <span className="text-indigo-300 text-xs font-bold">
          {filteredCount === totalSpots ? totalSpots : `${filteredCount} / ${totalSpots}`}
        </span>
      </div>

      <input
        type="text"
        placeholder="名前または説明で検索..."
        value={filter.search}
        onChange={e => onFilterChange({ ...filter, search: e.target.value })}
        className={fieldClass}
      />

      <select
        value={filter.category}
        onChange={e => onFilterChange({ ...filter, category: e.target.value })}
        className={`${fieldClass} bg-gray-800`}
      >
        <option value="">すべてのカテゴリ</option>
        <option value="Cafe">カフェ</option>
        <option value="Tea Room">ティールーム</option>
        <option value="Hotel">ホテル</option>
        <option value="Chain">チェーン</option>
      </select>

      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs whitespace-nowrap">最低評価</span>
        <div className="flex gap-1">
          {([0, 1, 2, 3, 4, 5] as const).map(n => (
            <button
              key={n}
              onClick={() => onFilterChange({ ...filter, minRating: n })}
              className={`text-xs px-1 rounded transition-colors ${filter.minRating === n ? 'text-yellow-400 font-bold' : 'text-gray-600 hover:text-gray-300'}`}
            >
              {n === 0 ? '全て' : n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5">
        <button onClick={onClusterToggle} className={toggleClass(clusterEnabled, 'bg-indigo-700 border-indigo-500')}>
          クラスター
        </button>
        <button onClick={onHeatmapToggle} className={toggleClass(showHeatmap, 'bg-orange-700 border-orange-500')}>
          ヒートマップ
        </button>
        <button
          onClick={onGeolocate}
          className="flex-1 text-xs py-1 rounded border bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 transition-colors"
        >
          現在地
        </button>
      </div>

      <div className="flex gap-1.5 border-t border-gray-700 pt-2">
        <button
          onClick={() => exportCSV(spots)}
          disabled={spots.length === 0}
          className="flex-1 text-xs py-1 rounded bg-gray-800 border border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          CSVエクスポート
        </button>
        <button
          onClick={() => exportGeoJSON(spots)}
          disabled={spots.length === 0}
          className="flex-1 text-xs py-1 rounded bg-gray-800 border border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          GeoJSONエクスポート
        </button>
      </div>
    </div>
  )
}
