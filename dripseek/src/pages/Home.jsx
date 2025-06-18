import React, { useRef, useState } from 'react';
import '../css/Home.css';
import { tryOn } from '../api/pixelcutTryOn';
import { sendToRekogCropPerson } from '../api/rekogCrop';

const DEFAULT_USER_IMAGE = 'https://amithbuckettest.s3.us-west-2.amazonaws.com/customer_picture/customer_picture.jpg';

const Home = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [tryOnResultUrl, setTryOnResultUrl] = useState('');
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [userImage, setUserImage] = useState(DEFAULT_USER_IMAGE);
  const fileInputRef = useRef(null);

  const wrapperRef = useRef(null);

  const captureScreenshot = () => {
  const video = document.querySelector('video');
  if (!video) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert to base64 string
  const imageData = canvas.toDataURL('image/jpeg');
  return imageData;
};
  const clothes = [
    { 
      id: 1, 
      img: 'https://m.media-amazon.com/images/I/61-jBuhtgZL._AC_UX569_.jpg', 
      desc: 'Black T-Shirt' 
    },
    { 
      id: 2, 
      img: 'https://m.media-amazon.com/images/I/71RNJ5FUwbL._AC_UY550_.jpg', 
      desc: 'Red Hoodie' 
    },
    { 
      id: 3, 
      img: 'https://m.media-amazon.com/images/I/71Wj-jQjBBL._AC_UY550_.jpg', 
      desc: 'Denim Jacket' 
    },
  ];

  const handleAddToCart = (item) => {
    if (!cartItems.find((i) => i.id === item.id)) {
      setCartItems([...cartItems, item]);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserImage(e.target.result);
      };
      reader.readAsDataURL(file);
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
      console.log('Using person image:', personImage === DEFAULT_USER_IMAGE ? 'Default S3 image' : 'User uploaded image');
      
      // Call the actual API
      const blob = await tryOn(personImage, garmentUrl);
      const resultUrl = URL.createObjectURL(blob);
      setTryOnResultUrl(resultUrl);
      
      console.log('Try-on completed successfully');
    } catch (e) {
      console.error('Try-on error:', e);
      alert('Failed to generate try-on: ' + e.message);
      
      // Fallback to showing the garment image if API fails
      setTryOnResultUrl(garmentUrl);
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

  const captureAndCropPerson = async () => {
    const screenshot = captureScreenshot();
    if (!screenshot) {
      throw new Error('Failed to capture screenshot');
    }
    
    try {
      // If you have the sendToRekogCropPerson function implemented
      return await sendToRekogCropPerson(screenshot);
    } catch (e) {
      console.error('Error cropping person:', e);
      // Fall back to using the full screenshot
      return screenshot;
    }
  };

  const handleDripSeekClick = async () => {
    setShowPanel(true);
    setActiveTab('items');
    setTryOnLoading(true);

    try {
      const screenshot = captureScreenshot();
      if (!screenshot) throw new Error('Screenshot failed');
      
      console.log("Screenshot captured, sending to API...");
      const response = await sendToRekogCropPerson(screenshot);
      
      // Check if response has the expected format
      if (response && response.result && Array.isArray(response.result)) {
        // Format the clothes data from the API response
        const newClothes = response.result.map((item, index) => {
          const crawlData = item.crawling_result || {};
          return {
            id: index + 1,
            img: item.imageUrl || crawlData.image_link || '',
            desc: crawlData.title || `Item ${index + 1}`,
            price: crawlData.price || '',
            oldPrice: crawlData.old_price || ''
          };
        }).filter(item => item.img); // Only keep items with images
        
        // Update clothes array with the API results
        if (newClothes.length > 0) {
          setClothes(newClothes);
          console.log('Found similar clothes:', newClothes.length);
        }
      }
    } catch (e) {
      console.error('API request failed:', e);
    } finally {
      setTryOnLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="video-wrapper" ref={wrapperRef}>
        <video className="video" autoPlay muted loop controls>
          <source src="/video.mp4" type="video/mp4" />
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

          {/* Cart or Items */}
          {activeTab === 'items' ? (
            <div className="clothes-grid">
              {clothes.map((item) => (
                <div key={item.id} className="clothing-card">
                  <img src={item.img} alt={item.desc} />
                  <div>
                    <p>{item.desc}</p>
                    {item.price && <p style={{ color: '#00c2ff', fontSize: '0.9rem' }}>{item.price}</p>}
                    {item.oldPrice && <p style={{ color: '#666', fontSize: '0.8rem', textDecoration: 'line-through' }}>{item.oldPrice}</p>}
                    <div className="button-row">
                      <button className="chat-button" onClick={() => handleAddToCart(item)}>
                        Add to Cart
                      </button>
                      <button className="chat-button" onClick={() => handleDripTry(item.img)}>
                        DripTry
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="clothes-grid">
              <button className="back-to-items-button" onClick={() => setActiveTab('items')}>
                ← Back to Items
              </button>
              <h4 style={{ color: '#fff', marginBottom: '10px' }}>Your DripCart</h4>
              {cartItems.length === 0 ? (
                <p style={{ color: '#ccc' }}>Your cart is empty.</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="clothing-card">
                    <img src={item.img} alt={item.desc} />
                    <div>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Try-On Results Section */}
          {activeTab === 'items' && (
            <>
              {/* Image Upload Section */}
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '15px' }}>
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
                <div style={{ marginTop: '20px' }}>
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
            </>
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
