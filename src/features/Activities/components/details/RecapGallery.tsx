
import { useTranslation } from 'react-i18next'

interface RecapGalleryProps {
  images: string[]
  onImageClick: (index: number) => void
}

export default function RecapGallery({ images, onImageClick }: RecapGalleryProps) {
  const { t, i18n } = useTranslation()

  if (!images || images.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {t('activities.recapPhotos')}
        <span className={`text-sm font-normal text-gray-500 ${i18n.dir() === 'rtl' ? 'mr-2' : 'ml-2'}`}>({images.length})</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((url, index) => (
          <button
            key={index}
            onClick={() => onImageClick(index)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-95 transition-all shadow-sm active:scale-95"
          >
            <img
              src={url}
              alt={`Recap ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>
    </section>
  )
}
