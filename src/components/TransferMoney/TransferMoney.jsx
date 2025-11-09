import React, { useState } from 'react';
import './TransferMoney.css'

const TransferMoney = ({ accounts, onTransfer, isLoading }) => {
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleTransfer = async () => {
    // если не заполнены данные для перевода
    if (!fromAccount || !toAccount || !amount) {
      alert('Заполните все поля!');
      return;
    }

    // проверка баланса
    const selectedAccount = accounts.find(acc => acc.number === fromAccount);
    if (selectedAccount && parseFloat(amount) > selectedAccount.balance) {
      alert('❌ Недостаточно средств на счете!');
      return;
    }

    try {
      await onTransfer({
        fromAccount: fromAccount,
        toAccount: toAccount,
        amount: parseFloat(amount),
        description: description || "Перевод через FinHelper"
      });
      
      setFromAccount('');
      setToAccount('');
      setAmount('');
      setDescription('');
      alert('✅ Перевод выполнен успешно!');
    } catch (err) {
      alert(`❌ Ошибка перевода: ${err.message}`);
    }
  };

  return (
    <div className="transfer-section">
      <h3>💸 Перевод между счетами</h3>
      
      <div className="transfer-form">
        <div className="form-group">
          <label>С какого счета:</label>
          <select 
            value={fromAccount} 
            onChange={(e) => setFromAccount(e.target.value)}
          >
            <option value="">Выберите счет списания</option>
            {accounts.map(account => (
              <option key={account.id} value={account.number}>
                {account.bankName} - {account.name} ({account.balance.toLocaleString('ru-RU')} ₽)
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>На какой счет:</label>
          <input
            type="text"
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            placeholder="Введите номер счета получателя"
          />
          <small>Пример: 423019e2792c2c78142c (номер из списка счетов)</small>
        </div>

        <div className="form-group">
          <label>Сумма перевода:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Введите сумму"
            min="1"
          />
        </div>
        <button 
          onClick={handleTransfer}
          disabled={isLoading || !fromAccount || !toAccount || !amount}
          className="transfer-button"
        >
          {isLoading ? '🔄 Перевод...' : '💸 Перевести деньги'}
        </button>
      </div>
{/* для теста */}
      <div className="transfer-hint">
        <h4>💡 Для тестирования:</h4>
        <p>• Выберите счет, с которого будете переводить деньги</p>
        <p>• Введите номер счета получателя (можно скопировать из списка ваших счетов)</p>
        <p>• Укажите сумму перевода (минимальная сумма: 1 ₽)</p>
      </div>
    </div>
  );
};

export default TransferMoney;