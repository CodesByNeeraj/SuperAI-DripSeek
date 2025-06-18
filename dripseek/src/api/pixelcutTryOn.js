// src/api/pixelcutTryOn.js
export const tryOn = async (personImageData, garmentUrl, options = {}) => {
  console.log('Try-on request with:', { garmentUrl });
  
  // For demo purposes, create a mock implementation
  // This simulates what the API would do without actually calling it
  return createMockTryOnResult(personImageData, garmentUrl);
  
  /* 
  // Real implementation - uncomment when you have a working API key and setup
  // Check if personImageData is a data URL (base64)
  if (personImageData.startsWith('data:')) {
    console.log('Using file upload method');
    
    // Create a FormData object to send the images
    const formData = new FormData();
    
    // Convert data URL to Blob
    const personBlob = dataURLtoBlob(personImageData);
    
    // Add the person image as a file
    formData.append('person_image', personBlob, 'person.jpg');
    
    // Add the garment URL
    formData.append('garment_image_url', garmentUrl);
    
    // Add other options
    formData.append('garment_mode', options.mode || 'auto');
    formData.append('preprocess_garment', options.preprocess !== undefined ? options.preprocess : true);
    formData.append('remove_background', options.removeBg || false);
    formData.append('wait_for_result', true);
    
    const API_KEY = "YOUR_ACTUAL_API_KEY"; // Replace with your key
    
    const resp = await fetch('https://api.pixelcut.ai/v1/try-on', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: formData,
    });
    
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.message || 'Try-On API error');
    }
    
    return resp.blob();
  } else {
    console.log('Using URL method');
    
    const body = {
      person_image_url: personImageData,
      garment_image_url: garmentUrl,
      garment_mode: options.mode || 'auto',
      preprocess_garment: options.preprocess !== undefined ? `${options.preprocess}` : 'true',
      remove_background: options.removeBg ? `${options.removeBg}` : 'false',
      wait_for_result: 'true',
    };
    
    const API_KEY = "YOUR_ACTUAL_API_KEY"; // Replace with your key
    
    const resp = await fetch('https://api.pixelcut.ai/v1/try-on', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.message || 'Try-On API error');
    }

    return resp.blob();
  }
  */
};

// Helper function to convert data URL to Blob
const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Create a mock try-on result for demo purposes
const createMockTryOnResult = async (personImageData, garmentUrl) => {
  // Create a canvas to combine the images
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Load the person image
  const personImg = new Image();
  personImg.crossOrigin = 'Anonymous'; // Try to avoid CORS issues
  
  await new Promise((resolve, reject) => {
    personImg.onload = resolve;
    personImg.onerror = reject;
    personImg.src = personImageData;
  }).catch(() => {
    console.warn('Could not load person image, using placeholder');
    // If loading fails, create a placeholder
    canvas.width = 400;
    canvas.height = 600;
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ccc';
    ctx.font = '20px Arial';
    ctx.fillText('Person image placeholder', 100, 300);
  });
  
  // Load the garment image
  const garmentImg = new Image();
  garmentImg.crossOrigin = 'Anonymous'; // Try to avoid CORS issues
  
  await new Promise((resolve, reject) => {
    garmentImg.onload = resolve;
    garmentImg.onerror = reject;
    garmentImg.src = garmentUrl;
  }).catch(() => {
    console.warn('Could not load garment image, using placeholder');
  });
  
  // Set canvas size
  if (!canvas.width) {
    canvas.width = personImg.width || 400;
    canvas.height = personImg.height || 600;
    
    // Draw the person image if it loaded
    if (personImg.width) {
      ctx.drawImage(personImg, 0, 0);
    }
  }
  
  // Create a simple overlay effect
  if (garmentImg.width) {
    // Draw the garment with some transparency
    ctx.globalAlpha = 0.85;
    
    // Calculate position to center the garment
    const scale = Math.min(canvas.width / garmentImg.width * 0.8, canvas.height / garmentImg.height * 0.5);
    const width = garmentImg.width * scale;
    const height = garmentImg.height * scale;
    const x = (canvas.width - width) / 2;
    const y = canvas.height * 0.2; // Position at about 20% from the top
    
    ctx.drawImage(garmentImg, x, y, width, height);
    ctx.globalAlpha = 1.0;
  }
  
  // Add a watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '16px Arial';
  ctx.fillText('DripSeek Demo', 10, canvas.height - 20);
  
  try {
    // Try to get the data URL
    const dataURL = canvas.toDataURL('image/jpeg');
    const blob = dataURLtoBlob(dataURL);
    return blob;
  } catch (e) {
    console.error('Canvas export error:', e);
    
    // If canvas export fails due to CORS, return a simple blob
    return new Blob(['Mock try-on result'], { type: 'text/plain' });
  }
};
