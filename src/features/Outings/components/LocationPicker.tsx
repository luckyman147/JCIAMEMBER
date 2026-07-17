import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, MapPin } from 'lucide-react'

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function ClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number, address: string) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
        )
        const data = await res.json()
        onLocationChange(lat, lng, data.display_name ?? `${lat}, ${lng}`)
      } catch {
        onLocationChange(lat, lng, `${lat}, ${lng}`)
      }
    },
  })
  return null
}

function DraggableMarker({
  latitude, longitude, onLocationChange,
}: {
  latitude: number
  longitude: number
  onLocationChange: (lat: number, lng: number, address: string) => void
}) {
  const markerRef = useRef<L.Marker>(null)

  const eventHandlers = {
    dragend: async () => {
      const marker = markerRef.current
      if (marker) {
        const { lat, lng } = marker.getLatLng()
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
          )
          const data = await res.json()
          onLocationChange(lat, lng, data.display_name ?? `${lat}, ${lng}`)
        } catch {
          onLocationChange(lat, lng, `${lat}, ${lng}`)
        }
      }
    },
  }

  return <Marker ref={markerRef} position={[latitude, longitude]} draggable eventHandlers={eventHandlers} icon={defaultIcon} />
}

interface LocationPickerProps {
  latitude: number
  longitude: number
  address: string
  onLocationChange: (lat: number, lng: number, address: string) => void
}

interface Suggestion {
  lat: string
  lon: string
  display_name: string
}

export default function LocationPicker({ latitude, longitude, address, onLocationChange }: LocationPickerProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=en`
        )
        const data = await res.json()
        setSuggestions(data)
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [searchQuery])

  const selectSuggestion = (s: Suggestion) => {
    onLocationChange(parseFloat(s.lat), parseFloat(s.lon), s.display_name)
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2 relative">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('outings.searchLocation')}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            aria-label={t('outings.searchLocation')}
          />
        </div>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => selectSuggestion(s)}
              className="w-full flex items-start gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-b-0 dark:border-gray-700"
            >
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
              <span className="line-clamp-2">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-2">
        <MapContainer center={[latitude || 36.8, longitude || 10.18]} zoom={13} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationChange={onLocationChange} />
          {latitude !== 0 && longitude !== 0 && (
            <DraggableMarker latitude={latitude} longitude={longitude} onLocationChange={onLocationChange} />
          )}
        </MapContainer>
      </div>
      <div className="text-sm text-gray-500 space-y-1">
       
        <p className="text-xs truncate">{address}</p>
      </div>
    </div>
  )
}
