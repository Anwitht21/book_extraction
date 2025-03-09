'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { BookData, ImageUploadResponse } from 'shared';

interface ImageUploaderProps {
  onUploadStart: () => void;
  onBookDataReceived: (data: BookData) => void;
  onError: (message: string) => void;
}

export default function ImageUploader({
  onUploadStart,
  onBookDataReceived,
  onError,
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        onError('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        onError('File size exceeds 5MB limit');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      onError('Please select a file first');
      return;
    }
    
    console.log('Starting upload process');
    onUploadStart();
    
    const formData = new FormData();
    formData.append('coverImage', selectedFile);
    console.log('FormData created with file:', selectedFile.name);
    
    // Log the FormData contents for debugging
    Array.from(formData.entries()).forEach(pair => {
      console.log('FormData entry:', pair[0], pair[1]);
    });
    
    try {
      console.log('Sending request to /api/upload');
      
      // Use fetch instead of axios
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as ImageUploadResponse;
      console.log('Response received:', data);
      
      if (data.success && data.bookData) {
        console.log('Book data received:', data.bookData);
        onBookDataReceived(data.bookData);
      } else {
        console.error('API error:', data.error);
        onError(data.error || 'Failed to process image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError('Failed to upload image. Please try again.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        onError('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        onError('File size exceeds 5MB limit');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div 
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="mb-4">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg shadow-sm"
              />
              <p className="mt-2 text-sm text-gray-500">
                {selectedFile?.name} ({(selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0)} MB)
              </p>
            </div>
          ) : (
            <div className="py-12">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-700">
                Drag and drop a book cover image
              </p>
              <p className="mt-2 text-sm text-gray-500">
                or click to browse from your device
              </p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="btn btn-secondary mt-4 inline-block cursor-pointer"
          >
            {selectedFile ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Change Image
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Select Image
              </>
            )}
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          {selectedFile && (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-outline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Reset
            </button>
          )}
          <button
            type="submit"
            disabled={!selectedFile}
            className={`btn btn-primary ${
              !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Extract Book Data
          </button>
        </div>
      </form>
    </div>
  );
} 