import { useActivityForm } from '../hooks/useActivityForm'
import type { ActivityFormValues } from '../schemas/activitySchema'
import { useTranslation } from 'react-i18next'

// Section Components - all from barrel file
import {
  BasicInfoSection,
  CategorySection,
  CoverImageSection,
  DateTimeSection,
  LocationSection,
  PaymentSection,
  RecapImagesSection,
  MeetingSection,
  FormationSection,
  RegistrationSection,
  GeneralAssemblySection,
  FormActions,
} from '../components/form/sections'

// Layout
import Navbar from '../../../Global_Components/navBar'

export default function ActivityForm() {
  const {
    register,
    handleSubmit,
    errors,
    watch,
    setValue,
    activityType,
    isPaid,
    isOnline,
    isEditMode,
    loading,
    uploading,
    meetingAgenda,
    selectedCategoryIds,
    activityImage,
    pvAttachment,
    courseAttachment,
    recapImages,
    setMeetingAgenda,
    setSelectedCategoryIds,
    onSubmit,
    onCancel,
  } = useActivityForm()

  const isDisabled = loading || uploading

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
          <main className="md:ms-64 pt-16 md:pt-6">

      <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <FormHeader isEditMode={isEditMode} />
          
          {/* Form */}
          <form 
            onSubmit={handleSubmit((data) => onSubmit(data as unknown as ActivityFormValues))} 
            className="p-4 sm:p-8 space-y-6 sm:space-y-8"
          >
            {/* Common Sections */}
            <CoverImageSection activityType={activityType} fileUpload={activityImage} />
            <BasicInfoSection register={register} errors={errors} isEditMode={isEditMode} />
            <CategorySection
              selectedCategoryIds={selectedCategoryIds}
              onCategoriesChange={setSelectedCategoryIds}
              disabled={isDisabled}
            />
            <DateTimeSection register={register} errors={errors} watch={watch} setValue={setValue} />

            {/* Type-specific Sections */}
            {(activityType === 'event' || activityType === 'formation') && (
              <RegistrationSection register={register} />
            )}

             {activityType === 'general_assembly' && (
              <GeneralAssemblySection register={register} />
            )}

            {activityType === 'meeting' && (
              <MeetingSection
                agenda={meetingAgenda}
                onAgendaChange={setMeetingAgenda}
                pvAttachment={pvAttachment}
                register={register}
                disabled={isDisabled}
                />
            )}

            {activityType === 'formation' && (
              <FormationSection
              register={register}
              courseAttachment={courseAttachment}
              />
            )}

            {/* Common Sections (continued) */}
            <LocationSection register={register} errors={errors} isOnline={isOnline} />
            <RecapImagesSection fileUpload={recapImages} />
            <PaymentSection register={register} errors={errors} isPaid={isPaid} />

            {/* Actions */}
            <FormActions
              isEditMode={isEditMode}
              loading={loading}
              uploading={uploading}
              onCancel={onCancel}
            />
          </form>
        </div>
      </div>
</main>
    </div>
  )
}

// Simple header component
function FormHeader({ isEditMode }: { isEditMode: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="px-4 sm:px-8 py-4 sm:py-6 bg-linear-to-r from-(--color-myPrimary) to-(--color-mySecondary) text-white text-start">
      <h1 className="text-2xl sm:text-3xl font-bold">
        {isEditMode ? t('activities.editActivity') : t('activities.createActivity')}
      </h1>
      <p className="mt-2 text-sm sm:text-base text-blue-100">
        {isEditMode 
          ? t('activities.updateSubtitle') 
          : t('activities.createSubtitle')}
      </p>
    </div>
  )
}
