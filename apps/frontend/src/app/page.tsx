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
    <div className="flex flex-col gap-8">
      <section className="card">
        <h2 className="text-2xl font-bold mb-4">Upload Book Cover</h2>
        <p className="mb-4 text-gray-600">
          Upload a clear image of a book cover to extract information and text from its first pages.
        </p>
        <div className="mb-4">
          <button 
            onClick={testBackendConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Backend Connection
          </button>
          {testMessage && (
            <p className="mt-2 text-sm">{testMessage}</p>
          )}
        </div>
        <ImageUploader
          onUploadStart={handleUploadStart}
          onBookDataReceived={handleBookDataReceived}
          onError={handleError}
        />
        {loading && (
          <div className="mt-4 text-center">
            <p className="text-gray-600">Processing image...</p>
            <p className="text-sm text-gray-500">This may take a moment as we analyze the book cover and extract text...</p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            <p>{error}</p>
          </div>
        )}
      </section>

      {bookData && (
        <section className="card">
          <h2 className="text-2xl font-bold mb-4">Book Details</h2>
          <BookDetails bookData={bookData} />
        </section>
      )}
    </div>
  );
} 