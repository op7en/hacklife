import React from 'react';
import './BankConnection.css';

const BankConnection = ({ 
  connectedBanks, 
  onConnectBank, 
  isLoading, 
  error,
}) => {
  const banks = [
    { 
      id: 'vbank', 
      name: 'VBank', 
      color: '#3b82f6',
      description: 'Основной банк с полным набором услуг'
    },
    { 
      id: 'abank', 
      name: 'ABank', 
      color: '#ef4444',
      description: 'Партнерский банк с выгодными условиями'
    },
    { 
      id: 'sbank', 
      name: 'SBank', 
      color: '#10b981',
      description: 'Сберегательный банк с высокими процентами'
    }
  ];

  const getConnectionStatus = (bankId) => {
    const isConnected = connectedBanks.includes(bankId);
    return {
      isConnected,
      text: isConnected ? 'Подключен' : 'Не подключен',
      indicator: isConnected ? '✓' : '●'
    };
  };

  return (
    <div className="bank-connection">
      <div className="connection-header">
        <div className="header-info">
          <h2 className="connection-title">Подключенные банки</h2>
          <p className="connection-subtitle">
            Управляйте всеми счетами из одного интерфейса
          </p>
        </div>
        
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="banks-grid">
        {banks.map(bank => {
          const status = getConnectionStatus(bank.id);
          
          return (
            <div 
              key={bank.id}
              className={`bank-card ${status.isConnected ? 'connected' : 'disconnected'}`}
              style={{ '--bank-color': bank.color }}
            >
              <div className="bank-header">
                <div 
                  className="bank-icon"
                  style={{ backgroundColor: bank.color }}
                >
                  🏦
                </div>
                <div className="bank-info">
                  <h3 className="bank-name">{bank.name}</h3>
                  <p className="bank-description">{bank.description}</p>
                  <p className={`bank-status ${status.isConnected ? 'connected' : 'disconnected'}`}>
                    {status.text}
                  </p>
                </div>
                <div className="bank-indicator">
                  <div className={`status-indicator ${status.isConnected ? 'connected' : 'disconnected'}`}>
                    {status.indicator}
                  </div>
                </div>
              </div>
              
              <div className="bank-actions">
                {!status.isConnected ? (
                  <button 
                    className="connect-button"
                    onClick={() => onConnectBank(bank.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Подключение...
                      </>
                    ) : (
                      'Подключить банк'
                    )}
                  </button>
                ) : (
                  <div className="connected-actions">
                    <span className="success-text">✓ Успешно подключено</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {connectedBanks.length > 0 && (
        <div className="connection-stats">
          <div className="stat-item">
            <span className="stat-label">Подключено банков:</span>
            <span className="stat-value">{connectedBanks.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Статус:</span>
            <span className="stat-value success">
              {connectedBanks.length === banks.length ? 'Все банки подключены' : 'Частично подключено'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankConnection;