import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    handleFile(selectedFile);
  };
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
    }
  };
  
  // Common file handling logic
  const handleFile = (selectedFile: File | null) => {
    if (selectedFile) {
      // Check if file is an image
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      setFile(selectedFile);
      
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      
      // Reset states for new upload
      setError(null);
      setSuccess(false);
      setBookInfo(null);
      setPreviewText(null);
      setUploadProgress(0);
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
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('currentRetry', currentAttempt.toString());
      
      const response = await axios.post(`${API_URL}/book/cover`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadProgress(percentCompleted);
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
    setUploadProgress(0);
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Book Cover Upload
          </h2>
          
          {/* Progress indicator */}
          <AnimatePresence>
            {needsRetry && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-amber-800 font-medium">Attempt {currentAttempt} of {maxAttempts + 1}</p>
                      <div className="w-full bg-amber-200 rounded-full h-2.5 mt-2">
                        <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${(currentAttempt / (maxAttempts + 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Success message */}
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-green-700">Book cover processed successfully!</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Upload form */}
          <AnimatePresence>
            {(!success || needsRetry) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <form onSubmit={handleSubmit} className="mb-8">
                  <div 
                    className={`mb-6 border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : file 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={loading}
                    />
                    
                    {!preview ? (
                      <div className="py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-4 text-lg font-medium text-gray-700">
                          Drag & drop a book cover image here, or click to browse
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          Supports JPG, PNG, GIF up to 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="relative py-4">
                        <img
                          src={preview}
                          alt="Book cover preview"
                          className="max-h-80 mx-auto object-contain rounded-md"
                        />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            if (preview) {
                              URL.revokeObjectURL(preview);
                              setPreview(null);
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <p className="mt-2 text-sm text-gray-500">
                          Click to change image
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload progress */}
                  {loading && (
                    <div className="mb-6">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-indigo-700">Uploading...</span>
                        <span className="text-sm font-medium text-indigo-700">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <motion.div 
                          className="bg-indigo-600 h-2.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        ></motion.div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={!file || loading}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                        !file || loading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : 'Upload & Process'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      disabled={loading}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Results section */}
          <AnimatePresence>
            {(bookInfo || previewText) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Results</h3>
                  
                  {/* Book information */}
                  {bookInfo && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm"
                    >
                      <h4 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Book Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">Title</p>
                          <p className="text-lg font-medium text-gray-800">{bookInfo.title}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">Author</p>
                          <p className="text-lg font-medium text-gray-800">{bookInfo.author}</p>
                        </div>
                        {bookInfo.isFiction !== undefined && (
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-gray-500 mb-1">Type</p>
                            <p className="text-lg font-medium text-gray-800">
                              {bookInfo.isFiction ? (
                                <span className="inline-flex items-center">
                                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                  Fiction
                                </span>
                              ) : (
                                <span className="inline-flex items-center">
                                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                  Non-fiction
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        {bookInfo.isbn && (
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-gray-500 mb-1">ISBN</p>
                            <p className="text-lg font-medium text-gray-800 font-mono">{bookInfo.isbn}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Preview text */}
                  {previewText && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mb-8"
                    >
                      <h4 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        Book Preview
                      </h4>
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="max-h-96 overflow-y-auto pr-4 whitespace-pre-wrap font-serif text-gray-700 leading-relaxed">
                          {previewText}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* Try again button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 text-center"
                >
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg inline-flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Try Another Book
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default BookCoverUpload; 