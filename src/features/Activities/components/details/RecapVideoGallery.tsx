import { useTranslation } from 'react-i18next'
import { Play } from 'lucide-react'

interface RecapVideoGalleryProps {
  videos: string[]
}

export default function RecapVideoGallery({ videos }: RecapVideoGalleryProps) {
  const { t, i18n } = useTranslation()

  if (!videos || videos.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {t('activities.recapVideos')}
        <span className={`text-sm font-normal text-gray-500 ${i18n.dir() === 'rtl' ? 'mr-2' : 'ml-2'}`}>({videos.length})</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((url, index) => (
          <div
            key={index}
            className="group relative aspect-video rounded-xl overflow-hidden bg-black shadow-sm"
          >
            <video
              src={url}
              className="w-full h-full object-cover"
              controls
            />
            <div className="absolute inset-0 bg-black/20 pointer-events-none group-hover:bg-black/0 transition-colors" />
            <div className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white opacity-100 group-hover:opacity-0 transition-opacity">
               <Play size={16} fill="currentColor" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
