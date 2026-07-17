import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ExternalLink } from 'lucide-react'

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface MapPreviewProps {
  latitude: number
  longitude: number
  address: string
}

export default function MapPreview({ latitude, longitude }: MapPreviewProps) {
  const { t } = useTranslation()
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`

  return (
    <div>
      <div className="h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-3">
        <MapContainer center={[latitude, longitude]} zoom={15} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latitude, longitude]} icon={defaultIcon} />
        </MapContainer>
      </div>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        {t('outings.openInMaps')}
      </a>
    </div>
  )
}
