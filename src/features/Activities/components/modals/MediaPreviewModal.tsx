
import { X, Download, ExternalLink, FileText, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';

interface MediaItem {
  url: string;
  title: string;
}

interface MediaPreviewModalProps {
  items: MediaItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaPreviewModal({ items, initialIndex, isOpen, onClose }: MediaPreviewModalProps) {
  const { i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const isRTL = i18n.dir() === 'rtl';

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handlePrevious = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') isRTL ? handleNext() : handlePrevious();
      if (e.key === 'ArrowRight') isRTL ? handlePrevious() : handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRTL, handleNext, handlePrevious, onClose]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const url = currentItem.url;
  const title = currentItem.title;

  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || (url.includes('cloudinary') && !url.toLowerCase().endsWith('.pdf'));
  const isPDF = url.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* Navigation - Floating Arrows for better UI */}
      {items.length > 1 && (
        <>
          <button
            onClick={isRTL ? handleNext : handlePrevious}
            className={`absolute z-[60] p-3 text-white bg-black/20 hover:bg-black/40 rounded-full transition-all backdrop-blur-md ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2`}
          >
            <ChevronLeft className={`w-8 h-8 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={isRTL ? handlePrevious : handleNext}
            className={`absolute z-[60] p-3 text-white bg-black/20 hover:bg-black/40 rounded-full transition-all backdrop-blur-md ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2`}
          >
            <ChevronRight className={`w-8 h-8 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </>
      )}

      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                {title}
              </h3>
              {items.length > 1 && (
                <p className="text-xs text-gray-500 font-medium">
                  {currentIndex + 1} / {items.length}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-950 flex items-center justify-center min-h-[300px] relative group/content">
          {isImage ? (
            <img 
              src={url} 
              alt={title} 
              className="max-w-full max-h-full object-contain select-none"
              key={url} // Key forces re-render/animation on change
            />
          ) : isPDF ? (
            <iframe 
              src={`${url}#toolbar=0`} 
              className="w-full h-full border-none min-h-[60vh]"
              title={title}
              key={url}
            />
          ) : (
            <div className="text-center p-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-slate-400 mb-6">
                Preview not available for this file type.
              </p>
              <a 
                href={url} 
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25"
              >
                <Download className="w-5 h-5" />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
