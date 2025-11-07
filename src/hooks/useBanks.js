import { useState, useEffect } from 'react';

export const useBanks = () => {
  const [connectedBanks, setConnectedBanks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState(null);

  // Конфигурация для каждого банка
  const bankConfigs = {
    vbank: {
      clientId: 'team003-1',
      consentId: 'consent-d004cc84f345'
    },
    abank: {
      clientId: 'team003-1', 
      consentId: 'consent-8bdecbd761ab'
    },
    sbank: {
      clientId: 'team003-1',
      consentId: 'consent-9b1252c03f73'
    }
  };

  const connectBank = async (bankId) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔥 Подключаем ${bankId}...`);

      // 1. Получаем токен банка
      console.log('🔑 Получаем токен...');
      const tokenResponse = await fetch(`https://${bankId}.open.bankingapi.ru/auth/bank-token?client_id=team003&client_secret=WzuKQTQrmefPsCLAB8OtkP5gXjO38iBF`, {
        method: 'POST',
        headers: { 
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!tokenResponse.ok) {
        throw new Error(`Токен: ${tokenResponse.status} - ${await tokenResponse.text()}`);
      }

      const tokenData = await tokenResponse.json();
      const bankToken = tokenData.access_token;
      console.log('✅ Токен:', bankToken);

      // 2. Получаем конфиг для банка
      const config = bankConfigs[bankId];
      if (!config) {
        throw new Error(`Нет конфигурации для банка ${bankId}`);
      }

      const { clientId, consentId } = config;

      // 3. Получаем счета через межбанковский запрос
      console.log(`💰 Получаем счета для клиента ${clientId}...`);
      const accountsResponse = await fetch(`https://${bankId}.open.bankingapi.ru/accounts?client_id=${clientId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${bankToken}`,
          'X-Consent-Id': consentId,
          'X-Requesting-Bank': 'team003'
        }
      });

      console.log('📊 Статус счетов:', accountsResponse.status);

      if (!accountsResponse.ok) {
        throw new Error(`Счета: ${accountsResponse.status} - ${await accountsResponse.text()}`);
      }

      const accountsData = await accountsResponse.json();
      console.log(`✅ СЧЕТА ПОЛУЧЕНЫ ДЛЯ ${bankId}!`, accountsData);

      // 4. Получаем балансы для каждого счета
      const accountsWithBalances = [];
      
      for (const account of accountsData.data?.account || []) {
        try {
          console.log(`💰 Запрашиваем баланс для счета ${account.accountId}...`);
          
          const balanceResponse = await fetch(`https://${bankId}.open.bankingapi.ru/accounts/${account.accountId}/balances?client_id=${clientId}`, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${bankToken}`,
              'X-Consent-Id': consentId,
              'X-Requesting-Bank': 'team003'
            }
          });

          let balance = 0;
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            balance = Number(balanceData.data?.balance?.[0]?.amount?.amount) || 0;
            console.log(`💰 Баланс счета ${account.accountId}: ${balance}`);
          } else {
            console.log(`⚠️ Не удалось получить баланс для ${account.accountId}`);
          }

          accountsWithBalances.push({
            id: account.accountId,
            name: account.nickname || 'Основной счет',
            balance: Number(balance) || 0,
            number: account.account?.[0]?.identification ? account.account[0].identification : 'Номер не указан',
            currency: account.currency || 'RUB',
            bankName: bankId.toUpperCase(),
            type: account.accountType === 'Personal' ? 'Personal' : 'Business',
            status: account.status === 'Enabled' ? 'Active' : 'Inactive'
          });

        } catch (err) {
          console.log(`❌ Ошибка при получении баланса для ${account.accountId}:`, err);
        }
      }

      // 5. Получаем транзакции для первого счета
      if (accountsWithBalances.length > 0) {
        try {
          const firstAccountId = accountsWithBalances[0].id;
          console.log(`📊 Получаем транзакции для счета ${firstAccountId}...`);
          
          const transactionsResponse = await fetch(`https://${bankId}.open.bankingapi.ru/accounts/${firstAccountId}/transactions?client_id=${clientId}`, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${bankToken}`,
              'X-Consent-Id': consentId,
              'X-Requesting-Bank': 'team003'
            }
          });

          if (transactionsResponse.ok) {
            const transactionsData = await transactionsResponse.json();
            const realTransactions = transactionsData.data?.transaction?.map(trans => ({
              id: trans.transactionId,
              date: trans.bookingDateTime || trans.valueDateTime || new Date().toISOString(),
              amount: Number(trans.amount?.amount) || 0,
              description: trans.transactionInformation || 'Без описания',
              category: 'Другое',
              bankId: bankId
            })) || [];

            setTransactions(prev => [...prev, ...realTransactions]);
            console.log('✅ Транзакции получены:', realTransactions.length);
          }
        } catch (error) {
          console.log( error, '⚠️ Не удалось получить транзакции');
        }
      }

      // 6. Сохраняем данные
      setAccounts(prev => {
        const filtered = prev.filter(acc => !acc.bankName.includes(bankId.toUpperCase()));
        return [...filtered, ...accountsWithBalances];
      });
      
      setConnectedBanks(prev => {
        const updated = [...prev.filter(id => id !== bankId), bankId];
        return updated;
      });

      console.log(`🎉 ${bankId} подключен! Счетов: ${accountsWithBalances.length}`);

    } catch (err) {
      console.error('💥 Ошибка:', err);
      setError(`${bankId}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    const currentBanks = [...connectedBanks];
    
    for (const bankId of currentBanks) {
      await connectBank(bankId);
    }
  };

  // Функция создания согласия на перевод - ИСПРАВЛЕННАЯ
// Функция создания согласия на перевод - ЧЕРЕЗ ПРОКСИ
const createPaymentConsent = async (bankId, fromAccount, toAccount, amount) => {
  try {
    console.log('🔐 Создаем согласие на перевод через прокси...');
    
    // Используем прокси вместо прямого запроса
    const consentResponse = await fetch(`http://localhost:3001/api/payment-consent`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bankId: bankId,
        fromAccount: fromAccount,
        toAccount: toAccount,
        amount: amount,
        client_id: 'team003-1'
      })
    });

    console.log('📊 Статус согласия от прокси:', consentResponse.status);

    if (!consentResponse.ok) {
      const errorText = await consentResponse.text();
      throw new Error(`Прокси: ${consentResponse.status} - ${errorText}`);
    }

    const consentData = await consentResponse.json();
    console.log('✅ Согласие создано через прокси:', consentData);
    
    return consentData.consent_id;

  } catch (err) {
    console.error('❌ Ошибка создания согласия через прокси:', err);
    throw err;
  }
};

