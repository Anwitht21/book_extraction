# Book Extraction Monorepo

This is a Turborepo-based monorepo for a book extraction project. The project consists of a frontend application for uploading book cover images and a backend service for image validation and book data retrieval.

## What's inside?

This monorepo includes the following packages/apps:

### Apps and Packages

- `frontend`: a web application for uploading and viewing book covers
- `backend`: an API server for processing book cover images and retrieving book data
- `shared`: shared TypeScript types and utilities used by both frontend and backend

### Book Preview Text Extraction

The backend service uses the Google Books API and Embedded Viewer API to retrieve preview text from books. This approach:

1. Searches for books by title and author
2. Determines if the book is fiction or non-fiction based on categories, description, and title
3. Retrieves book information including description, text snippets, and preview links
4. For non-fiction books, extracts the first page of preview text
5. For fiction books, extracts the second page of preview text
6. For public domain books, downloads and extracts text from the specific page of the PDF if available

#### Enhanced Preview Extraction

The service uses multiple methods to extract preview text:

1. **Google Books Embedded Viewer API**: Creates a headless browser instance to load the book preview and extract text from the specific page (page 1 for non-fiction, page 2 for fiction)
2. **PDF Download for Public Domain Books**: For public domain books, downloads and extracts text from the PDF
3. **Screenshot and OCR Fallback**: If direct text extraction fails, takes a screenshot of the preview page
4. **Description Fallback**: If all other methods fail, uses the book description as a fallback

This implementation is legally compliant as it uses the official Google Books API, which provides content with publisher permission.

#### Fiction/Non-Fiction Detection

The service uses a combination of methods to determine if a book is fiction or non-fiction:

1. Checks book categories against a list of fiction-related categories
2. Looks for explicit "non-fiction" or "fiction" mentions in categories
3. Examines the book description for fiction-related keywords
4. Analyzes the book title for fiction-related terms
5. Defaults to non-fiction if the book type cannot be determined

### Environment Variables

The following environment variables need to be set:

- `GOOGLE_BOOKS_API_KEY`: Your Google Books API key (required for book preview text extraction)
- `SERPAPI_KEY`: Your SerpAPI key (if using SerpAPI)
- `USE_SELENIUM`: Whether to use Selenium for web scraping (true/false)

You can copy `.env.example` to `.env` and fill in your API keys.

### Getting a Google Books API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Books API for your project
4. Create an API key from the Credentials page
5. Add the API key to your `.env` file

### Dependencies

The backend service requires the following dependencies:

- **puppeteer**: For headless browser automation to extract preview text
- **pdf-parse**: For extracting text from PDF files
- **axios**: For making HTTP requests

Install these dependencies with:

```bash
cd apps/backend
npm install puppeteer pdf-parse axios --save
```

### Utilities

This Turborepo has some additional tools already set up for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## Setup

### Build

To build all apps and packages, run the following command:

```
npm run build
```

### Develop

To develop all apps and packages, run the following command:

```
npm run dev
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)

### Google Books API Documentation

- [Google Books API Overview](https://developers.google.com/books/docs/v1/using)
- [Google Books API Reference](https://developers.google.com/books/docs/v1/reference/)
- [Google Books Embedded Viewer API](https://developers.google.com/books/docs/viewer/developers_guide) 