import axios from 'axios';

export const tryOn = async (personUrl, garmentUrl) => {
  try {
    const response = await axios.post(
      'https://api.developer.pixelcut.ai/v1/try-on',
      {
        person_image_url: personUrl,
        garment_image_url: garmentUrl,
        garment_mode: 'auto',
        preprocess_garment: true,
        remove_background: false,
        wait_for_result: true,
      },
      {
        headers: {
          Authorization: `Bearer sk_5a4354a04e56419fa3e9a8dabe9dc41d`,
          'Content-Type': 'application/json',
        },
        responseType: 'blob', // important for getting back image data
      }
    );
    return response.data; // Blob (image)
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Try-On failed');
  }
};
