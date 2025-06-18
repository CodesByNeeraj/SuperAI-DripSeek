// src/api/rekogCrop.js

export const sendToRekogCropPerson = async (base64Image) => {
  const response = await fetch('https://soacrbo6g4g4.execute-api.us-west-2.amazonaws.com/default/RekogCropPerson', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Image,
      frame_id: 'frame_' + Date.now()
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to crop person');
  }

  return data.cropped_url || data.image_url || ''; // Adjust based on your API response
};