// Функция выполнения перевода - МОК-ВЕРСИЯ
const makeTransfer = async (transferData) => {
  return new Promise((resolve, reject) => {
    setIsLoading(true);
    setError(null);
    
    // Имитация загрузки (2 секунды)
    setTimeout(() => {
      try {
        const { fromAccount, toAccount, amount, description = "Перевод через FinHelper" } = transferData;
        
        console.log('💸 МОК-ПЕРЕВОД:', {
          fromAccount,
          toAccount, 
          amount,
          description,
          timestamp: new Date().toISOString()
        });

        // Проверяем баланс
        const fromAccountData = accounts.find(acc => acc.number === fromAccount);
        if (!fromAccountData) {
          throw new Error('Счет отправителя не найден');
        }

        if (fromAccountData.balance < amount) {
          throw new Error('Недостаточно средств на счете');
        }

        if (amount <= 0) {
          throw new Error('Сумма перевода должна быть больше 0');
        }

        // Обновляем балансы для реалистичности
        setAccounts(prev => prev.map(acc => {
          if (acc.number === fromAccount) {
            return { ...acc, balance: acc.balance - amount };
          }
          if (acc.number === toAccount) {
            return { ...acc, balance: acc.balance + amount };
          }
          return acc;
        }));

        // Добавляем мок-транзакцию
        const mockTransaction = {
          id: `mock-${Date.now()}`,
          date: new Date().toISOString(),
          amount: -amount, // отрицательная сумма для расхода
          description: `Перевод на счет ${toAccount}`,
          category: 'Перевод',
          bankId: fromAccountData.bankName.toLowerCase(),
          transactionType: 'expense'
        };

        setTransactions(prev => [mockTransaction, ...prev]);

        // Успешный ответ
        const successResponse = {
          success: true,
          message: '✅ Перевод выполнен успешно!',
          transactionId: `mock-transaction-${Date.now()}`,
          amount: amount,
          fromAccount: fromAccount,
          toAccount: toAccount,
          timestamp: new Date().toISOString()
        };

        console.log('✅ МОК-ПЕРЕВОД УСПЕШЕН:', successResponse);
        resolve(successResponse);

      } catch (error) {
        console.error('❌ Ошибка мок-перевода:', error);
        setError(error.message);
        reject(error);
      } finally {
        setIsLoading(false);
      }
    }, 2000); // 2 секунды задержки для реалистичности
  });
};
  // Безопасный расчет общего баланса
  const totalBalance = accounts.reduce((sum, account) => {
    const balance = Number(account.balance) || 0;
    return sum + balance;
  }, 0);



  // премиум
  
  // Функция активации премиума
  const activatePremium = (days = 7) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    setIsPremium(true);
    setPremiumExpiry(expiryDate);
    
    // Сохраняем в localStorage
    localStorage.setItem('finhelper_premium', 'true');
    localStorage.setItem('finhelper_premium_expiry', expiryDate.toISOString());
    
    console.log(`🎉 Премиум активирован на ${days} дней!`);
  };

  // Проверяем премиум при загрузке
  useEffect(() => {
    const savedPremium = localStorage.getItem('finhelper_premium');
    const savedExpiry = localStorage.getItem('finhelper_premium_expiry');
    
    if (savedPremium === 'true' && savedExpiry) {
      const expiryDate = new Date(savedExpiry);
      if (expiryDate > new Date()) {
        setIsPremium(true);
        setPremiumExpiry(expiryDate);
      } else {
        // Премиум истек
        localStorage.removeItem('finhelper_premium');
        localStorage.removeItem('finhelper_premium_expiry');
      }
    }
  }, []);

  return {
    connectedBanks,
    accounts,
    transactions,
    totalBalance,
    isLoading,
    error,
    isPremium,
    premiumExpiry,
    activatePremium,
    connectBank,
    refreshData,
    makeTransfer,
    createPaymentConsent,
  };
};