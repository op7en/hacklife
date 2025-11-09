import React, { useState } from 'react';
import './CreateAccount.css';

const CreateAccount = ({ onCreateAccount, isLoading }) => {
  const [selectedBank, setSelectedBank] = useState('abank');
  const [accountType, setAccountType] = useState('personal');
  const [creationStatus, setCreationStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setCreationStatus('🔄 Пробуем создать через банковское API...');
    
    try {
      const result = await onCreateAccount({
        bankName: selectedBank,
        accountType,
        customName: `${selectedBank.toUpperCase()} ${accountType === 'savings' ? 'Накопительный' : accountType === 'business' ? 'Бизнес' : 'Личный'} счет`
      });
      
      setCreationStatus(result.createdVia === 'API' 
        ? `✅ Счет создан в ${selectedBank.toUpperCase()} через банковское API!` 
        : `📝 Счет создан в ${selectedBank.toUpperCase()} (локальный режим)`);
      
      setTimeout(() => {
        setSelectedBank('abank');
        setAccountType('personal');
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
          disabled={isLoading} // Убрал проверку на bankName
          className="create-account-button"
        >
          {isLoading ? '🔄 Создание...' : '✅ Создать счет'}
        </button>
      </form>

      <div className="create-account-hint">
        <h4>💡 Примечание:</h4>
        <p>• Все счета создаются с начальным балансом 0 рублей</p>
        <p>• Для пополнения счета используйте функцию "Перевод между счетами"</p>
      </div>
    </div>
  );
};

export default CreateAccount;