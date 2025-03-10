import axios from 'axios';
import { BookData } from 'shared';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

/**
 * Service for retrieving book information and preview text using Google Books API
 */
export class BookInformationService {
  private readonly apiKey: string;
  private readonly tempDir: string;
  
  // Fiction categories/keywords to check against
  private readonly fictionCategories: string[] = [
    'fiction', 'novel', 'fantasy', 'science fiction', 'sci-fi', 'mystery', 
    'thriller', 'romance', 'horror', 'adventure', 'drama', 'poetry', 'comics',
    'fairy tales', 'fables', 'short stories', 'young adult fiction', 'children\'s fiction',
    'literary fiction', 'historical fiction', 'crime fiction', 'detective'
  ];

  constructor() {
    // Get Google Books API key from environment variables
    this.apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('GOOGLE_BOOKS_API_KEY environment variable is not set. Some functionality may be limited.');
    }
    
    // Create temp directory if it doesn't exist
    this.tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Find a book by ISBN
   * @param isbn ISBN to search for
   * @returns Promise with book preview text or null if not found
   */
  async findBookByIsbn(isbn: string): Promise<string | null> {
    try {
      console.log(`Searching for book with ISBN: ${isbn}`);
      
      // Build search query specifically for ISBN
      const query = `isbn:${isbn}`;
      
      // Get book information from Google Books API
      const bookInfo = await this.searchGoogleBooks(query);
      
      if (!bookInfo) {
        console.log(`No book found with ISBN: ${isbn}`);
        return null;
      }
      
      // Determine if the book is fiction or non-fiction
      const isFiction = this.isFiction(bookInfo);
      console.log(`Book "${bookInfo.volumeInfo?.title}" determined to be ${isFiction ? 'fiction' : 'non-fiction'}`);
      
      // Extract preview text based on fiction/non-fiction status
      const previewText = await this.extractPreviewText(bookInfo, isFiction);
      
      if (!previewText) {
        console.log('No preview text available');
        return null;
      }
      
      return previewText;
    } catch (error) {
      console.error(`Error finding book with ISBN ${isbn}:`, error);
      return null;
    }
  }

  /**
   * Get preview text from a book by title and author
   * @param title Book title
   * @param author Book author (optional)
   * @param isbn ISBN (optional) - if provided, will be used to prioritize matching editions
   * @returns Promise with book preview text or null if not found
   */
  async findBookPdf(title: string, author?: string, isbn?: string): Promise<string | null> {
    try {
      console.log(`Searching for preview of "${title}" ${author ? `by ${author}` : ''} ${isbn ? `ISBN: ${isbn}` : ''}`);
      
      // If ISBN is provided, try searching by ISBN first
      if (isbn) {
        console.log(`Trying to find book with ISBN: ${isbn}`);
        const isbnResult = await this.findBookByIsbn(isbn);
        if (isbnResult) {
          console.log(`Found book by ISBN: ${isbn}`);
          return isbnResult;
        }
        console.log(`No preview available for ISBN: ${isbn}, falling back to title/author search`);
      }
      
      // Build search query
      let query = `intitle:${title}`;
      if (author) {
        query += `+inauthor:${author}`;
      }
      
      // Get book information from Google Books API
      const bookInfo = await this.searchGoogleBooks(query);
      
      if (!bookInfo) {
        console.log('No book information found');
        return null;
      }
      
      // Determine if the book is fiction or non-fiction
      const isFiction = this.isFiction(bookInfo);
      console.log(`Book "${bookInfo.volumeInfo?.title}" determined to be ${isFiction ? 'fiction' : 'non-fiction'}`);
      
      // Extract preview text based on fiction/non-fiction status
      const previewText = await this.extractPreviewText(bookInfo, isFiction);
      
      if (!previewText) {
        console.log('No preview text available');
        return null;
      }
      
      return previewText;
    } catch (error) {
      console.error('Error finding book preview:', error);
      return null;
    }
  }

  /**
   * Extract ISBNs from book information
   * @param bookInfo Book information from Google Books API
   * @returns Object with ISBN-10 and ISBN-13 if available
   */
  private extractIsbns(bookInfo: any): { isbn10?: string, isbn13?: string } {
    const result: { isbn10?: string, isbn13?: string } = {};
    
    if (bookInfo?.volumeInfo?.industryIdentifiers) {
      for (const identifier of bookInfo.volumeInfo.industryIdentifiers) {
        if (identifier.type === 'ISBN_10') {
          result.isbn10 = identifier.identifier;
        } else if (identifier.type === 'ISBN_13') {
          result.isbn13 = identifier.identifier;
        }
      }
    }
    
    return result;
  }

