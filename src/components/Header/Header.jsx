import React from 'react';
import './Header.css';

const Header = ({ isPremium }) => {
  const handleLogout = () => {
    if (window.confirm('Вы уверены что хотите выйти?')) {
      localStorage.removeItem('finhelper_user');
      localStorage.removeItem('finhelper_premium');
      localStorage.removeItem('finhelper_premium_expiry');
      window.location.href = 'https://google.com';
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <h1>
            FinHelper
            {isPremium && <span className="premium-badge-header">👑</span>}
          </h1>
          <p>Мультибанковский помощник</p>
        </div>
        <div className='profile-user'>
          <div className={`user-avatar ${isPremium ? 'premium-user' : ''}`}>
            <span>
              {isPremium && <span className="premium-indicator">✨</span>}
            </span>
            <div className="dropdown">
              {isPremium && <p className="premium-status">Premium активен</p>}
              <p onClick={handleLogout}>Выйти</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;