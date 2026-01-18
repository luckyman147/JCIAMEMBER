
import { Globe, Image as ImageIcon, File as FileIcon } from "lucide-react";

export const ResourceIcon = ({ type, className }: { type?: string; className?: string }) => {
    switch (type) {
        case 'image': return <ImageIcon className={className} />;
        case 'file': return <FileIcon className={className} />;
        default: return <Globe className={className} />;
    }
};
