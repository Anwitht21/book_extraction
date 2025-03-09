import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Book Extraction App',
  description: 'Upload book covers to extract book information',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background`}>
        <header className="bg-surface border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-8 h-8 text-primary"
              >
                <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
              </svg>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Book Extraction
              </h1>
            </div>
            <nav>
              <ul className="flex gap-4">
                <li>
                  <a 
                    href="/" 
                    className="text-gray-600 hover:text-primary transition-colors font-medium"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="text-gray-600 hover:text-primary transition-colors font-medium"
                  >
                    About
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container mx-auto py-8 px-4 min-h-[calc(100vh-160px)]">{children}</main>
        <footer className="bg-gray-50 border-t border-gray-200 py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-6 h-6 text-primary"
                >
                  <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                </svg>
                <span className="font-medium text-gray-700">Book Extraction</span>
              </div>
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Book Extraction App. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
} 