  /**
   * Search Google Books API for book information
   * @param query Search query
   * @returns Book information or null if not found
   */
  private async searchGoogleBooks(query: string): Promise<any> {
    try {
      // Increase maxResults to get more potential editions
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${this.apiKey}`;
      
      const response = await axios.get(url, {
        timeout: 10000 // 10 seconds timeout
      });
      
      if (!response.data.items || response.data.items.length === 0) {
        console.log(`No books found for query: "${query}"`);
        return null;
      }
      
      // Process all results to find the best edition with preview
      const items = response.data.items;
      console.log(`Found ${items.length} editions for query: "${query}"`);
      
      // Log all editions with their viewability status and ISBNs
      items.forEach((item: any, index: number) => {
        const isbns = this.extractIsbns(item);
        const isbnText = [
          isbns.isbn13 ? `ISBN-13: ${isbns.isbn13}` : '',
          isbns.isbn10 ? `ISBN-10: ${isbns.isbn10}` : ''
        ].filter(Boolean).join(', ');
        
        console.log(`Edition ${index + 1}: "${item.volumeInfo?.title}" by ${item.volumeInfo?.authors?.join(', ') || 'Unknown'}`);
        console.log(`  Viewability: ${item.accessInfo?.viewability || 'Unknown'}, Embeddable: ${item.accessInfo?.embeddable || false}`);
        console.log(`  ${isbnText || 'No ISBNs found'}`);
      });
      
      // Priority 1: Editions with PARTIAL or ALL_PAGES viewability that are embeddable
      const bestEdition = items.find(item => 
        (item.accessInfo?.viewability === 'PARTIAL' || item.accessInfo?.viewability === 'ALL_PAGES') && 
        item.accessInfo?.embeddable === true
      );
      
      if (bestEdition) {
        const isbns = this.extractIsbns(bestEdition);
        const isbnText = [
          isbns.isbn13 ? `ISBN-13: ${isbns.isbn13}` : '',
          isbns.isbn10 ? `ISBN-10: ${isbns.isbn10}` : ''
        ].filter(Boolean).join(', ');
        
        console.log(`Selected best edition with preview available: "${bestEdition.volumeInfo?.title}"`);
        console.log(`  Viewability: ${bestEdition.accessInfo?.viewability}, ${isbnText}`);
        return bestEdition;
      }
      
      // Priority 2: Any edition with PARTIAL or ALL_PAGES viewability
      const editionWithPartialView = items.find(item => 
        item.accessInfo?.viewability === 'PARTIAL' || item.accessInfo?.viewability === 'ALL_PAGES'
      );
      
      if (editionWithPartialView) {
        const isbns = this.extractIsbns(editionWithPartialView);
        const isbnText = [
          isbns.isbn13 ? `ISBN-13: ${isbns.isbn13}` : '',
          isbns.isbn10 ? `ISBN-10: ${isbns.isbn10}` : ''
        ].filter(Boolean).join(', ');
        
        console.log(`Selected edition with partial view: "${editionWithPartialView.volumeInfo?.title}"`);
        console.log(`  Viewability: ${editionWithPartialView.accessInfo?.viewability}, ${isbnText}`);
        return editionWithPartialView;
      }
      
      // Priority 3: Any edition with textSnippet
      const editionWithSnippet = items.find(item => item.searchInfo?.textSnippet);
      
      if (editionWithSnippet) {
        const isbns = this.extractIsbns(editionWithSnippet);
        const isbnText = [
          isbns.isbn13 ? `ISBN-13: ${isbns.isbn13}` : '',
          isbns.isbn10 ? `ISBN-10: ${isbns.isbn10}` : ''
        ].filter(Boolean).join(', ');
        
        console.log(`Selected edition with text snippet: "${editionWithSnippet.volumeInfo?.title}"`);
        console.log(`  ${isbnText}`);
        return editionWithSnippet;
      }
      
      // Fallback: Use the first result
      console.log(`No edition with preview found. Using first result: "${items[0].volumeInfo?.title}"`);
      return items[0];
    } catch (error) {
      console.error('Error searching Google Books API:', error);
      return null;
    }
  }

  /**
   * Determine if a book is fiction or non-fiction based on its categories and description
   * @param bookInfo Book information from Google Books API
   * @returns True if the book is fiction, false if non-fiction
   */
  private isFiction(bookInfo: any): boolean {
    if (!bookInfo || !bookInfo.volumeInfo) {
      // Default to non-fiction if we can't determine
      return false;
    }

    const volumeInfo = bookInfo.volumeInfo;
    
    // Check categories if available
    if (volumeInfo.categories && volumeInfo.categories.length > 0) {
      for (const category of volumeInfo.categories) {
        const lowerCategory = category.toLowerCase();
        
        // Check if any fiction category matches
        for (const fictionCategory of this.fictionCategories) {
          if (lowerCategory.includes(fictionCategory)) {
            return true;
          }
        }
        
        // Explicit non-fiction check
        if (lowerCategory.includes('non-fiction') || lowerCategory.includes('nonfiction')) {
          return false;
        }
      }
    }
    
    // Check main category if available
    if (volumeInfo.mainCategory) {
      const lowerMainCategory = volumeInfo.mainCategory.toLowerCase();
      
      // Check if any fiction category matches
      for (const fictionCategory of this.fictionCategories) {
        if (lowerMainCategory.includes(fictionCategory)) {
          return true;
        }
      }
      
      // Explicit non-fiction check
      if (lowerMainCategory.includes('non-fiction') || lowerMainCategory.includes('nonfiction')) {
        return false;
      }
    }
    
    // Check description for keywords if available
    if (volumeInfo.description) {
      const lowerDescription = volumeInfo.description.toLowerCase();
      
      // Check for fiction keywords in description
      for (const fictionCategory of this.fictionCategories) {
        if (lowerDescription.includes(fictionCategory)) {
          return true;
        }
      }
      
      // Explicit non-fiction check in description
      if (lowerDescription.includes('non-fiction') || lowerDescription.includes('nonfiction')) {
        return false;
      }
    }
    
    // Check title for keywords
    if (volumeInfo.title) {
      const lowerTitle = volumeInfo.title.toLowerCase();
      
      // Check for fiction keywords in title
      for (const fictionCategory of this.fictionCategories) {
        if (lowerTitle.includes(fictionCategory)) {
          return true;
        }
      }
      
      // Explicit non-fiction check in title
      if (lowerTitle.includes('non-fiction') || lowerTitle.includes('nonfiction')) {
        return false;
      }
    }
    
    // Default to non-fiction if we can't determine
    return false;
  }

  /**
   * Extract and analyze table of contents to find the true start of the book
   * @param bookId Google Books volume ID
   * @returns Promise with the start page number or null if not available
   */
  private async findBookStartPage(bookId: string): Promise<number | null> {
    try {
      console.log(`Analyzing table of contents for book ID ${bookId} to find true start page`);
      
      // Get detailed volume information including table of contents
      const url = `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${this.apiKey}`;
      const response = await axios.get(url, {
        timeout: 10000 // 10 seconds timeout
      });
      
      const volumeInfo = response.data.volumeInfo;
      
      // Check if table of contents is available
      if (volumeInfo?.tableOfContents && Array.isArray(volumeInfo.tableOfContents)) {
        console.log(`Table of contents found with ${volumeInfo.tableOfContents.length} entries`);
        
        // Log the full table of contents for debugging
        volumeInfo.tableOfContents.forEach((entry: any, index: number) => {
          console.log(`TOC Entry ${index + 1}: ${JSON.stringify(entry)}`);
        });
        
        // Look for the first chapter or content start
        for (const entry of volumeInfo.tableOfContents) {
          // Check if this is a string entry or an object with title/pageNumber
          if (typeof entry === 'string') {
            // Parse string entries (older API format)
            const entryText = entry.toLowerCase();
            const pageMatch = entryText.match(/page\s*(\d+)|p\.\s*(\d+)/i);
            const isChapterStart = /chapter\s*1|chapter\s*one|introduction|prologue|part\s*one|part\s*1|begin/i.test(entryText);
            
            if (isChapterStart && pageMatch) {
              const pageNumber = parseInt(pageMatch[1] || pageMatch[2], 10);
              console.log(`Found chapter start in TOC: "${entry}" on page ${pageNumber}`);
              return pageNumber;
            }
          } else if (typeof entry === 'object' && entry.title && entry.pageNumber) {
            // Parse object entries (newer API format)
            const title = entry.title.toLowerCase();
            const isChapterStart = /chapter\s*1|chapter\s*one|introduction|prologue|part\s*one|part\s*1|begin/i.test(title);
            
            // Check if page number is numeric (not roman numerals)
            if (isChapterStart && /^\d+$/.test(entry.pageNumber)) {
              const pageNumber = parseInt(entry.pageNumber, 10);
              console.log(`Found chapter start in TOC: "${entry.title}" on page ${pageNumber}`);
              return pageNumber;
            }
          }
        }
        
        // If no chapter start found, look for the first entry with numeric pagination
        for (const entry of volumeInfo.tableOfContents) {
          if (typeof entry === 'string') {
            const pageMatch = entry.match(/page\s*(\d+)|p\.\s*(\d+)/i);
            if (pageMatch) {
              const pageNumber = parseInt(pageMatch[1] || pageMatch[2], 10);
              console.log(`Found first numeric page in TOC: "${entry}" on page ${pageNumber}`);
              return pageNumber;
            }
          } else if (typeof entry === 'object' && entry.pageNumber && /^\d+$/.test(entry.pageNumber)) {
            const pageNumber = parseInt(entry.pageNumber, 10);
            console.log(`Found first numeric page in TOC: "${entry.title}" on page ${pageNumber}`);
            return pageNumber;
          }
        }
      } else {
        console.log('No table of contents found in volume info');
      }
      
      // Check for text snippets that might indicate chapter starts
      if (volumeInfo?.description) {
        const description = volumeInfo.description.toLowerCase();
        const chapterMatch = description.match(/chapter\s*1|chapter\s*one|introduction|prologue/i);
        
        if (chapterMatch) {
          console.log(`Found chapter reference in description: "${chapterMatch[0]}"`);
          // Since we don't have a page number, return a default starting point
          return 4; // Default starting point if we find chapter references but no page numbers
        }
      }
      
      // If we couldn't find a specific start page, return null
      console.log('Could not determine exact start page from metadata');
      return null;
    } catch (error) {
      console.error('Error finding book start page:', error);
      return null;
    }
  }

  /**
   * Extract preview text from book information
   * @param bookInfo Book information from Google Books API
   * @param isFiction Whether the book is fiction or non-fiction
   * @returns Preview text or null if not available
   */
  private async extractPreviewText(bookInfo: any, isFiction: boolean): Promise<string | null> {
    try {
      if (!bookInfo || !bookInfo.id) {
        console.log('No book info or book ID provided');
        return null;
      }

      const bookId = bookInfo.id;
      const title = bookInfo.volumeInfo?.title || 'Unknown Title';
      const authors = bookInfo.volumeInfo?.authors || ['Unknown Author'];
      const isbns = this.extractIsbns(bookInfo);
      
      // Log book information including ISBNs
      console.log(`Book ID: ${bookId}`);
      console.log(`Title: ${title}`);
      console.log(`Authors: ${authors.join(', ')}`);
      if (isbns.isbn13) console.log(`ISBN-13: ${isbns.isbn13}`);
      if (isbns.isbn10) console.log(`ISBN-10: ${isbns.isbn10}`);
      console.log(`Viewability: ${bookInfo.accessInfo?.viewability || 'Unknown'}`);
      console.log(`Embeddable: ${bookInfo.accessInfo?.embeddable || false}`);
      
      // Check if preview is actually available
      const previewAvailable = bookInfo.accessInfo?.viewability === 'PARTIAL' || bookInfo.accessInfo?.viewability === 'ALL_PAGES';
      const previewLink = bookInfo.accessInfo?.webReaderLink;
      
      console.log(`Preview available: ${previewAvailable}`);
      console.log(`Preview link: ${previewLink || 'None'}`);
      
      // Check for textSnippet which indicates if there's any preview text
      const hasTextSnippet = !!bookInfo.searchInfo?.textSnippet;
      console.log(`Has text snippet: ${hasTextSnippet}`);
      
      // Check if the book has any preview pages
      if (bookInfo.volumeInfo?.readingModes) {
        console.log(`Reading modes: ${JSON.stringify(bookInfo.volumeInfo.readingModes)}`);
      }
      
      // Try to find the true start page of the book using table of contents metadata
      let startPage = null;
      try {
        startPage = await this.findBookStartPage(bookId);
      } catch (error) {
        console.error('Error finding start page:', error);
      }
      
      // Determine which page to extract based on the book type and metadata
      let pageNumber;
      
      if (startPage) {
        // If we found a specific start page from metadata, use it
        // For fiction books, go to the second page after the start
        // For non-fiction books, stay on the start page
        pageNumber = isFiction ? startPage + 1 : startPage;
        console.log(`Using metadata-derived page number: ${pageNumber} (${isFiction ? 'fiction - page after start' : 'non-fiction - start page'})`);
      } else {
        // Fall back to our default page selection logic
        // For fiction books, go to the second page after the full page of text (page 5)
        // For non-fiction books, stay on the original full page of text (page 4)
        pageNumber = isFiction ? 5 : 4;
        console.log(`Using default page number: ${pageNumber} (${isFiction ? 'fiction - second page after full text' : 'non-fiction - first full page of text'})`);
      }
      
      // Generate embedded viewer HTML if the book is embeddable
      if (bookInfo.accessInfo?.embeddable) {
        console.log('Book is embeddable, generating embedded viewer HTML');
        
        // Create a special response object with both text and HTML
        const embedHtml = this.generateEmbeddedViewerHtml(bookId, pageNumber, title, authors, isFiction, isbns, startPage);
        
        // Return a JSON string that includes both the placeholder text and the HTML
        return JSON.stringify({
          text: 'Preview available in embedded viewer',
          html: embedHtml,
          isbns,
          startPage
        });
      }
      
      // If the book is not embeddable, fall back to the description
      console.log('Book is not embeddable, using description as fallback');
      if (bookInfo.volumeInfo?.description) {
        return this.formatPreviewText(title, authors, bookInfo.volumeInfo.description, isFiction, true, isbns, startPage);
      }
      
      console.log('No description available');
      return null;
    } catch (error) {
      console.error('Error extracting preview text:', error);
      return null;
    }
  }

  /**
   * Generate HTML for embedding the Google Books viewer with a specific book and page
   * @param bookId Google Books ID
   * @param pageNumber Page number to show
   * @param title Book title
   * @param authors Book authors
   * @param isFiction Whether the book is fiction or non-fiction
   * @param isbns Object with ISBN-10 and ISBN-13 if available
   * @param startPage The true start page of the book content if available
   * @returns HTML for embedding the viewer
   */
  private generateEmbeddedViewerHtml(
    bookId: string, 
    pageNumber: number, 
    title: string, 
    authors: string[], 
    isFiction: boolean,
    isbns: { isbn10?: string, isbn13?: string } = {},
    startPage?: number | null
  ): string {
    const authorText = authors.length > 0 ? `by ${authors.join(', ')}` : '';
    const fictionStatus = isFiction ? 'Fiction' : 'Non-fiction';
    const isbnText = isbns.isbn13 ? `ISBN: ${isbns.isbn13}` : (isbns.isbn10 ? `ISBN: ${isbns.isbn10}` : '');
    const startPageInfo = startPage ? `Content starts on page ${startPage}` : '';
    
    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
  <title>${title} Preview</title>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; font-family: Arial, sans-serif; overflow: hidden; }
    .container { display: flex; flex-direction: column; height: 100vh; }
    .header { padding: 10px; background-color: #f5f5f5; border-bottom: 1px solid #ddd; }
    .book-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
    .book-info { font-size: 14px; color: #555; }
    .isbn-info { font-size: 12px; color: #777; margin-top: 3px; }
    .start-page-info { font-size: 12px; color: #4a6; margin-top: 3px; font-style: italic; }
    .viewer-container { flex: 1; width: 100%; height: calc(100% - 60px); }
    #viewerCanvas { width: 100%; height: 100%; }
    .error-message { color: red; padding: 20px; text-align: center; }
    .page-info { position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.8); padding: 5px; font-size: 12px; z-index: 1000; }
  </style>
  <script type="text/javascript" src="https://www.google.com/books/jsapi.js"></script>
  <script type="text/javascript">
    var viewer = null;
    var isFiction = ${isFiction};
    var currentPage = 0;
    var bookId = "${bookId}";
    var isbn = "${isbns.isbn13 || isbns.isbn10 || ''}";
    var targetPage = ${pageNumber};
    var startPage = ${startPage || 'null'};
    
    google.books.load();
    
    function alertNotFound() {
      document.getElementById('viewerCanvas').innerHTML = 
        '<div class="error-message">This book preview is not available.</div>';
    }
    
    function updatePageInfo() {
      if (!viewer) return;
      
      var pageInfoElement = document.getElementById('pageInfo');
      if (pageInfoElement) {
        currentPage = viewer.getPageNumber();
        pageInfoElement.innerHTML = 'Page ' + currentPage;
      }
    }
    
    function bookLoadSuccess() {
      console.log('Book loaded successfully');
      
      // Create page info element
      var pageInfoElement = document.createElement('div');
      pageInfoElement.id = 'pageInfo';
      pageInfoElement.className = 'page-info';
      document.body.appendChild(pageInfoElement);
      
      // Update page info immediately
      updatePageInfo();
      
      // Navigate to the appropriate page after a delay
      setTimeout(function() {
        console.log('Navigating to page ' + targetPage + ' (' + (isFiction ? 'fiction' : 'non-fiction') + ')');
        
        // Go to target page by navigating forward from page 1
        var pagesToAdvance = targetPage - 1; // Subtract 1 because we start at page 1
        
        if (pagesToAdvance <= 0) {
          // If target page is 1 or less, stay on page 1
          updatePageInfo();
          return;
        }
        
        // Go to target page by navigating forward from page 1
        for (var i = 0; i < pagesToAdvance; i++) {
          setTimeout(function() {
            viewer.nextPage();
            updatePageInfo();
          }, i * 500); // Stagger the page turns to ensure they all register
        }
      }, 1500);
      
      // Set up periodic page info updates
      setInterval(updatePageInfo, 1000);
    }
    
    function initialize() {
      viewer = new google.books.DefaultViewer(document.getElementById('viewerCanvas'));
      viewer.load(bookId, alertNotFound, bookLoadSuccess);
    }
    
    // Set callback to initialize the viewer when the API is loaded
    google.books.setOnLoadCallback(initialize);
  </script>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="book-title">${title}</div>
      <div class="book-info">${authorText} • ${fictionStatus} • Page ${pageNumber}</div>
      ${isbnText ? `<div class="isbn-info">${isbnText}</div>` : ''}
      ${startPageInfo ? `<div class="start-page-info">${startPageInfo}</div>` : ''}
    </div>
    <div class="viewer-container">
      <div id="viewerCanvas"></div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Format preview text with book information
   * @param title Book title
   * @param authors Book authors
   * @param text Preview text
   * @param isFiction Whether the book is fiction or non-fiction
   * @param isFallback Whether this is a fallback text
   * @param isbns Object with ISBN-10 and ISBN-13 if available
   * @param startPage The true start page of the book content if available
   * @returns Formatted preview text
   */
  private formatPreviewText(
    title: string, 
    authors: string[] = [], 
    text: string, 
    isFiction: boolean, 
    isFallback: boolean = false,
    isbns: { isbn10?: string, isbn13?: string } = {},
    startPage?: number | null
  ): string {
    const authorText = authors.length > 0 ? `by ${authors.join(', ')}` : '';
    const fictionStatus = isFiction ? 'Fiction' : 'Non-fiction';
    
    // Determine page number based on start page metadata if available
    let pageNumber;
    if (startPage) {
      pageNumber = isFiction ? startPage + 1 : startPage;
    } else {
      pageNumber = isFiction ? 5 : 4;
    }
    
    let formattedText = `${title} ${authorText}\nType: ${fictionStatus}\n`;
    
    // Add ISBN information if available
    if (isbns.isbn13 || isbns.isbn10) {
      formattedText += `ISBN: ${isbns.isbn13 || ''} ${isbns.isbn10 ? `(ISBN-10: ${isbns.isbn10})` : ''}\n`;
    }
    
    // Add start page information if available
    if (startPage) {
      formattedText += `Content starts on page ${startPage}\n`;
    }
    
    if (isFallback) {
      formattedText += `[Note: This is the book description or snippet, not the actual preview text]\n\n`;
    } else {
      formattedText += `Page ${pageNumber} Preview\n\n`;
    }
    
    formattedText += text;
    
    return formattedText;
  }

  /**
   * Get preview text directly from Google Books API
   * @param bookId Google Books volume ID
   * @param pageNumber Page number to extract (1-indexed)
   * @returns Preview text or null if not available
   */
  private async getPreviewTextFromAPI(bookId: string, pageNumber: number): Promise<string | null> {
    try {
      console.log(`Attempting to get preview text for book ID ${bookId}, page ${pageNumber}`);
      
      // First, get the volume information to check if it has a web reader link
      const volumeResponse = await axios.get(
        `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${this.apiKey}`
      );
      
      const volumeInfo = volumeResponse.data;
      const accessInfo = volumeInfo.accessInfo || {};
      
      console.log(`Book viewability: ${accessInfo.viewability}`);
      console.log(`Book has web reader link: ${accessInfo.webReaderLink ? 'Yes' : 'No'}`);
      
      // Try multiple approaches to get preview text
      
      // Approach 1: Try to get text snippets from the book's search results
      try {
        console.log('Approach 1: Getting text snippets from search results');
        const searchTerms = [
          'the', 'and', 'in', 'of', 'to', 'a', 'is', 'that', 'for', 'it',
          'with', 'as', 'was', 'on', 'are', 'by', 'this', 'be', 'at', 'an'
        ];
        
        // Try with different common words to get more text
        for (const term of searchTerms.slice(0, 5)) { // Try first 5 terms
          const searchResponse = await axios.get(
            `https://www.googleapis.com/books/v1/volumes/${bookId}?q=${term}&key=${this.apiKey}`
          );
          
          if (searchResponse.data.searchInfo && searchResponse.data.searchInfo.textSnippet) {
            const snippet = searchResponse.data.searchInfo.textSnippet
              .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
              .trim();
              
            if (snippet.length > 100) { // Only use if it's substantial
              console.log(`Found text snippet for term "${term}": ${snippet.substring(0, 50)}...`);
              return snippet;
            }
          }
        }
      } catch (error) {
        console.log('Error getting text snippets from search:', error.message);
      }
      
      // Approach 2: Try to get preview from the Google Books Partner API
      try {
        console.log('Approach 2: Trying Google Books Partner API');
        const partnerResponse = await axios.get(
          `https://www.googleapis.com/books/v1/volumes/${bookId}/content?key=${this.apiKey}`
        );
        
        if (partnerResponse.data && typeof partnerResponse.data === 'string' && partnerResponse.data.length > 100) {
          console.log('Found preview content from Partner API');
          return partnerResponse.data;
        }
      } catch (error) {
        console.log('Error getting preview from Partner API:', error.message);
      }
      
      // Approach 3: Try to get text from the book's volume info
      try {
        console.log('Approach 3: Getting text from volume info');
        
        // Check if we can get a substantial text snippet from the description
        if (volumeInfo.volumeInfo && volumeInfo.volumeInfo.description) {
          const description = volumeInfo.volumeInfo.description
            .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
            .trim();
            
          if (description.length > 200) { // Only use if it's substantial
            console.log('Using book description as preview text');
            return description;
          }
        }
        
        // Check if there are text snippets in the volume info
        if (volumeInfo.searchInfo && volumeInfo.searchInfo.textSnippet) {
          const snippet = volumeInfo.searchInfo.textSnippet
            .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
            .trim();
            
          if (snippet.length > 100) {
            console.log('Using text snippet from volume info');
            return snippet;
          }
        }
      } catch (error) {
        console.log('Error getting text from volume info:', error.message);
      }
      
      // If we couldn't get any preview text, return null
      console.log('Could not get preview text from any API approach');
      return null;
    } catch (error) {
      console.error('Error getting preview text from API:', error);
      return null;
    }
  }

  /**
   * Extract preview text from Google Books Embedded Viewer
   * @param bookId Google Books volume ID
   * @param pageNumber Page number to extract (1-indexed)
   * @returns Preview text or null if not available
   */
  private async extractPreviewFromEmbeddedViewer(bookId: string, pageNumber: number): Promise<string | null> {
    let browser = null;
    
    try {
      console.log(`Attempting to extract preview text for book ID ${bookId}, page ${pageNumber}`);
      
      // Try a more direct approach - go directly to the Google Books preview URL
      const previewUrl = `https://books.google.com/books?id=${bookId}&pg=PA${pageNumber}`;
      console.log(`Accessing direct preview URL: ${previewUrl}`);
      
      // Launch browser with specific settings for Google Books viewer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--window-size=1280,1696'
        ],
        defaultViewport: {
          width: 1280,
          height: 1696
        }
      });
      
      const page = await browser.newPage();
      
      // Set a user agent to mimic a regular browser
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Capture console logs for debugging
      page.on('console', msg => console.log('Browser console:', msg.text()));
      
      // Navigate to the preview URL
      console.log('Navigating to preview URL...');
      await page.goto(previewUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      
      // Take a screenshot to see what's loaded
      const screenshotPath = path.join(this.tempDir, `${Date.now()}-preview-page.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Saved preview page screenshot to ${screenshotPath}`);
      
      // Check if we're on a page that says "No preview available"
      const noPreviewText = await page.evaluate(() => {
        const noPreviewElement = document.querySelector('.gb-readerpreview-text');
        return noPreviewElement ? noPreviewElement.textContent : null;
      });
      
      if (noPreviewText && noPreviewText.includes('No preview available')) {
        console.log('No preview available for this book');
        return null;
      }
      
      // Wait for the page content to load
      console.log('Waiting for page content to load...');
      await page.waitForSelector('.gb-volume-text', { timeout: 10000 }).catch(() => {
        console.log('Could not find .gb-volume-text selector');
      });
      
      // Try multiple selectors to find the text content
      const previewText = await page.evaluate(() => {
        // Try different selectors that might contain the preview text
        const selectors = [
          '.gb-volume-text',
          '#viewport-frame',
          '.textLayer',
          '.text-layer',
          '.page-inner-content',
          '.page-content',
          '#page-content'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent && element.textContent.trim().length > 50) {
            return element.textContent.trim();
          }
        }
        
        // If no selector works, try to get all text from the page
        return document.body.textContent.trim();
      });
      
      if (previewText && previewText.length > 100) {
        console.log(`Successfully extracted ${previewText.length} characters of preview text`);
        return previewText;
      }
      
      console.log('Could not extract meaningful preview text');
      return null;
    } catch (error) {
      console.error('Error extracting preview from embedded viewer:', error);
      
      // Take a screenshot if browser is available
      if (browser) {
        try {
          const pages = await browser.pages();
          if (pages.length > 0) {
            const screenshotPath = path.join(this.tempDir, `${Date.now()}-error.png`);
            await pages[0].screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Saved error screenshot to ${screenshotPath}`);
          }
        } catch (screenshotError) {
          console.error('Error taking screenshot:', screenshotError);
        }
      }
      
      return null;
    } finally {
      // Close the browser
      if (browser) {
        try {
          await browser.close();
        } catch (error) {
          console.error('Error closing browser:', error);
        }
      }
    }
  }

  /**
   * Download a PDF and extract its text content (for public domain books only)
   * @param url URL of the PDF
   * @param isFiction Whether the book is fiction or non-fiction
   * @returns Extracted text from the PDF
   */
  private async downloadAndExtractPdf(url: string, isFiction: boolean): Promise<string | null> {
    try {
      // Generate a unique filename
      const filename = path.join(this.tempDir, `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.pdf`);
      
      console.log(`Downloading public domain PDF from ${url} to ${filename}`);
      
      // Download the PDF
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        timeout: 30000 // 30 seconds timeout
      });
      
      // Save the PDF to disk
      fs.writeFileSync(filename, response.data);
      
      // Use dynamic import for pdf-parse to avoid requiring it when not needed
      const pdfParse = require('pdf-parse');
      
      // Extract text from the PDF (specific page based on fiction/non-fiction)
      const dataBuffer = fs.readFileSync(filename);
      
      // For fiction books, we want page 5; for non-fiction books, we want page 4
      // Page numbers in pdf-parse are 0-indexed, so we use 4 for page 5 and 3 for page 4
      const pageToExtract = isFiction ? 4 : 3;
      
      // First, get the total number of pages to make sure we don't exceed it
      const pdfData = await pdfParse(dataBuffer, { max: 1 });
      const totalPages = pdfData.numpages || 0;
      
      if (totalPages <= pageToExtract) {
        // If the book doesn't have enough pages, just get what we can
        const data = await pdfParse(dataBuffer, { max: totalPages });
        
        // Clean up the temporary file
        fs.unlinkSync(filename);
        
        return data.text;
      }
      
      // Extract the specific page
      // Note: pdf-parse doesn't have a direct way to extract a specific page
      // We'll use a workaround by setting the max pages and then parsing the text
      const options = { 
        max: pageToExtract + 1, // Extract up to and including our target page
        pagerender: (pageData: any) => {
          // This function is called for each page
          // We only want to extract the text from our target page
          if (pageData.pageNumber === pageToExtract + 1) { // pageNumber is 1-indexed
            return pageData.getTextContent()
              .then((textContent: any) => {
                let lastY, text = '';
                for (const item of textContent.items) {
                  if (lastY !== item.transform[5]) {
                    text += '\n';
                  }
                  text += item.str;
                  lastY = item.transform[5];
                }
                return text;
              });
          }
          return null;
        }
      };
      
      const data = await pdfParse(dataBuffer, options);
      
      // Clean up the temporary file
      fs.unlinkSync(filename);
      
      // If we couldn't extract the specific page, return all text we got
      return data.text;
    } catch (error) {
      console.error('Error downloading or extracting PDF:', error);
      return null;
    }
  }
} 