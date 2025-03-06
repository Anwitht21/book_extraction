'use client';

import { BookData } from 'shared';

interface BookDetailsProps {
  book: BookData;
}

export default function BookDetails({ book }: BookDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {book.coverImageUrl && (
          <div className="md:col-span-1">
            <img
              src={book.coverImageUrl}
              alt={`${book.title} cover`}
              className="w-full max-w-xs mx-auto rounded-md shadow-md"
            />
          </div>
        )}
        
        <div className={book.coverImageUrl ? 'md:col-span-2' : 'md:col-span-3'}>
          <h3 className="text-xl font-bold">{book.title}</h3>
          <p className="text-gray-700 mb-2">by {book.author}</p>
          
          <div className="mt-4 space-y-2">
            <div className="flex">
              <span className="font-semibold w-32">ISBN:</span>
              <span>{book.isbn}</span>
            </div>
            
            {book.publisher && (
              <div className="flex">
                <span className="font-semibold w-32">Publisher:</span>
                <span>{book.publisher}</span>
              </div>
            )}
            
            {book.publicationYear && (
              <div className="flex">
                <span className="font-semibold w-32">Published:</span>
                <span>{book.publicationYear}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {book.description && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Description</h4>
          <p className="text-gray-700">{book.description}</p>
        </div>
      )}
    </div>
  );
} 