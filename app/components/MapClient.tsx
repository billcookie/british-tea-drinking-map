'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import type { Map as LeafletMap, Marker, LeafletMouseEvent, Layer } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import TeaSpotForm from './TeaSpotForm'
import SpotDetailSidebar from './SpotDetailSidebar'
import FilterPanel from './FilterPanel'
import { TeaSpot, FilterState } from '../types'

const PUBLIC_API =
  'https://api.cms.reearth.io/api/p/npbohqkson/british-tea-map/british_tea_drinking_spots'

const CATEGORY_COLORS: Record<string, string> = {
  Cafe: '#6366f1',
  'Tea Room': '#10b981',
  Hotel: '#f59e0b',
  Chain: '#ef4444',
}

interface ApiItem {
  id: string
  title?: string
  name?: string
  category?: string
  description?: string
  rating?: number
  location?: { coordinates: [number, number] }
  photos?: Array<{ url: string; id: string } | string>
}

interface Cluster {
  lat: number
  lng: number
  spots: TeaSpot[]
}

// Approximate cluster cell size in degrees per zoom level
const CELL_DEG_TABLE: [number, number][] = [
  [3, 15], [4, 8], [5, 4], [6, 2], [7, 1],
  [8, 0.5], [9, 0.25], [10, 0.12], [11, 0.06],
  [12, 0.03], [13, 0.015], [14, 0.007],
]

function cellDeg(zoom: number): number {
  for (const [z, d] of CELL_DEG_TABLE) if (zoom <= z) return d
  return 0.003
}

