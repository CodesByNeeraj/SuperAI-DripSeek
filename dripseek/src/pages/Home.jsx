import React, { useRef, useState } from 'react';
import '../css/Home.css';

const Home = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('items');

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
    { id: 1, img: 'https://via.placeholder.com/60x80', desc: 'Black T-Shirt' },
    { id: 2, img: 'https://via.placeholder.com/60x80', desc: 'Red Hoodie' },
    { id: 3, img: 'https://via.placeholder.com/60x80', desc: 'Denim Jacket' },
  ];

  const handleAddToCart = (item) => {
    if (!cartItems.find((i) => i.id === item.id)) {
      setCartItems([...cartItems, item]);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() !== '') {
      console.log("User Query:", chatInput);
      setChatInput('');
    }
  };

  const handleDripSeekClick = () => {
  setShowPanel(true);
  setActiveTab('items');

  const screenshot = captureScreenshot();

  // TODO: Send to backend (this part is optional for now)
  console.log("Screenshot captured:", screenshot.slice(0, 50) + '...'); // Just for debugging
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
                    <div className="button-row">
                      <button className="chat-button" onClick={() => handleAddToCart(item)}>
                        Add to Cart
                      </button>
                      <button className="chat-button" onClick={() => handleAddToCart(item)}>
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

          {/* Chat Box */}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
