import React from 'react';
import { useTranslation } from 'react-i18next';

interface EditModalHeaderProps {
  onClose: () => void;
  isOwnProfile: boolean;
  canEditExclusive: boolean;
  loading: boolean;
}

export const EditModalHeader: React.FC<EditModalHeaderProps> = ({ 
  onClose, 
  isOwnProfile, 
  canEditExclusive, 
  loading 
}) => {
  const { t } = useTranslation();

  return (
    <div className='p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0'>
      <button
        onClick={onClose}
        className='text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors mx-2'
      >
        <span className="text-xl font-bold leading-none">&times;</span>
      </button>

      <div>
        <h2 className='text-xl font-semibold text-gray-900'>
          {isOwnProfile ? t('profile.editYourProfile') : t('profile.editMemberProfile')}
        </h2>
        {!isOwnProfile && !canEditExclusive && (
          <p className="text-sm text-gray-500">{t('profile.noEditPermission')}</p>
        )}
      </div>

      <div className='flex items-center gap-3'>
        <button
          type='submit'
          form='edit-member-form'
          disabled={loading}
          className='px-3 py-1.5 text-sm font-medium text-white bg-(--color-myPrimary) rounded-lg hover:brightness-110 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2'
        >
          {loading ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('profile.saving')}
            </>
          ) : (
            t('common.save')
          )}
        </button>
      </div>
    </div>
  );
};
