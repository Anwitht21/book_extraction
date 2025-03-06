const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
  try {
    // Create a test image if it doesn't exist
    const testDir = path.join(__dirname, 'test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Path to a test image (you'll need to provide a real image)
    const imagePath = path.join(testDir, 'test-image.jpg');
    
    // Check if the test image exists
    if (!fs.existsSync(imagePath)) {
      console.log('Test image does not exist. Please place a book cover image at:', imagePath);
      return;
    }
    
    console.log('Reading test image from:', imagePath);
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Create form data
    const formData = new FormData();
    formData.append('coverImage', imageBuffer, {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });
    
    console.log('Sending request to API...');
    const response = await axios.post('http://localhost:3005/api/upload', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testUpload(); 