function computeClusters(spots: TeaSpot[], zoom: number): Cluster[] {
  const d = cellDeg(zoom)
  const grid = new Map<string, Cluster>()
  for (const spot of spots) {
    const key = `${Math.floor(spot.lat / d)},${Math.floor(spot.lng / d)}`
    const c = grid.get(key)
    if (!c) {
      grid.set(key, { lat: spot.lat, lng: spot.lng, spots: [spot] })
    } else {
      c.spots.push(spot)
      c.lat = c.spots.reduce((s: number, sp: TeaSpot) => s + sp.lat, 0) / c.spots.length
      c.lng = c.spots.reduce((s: number, sp: TeaSpot) => s + sp.lng, 0) / c.spots.length
    }
  }
  return Array.from(grid.values())
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LType = any

export default function MapClient() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const leafletRef = useRef<LType>(null)
  const markersLayerRef = useRef<Layer | null>(null)
  const heatLayerRef = useRef<Layer | null>(null)
  const tempMarkerRef = useRef<Marker | null>(null)

  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [spots, setSpots] = useState<TeaSpot[]>([])
  const [filter, setFilter] = useState<FilterState>({ category: '', minRating: 0, search: '' })
  const [selectedSpot, setSelectedSpot] = useState<TeaSpot | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [clusterEnabled, setClusterEnabled] = useState(true)
  const [zoom, setZoom] = useState(6)

  const filteredSpots = useMemo(
    () =>
      spots.filter(s => {
        if (filter.category && s.category !== filter.category) return false
        if (filter.minRating > 0 && (s.rating || 0) < filter.minRating) return false
        if (filter.search) {
          const q = filter.search.toLowerCase()
          if (!s.name?.toLowerCase().includes(q) && !s.description?.toLowerCase().includes(q))
            return false
        }
        return true
      }),
    [spots, filter]
  )

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      // Fix broken marker icons in webpack/turbopack bundling
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([54.5, -3], 6)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      mapInstanceRef.current = map
      leafletRef.current = (L as LType & { default?: LType }).default ?? L
      setLeafletLoaded(true)

      map.on('zoomend', () => setZoom(map.getZoom()))

      map.on('click', (e: LeafletMouseEvent) => {
        setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
        setSelectedSpot(null)
        if (tempMarkerRef.current) tempMarkerRef.current.remove()
        tempMarkerRef.current = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map)
      })

      fetch(PUBLIC_API)
        .then(r => r.json())
        .then(data => {
          const loaded: TeaSpot[] = (data.results || [])
            .filter((item: ApiItem) => item.location?.coordinates)
            .map((item: ApiItem) => {
              const [lng, lat] = item.location!.coordinates
              return {
                id: item.id,
                name: item.title || item.name || '',
                category: item.category || '',
                description: item.description || '',
                rating: item.rating || 0,
                lat,
                lng,
                photos: item.photos || [],
              }
            })
          setSpots(loaded)
        })
        .catch(() => {})
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      leafletRef.current = null
    }
  }, [])

  // Re-render markers when filtered spots, cluster mode, heatmap, or zoom changes
  useEffect(() => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map || !leafletLoaded) return

    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current)
      markersLayerRef.current = null
    }

    function makeSpotIcon(category: string) {
      const color = CATEGORY_COLORS[category] || '#6b7280'
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/><circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/></svg>`
      return L.divIcon({ html: svg, className: '', iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36] })
    }

    function makeClusterIcon(count: number) {
      const size = count < 10 ? 32 : count < 50 ? 38 : 44
      const color = count < 10 ? '#6366f1' : count < 50 ? '#f59e0b' : '#ef4444'
      const html = `<div style="background:${color};color:white;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${count > 99 ? 11 : 13}px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)">${count}</div>`
      return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
    }

    const layer = L.layerGroup()

    if (clusterEnabled) {
      computeClusters(filteredSpots, zoom).forEach(cluster => {
        if (cluster.spots.length === 1) {
          const spot = cluster.spots[0]
          L.marker([spot.lat, spot.lng], { icon: makeSpotIcon(spot.category) })
            .bindPopup(`<b>${spot.name}</b><br/><span style="color:#9ca3af;font-size:12px">${spot.category}</span>`)
            .on('click', (e: LeafletMouseEvent) => {
              e.originalEvent?.stopPropagation()
              setSelectedSpot(spot)
            })
            .addTo(layer)
        } else {
          L.marker([cluster.lat, cluster.lng], { icon: makeClusterIcon(cluster.spots.length) })
            .on('click', () => {
              const bounds = L.latLngBounds(cluster.spots.map(s => [s.lat, s.lng]))
              map.fitBounds(bounds, { padding: [60, 60] })
            })
            .addTo(layer)
        }
      })
    } else {
      filteredSpots.forEach(spot => {
        L.marker([spot.lat, spot.lng], { icon: makeSpotIcon(spot.category) })
          .bindPopup(`<b>${spot.name}</b><br/><span style="color:#9ca3af;font-size:12px">${spot.category}</span>`)
          .on('click', (e: LeafletMouseEvent) => {
            e.originalEvent?.stopPropagation()
            setSelectedSpot(spot)
          })
          .addTo(layer)
      })
    }

    layer.addTo(map)
    markersLayerRef.current = layer

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }
    if (showHeatmap) {
      const heatGroup = L.layerGroup()
      filteredSpots.forEach(spot => {
        L.circleMarker([spot.lat, spot.lng], {
          radius: 40,
          fillColor: '#ff6b35',
          fillOpacity: 0.12,
          stroke: false,
          interactive: false,
        }).addTo(heatGroup)
      })
      heatGroup.addTo(map)
      heatLayerRef.current = heatGroup
    }
  }, [filteredSpots, clusterEnabled, showHeatmap, leafletLoaded, zoom])

  function handleGeolocate() {
    const map = mapInstanceRef.current
    if (!map) return
    navigator.geolocation.getCurrentPosition(
      pos => map.setView([pos.coords.latitude, pos.coords.longitude], 12),
      () => {}
    )
  }

  function handleSpotAdded(spot: TeaSpot) {
    setSpots(prev => [...prev, spot])
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove()
      tempMarkerRef.current = null
    }
    setSelectedLocation(null)
  }

  return (
    <div className="relative h-screen">
      <div ref={mapRef} className="h-full" />

      <TeaSpotForm
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        onSpotAdded={handleSpotAdded}
      />

      <FilterPanel
        filter={filter}
        onFilterChange={setFilter}
        totalSpots={spots.length}
        filteredCount={filteredSpots.length}
        showHeatmap={showHeatmap}
        onHeatmapToggle={() => setShowHeatmap(v => !v)}
        clusterEnabled={clusterEnabled}
        onClusterToggle={() => setClusterEnabled(v => !v)}
        onGeolocate={handleGeolocate}
        spots={filteredSpots}
      />

      {selectedSpot && (
        <SpotDetailSidebar spot={selectedSpot} onClose={() => setSelectedSpot(null)} />
      )}
    </div>
  )
}
