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
    <div className="overflow-hidden">
      <div className="md:flex gap-8">
        {coverImageUrl && (
          <div className="md:flex-shrink-0 mb-6 md:mb-0">
            <div className="relative w-full md:w-48 aspect-[2/3] overflow-hidden rounded-xl shadow-soft mx-auto md:mx-0">
              <img
                className="h-full w-full object-cover"
                src={coverImageUrl}
                alt={`Cover of ${title}`}
              />
            </div>
          </div>
        )}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            {classification?.isFiction !== undefined && (
              <span className={`badge ${classification.isFiction ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}`}>
                {classification.isFiction ? 'Fiction' : 'Non-Fiction'}
                {classification?.confidence && ` (${Math.round(classification.confidence * 100)}% confidence)`}
              </span>
            )}
            
            {categories && categories.length > 0 && categories.map((category: string, index: number) => (
              <span 
                key={index} 
                className="badge bg-secondary/10 text-secondary"
              >
                {category}
              </span>
            ))}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          
          {author && (
            <p className="text-lg text-gray-700 mb-3">by <span className="font-medium">{author}</span></p>
          )}
          
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-sm text-gray-500">
            {publisher && (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                </svg>
                <span>{publisher}</span>
              </div>
            )}
            
            {publicationYear && (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
                <span>{publicationYear}</span>
              </div>
            )}
            
            {pageCount && (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span>{pageCount} pages</span>
              </div>
            )}
            
            {isbn && (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
                <span>ISBN: {isbn}</span>
              </div>
            )}
          </div>
          
          {description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>
          )}
        </div>
      </div>
      
      {extractedText && !embeddedViewerHtml && (
        <div className="mt-8 border-t border-gray-100 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-secondary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            Book Content
          </h2>
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
            <p className="whitespace-pre-line text-gray-700 leading-relaxed">{extractedText}</p>
          </div>
        </div>
      )}
      
      {embeddedViewerHtml && (
        <div className="mt-8 border-t border-gray-100 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-secondary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            Book Content
          </h2>
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '800px' }}>
            <iframe
              srcDoc={embeddedViewerHtml}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation"
              title={`${title} Preview`}
              style={{ minHeight: '800px' }}
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
} 