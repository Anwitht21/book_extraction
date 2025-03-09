'use client';

import { useState } from 'react';
import { BookData } from 'shared';
import BookDetails from '@/components/BookDetails';
import ImageUploader from '@/components/ImageUploader';

export default function Home() {
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const handleBookDataReceived = (data: BookData) => {
    setBookData(data);
    setLoading(false);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
  };

  const handleUploadStart = () => {
    setLoading(true);
    setError(null);
  };

  const testBackendConnection = async () => {
    try {
      setTestMessage('Testing connection...');
      const response = await fetch('/api/test');
      const data = await response.json();
      setTestMessage(`Connection successful: ${data.message}`);
      console.log('Test response:', data);
    } catch (error) {
      setTestMessage(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Test error:', error);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <section className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Book Information Extractor
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload a book cover image and we'll extract all the important information using AI technology.
        </p>
      </section>

      <section className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-6 h-6 text-primary"
            >
              <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
              <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Upload Book Cover</h2>
        </div>
        
        <p className="mb-6 text-gray-600">
          Upload a clear image of a book cover to extract information and text from its first pages.
        </p>
        
        <div className="mb-6">
          <button 
            onClick={testBackendConnection}
            className="btn btn-outline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
            </svg>
            Test Backend Connection
          </button>
          {testMessage && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${testMessage.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testMessage}
            </div>
          )}
        </div>
        
        <ImageUploader
          onUploadStart={handleUploadStart}
          onBookDataReceived={handleBookDataReceived}
          onError={handleError}
        />
        
        {loading && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <div>
              <p className="font-medium text-blue-700">Processing image...</p>
              <p className="text-sm text-blue-600">This may take a moment as we analyze the book cover and extract text...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mt-0.5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p>{error}</p>
          </div>
        )}
      </section>

      {bookData && (
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-6 h-6 text-secondary"
              >
                <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Book Details</h2>
          </div>
          <BookDetails bookData={bookData} />
        </section>
      )}
    </div>
  );
} 