import React from 'react';
import { useTranslation } from 'react-i18next';

interface BasicInfoFieldsProps {
  fullname: string;
  setFullname: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  birthday: string;
  setBirthday: (val: string) => void;
  isOwnProfile: boolean;
  canEditExclusive: boolean;
}

export const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({
  fullname, setFullname,
  phone, setPhone,
  birthday, setBirthday,
  isOwnProfile, canEditExclusive
}) => {
  const { t } = useTranslation();
  const isDisabled = !isOwnProfile && !canEditExclusive;
  const inputClass = `w-full border rounded-md p-2 text-sm focus:ring-(--color-myPrimary) focus:border-(--color-myPrimary) ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`;

  return (
    <>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          {t('auth.fullname')}
        </label>
        <input
          type='text'
          required
          disabled={isDisabled}
          className={inputClass}
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          {t('auth.phone')}
        </label>
        <input
          type='tel'
          disabled={isDisabled}
          className={inputClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          {t('auth.birthday')}
        </label>
        <input
          type='date'
          disabled={isDisabled}
          className={inputClass}
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />
      </div>
    </>
  );
};
