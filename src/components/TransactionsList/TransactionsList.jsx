import React, { useState, useMemo } from 'react';
import './TransactionsList.css';

const TransactionsList = ({ transactions }) => {
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 5;

  // Функция форматирования денег
  const formatMoney = (amount, showSign = false) => {
    const safeAmount = Number(amount) || 0;
    const absAmount = Math.abs(safeAmount);
    
    const formatted = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(absAmount);

    if (showSign) {
      return safeAmount > 0 ? `+${formatted}` : `-${formatted}`;
    }
    
    return safeAmount < 0 ? `-${formatted}` : formatted;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Продукты': '🛒',
      'Транспорт': '🚗',
      'Доход': '💰',
      'Перевод': '🔄',
      'ЖКХ': '🏠',
      'Развлечения': '🎬',
      'Зарплата': '💼',
      'Другое': '📦'
    };
    return icons[category] || '📦';
  };

  // Категоризация транзакций
  const categorizeTransaction = (transaction) => {
    const description = transaction.description.toLowerCase();
    const originalAmount = Number(transaction.amount) || 0;

    // ДОХОДЫ
    if (description.includes('зарплата') || 
        description.includes('перевод от') || 
        description.includes('входящий перевод') ||
        description.includes('подработка') ||
        description.includes('бонус') ||
        description.includes('межбанковский перевод в') ||
        description.includes('зачисление')) {
      return { 
        amount: Math.abs(originalAmount),
        category: description.includes('зарплата') ? 'Зарплата' : 'Доход',
        type: 'income'
      };
    }
    
    // РАСХОДЫ
    if (description.includes('жкх') || 
        description.includes('аренда') ||
        description.includes('продукты') ||
        description.includes('транспорт') ||
        description.includes('развлечения') ||
        description.includes('покупки') ||
        description.includes('такси') ||
        description.includes('магнит') ||
        description.includes('пятерочка') ||
        description.includes('яндекс') ||
        description.includes('сбер') ||
        description.includes('оплата') ||
        description.includes('списание')) {
      return { 
        amount: -Math.abs(originalAmount),
        category: description.includes('жкх') ? 'ЖКХ' : 
                  description.includes('продукты') ? 'Продукты' :
                  description.includes('транспорт') ? 'Транспорт' :
                  description.includes('развлечения') ? 'Развлечения' : 'Другое',
        type: 'expense'
      };
    }
    
    return { 
      amount: originalAmount,
      category: 'Другое',
      type: originalAmount >= 0 ? 'income' : 'expense'
    };
  };

  // Нормализация транзакций
  const normalizedTransactions = useMemo(() => {
    const seen = new Set();
    
    return transactions.map(trans => {
      const categorized = categorizeTransaction(trans);
      
      return {
        ...trans,
        amount: categorized.amount,
        category: categorized.category,
        transactionType: categorized.type
      };
    }).filter(trans => {
      const key = `${trans.id}-${trans.description}-${trans.amount}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [transactions]);

  // Фильтрация
  const filteredTransactions = useMemo(() => {
    switch (filter) {
      case 'income':
        return normalizedTransactions.filter(t => t.amount > 0);
      case 'expense':
        return normalizedTransactions.filter(t => t.amount < 0);
      default:
        return normalizedTransactions;
    }
  }, [normalizedTransactions, filter]);

  // Статистика
  const stats = useMemo(() => {
    const incomes = normalizedTransactions.filter(t => t.amount > 0);
    const expenses = normalizedTransactions.filter(t => t.amount < 0);
    
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      totalIncome,
      totalExpenses, 
      balance: totalIncome - totalExpenses,
      incomeCount: incomes.length,
      expenseCount: expenses.length
    };
  }, [normalizedTransactions]);

  // ПАГИНАЦИЯ
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  
  // Транзакции для текущей страницы
  const currentTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  // Сброс страницы при изменении фильтра
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Функции для пагинации
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Генерация номеров страниц для пагинации
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="transactions-list">
      <div className="transactions-header">
        <div>
          <h2 className="transactions-title">История операций</h2>
          <p className="transactions-subtitle">
            {filteredTransactions.length} операций
            {totalPages > 1 && ` • Страница ${currentPage} из ${totalPages}`}
          </p>
        </div>
        
        <div className="transactions-controls">
          <div className="filter-tabs">
            {[
              { key: 'all', label: `Все (${normalizedTransactions.length})` },
              { key: 'income', label: `Доходы (${stats.incomeCount})` },
              { key: 'expense', label: `Расходы (${stats.expenseCount})` }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`filter-tab ${filter === item.key ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Список транзакций */}
      <div className="transactions-container">
        {currentTransactions.map((transaction, index) => (
          <div 
            key={`${transaction.id}-${index}`} 
            className="transaction-item"
            style={{
              borderLeft: `4px solid ${transaction.amount > 0 ? '#4caf50' : '#f44336'}`
            }}
          >
            <div className="transaction-main">
              <div className="transaction-icon">
                {getCategoryIcon(transaction.category)}
              </div>
              
              <div className="transaction-details">
                <h3 className="transaction-description">
                  {transaction.description}
                </h3>
                <div className="transaction-meta">
                  <span className="transaction-date">
                    {formatDate(transaction.date)}
                  </span>
                  <span className="transaction-category">
                    {transaction.category}
                  </span>
                  <span style={{
                    background: transaction.amount > 0 ? '#e8f5e8' : '#ffebee',
                    color: transaction.amount > 0 ? '#2e7d32' : '#c62828',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {transaction.amount > 0 ? 'ДОХОД' : 'РАСХОД'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className={`transaction-amount ${transaction.amount > 0 ? 'income' : 'expense'}`}>
              <span className="amount">
                {formatMoney(transaction.amount, true)}
              </span>
              <span className="amount-type">
                {transaction.amount > 0 ? 'Зачисление' : 'Списание'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="pagination-button pagination-prev"
          >
            ← Назад
          </button>
          
          <div className="pagination-pages">
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`pagination-page ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button 
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="pagination-button pagination-next"
          >
            Вперед →
          </button>
        </div>
      )}

      {filteredTransactions.length === 0 && (
        <div className="empty-transactions">
          <div className="empty-icon">
            {filter === 'income' ? '💰' : filter === 'expense' ? '💸' : '📊'}
          </div>
          <p className="empty-text">
            {filter === 'income' ? 'Нет доходных операций' : 
             filter === 'expense' ? 'Нет расходных операций' : 
             'Нет операций'}
          </p>
          <button 
            onClick={() => setFilter('all')}
            className="empty-action"
          >
            Показать все операции
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;