'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map, Marker, LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import TeaSpotForm from './TeaSpotForm'

interface ReportItem {
  location?: { coordinates: [number, number] }
  title?: string
}

const PUBLIC_API =
  'https://api.cms.reearth.io/api/p/npbohqkson/british-tea-map/british_tea_drinking_spots'

export default function MapClient() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // Fix broken marker icons in webpack bundling
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([54.5, -3], 6)
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ).addTo(map)
      mapInstanceRef.current = map

      // Load existing reports
      fetch(PUBLIC_API)
        .then((r) => r.json())
        .then((data) => {
          data.results?.forEach((item: ReportItem) => {
            if (item.location?.coordinates) {
              const [lng, lat] = item.location.coordinates
              L.marker([lat, lng])
                .bindPopup(item.title || '')
                .addTo(map)
            }
          })
        })
        .catch(() => {})

      // Temporary marker ref so we can replace on each click
      let tempMarker: Marker | null = null
      map.on('click', (e: LeafletMouseEvent) => {
        setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
        if (tempMarker) tempMarker.remove()
        tempMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map)
      })
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  return (
    <div className="relative h-screen">
      <div ref={mapRef} className="h-full" />
      <TeaSpotForm selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
    </div>
  )
}
