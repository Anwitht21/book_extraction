'use client';

import { useState } from 'react';
import { BookData } from 'shared';
import BookDetails from '@/components/BookDetails';
import ImageUploader from '@/components/ImageUploader';

export default function Home() {
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col gap-8">
      <section className="card">
        <h2 className="text-2xl font-bold mb-4">Upload Book Cover</h2>
        <p className="mb-4 text-gray-600">
          Upload a clear image of a book cover to extract information such as title, author, and ISBN.
        </p>
        <ImageUploader
          onUploadStart={handleUploadStart}
          onBookDataReceived={handleBookDataReceived}
          onError={handleError}
        />
        {loading && (
          <div className="mt-4 text-center">
            <p className="text-gray-600">Processing image...</p>
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
          <BookDetails book={bookData} />
        </section>
      )}
    </div>
  );
} 