// Test script for Book Information Service
require('dotenv').config();
const { BookInformationService } = require('./dist/services/bookInformationService');

async function testBookInformation() {
  console.log('Testing Book Information Service...');
  
  const bookInfoService = new BookInformationService();
  
  // Test with multiple books
  const books = [
    { title: 'Pride and Prejudice', author: 'Jane Austen' },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee' },
    { title: '1984', author: 'George Orwell' }
  ];
  
  for (const book of books) {
    console.log(`\n------------------------------`);
    console.log(`Searching for information on "${book.title}" by ${book.author}...`);
    
    try {
      const startTime = Date.now();
      const bookText = await bookInfoService.findBookInformation(book.title, book.author);
      const endTime = Date.now();
      const timeElapsed = (endTime - startTime) / 1000;
      
      if (bookText) {
        console.log(`Success! Found text in ${timeElapsed.toFixed(2)} seconds:`);
        console.log('-------------------');
        console.log(bookText.substring(0, 500) + '...');
        console.log('-------------------');
        console.log(`Total text length: ${bookText.length} characters`);
      } else {
        console.log(`No book information found after ${timeElapsed.toFixed(2)} seconds.`);
      }
    } catch (error) {
      console.error('Error testing Book Information Service:', error);
    }
  }
}

// Run the test
testBookInformation().catch(console.error); 