// utils/uploadToCloudinary.js
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', "mehmeh");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dojig5luk/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await res.json();
  if (!data.secure_url) {
    throw new Error('Cloudinary upload failed');
  }

  return data.secure_url;
};
