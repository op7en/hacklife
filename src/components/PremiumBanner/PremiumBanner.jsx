import React from 'react';
import './PremiumBanner.css';

const PremiumBanner = ({ isPremium, onActivatePremium }) => {
  const handleActivate = () => {
    onActivatePremium(7); 
  };

  if (isPremium) {
    return (
      <div className="premium-active-banner">
        <div className="premium-active-content">
          <div className="premium-badge">
            <span className="premium-crown">👑</span>
            <h3>FinHelper Premium Активен</h3>
          </div>
          <p className="premium-expiry">Пробный период истекает через 7 дней</p>
          <div className="premium-benefits">
            <span>✅ Все премиум-функции доступны</span>
            <span>✅ Расширенная аналитика</span>
            <span>✅ Приоритетная поддержка</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-banner">
      <div className="premium-content">
        <div className="premium-info">
          <div className="premium-header">
            <span className="premium-icon">👑</span>
            <h3 className="premium-title">FinHelper Premium</h3>
          </div>
          <p className="premium-description">
            Расширенная аналитика, автоматические сценарии и персональные советы
          </p>
          <div className="premium-features">
            {/* премиум вещи */}
            <span className="feature">📊 Расширенная аналитика</span>
            <span className="feature">⚡ Автоматические сценарии</span>
            <span className="feature">🔔 Бесплатные СМС-уведомления</span>
            <span className="feature">😎 Круглосуточная поддержка</span>
            <span className="feature">🤑 Кешбэк 6% на всё</span>
          </div>
        </div>
        <div className="premium-cta">
          <div className="price-section">
            <p className="price">99₽</p>
            <p className="period">в месяц</p>
          </div>
          <button onClick={handleActivate} className="premium-button">
            Попробовать 7 дней бесплатно
          </button>
          <p className="premium-note">Отмена в любой момент</p>
        </div>
      </div>
    </div>
  );
};

export default PremiumBanner;