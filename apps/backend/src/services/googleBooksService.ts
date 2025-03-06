import axios from 'axios';
import { BookData } from 'shared';

/**
 * Service for interacting with the Google Books API
 */
export class GoogleBooksService {
  private readonly baseUrl = 'https://www.googleapis.com/books/v1/volumes';
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (!this.apiKey) {
      console.warn('Google Books API key not set. Some functionality may be limited.');
    }
  }

  /**
   * Search for books by title and author
   * @param title Book title
   * @param author Book author (optional)
   * @returns Promise with search results
   */
  async searchBooks(title: string, author?: string): Promise<any> {
    try {
      let query = `intitle:${encodeURIComponent(title)}`;
      
      if (author) {
        query += `+inauthor:${encodeURIComponent(author)}`;
      }

      const url = `${this.baseUrl}?q=${query}&maxResults=5`;
      const response = await axios.get(url, {
        params: {
          key: this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error searching Google Books:', error);
      throw new Error('Failed to search Google Books');
    }
  }

  /**
   * Get book content or description from Google Books
   * @param title Book title
   * @param author Book author (optional)
   * @returns Promise with book content or description
   */
  async getBookContent(title: string, author?: string): Promise<string> {
    try {
      const searchResults = await this.searchBooks(title, author);
      
      if (!searchResults.items || searchResults.items.length === 0) {
        return 'No book content available.';
      }

      // Get the first result
      const book = searchResults.items[0];
      
      // Check if there's a description
      if (book.volumeInfo && book.volumeInfo.description) {
        return book.volumeInfo.description;
      }

      // Check if there's a text snippet
      if (book.searchInfo && book.searchInfo.textSnippet) {
        return book.searchInfo.textSnippet;
      }

      // If no content is available
      return 'No book content available.';
    } catch (error) {
      console.error('Error getting book content from Google Books:', error);
      return 'Failed to retrieve book content.';
    }
  }

  /**
   * Get book details from Google Books
   * @param title Book title
   * @param author Book author (optional)
   * @returns Promise with book details
   */
  async getBookDetails(title: string, author?: string): Promise<Partial<BookData>> {
    try {
      const searchResults = await this.searchBooks(title, author);
      
      if (!searchResults.items || searchResults.items.length === 0) {
        return {};
      }

      // Get the first result
      const book = searchResults.items[0];
      const volumeInfo = book.volumeInfo || {};
      
      return {
        title: volumeInfo.title,
        author: volumeInfo.authors ? volumeInfo.authors.join(', ') : undefined,
        isbn: volumeInfo.industryIdentifiers ? 
          volumeInfo.industryIdentifiers.find((id: any) => id.type === 'ISBN_13')?.identifier : undefined,
        publisher: volumeInfo.publisher,
        publicationYear: volumeInfo.publishedDate ? 
          parseInt(volumeInfo.publishedDate.substring(0, 4)) : undefined,
        description: volumeInfo.description,
        coverImageUrl: volumeInfo.imageLinks?.thumbnail
      };
    } catch (error) {
      console.error('Error getting book details from Google Books:', error);
      return {};
    }
  }
} 