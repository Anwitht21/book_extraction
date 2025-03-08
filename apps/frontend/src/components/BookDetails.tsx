'use client';

import { BookData } from 'shared';

interface BookDetailsProps {
  bookData: BookData;
}

export default function BookDetails({ bookData }: BookDetailsProps) {
  const {
    title,
    author,
    isbn,
    publisher,
    publicationYear,
    description,
    coverImageUrl,
    extractedText,
    embeddedViewerHtml,
    classification
  } = bookData;

  // These properties might not be in the BookData interface yet
  const pageCount = (bookData as any).pageCount;
  const categories = (bookData as any).categories;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="md:flex">
        {coverImageUrl && (
          <div className="md:flex-shrink-0">
            <img
              className="h-48 w-full object-cover md:w-48"
              src={coverImageUrl}
              alt={`Cover of ${title}`}
            />
          </div>
        )}
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            {classification?.isFiction ? 'Fiction' : 'Non-Fiction'}
            {classification?.confidence && ` (${Math.round(classification.confidence * 100)}% confidence)`}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">by {author}</p>
          
          {(publisher || publicationYear) && (
            <p className="mt-2 text-gray-500">
              {publisher && `Published by ${publisher}`}
              {publisher && publicationYear && ', '}
              {publicationYear && `${publicationYear}`}
              {pageCount && ` • ${pageCount} pages`}
            </p>
          )}
          
          {isbn && (
            <p className="mt-2 text-sm text-gray-500">ISBN: {isbn}</p>
          )}
          
          {categories && categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category: string, index: number) => (
                <span 
                  key={index} 
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
          
          {description && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              <p className="mt-2 text-gray-600">{description}</p>
            </div>
          )}
          
          {extractedText && !embeddedViewerHtml && (
            <div className="mt-6 border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Book Content
              </h2>
              <div className="mt-2 text-gray-600 bg-gray-50 p-4 rounded border border-gray-200 max-h-64 overflow-y-auto">
                <p className="whitespace-pre-line">{extractedText}</p>
              </div>
            </div>
          )}
          
          {embeddedViewerHtml && (
            <div className="mt-6 border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Book Content
              </h2>
              <div className="mt-2" style={{ height: '800px' }}>
                <iframe
                  srcDoc={embeddedViewerHtml}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation"
                  title={`${title} Preview`}
                  className="rounded border border-gray-200"
                  style={{ minHeight: '800px' }}
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 