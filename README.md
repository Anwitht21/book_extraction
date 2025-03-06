# Book Extraction Monorepo

This is a Turborepo-based monorepo for a book extraction project. The project consists of a frontend application for uploading book cover images and a backend service for image validation and book data retrieval.

## What's inside?

This monorepo includes the following packages/apps:

### Apps and Packages

- `frontend`: a web application for uploading and viewing book covers
- `backend`: an API server for processing book cover images and retrieving book data
- `shared`: shared TypeScript types and utilities used by both frontend and backend

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