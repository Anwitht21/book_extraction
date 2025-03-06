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
      <body className={inter.className}>
        <header className="bg-primary text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">Book Extraction</h1>
          </div>
        </header>
        <main className="container mx-auto py-8 px-4">{children}</main>
        <footer className="bg-gray-100 p-4 mt-8">
          <div className="container mx-auto text-center text-gray-600">
            <p>© {new Date().getFullYear()} Book Extraction App</p>
          </div>
        </footer>
      </body>
    </html>
  );
} 