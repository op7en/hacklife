import React, { useState } from 'react';
import './CreateAccount.css';

const CreateAccount = ({ onCreateAccount, isLoading }) => {
  const [bankName, setBankName] = useState('');
  const [selectedBank, setSelectedBank] = useState('abank');
  const [accountType, setAccountType] = useState('personal');
  const [initialBalance, setInitialBalance] = useState('');
  const [creationStatus, setCreationStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!bankName.trim()) {
      alert('Введите название счета');
      return;
    }

    setCreationStatus('🔄 Пробуем создать через банковское API...');
    
    try {
      const result = await onCreateAccount({
        bankName: selectedBank,
        accountType,
        initialBalance: initialBalance || 0,
        customName: bankName.trim()
      });
      
      setCreationStatus(result.createdVia === 'API' 
        ? `✅ Счет создан в ${selectedBank.toUpperCase()} через банковское API!` 
        : `📝 Счет создан в ${selectedBank.toUpperCase()} (локальный режим)`);
      
      setTimeout(() => {
        setBankName('');
        setSelectedBank('abank');
        setAccountType('personal');
        setInitialBalance('');
        setCreationStatus('');
      }, 3000);
      
    } catch (err) {
      setCreationStatus(`❌ Ошибка: ${err.message}`);
    }
  };

  return (
    <div className="create-account-section">
      <h3>🏦 Создать новый счет</h3>
      
      <form onSubmit={handleSubmit} className="create-account-form">
        <div className="form-group">
          <label>Банк для создания счета:</label>
          <select 
            value={selectedBank} 
            onChange={(e) => setSelectedBank(e.target.value)}
          >
            <option value="abank">🏦 ABank </option>
            <option value="sbank">🏦 SBank </option>
            <option value="vbank">🏦 VBank </option>
            <option value="custom">💼 Другой банк (локальный режим)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Название счета:</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Например: Основной счет, Накопительный"
            maxLength={30}
          />
        </div>

        <div className="form-group">
          <label>Тип счета:</label>
          <select 
            value={accountType} 
            onChange={(e) => setAccountType(e.target.value)}
          >
            <option value="personal">💳 Личный счет</option>
            <option value="savings">💰 Накопительный счет</option>
            <option value="business">🏢 Бизнес-счет</option>
          </select>
        </div>

        <div className="form-group">
          <label>Начальный баланс (необязательно):</label>
          <input
            type="number"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>

        {/* Статус создания */}
        {creationStatus && (
          <div className={`creation-status ${
            creationStatus.includes('✅') ? 'success' : 
            creationStatus.includes('❌') ? 'error' : 'loading'
          }`}>
            {creationStatus}
          </div>
        )}

        <button 
          type="submit"
          disabled={isLoading || !bankName.trim()}
          className="create-account-button"
        >
          {isLoading ? '🔄 Создание...' : '✅ Создать счет'}
        </button>
      </form>


    </div>
  );
};

export default CreateAccount;