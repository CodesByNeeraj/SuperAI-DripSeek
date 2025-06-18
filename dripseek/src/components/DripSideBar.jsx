import React, { useEffect, useState } from 'react';
import '../css/DripSidebar.css';

const DripSidebar = ({ isOpen, onClose, defaultTab = 'DripChat' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [cartItems, setCartItems] = useState([]);

  const sampleItems = [
    { id: 1, name: 'Black T-Shirt', img: 'https://via.placeholder.com/80x100' },
    { id: 2, name: 'Red Hoodie', img: 'https://via.placeholder.com/80x100' },
    { id: 3, name: 'Denim Jacket', img: 'https://via.placeholder.com/80x100' }
  ];

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleAddToCart = (item) => {
    if (!cartItems.find((i) => i.id === item.id)) {
      setCartItems([...cartItems, item]);
    }
  };

  return (
    <div className={`drip-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="drip-tabs">
        {['DripChat', 'DripCart'].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="drip-content">
        {activeTab === 'DripChat' && (
          <div className="drip-chat">
            <p>This is a placeholder chat interface for product interaction.</p>
          </div>
        )}

        {activeTab === 'DripCart' && (
          <div className="drip-cart">
            {cartItems.length === 0 ? (
              <p>Your DripCart is empty.</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.img} alt={item.name} />
                  <p>{item.name}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DripSidebar;
