import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-message">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          <h3 className="error-title">Произошла ошибка</h3>
          <p className="error-description">{message}</p>
        </div>
      </div>
      
      {onRetry && (
        <div className="error-actions">
          <button onClick={onRetry} className="retry-button">
            <span className="retry-icon">🔄</span>
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;