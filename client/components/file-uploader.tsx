"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Upload, File } from "lucide-react"

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  acceptedFileTypes?: string[]
}

export function FileUploader({ onFilesSelected, maxFiles = 5, acceptedFileTypes = ["*"] }: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const updatedFiles = [...selectedFiles, ...newFiles].slice(0, maxFiles)
      setSelectedFiles(updatedFiles)
      onFilesSelected(updatedFiles)
    }
  }

  const handleRemoveFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(updatedFiles)
    onFilesSelected(updatedFiles)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">{acceptedFileTypes.join(", ")}</p>
          </div>
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            multiple
            accept={acceptedFileTypes.join(",")}
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Files:</p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveFile(index)}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

