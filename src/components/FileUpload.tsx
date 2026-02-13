import React, { useState, useRef } from 'react'
import { Upload, X, File } from 'lucide-react'

interface FileUploadProps {
  label: string
  accept: 'image' | 'document' | 'video'
  multiple?: boolean
  onFileSelect: (files: File[]) => void
  onFileRemove?: (index: number) => void
  currentFiles?: File[]
  currentUrls?: string[]
  disabled?: boolean
  error?: string
  isCircular?: boolean // <-- NEW PROP
}

export default function FileUpload({
  label,
  accept,
  multiple = false,
  onFileSelect,
  onFileRemove,
  currentFiles = [],
  currentUrls = [],
  disabled = false,
  isCircular = false,
  error
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptedTypes = accept === 'image' 
    ? 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
    : accept === 'video'
    ? 'video/mp4,video/webm,video/ogg,video/quicktime'
    : 'application/pdf,.doc,.docx'

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileSelect(multiple ? files : [files[0]])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileSelect(multiple ? files : [files[0]])
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleRemove = (index: number) => {
    if (onFileRemove) {
      onFileRemove(index)
    }
  }

  return (
    <div className='space-y-2'>
      {!isCircular && (
        <label className='block text-sm font-medium text-gray-700'>
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
                    relative border-2 border-dashed text-center cursor-pointer
                    transition-all duration-200
                    ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${error ? 'border-red-300' : ''}

                    ${
                      isCircular
                        ? 'rounded-full w-28 h-28 flex items-center justify-center p-0 mx-auto' // Circular styles
                        : 'rounded-lg p-6 w-full' // Standard styles
                    }
                `}
        style={
          isCircular ? { minWidth: '112px', minHeight: '112px' } : undefined
        } // Ensures fixed size
      >
        <input
          ref={fileInputRef}
          type='file'
          accept={acceptedTypes}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className='hidden'
        />

        <div className='flex flex-col items-center space-y-1 w-full h-full justify-center overflow-hidden rounded-full relative group'>
          {isCircular && (currentFiles.length > 0 || currentUrls.length > 0) ? (
            <>
               <img 
                 src={currentFiles.length > 0 ? URL.createObjectURL(currentFiles[0]) : currentUrls[0]} 
                 className="absolute inset-0 w-full h-full object-cover"
                 alt="Preview"
               />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Upload className="h-6 w-6 text-white" />
               </div>
            </>
          ) : (
            <>
              <Upload
                className={`
                            ${isCircular ? 'h-6 w-6' : 'h-10 w-10'}
                            ${isDragging ? 'text-blue-500' : 'text-gray-400'}
                        `}
              />

              {!isCircular && (
                <>
                  <div className='text-sm text-gray-600'>
                    <span className='font-semibold text-blue-600'>
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </div>
                  <div className='text-xs text-gray-500'>
                    {accept === 'image'
                      ? 'PNG, JPG, GIF up to 5MB'
                      : accept === 'video'
                      ? 'MP4, WEBM, QuickTime up to 50MB'
                      : 'PDF, DOC, DOCX up to 10MB'}
                  </div>
                </>
              )}
              {isCircular && (
                <div className='text-xs text-gray-600'>{label || 'Upload'}</div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Error Message */}
      {error && <p className='text-sm text-red-600'>{error}</p>}

      {/* File Previews - Only show for standard (non-circular) upload */}
      {!isCircular && currentFiles.length > 0 && (
        <div className='space-y-2'>
          {currentFiles.map((file, index) => (
            <FilePreview
              key={index}
              file={file}
              onRemove={() => handleRemove(index)}
              type={accept}
            />
          ))}
        </div>
      )}

      {/* URL Previews - Only show for standard (non-circular) upload */}
      {!isCircular && currentUrls.length > 0 && (
        <div className='space-y-2'>
          {currentUrls.map((url, index) => (
            <UrlPreview
              key={index}
              url={url}
              onRemove={() => handleRemove(index)}
              type={accept}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// File Preview Component
function FilePreview({ file, onRemove, type }: { file: File; onRemove: () => void; type: 'image' | 'document' | 'video' }) {
  const [preview, setPreview] = useState<string>('')

  React.useEffect(() => {
    if (type === 'image' || type === 'video') {
      const url = URL.createObjectURL(file)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file, type])

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {type === 'image' && preview ? (
          <img src={preview} alt={file.name} className="h-12 w-12 shrink-0 object-cover rounded" />
        ) : type === 'video' && preview ? (
          <video src={preview} className="h-12 w-12 shrink-0 object-cover rounded" />
        ) : (
          <File className="h-8 w-8 shrink-0 text-gray-400" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>{file.name}</p>
          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
      >
        <X className="h-5 w-5 text-gray-500" />
      </button>
    </div>
  )
}

// URL Preview Component (for existing uploaded files)
function UrlPreview({ url, onRemove, type }: { url: string; onRemove: () => void; type: 'image' | 'document' | 'video' }) {
  const filename = url.split('/').pop() || 'file'

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {type === 'image' ? (
          <img src={url} alt={filename} className="h-12 w-12 shrink-0 object-cover rounded" />
        ) : type === 'video' ? (
          <video src={url} className="h-12 w-12 shrink-0 object-cover rounded" />
        ) : (
          <File className="h-8 w-8 shrink-0 text-gray-400" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate" title={filename}>{filename}</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline inline-block max-w-full truncate"
          >
            View file
          </a>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
      >
        <X className="h-5 w-5 text-gray-500" />
      </button>
    </div>
  )
}
