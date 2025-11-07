import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner-container">
        <div className="spinner"></div>
        <h3 className="loading-title">Загружаем данные</h3>
        <p className="loading-subtitle">
          Подключаемся к банковским системам...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;