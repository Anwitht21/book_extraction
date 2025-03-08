// Test script for PDF scraper
require('dotenv').config();
const { PdfScraperService } = require('./dist/services/pdfScraperService');

async function testPdfScraper() {
  console.log('Testing PDF scraper...');
  
  const pdfScraperService = new PdfScraperService();
  
  // Test with multiple books
  const books = [
    { title: 'Pride and Prejudice', author: 'Jane Austen' },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee' },
    { title: '1984', author: 'George Orwell' }
  ];
  
  for (const book of books) {
    console.log(`\n------------------------------`);
    console.log(`Searching for PDF of "${book.title}" by ${book.author}...`);
    
    try {
      const startTime = Date.now();
      const pdfText = await pdfScraperService.findBookPdf(book.title, book.author);
      const endTime = Date.now();
      const timeElapsed = (endTime - startTime) / 1000;
      
      if (pdfText) {
        console.log(`Success! Found text in ${timeElapsed.toFixed(2)} seconds:`);
        console.log('-------------------');
        console.log(pdfText.substring(0, 500) + '...');
        console.log('-------------------');
        console.log(`Total text length: ${pdfText.length} characters`);
      } else {
        console.log(`No PDF found for this book after ${timeElapsed.toFixed(2)} seconds.`);
      }
    } catch (error) {
      console.error('Error testing PDF scraper:', error);
    }
  }
}

// Run the test
testPdfScraper().catch(console.error); 