import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';

interface BookInfo {
  title: string;
  author: string;
  isFiction?: boolean;
  isbn?: string;
}

const BookCoverUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [needsRetry, setNeedsRetry] = useState<boolean>(false);
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [maxAttempts] = useState<number>(3);
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      
      // Reset states for new upload
      setError(null);
      setSuccess(false);
      setBookInfo(null);
      setPreviewText(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an image file');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('currentRetry', currentAttempt.toString());
      
      const response = await axios.post(`${API_URL}/book/cover`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const data = response.data;
      
      if (data.success) {
        // Success case
        setSuccess(true);
        setNeedsRetry(false);
        
        if (data.bookInfo) {
          setBookInfo(data.bookInfo);
        }
        
        if (data.previewText) {
          setPreviewText(data.previewText);
        }
      } else if (data.needsRetry) {
        // Need to retry with another image
        setSuccess(false);
        setNeedsRetry(true);
        setError(data.message);
        setCurrentAttempt(data.currentAttempt || currentAttempt + 1);
        
        // Clear the current file and preview
        setFile(null);
        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
      } else {
        // Other error
        setSuccess(false);
        setNeedsRetry(false);
        setError(data.message || 'An error occurred');
      }
    } catch (err: any) {
      console.error('Error uploading book cover:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
        
        if (err.response.data.needsRetry) {
          setNeedsRetry(true);
          setCurrentAttempt(err.response.data.currentAttempt || currentAttempt + 1);
          
          // Clear the current file and preview
          setFile(null);
          if (preview) {
            URL.revokeObjectURL(preview);
            setPreview(null);
          }
        }
      } else {
        setError('An error occurred while processing the image');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setError(null);
    setSuccess(false);
    setNeedsRetry(false);
    setCurrentAttempt(0);
    setBookInfo(null);
    setPreviewText(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Upload Book Cover</h2>
      
      {/* Attempt counter */}
      {needsRetry && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            Attempt {currentAttempt} of {maxAttempts + 1}
          </p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">Book cover processed successfully!</p>
        </div>
      )}
      
      {/* Upload form */}
      {(!success || needsRetry) && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Upload a book cover image:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={loading}
            />
          </div>
          
          {/* Image preview */}
          {preview && (
            <div className="mb-4">
              <p className="text-gray-700 mb-2">Preview:</p>
              <img
                src={preview}
                alt="Book cover preview"
                className="max-h-64 max-w-full object-contain border border-gray-300 rounded-md"
              />
            </div>
          )}
          
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={!file || loading}
              className={`px-4 py-2 rounded-md ${
                !file || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {loading ? 'Processing...' : 'Upload'}
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      )}
      
      {/* Book information */}
      {bookInfo && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="text-xl font-semibold mb-2">Book Information</h3>
          <p><strong>Title:</strong> {bookInfo.title}</p>
          <p><strong>Author:</strong> {bookInfo.author}</p>
          {bookInfo.isFiction !== undefined && (
            <p><strong>Type:</strong> {bookInfo.isFiction ? 'Fiction' : 'Non-fiction'}</p>
          )}
          {bookInfo.isbn && (
            <p><strong>ISBN:</strong> {bookInfo.isbn}</p>
          )}
        </div>
      )}
      
      {/* Preview text */}
      {previewText && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Book Preview</h3>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md whitespace-pre-wrap font-serif">
            {previewText}
          </div>
        </div>
      )}
      
      {/* Try again button */}
      {success && (
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Another Book
        </button>
      )}
    </div>
  );
};

export default BookCoverUpload; 