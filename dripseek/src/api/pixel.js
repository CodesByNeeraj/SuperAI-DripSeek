export const tryOnStudio = async (personImageUrl, garmentImageUrl) => {
  try {
    const response = await fetch(
      "https://jr5rgckv4b.execute-api.us-west-2.amazonaws.com/test_drip_seek/tryonstudio",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person_image_url: personImageUrl,
          garment_image_url: garmentImageUrl,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();
    
    // Extract the image URL from the nested structure
    const resultUrl = data?.final_image_url?.result_url;
    
    if (!resultUrl) {
      throw new Error('Result image URL not found in response');
    }
    
    return resultUrl;
  } catch (error) {
    console.error("TryOn failed:", error);
    throw error;
  }
};