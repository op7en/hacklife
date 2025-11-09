import { useState, useEffect } from "react";

export const useBanks = () => {
  const [connectedBanks, setConnectedBanks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState(null);

  const bankConfigs = {
    vbank: {
      clientId: "team003-1",
      consentId: "consent-d004cc84f345",
    },
    abank: {
      clientId: "team003-1", 
      consentId: "consent-8bdecbd761ab",
    },
    sbank: {
      clientId: "team003-1",
      consentId: "consent-9b1252c03f73",
    },
  };

  const mockBankConnection = async (bankId) => {
    console.log(`🔄 Используем мок-данные для ${bankId}...`);
    
    const mockAccounts = [
      {
        id: `mock-${bankId}-1`,
        name: "Основной счет",
        balance: 150000 + Math.floor(Math.random() * 100000),
        number: `40702${Math.floor(Math.random() * 10000000000)}`,
        currency: "RUB",
        bankName: bankId.toUpperCase(),
        type: "Личные",
        status: "Active",
      },
      {
        id: `mock-${bankId}-2`,
        name: "Накопительный счет",
        balance: 50000 + Math.floor(Math.random() * 50000),
        number: `40817${Math.floor(Math.random() * 10000000000)}`,
        currency: "RUB",
        bankName: bankId.toUpperCase(),
        type: "Накопления",
        status: "Active",
      },
    ];

    const mockTransactions = [
      {
        id: `mock-trans-${Date.now()}-1`,
        date: new Date(Date.now() - 86400000).toISOString(),
        amount: -(Math.random() * 5000 + 1000),
        description: "Оплата в супермаркете",
        category: "Продукты",
        bankId: bankId,
      },
      {
        id: `mock-trans-${Date.now()}-2`,
        date: new Date(Date.now() - 172800000).toISOString(),
        amount: 75000,
        description: "Зарплата",
        category: "Зарплата",
        bankId: bankId,
      },
      {
        id: `mock-trans-${Date.now()}-3`,
        date: new Date(Date.now() - 259200000).toISOString(),
        amount: -2500,
        description: "Оплата ЖКХ",
        category: "ЖКХ",
        bankId: bankId,
      },
    ];

    setAccounts((prev) => [...prev, ...mockAccounts]);
    setTransactions((prev) => [...prev, ...mockTransactions]);
    setConnectedBanks((prev) => [...prev.filter((id) => id !== bankId), bankId]);
    
    console.log(`🎉 ${bankId} подключен (мок-данные)!`);
  };

  const connectBank = async (bankId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`🔥 Пробуем реальное API для ${bankId}...`);

        const tokenResponse = await fetch(
          `https://${bankId}.open.bankingapi.ru/auth/bank-token?client_id=team003&client_secret=WzuKQTQrmefPsCLAB8OtkP5gXjO38iBF`,
          {
            method: "POST",
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (!tokenResponse.ok) {
          throw new Error(`Токен: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        const bankToken = tokenData.access_token;

        const config = bankConfigs[bankId];
        if (!config) {
          throw new Error(`Нет конфигурации для банка ${bankId}`);
        }

        const { clientId, consentId } = config;

        const accountsResponse = await fetch(
          `https://${bankId}.open.bankingapi.ru/accounts?client_id=${clientId}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${bankToken}`,
              "X-Consent-Id": consentId,
              "X-Requesting-Bank": "team003",
            },
          }
        );

        if (!accountsResponse.ok) {
          throw new Error(`Счета: ${accountsResponse.status}`);
        }

        const accountsData = await accountsResponse.json();

        const accountsWithBalances = [];

        for (const account of accountsData.data?.account || []) {
          try {
            const balanceResponse = await fetch(
              `https://${bankId}.open.bankingapi.ru/accounts/${account.accountId}/balances?client_id=${clientId}`,
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                  Authorization: `Bearer ${bankToken}`,
                  "X-Consent-Id": consentId,
                  "X-Requesting-Bank": "team003",
                },
              }
            );

            let balance = 0;
            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();
              balance = Number(balanceData.data?.balance?.[0]?.amount?.amount) || 0;
            }

            accountsWithBalances.push({
              id: account.accountId,
              name: account.nickname || "Основной счет",
              balance: Number(balance) || 0,
              number: account.account?.[0]?.identification || `acc-${account.accountId}`,
              currency: account.currency || "RUB",
              bankName: bankId.toUpperCase(),
              type: account.accountType === "Personal" ? "Личные" : "Бизнес",
              status: account.status === "Enabled" ? "Active" : "Inactive",
            });
          } catch (err) {
            console.log(`❌ Ошибка при получении баланса:`, err);
          }
        }

        if (accountsWithBalances.length > 0) {
          try {
            const firstAccountId = accountsWithBalances[0].id;
            const transactionsResponse = await fetch(
              `https://${bankId}.open.bankingapi.ru/accounts/${firstAccountId}/transactions?client_id=${clientId}`,
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                  Authorization: `Bearer ${bankToken}`,
                  "X-Consent-Id": consentId,
                  "X-Requesting-Bank": "team003",
                },
              }
            );

            if (transactionsResponse.ok) {
              const transactionsData = await transactionsResponse.json();
              const realTransactions = transactionsData.data?.transaction?.map((trans) => {
                const amount = Number(trans.amount?.amount) || 0;
                const isExpense = amount < 0;
                
                return {
                  id: trans.transactionId,
                  date: trans.bookingDateTime || trans.valueDateTime || new Date().toISOString(),
                  amount: -amount,
                  description: trans.transactionInformation || "Без описания",
                  category: isExpense ? "Расход" : "Доход",
                  bankId: bankId,
                };
              }) || [];

              setTransactions((prev) => [...prev, ...realTransactions]);
            }
          } catch (error) {
            console.log("⚠️ Не удалось получить транзакции");
          }
        }

        setAccounts((prev) => {
          const filtered = prev.filter((acc) => !acc.bankName.includes(bankId.toUpperCase()));
          return [...filtered, ...accountsWithBalances];
        });

        setConnectedBanks((prev) => {
          const updated = [...prev.filter((id) => id !== bankId), bankId];
          return updated;
        });

        console.log(`🎉 ${bankId} подключен (реальные данные)! Счетов: ${accountsWithBalances.length}`);

      } catch (apiError) {
        console.log(`❌ API ${bankId} недоступно, используем мок-данные`);
        await mockBankConnection(bankId);
      }

    } catch (err) {
      console.error("💥 Общая ошибка:", err);
      setError(`${bankId}: ${err.message}`);
      await mockBankConnection(bankId);
    } finally {
      setIsLoading(false);
    }
  };

  const createAccountConsent = async (bankId) => {
    try {
      console.log(`🔐 Получаем согласие для создания счетов в ${bankId}...`);
      
      // 1. Получаем токен банка
      const tokenResponse = await fetch(
        `https://${bankId}.open.bankingapi.ru/auth/bank-token?client_id=team003&client_secret=WzuKQTQrmefPsCLAB8OtkP5gXjO38iBF`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!tokenResponse.ok) {
        throw new Error(`Токен: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const bankToken = tokenData.access_token;

      const config = bankConfigs[bankId];
      const { clientId } = config;

      const consentResponse = await fetch(
        `https://${bankId}.open.bankingapi.ru/account-consents?client_id=${clientId}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${bankToken}`,
            "X-Requesting-Bank": "team003",
          },
          body: JSON.stringify({
            "data": {
              "permissions": ["ManageAccounts"],
              "expirationDateTime": "2025-12-31T23:59:59Z"
            }
          })
        }
      );

      if (!consentResponse.ok) {
        const errorText = await consentResponse.text();
        console.log('❌ Ошибка согласия:', errorText);
        throw new Error(`Согласие: ${consentResponse.status}`);
      }

      const consentData = await consentResponse.json();
      console.log('✅ Согласие получено:', consentData);
      
      return consentData.data?.consentId;

    } catch (err) {
      console.error('❌ Ошибка получения согласия:', err);
      throw err;
    }
  };

  const createRealAccount = async (bankId, accountData) => {
    try {
      console.log(`🏦 Создаем реальный счет в ${bankId} через client_token...`);
      
      const tokenResponse = await fetch(
        `https://${bankId}.open.bankingapi.ru/auth/client-token?client_id=team003&client_secret=WzuKQTQrmefPsCLAB8OtkP5gXjO38iBF`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!tokenResponse.ok) {
        throw new Error(`Client token: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const clientToken = tokenData.access_token;
      console.log('✅ Client token получен');

      // 2. Создаем счет через API с client_token
      const createAccountResponse = await fetch(
        `https://${bankId}.open.bankingapi.ru/accounts?client_id=team003-1`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${clientToken}`,
          },
          body: JSON.stringify({
            "account_type": accountData.accountType === 'savings' ? 'savings' : 'checking',
            "initial_balance": Number(accountData.initialBalance) || 0
          })
        }
      );

      console.log('📊 Статус создания счета:', createAccountResponse.status);

      if (!createAccountResponse.ok) {
        const errorText = await createAccountResponse.text();
        console.log('❌ Ошибка создания счета:', errorText);
        throw new Error(`Создание счета: ${createAccountResponse.status}`);
      }

      const accountDataResponse = await createAccountResponse.json();
      console.log('✅ Счет создан через API:', accountDataResponse);

      const newAccount = {
        id: accountDataResponse.data?.accountId || `real-${Date.now()}`,
        name: accountData.customName || (accountData.accountType === 'savings' ? 'Накопительный счет' : 'Основной счет'),
        balance: Number(accountData.initialBalance) || 0,
        number: accountDataResponse.data?.accountNumber || `acc-${Date.now()}`,
        currency: 'RUB',
        bankName: bankId.toUpperCase(),
        type: accountData.accountType === 'savings' ? 'Накопления' : 'Личные',
        status: 'Active',
        isReal: true,
        createdVia: 'API'
      };

      setAccounts(prev => [...prev, newAccount]);

      if (accountData.initialBalance > 0) {
        const initialTransaction = {
          id: `initial-${Date.now()}`,
          date: new Date().toISOString(),
          amount: Number(accountData.initialBalance),
          description: 'Начальный баланс',
          category: 'Доход',
          bankId: bankId,
          isReal: true
        };
        setTransactions(prev => [initialTransaction, ...prev]);
      }

      return {
        success: true,
        message: `✅ Счет успешно создан в ${bankId.toUpperCase()} через банковское API!`,
        account: newAccount,
        createdVia: 'API'
      };

    } catch (err) {
      console.error('💥 Ошибка создания реального счета:', err);
      throw err;
    }
  };

  const createRealAccountWithConsent = async (bankId, accountData) => {
    try {
      console.log(`🏦 Создаем реальный счет в ${bankId} через bank_token...`);
      
      // 1. Получаем токен банка
      const tokenResponse = await fetch(
        `https://${bankId}.open.bankingapi.ru/auth/bank-token?client_id=team003&client_secret=WzuKQTQrmefPsCLAB8OtkP5gXjO38iBF`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!tokenResponse.ok) {
        throw new Error(`Токен: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const bankToken = tokenData.access_token;

      // 2. Получаем конфиг
      const config = bankConfigs[bankId];
      const { clientId, consentId } = config;

      // 3. Создаем счет через API с bank_token
      const createAccountResponse = await fetch(
        `https://${bankId}.open.bankingapi.ru/accounts?client_id=${clientId}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${bankToken}`,
            "X-Requesting-Bank": "team003",
            "X-Consent-Id": consentId,
          },
          body: JSON.stringify({
            "account_type": accountData.accountType === 'savings' ? 'savings' : 'checking',
            "initial_balance": Number(accountData.initialBalance) || 0
          })
        }
      );

      console.log('📊 Статус создания счета:', createAccountResponse.status);

      if (!createAccountResponse.ok) {
        const errorText = await createAccountResponse.text();
        console.log('❌ Ошибка создания:', errorText);
        
        if (createAccountResponse.status === 403) {
          console.log('🔄 Пробуем получить новое согласие...');
          const newConsentId = await createAccountConsent(bankId);
          
          if (newConsentId) {
            bankConfigs[bankId].consentId = newConsentId;
            
            return await createRealAccountWithConsent(bankId, accountData);
          }
        }
        
        throw new Error(`Создание счета: ${createAccountResponse.status}`);
      }

      const accountDataResponse = await createAccountResponse.json();
      console.log('✅ Счет создан через API:', accountDataResponse);

      const newAccount = {
        id: accountDataResponse.data?.accountId || `real-${Date.now()}`,
        name: accountData.customName || (accountData.accountType === 'savings' ? 'Накопительный счет' : 'Основной счет'),
        balance: Number(accountData.initialBalance) || 0,
        number: accountDataResponse.data?.accountNumber || `acc-${Date.now()}`,
        currency: 'RUB',
        bankName: bankId.toUpperCase(),
        type: accountData.accountType === 'savings' ? 'Накопления' : 'Личные',
        status: 'Active',
        isReal: true,
        createdVia: 'API'
      };

      setAccounts(prev => [...prev, newAccount]);

      if (accountData.initialBalance > 0) {
        const initialTransaction = {
          id: `initial-${Date.now()}`,
          date: new Date().toISOString(),
          amount: Number(accountData.initialBalance),
          description: 'Начальный баланс',
          category: 'Доход',
          bankId: bankId,
          isReal: true
        };
        setTransactions(prev => [initialTransaction, ...prev]);
      }

      return {
        success: true,
        message: `✅ Счет успешно создан в ${bankId.toUpperCase()} через банковское API!`,
        account: newAccount,
        createdVia: 'API'
      };

    } catch (err) {
      console.error('💥 Ошибка создания реального счета:', err);
      throw err;
    }
  };

  const createMockAccount = async (accountData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { bankName, accountType, initialBalance = 0, customName } = accountData;
        
        const newAccount = {
          id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: customName || (accountType === 'savings' ? 'Накопительный счет' : 
                accountType === 'business' ? 'Бизнес-счет' : 'Основной счет'),
          balance: Number(initialBalance) || 0,
          number: `40702${Math.floor(Math.random() * 10000000000)}`,
          currency: 'RUB',
          bankName: bankName.toUpperCase(),
          type: accountType === 'savings' ? 'Накопления' : 
                accountType === 'business' ? 'Бизнес' : 'Личные',
          status: 'Active',
          isCustom: true,
          createdVia: 'MOCK'
        };

        setAccounts(prev => [...prev, newAccount]);

        if (initialBalance > 0) {
          const initialTransaction = {
            id: `initial-${Date.now()}`,
            date: new Date().toISOString(),
            amount: Number(initialBalance),
            description: 'Начальный баланс',
            category: 'Доход',
            bankId: bankName.toLowerCase(),
            isReal: false
          };
          setTransactions(prev => [initialTransaction, ...prev]);
        }

        resolve({
          success: true,
          message: '✅ Счет создан (локальный режим)',
          account: newAccount,
          createdVia: 'MOCK'
        });
      }, 1000);
    });
  };

  const createAccount = async (accountData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { bankName } = accountData;
      
      if (bankName === 'abank' || bankName === 'sbank') {
        try {
          console.log('🔥 Пробуем создать счет через client_token...');
          const result = await createRealAccount(bankName, accountData);
          return result;
        } catch (apiError) {
          console.log('❌ API недоступно, используем локальное создание');
          return await createMockAccount(accountData);
        }
      }
      else if (bankName === 'vbank') {
        try {
          console.log('🔥 Пробуем создать счет в VBank через bank_token...');
          const result = await createRealAccountWithConsent(bankName, accountData);
          return result;
        } catch (apiError) {
          console.log('❌ API VBank недоступно, используем локальное создание');
          return await createMockAccount(accountData);
        }
      }
      // Для других банков - локальное создание
      else {
        console.log('📝 Создаем счет в локальном режиме для', bankName);
        return await createMockAccount(accountData);
      }

    } catch (err) {
      setError(err.message);
      throw err;
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

  const makeTransfer = async (transferData) => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      setError(null);

      setTimeout(() => {
        try {
          const { fromAccount, toAccount, amount, description = "Перевод через FinHelper" } = transferData;

          const fromAccountData = accounts.find((acc) => acc.number === fromAccount);
          if (!fromAccountData) {
            throw new Error("Счет отправителя не найден");
          }

          if (fromAccountData.balance < amount) {
            throw new Error("Недостаточно средств на счете");
          }

          setAccounts((prev) => prev.map((acc) => {
            if (acc.number === fromAccount) {
              return { ...acc, balance: acc.balance - amount };
            }
            if (acc.number === toAccount) {
              return { ...acc, balance: acc.balance + amount };
            }
            return acc;
          }));

          const mockTransaction = {
            id: `mock-${Date.now()}`,
            date: new Date().toISOString(),
            amount: -amount,
            description: `Перевод на счет ${toAccount}`,
            category: "Перевод",
            bankId: fromAccountData.bankName.toLowerCase(),
          };

          setTransactions((prev) => [mockTransaction, ...prev]);

          resolve({
            success: true,
            message: "✅ Перевод выполнен успешно!",
            transactionId: `mock-transaction-${Date.now()}`,
            amount: amount,
            fromAccount: fromAccount,
            toAccount: toAccount,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          setError(error.message);
          reject(error);
        } finally {
          setIsLoading(false);
        }
      }, 2000);
    });
  };

  const totalBalance = accounts.reduce((sum, account) => {
    const balance = Number(account.balance) || 0;
    return sum + balance;
  }, 0);

  const activatePremium = (days = 7) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    setIsPremium(true);
    setPremiumExpiry(expiryDate);

    localStorage.setItem("finhelper_premium", "true");
    localStorage.setItem("finhelper_premium_expiry", expiryDate.toISOString());

    console.log(`🎉 Премиум активирован на ${days} дней!`);
  };

  useEffect(() => {
    const savedPremium = localStorage.getItem("finhelper_premium");
    const savedExpiry = localStorage.getItem("finhelper_premium_expiry");

    if (savedPremium === "true" && savedExpiry) {
      const expiryDate = new Date(savedExpiry);
      if (expiryDate > new Date()) {
        setIsPremium(true);
        setPremiumExpiry(expiryDate);
      } else {
        localStorage.removeItem("finhelper_premium");
        localStorage.removeItem("finhelper_premium_expiry");
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
    createAccount,
  };
};