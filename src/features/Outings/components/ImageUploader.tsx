import { useTranslation } from 'react-i18next'
import { Upload, X } from 'lucide-react'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string | undefined) => void
  onFileSelect: (file: File | null) => void
}

export default function ImageUploader({ value, onChange, onFileSelect }: ImageUploaderProps) {
  const { t } = useTranslation()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
      const previewUrl = URL.createObjectURL(file)
      onChange(previewUrl)
    }
  }

  const handleRemove = () => {
    onChange(undefined)
    onFileSelect(null)
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{t('outings.coverImage')}</label>
      {value ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
            aria-label="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-(--color-myPrimary) transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">{t('outings.coverImage')}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      )}
    </div>
  )
}
