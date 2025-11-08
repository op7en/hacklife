import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onRetry, onSecondary }) => {
  return (
    <div className="error-message" role="alert" aria-live="polite">
      <div className="error-content">
        <div className="error-icon" aria-hidden="true">⚠️</div>
        <div className="error-text">
          <h3 className="error-title">Произошла ошибка</h3>
          <p className="error-description">{message}</p>
        </div>
      </div>
      
      {(onRetry || onSecondary) && (
        <div className="error-actions">
          {onRetry && (
            <button 
              onClick={onRetry} 
              className="retry-button"
              aria-label="Попробовать снова"
            >
              <span className="retry-icon" aria-hidden="true">🔄</span>
              Попробовать снова
            </button>
          )}
          {onSecondary && (
            <button 
              onClick={onSecondary} 
              className="secondary-button"
              aria-label="Дополнительное действие"
            >
              <span aria-hidden="true">ℹ️</span>
              Подробнее
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;