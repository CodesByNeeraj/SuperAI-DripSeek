// src/api/rekogCrop.js

export const sendToRekogCropPerson = async (base64Image) => {
  // Make sure we're sending just the base64 data without the prefix
  const imageData = base64Image.startsWith('data:') 
    ? base64Image.split(',')[1] 
    : base64Image;
  
  console.log('Sending image data to API, length:', imageData.length);
  
  try {
    const response = await fetch('https://jr5rgckv4b.execute-api.us-west-2.amazonaws.com/test_drip_seek/image_to_keyword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        base64image: imageData
      })
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(errorText || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    console.log('API response parsed successfully');
    
    // Return the entire data object so we can access result array in the UI
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};