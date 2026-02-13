import { useTranslation } from 'react-i18next'

interface ActivityVideoProps {
  url: string
}

export default function ActivityVideo({ url }: ActivityVideoProps) {
  const { t } = useTranslation()

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {t('activities.activityVideo')}
      </h2>
      <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
        <video 
          src={url} 
          controls 
          className="w-full h-full object-contain"
        >
          {t('common.videoNotSupported')}
        </video>
      </div>
    </section>
  )
}
