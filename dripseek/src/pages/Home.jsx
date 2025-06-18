import React, { useRef, useState } from 'react';
import '../css/Home.css';
import { tryOn } from '../api/pixelcutTryOn';
import { sendToRekogCropPerson } from '../api/rekogCrop';
import { uploadToCloudinary } from'../api/uploadToCloudinary';
import { tryOnStudio } from "../api/pixel"
const DEFAULT_USER_IMAGE = 'https://res.cloudinary.com/dojig5luk/image/upload/v1750275979/h9lchhtlninxshu0sboa.jpg';
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const Home = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [itemSizes, setItemSizes] = useState({});
  const [itemQuantities, setItemQuantities] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [tryOnResultUrl, setTryOnResultUrl] = useState('');
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [userImage, setUserImage] = useState(DEFAULT_USER_IMAGE);
  const [isClothesLoading, setIsClothesLoading] = useState(false); 
  const [clothes, setClothes] = useState([]);
  const [cartNotification, setCartNotification] = useState('');
  const fileInputRef = useRef(null);

  const wrapperRef = useRef(null);

  const captureScreenshot = () => {
    const video = document.querySelector('video');
    if (!video) {
      console.error('No video element found');
      return null;
    }

    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    // Create canvas with video dimensions
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;  // Fallback width if videoWidth is 0
    canvas.height = video.videoHeight || 480; // Fallback height if videoHeight is 0
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log('Successfully captured frame to canvas');
    } catch (e) {
      console.error('Error capturing video frame:', e);
      return null;
    }
    
    // Convert to base64 string (JPEG format, quality 0.9)
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      // Debug: Show image size and preview
      console.log('Base64 image size:', Math.round(imageData.length / 1024), 'KB');
      console.log('Base64 prefix:', imageData.substring(0, 50) + '...');
      
      // Debug: Create a preview element (will be removed after 5 seconds)
      const debugPreview = document.createElement('div');
      debugPreview.style.position = 'fixed';
      debugPreview.style.bottom = '10px';
      debugPreview.style.right = '10px';
      debugPreview.style.zIndex = '9999';
      debugPreview.style.border = '2px solid red';
      debugPreview.style.background = 'white';
      debugPreview.style.padding = '5px';
      debugPreview.innerHTML = `
        <p>Screenshot Preview (removed in 5s)</p>
        <img src="${imageData}" style="max-width: 200px; max-height: 200px;" />
      `;
      document.body.appendChild(debugPreview);
      setTimeout(() => document.body.removeChild(debugPreview), 5000);
      
      // Make sure the base64 string is properly formatted
      if (!imageData.startsWith('data:image/jpeg;base64,')) {
        console.error('Invalid base64 image format');
        return null;
      }
      
      return imageData;
    } catch (e) {
      console.error('Error converting canvas to base64:', e);
      return null;
    }
  };
  // Clothes are now managed in state

  const handleAddToCart = (item) => {
    if (!cartItems.find((i) => i.id === item.id)) {
      setCartItems([...cartItems, item]);
      // Set default size to 'M' when adding to cart
      setItemSizes(prev => ({
        ...prev,
        [item.id]: 'M'
      }));
      
      // Set default quantity to 1
      setItemQuantities(prev => ({
        ...prev,
        [item.id]: 1
      }));
      
      // Show notification
      setCartNotification(`${item.desc} added to cart!`);
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setCartNotification('');
      }, 3000);
    }
  };
  
  const handleSizeChange = (itemId, newSize) => {
    setItemSizes(prev => ({
      ...prev,
      [itemId]: newSize
    }));
  };
  
  const handleQuantityChange = (itemId, newQuantity) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, parseInt(newQuantity) || 1)
    }));
  };
  
  const handleSizeGuideClick = () => {
    setCartNotification('Size guide will be available soon!');
    setTimeout(() => setCartNotification(''), 3000);
  };
  
  const handleRemoveFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
    setCartNotification('Item removed from cart');
    setTimeout(() => setCartNotification(''), 3000);
  };
  
  const handleBuyNow = (item) => {
    setCartNotification(`Processing purchase for ${item.desc}...`);
    // In a real app, this would redirect to checkout with just this item
    setTimeout(() => {
      setCartNotification('Purchase completed!');
      setTimeout(() => setCartNotification(''), 2000);
    }, 1500);
  };
  
  const handleCheckout = () => {
    setCartNotification('Processing your order...');
    // In a real app, this would redirect to checkout with all items
    setTimeout(() => {
      setCartNotification('Order completed!');
      setTimeout(() => setCartNotification(''), 2000);
    }, 1500);
  };
  
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      // Extract numeric value from price string (e.g., "$29.99" -> 29.99)
      const price = parseFloat(item.price?.replace(/[^0-9.]/g, '')) || 0;
      const quantity = itemQuantities[item.id] || 1;
      return total + (price * quantity);
    }, 0).toFixed(2);
  };

  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const imageUrl = await uploadToCloudinary(file);
    setUserImage(imageUrl); // set direct URL now
  } catch (err) {
    console.error('Image upload failed:', err);
    alert('Failed to upload image.');
  }
};

  // This helper function is now in pixelcutTryOn.js

  const handleDripTry = async (garmentUrl) => {
    setTryOnLoading(true);
    setTryOnResultUrl('');

    try {
      // Get the person image (always use userImage since we have a default)
      const personImage = userImage;
      
      console.log('Starting try-on with Pixelcut API...');
      // console.log('Using person image:', personImage === DEFAULT_USER_IMAGE ? 'Default S3 image' : 'User uploaded image');
      
      // Call the actual API
      const imageUrl = await tryOnStudio(personImage, garmentUrl);

      setTryOnResultUrl(imageUrl);
      
      console.log('Try-on completed successfully');
    } catch (e) {
      console.error('Try-on error:', e);
      alert('Failed to generate try-on: ' + e.message);
      
      // Fallback to showing the garment image if API fails
      // setTryOnResultUrl(garmentUrl);
    } finally {
      setTryOnLoading(false);
      
    }
  };


  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() !== '') {
      console.log("User Query:", chatInput);
      setChatInput('');
    }
  };



  const handleDripSeekClick = async () => {
    setShowPanel(true);
    setActiveTab('items');
    setTryOnLoading(true);
    setIsClothesLoading(true); 

    try {
      // Capture screenshot with enhanced debugging
      const screenshot = captureScreenshot();
      if (!screenshot) throw new Error('Screenshot failed');
      
      // Extract the base64 data (remove the prefix)
      const base64Data = screenshot.replace('data:image/jpeg;base64,', '');
      console.log('Base64 data length:', base64Data.length);
      
      // Check if the base64 string contains valid characters
      const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Data);
      console.log('Is valid base64 format:', isValidBase64);
      
      console.log("Screenshot captured, sending to API...");
      const response = await sendToRekogCropPerson(screenshot);
      console.log('API response:', response);
      
      // Check if response has the expected format
      //if (response && response.result && Array.isArray(response.result)) {
        // Format the clothes data from the API response
        const newClothes = response.result.map((item, index) => {
          const crawlData = item.crawling_result || {};
          return {
            id: index + 1,
            img: crawlData.image_link || '',  // Use the image_link from crawling_result
            desc: crawlData.title || '',      // Use the title from crawling_result
            price: crawlData.price || '',     // Use the price from crawling_result
            oldPrice: crawlData.old_price || '',
            link: crawlData.link || ''        // Store the link for potential use
          };
        }).filter(item => item.img); // Only keep items with images
        
        // Update clothes array with the API results
        if (newClothes.length > 0) {
        setClothes(newClothes);
      }
      //}
    } catch (e) {
      console.error('API request failed:', e);
    } finally {
      setTryOnLoading(false);
      setIsClothesLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="video-wrapper" ref={wrapperRef}>
        <video className="video" autoPlay muted loop controls>
          <source src="/mehmeh.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* DripSeek Button */}
        <button 
            className='dripseek-button'
            onClick  = {handleDripSeekClick}
        >
          <span className="eye-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7.58 4.5 3.67 7.26 2 12c1.67 4.74 5.58 7.5 10 7.5s8.33-2.76 10-7.5c-1.67-4.74-5.58-7.5-10-7.5zm0 13c-3.04 0-5.5-2.46-5.5-5.5S8.96 6.5 12 6.5s5.5 2.46 5.5 5.5S15.04 17.5 12 17.5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3s3-1.34 3-3s-1.34-3-3-3z"/>
            </svg>
          </span>
          <span className="dripseek-text">DripSeek</span>
        </button>

        {/* Arrow Toggle */}
        <button
          className="toggle-arrow-button"
          onClick={() => setShowPanel((prev) => !prev)}
          title="Toggle Panel"
        >
          {showPanel ? '<' : '>'}
        </button>

        {/* Overlay Panel */}
        <div className={`drip-panel ${showPanel ? 'open' : ''}`}>
          <div className="panel-header">
            <span className="powered-label">Powered by <strong>DripSeek AI</strong></span>
            <button
              className="cart-button"
              onClick={() => {
                setActiveTab('cart');
                setShowPanel(true);
              }}
            >
              🛒 DripCart
            </button>
          </div>
          
          {/* Cart Notification */}
          {cartNotification && (
            <div className="cart-notification">
              {cartNotification}
            </div>
          )}

          {/* Cart or Items */}
          {activeTab === 'items' ? (
            <div className="drip-panel-content">
              {/* Search Results Section */}
              <div className="search-results-section">
                <h4 style={{ color: '#00c2ff', marginBottom: '10px' }}>Search Results</h4>
                <div className="clothes-grid">
                  {isClothesLoading ? (
                    // Loading screen while clothes are loading
                    <div className="loading-screen">
                      <div className="loading-spinner">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                      <p className="loading-text">Finding your perfect style...</p>
                    </div>
                  ) : clothes.length > 0 ? (
                    // Display clothes when loaded
                    clothes.map((item) => (
                      <div key={item.id} className="clothing-card">
                        <img src={item.img} alt={item.desc} />
                        <div>
                          <p>{item.desc}</p>
                          {item.price && <p style={{ color: '#00c2ff', fontSize: '0.9rem' }}>{item.price}</p>}
                          {item.oldPrice && <p style={{ color: '#ff0000', fontSize: '0.8rem', textDecoration: 'line-through' }}>{item.oldPrice}</p>}
                          <div className="button-row">
                            <button className="chat-button" onClick={() => handleAddToCart(item)}>
                              Add to Cart
                            </button>
                            <button className="chat-button" onClick={() => handleDripTry(item.img)}>
                              DripTry
                            </button>
                          </div>
                          <p className="size-guide" onClick={handleSizeGuideClick}>
                            <i>Click here for size guide</i>
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Show empty state when no clothes
                    <div className="no-results">
                      <p>No styles found. Try capturing again.</p>
                      <button 
                        className="retry-button"
                        onClick={handleDripSeekClick}
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Try-On Section */}
              <div className="try-on-section">
                {/* Image Upload Section */}
                <div className="photo-upload-section">
                  <h4 style={{ color: '#00c2ff', marginBottom: '10px' }}>Your Photo</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      className="chat-button" 
                      onClick={() => fileInputRef.current.click()}
                      style={{ flex: 1 }}
                    >
                      Upload New Photo
                    </button>
                    <button 
                      className="chat-button" 
                      onClick={() => setUserImage(DEFAULT_USER_IMAGE)}
                      style={{ flex: 1 }}
                    >
                      Use Default
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img 
                      src={userImage} 
                      alt="Your photo" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '120px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }} 
                    />
                    {userImage === DEFAULT_USER_IMAGE && (
                      <p style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '5px' }}>
                        Using default model image
                      </p>
                    )}
                  </div>
                </div>

                {tryOnLoading && (
                  <div style={{ color: '#00c2ff', marginTop: '20px', textAlign: 'center' }}>
                    <p>Generating Try-On...</p>
                  </div>
                )}

                {tryOnResultUrl && (
                  <div className="try-on-preview">
                    <h4 style={{ color: '#00c2ff' }}>Try-On Preview:</h4>
                    
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <img
                        src={tryOnResultUrl}
                        alt="Try-on result"
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          borderRadius: '10px',
                          border: '1px solid #00c2ff',
                          boxShadow: '0 0 15px rgba(0, 194, 255, 0.3)',
                        }}
                      />
                    </div>
                    
                    <p style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '5px', textAlign: 'center' }}>
                      DripSeek Demo Mode
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="cart-view">
              <button className="back-to-items-button" onClick={() => setActiveTab('items')}>
                ← Back to Items
              </button>
              <h4 style={{ color: '#fff', marginBottom: '10px' }}>Your DripCart</h4>
              {cartItems.length === 0 ? (
                <p style={{ color: '#ccc' }}>Your cart is empty.</p>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <div key={item.id} className="clothing-card">
                      <img src={item.img} alt={item.desc} />
                      <div style={{ width: '100%' }}>
                        <div className="item-header">
                          <p>{item.desc}</p>
                          <button 
                            className="remove-item-btn" 
                            onClick={() => handleRemoveFromCart(item.id)}
                            title="Remove from cart"
                          >
                            🗑️
                          </button>
                        </div>
                        {item.price && <p style={{ color: '#00c2ff', fontSize: '0.9rem' }}>{item.price}</p>}
                        <div className="cart-item-controls">
                          <div className="size-selector">
                            <label htmlFor={`size-${item.id}`} style={{ color: '#ccc', fontSize: '0.85rem', marginRight: '8px' }}>
                              Size:
                            </label>
                            <select 
                              id={`size-${item.id}`}
                              value={itemSizes[item.id] || 'M'} 
                              onChange={(e) => handleSizeChange(item.id, e.target.value)}
                              className="size-dropdown"
                            >
                              {SIZES.map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </div>
                          <div className="quantity-selector">
                            <label htmlFor={`qty-${item.id}`} style={{ color: '#ccc', fontSize: '0.85rem', marginRight: '8px' }}>
                              Qty:
                            </label>
                            <input
                              id={`qty-${item.id}`}
                              type="number"
                              min="1"
                              value={itemQuantities[item.id] || 1}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className="quantity-input"
                            />
                          </div>
                          <p className="size-guide" onClick={handleSizeGuideClick}>
                            <i>Click here for size guide</i>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="checkout-section">
                    <div className="total-price">
                      <span>Total:</span>
                      <span>${calculateTotal()}</span>
                    </div>
                    <button 
                      className="checkout-button"
                      onClick={handleCheckout}
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}


          {/* Chat Box
          {activeTab === 'items' && (
            <form className="dripchat-input-box" onSubmit={handleChatSubmit}>
              <input
                type="text"
                placeholder="Ask about a style..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
        //   )} */}
        </div>
      </div>
    </div>
  );
};

export default Home;
