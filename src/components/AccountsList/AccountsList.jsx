import React from 'react';
import './AccountsList.css';

const AccountsList = ({ accounts, totalBalance }) => {
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getAccountIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'savings': return '💰';
      case 'business': return '🏢';
      case 'loan': return '📊';
      default: return '💳';
    }
  };

  return (
    <div className="accounts-list">
      {/* Общий баланс */}
      <div className="total-balance">
        <div className="balance-header">
          <h2 className="balance-title">Общий баланс</h2>
          <div className="balance-stats">
            <span>{accounts.length} счетов</span>
          </div>
        </div>
        <p className="balance-amount">{formatMoney(totalBalance)}</p>
      </div>

      {/* Список счетов */}
      <div className="accounts-grid">
        {accounts.map(account => (
          <div key={account.id} className="account-card">
            <div className="account-header">
              <div className="account-icon">
                {getAccountIcon(account.type)}
              </div>
              <div className="account-info">
                <h3 className="account-name">{account.name}</h3>
                <p className="account-details">
                  {account.bankName} • {account.number}
                </p>
              </div>
            </div>
            
            <div className="account-balance">
              <span className={`balance ${account.balance >= 0 ? 'positive' : 'negative'}`}>
                {formatMoney(account.balance)}
              </span>
              <span className="account-currency">{account.currency}</span>
            </div>

            <div className="account-footer">
              <span className={`account-status ${account.status === 'Active' ? 'active' : 'inactive'}`}>
                {account.status === 'Active' ? 'Активен' : 'Неактивен'}
              </span>
              <span className="account-type">{account.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountsList;