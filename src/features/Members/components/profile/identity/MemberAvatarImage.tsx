import { FormSection, FileUpload } from "../../../../../components";
import type { UseFileUploadReturn } from "../../../../Activities/hooks/useFileUpload";
import { useTranslation } from "react-i18next";

interface MemberAvatarImageProps {
    fileUpload: UseFileUploadReturn;
}

export default function MemberAvatarImage({ fileUpload }: MemberAvatarImageProps) {
    const { t } = useTranslation();

    return (
        <FormSection title={t('profile.avatarImage')}>
            <FileUpload
                isCircular={true}
                label={t('profile.uploadAvatar')}
                accept="image"
                onFileSelect={(files) => fileUpload.setFile(files)}
                onFileRemove={fileUpload.clearFiles}
                currentFiles={fileUpload.file}
                currentUrls={fileUpload.urls}
            />
        </FormSection>
    );
}
