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

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {preview ? (
            <div className="mb-4">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto"
              />
            </div>
          ) : (
            <div className="py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop a book cover image, or click to select
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
            className="btn btn-secondary inline-block cursor-pointer"
          >
            {selectedFile ? 'Change Image' : 'Select Image'}
          </label>
        </div>

        <div className="flex justify-end space-x-2">
          {selectedFile && (
            <button
              type="button"
              onClick={handleReset}
              className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
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
            Extract Book Data
          </button>
        </div>
      </form>
    </div>
  );
} 