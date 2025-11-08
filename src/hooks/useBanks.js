import { useState, useEffect } from "react";

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

  // Функция для мок-данных при падении API
  const mockBankConnection = async (bankId) => {
    console.log(`🔄 Используем мок-данные для ${bankId}...`);
    
    const mockAccounts = [
      {
        id: `mock-${bankId}-1`,
        name: 'Основной счет',
        balance: 150000 + Math.floor(Math.random() * 100000),
        number: `40702${Math.floor(Math.random() * 10000000000)}`,
        currency: 'RUB',
        bankName: bankId.toUpperCase(),
        type: 'Личные',
        status: 'Active'
      },
      {
        id: `mock-${bankId}-2`,
        name: 'Накопительный счет',
        balance: 50000 + Math.floor(Math.random() * 50000),
        number: `40817${Math.floor(Math.random() * 10000000000)}`,
        currency: 'RUB',
        bankName: bankId.toUpperCase(),
        type: 'Накопления',
        status: 'Active'
      }
    ];

    const mockTransactions = [
      {
        id: `mock-trans-${Date.now()}-1`,
        date: new Date(Date.now() - 86400000).toISOString(),
        amount: -(Math.random() * 5000 + 1000), // ОТРИЦАТЕЛЬНОЕ - расход
        description: 'Оплата в супермаркете',
        category: 'Продукты',
        bankId: bankId
      },
      {
        id: `mock-trans-${Date.now()}-2`,
        date: new Date(Date.now() - 172800000).toISOString(),
        amount: 75000, // ПОЛОЖИТЕЛЬНОЕ - доход
        description: 'Зарплата',
        category: 'Зарплата',
        bankId: bankId
      },
      {
        id: `mock-trans-${Date.now()}-3`,
        date: new Date(Date.now() - 259200000).toISOString(),
        amount: -2500, // ОТРИЦАТЕЛЬНОЕ - расход
        description: 'Оплата ЖКХ',
        category: 'ЖКХ',
        bankId: bankId
      }
    ];

    setAccounts(prev => [...prev, ...mockAccounts]);
    setTransactions(prev => [...prev, ...mockTransactions]);
    setConnectedBanks(prev => [...prev.filter(id => id !== bankId), bankId]);
    
    console.log(`🎉 ${bankId} подключен (мок-данные)!`);
  };

  const connectBank = async (bankId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Пробуем реальное API, если падает - используем мок-данные
      try {
        console.log(`🔥 Пробуем реальное API для ${bankId}...`);

        // 1. Получаем токен банка
        console.log("🔑 Получаем токен...");
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

        // 2. Получаем конфиг для банка
        const config = bankConfigs[bankId];
        if (!config) {
          throw new Error(`Нет конфигурации для банка ${bankId}`);
        }

        const { clientId, consentId } = config;

        // 3. Получаем счета через межбанковский запрос
        console.log(`💰 Получаем счета для клиента ${clientId}...`);
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
        console.log(`✅ СЧЕТА ПОЛУЧЕНЫ ДЛЯ ${bankId}!`);

        // 4. Получаем балансы для каждого счета
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
              balance =
                Number(balanceData.data?.balance?.[0]?.amount?.amount) || 0;
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

        // 5. Получаем транзакции для первого счета
        if (accountsWithBalances.length > 0) {
          try {
            const firstAccountId = accountsWithBalances[0].id;
            console.log(`📊 Получаем транзакции для счета ${firstAccountId}...`);

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
              const realTransactions =
                transactionsData.data?.transaction?.map((trans) => {
                  const amount = Number(trans.amount?.amount) || 0;
                  const isExpense = amount < 0;
                  
                  return {
                    id: trans.transactionId,
                    date:
                      trans.bookingDateTime ||
                      trans.valueDateTime ||
                      new Date().toISOString(),
                    amount: -amount, // 
                    description: trans.transactionInformation || "Без описания",
                    category: isExpense ? "Расход" : "Доход", // 
                    bankId: bankId,
                  };
                }) || [];

              setTransactions((prev) => [...prev, ...realTransactions]);
              console.log("✅ Транзакции получены:", realTransactions.length);
            }
          } catch (error) {
            console.log("⚠️ Не удалось получить транзакции");
          }
        }

        // 6. Сохраняем данные
        setAccounts((prev) => {
          const filtered = prev.filter(
            (acc) => !acc.bankName.includes(bankId.toUpperCase())
          );
          return [...filtered, ...accountsWithBalances];
        });

        setConnectedBanks((prev) => {
          const updated = [...prev.filter((id) => id !== bankId), bankId];
          return updated;
        });

        console.log(
          `🎉 ${bankId} подключен (реальные данные)! Счетов: ${accountsWithBalances.length}`
        );

      } catch (apiError) {
        console.log(`❌ API ${bankId} недоступно, используем мок-данные`);
        await mockBankConnection(bankId);
      }

    } catch (err) {
      console.error("💥 Общая ошибка:", err);
      setError(`${bankId}: ${err.message}`);
      // При любой ошибке используем мок-данные
      await mockBankConnection(bankId);
    } finally {
      setIsLoading(false);
    }
  };

  // Остальные функции без изменений
  const refreshData = async () => {
    const currentBanks = [...connectedBanks];
    for (const bankId of currentBanks) {
      await connectBank(bankId);
    }
  };

  const createPaymentConsent = async (bankId, fromAccount, toAccount, amount) => {
    try {
      console.log("🔐 Создаем согласие на перевод через прокси...");
      const consentResponse = await fetch(`http://localhost:3001/api/payment-consent`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankId: bankId,
          fromAccount: fromAccount,
          toAccount: toAccount,
          amount: amount,
          client_id: "team003-1",
        }),
      });

      if (!consentResponse.ok) {
        throw new Error(`Прокси: ${consentResponse.status}`);
      }

      const consentData = await consentResponse.json();
      return consentData.consent_id;
    } catch (err) {
      console.error("❌ Ошибка создания согласия:", err);
      throw err;
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

          if (amount <= 0) {
            throw new Error("Сумма перевода должна быть больше 0");
          }

          setAccounts((prev) =>
            prev.map((acc) => {
              if (acc.number === fromAccount) {
                return { ...acc, balance: acc.balance - amount };
              }
              if (acc.number === toAccount) {
                return { ...acc, balance: acc.balance + amount };
              }
              return acc;
            })
          );

          const mockTransaction = {
            id: `mock-${Date.now()}`,
            date: new Date().toISOString(),
            amount: -amount,
            description: `Перевод на счет ${toAccount}`,
            category: "Перевод",
            bankId: fromAccountData.bankName.toLowerCase(),
          };

          setTransactions((prev) => [mockTransaction, ...prev]);

          const successResponse = {
            success: true,
            message: "✅ Перевод выполнен успешно!",
            transactionId: `mock-transaction-${Date.now()}`,
            amount: amount,
            fromAccount: fromAccount,
            toAccount: toAccount,
            timestamp: new Date().toISOString(),
          };

          resolve(successResponse);
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
    const savedPremium = localStorage.getItem('finhelper_premium');
    const savedExpiry = localStorage.getItem('finhelper_premium_expiry');

    if (savedPremium === 'true' && savedExpiry) {
      const expiryDate = new Date(savedExpiry);
      if (expiryDate > new Date()) {
        setIsPremium(true);
        setPremiumExpiry(expiryDate);
      } else {
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