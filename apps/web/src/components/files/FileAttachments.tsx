'use client'

import { useState, useEffect, useRef } from 'react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface FileRecord {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

interface FileAttachmentsProps {
  entityType: string
  entityId: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'img'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv')
    return 'XLS'
  if (mimeType.includes('word') || mimeType === 'application/msword') return 'DOC'
  if (mimeType.startsWith('text/')) return 'TXT'
  if (mimeType.includes('zip') || mimeType.includes('gzip')) return 'ZIP'
  return 'FILE'
}

export function FileAttachments({ entityType, entityId }: FileAttachmentsProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadFiles()
  }, [entityType, entityId])

  const loadFiles = async () => {
    try {
      const data = await api.get<{ files: FileRecord[] }>(
        `/files?entityType=${entityType}&entityId=${entityId}`,
      )
      setFiles(data.files)
    } catch {
      // Entity may not have files yet
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles?.length) return

    setUploading(true)
    setError(null)

    try {
      for (const file of Array.from(selectedFiles)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('entityType', entityType)
        formData.append('entityId', entityId)
        await api.upload('/files/upload', formData)
      }
      void loadFiles()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      await api.delete(`/files/${fileId}`)
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
    } catch {
      setError('Failed to delete file')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-french-gray dark:text-dark-text-secondary uppercase tracking-wide">
          Attachments {files.length > 0 && `(${files.length})`}
        </h4>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => void handleUpload(e)}
            className="hidden"
            id={`file-upload-${entityType}-${entityId}`}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            isLoading={uploading}
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            Attach
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-coral">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 p-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-sm group"
            >
              <span className="w-8 h-8 rounded bg-indigo/10 text-indigo flex items-center justify-center text-[10px] font-bold shrink-0">
                {getFileIcon(file.mimeType)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-jet dark:text-dark-text truncate">
                  {file.originalName}
                </p>
                <p className="text-[10px] text-french-gray dark:text-dark-text-secondary">
                  {formatFileSize(file.sizeBytes)}
                </p>
              </div>
              <a
                href={`${API_URL}/files/${file.id}`}
                className="p-1 rounded text-french-gray hover:text-indigo transition-colors opacity-0 group-hover:opacity-100"
                title="Download"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </a>
              <button
                onClick={() => void handleDelete(file.id)}
                className="p-1 rounded text-french-gray hover:text-coral transition-colors opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
