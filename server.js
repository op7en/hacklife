const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/auth', async (req, res) => {
  try {
    console.log('🔐 Проксируем запрос авторизации...');
    
    const response = await fetch('https://vbank.open.bankingapi.ru/auth/bank_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        login: 'team003',
        password: 'WzuKQTQrmefPsCLAB8OtkP5gXjO38iBF'
      })
    });
    
    const data = await response.json();
    console.log('✅ Ответ от API:', data);
    
    res.json(data);
  } catch (error) {
    console.error('❌ Ошибка прокси:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/accounts', async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    const response = await fetch('https://vbank.open.bankingapi.ru/accounts', {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Прокси-сервер запущен на http://localhost:${PORT}`);
});


app.post('/api/payment-consent', async (req, res) => {
  try {
    console.log('🔐 Проксируем создание платежного согласия...');
    const { bankId, fromAccount, toAccount, amount, client_id } = req.body;
    
    const tokenResponse = await fetch(`https://${bankId}.open.bankingapi.ru/auth/bank-token?client_id=team003&client_secret=WzuKQTQrmefPsCLAB8OtkP5gXjO38iBF`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Токен: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const bankToken = tokenData.access_token;

    const consentResponse = await fetch(`https://${bankId}.open.bankingapi.ru/payment-consents/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${bankToken}`,
        'X-Requesting-Bank': 'team003'
      },
      body: JSON.stringify({
        "requesting_bank": "team003",
        "client_id": client_id,
        "consent_type": "single_use",
        "amount": amount,
        "currency": "RUB",
        "debtor_account": fromAccount,
        "creditor_account": toAccount,
        "creditor_name": "FinHelper Transfer",
        "reference": `transfer-${Date.now()}`,
        "max_uses": 1,
        "max_amount_per_payment": amount,
        "max_total_amount": amount,
        "valid_until": new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        "reason": "Перевод через FinHelper"
      })
    });

    console.log('📊 Статус от банка:', consentResponse.status);

    if (!consentResponse.ok) {
      const errorText = await consentResponse.text();
      throw new Error(`Банк: ${consentResponse.status} - ${errorText}`);
    }

    const consentData = await consentResponse.json();
    console.log('✅ Согласие от банка:', consentData);
    
    res.json(consentData);

  } catch (error) {
    console.error('❌ Ошибка прокси платежа:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payment', async (req, res) => {
  try {
    console.log('💸 Проксируем выполнение платежа...');
    const { bankId, consentId, fromAccount, toAccount, amount, description } = req.body;
    
    const tokenResponse = await fetch(`https://${bankId}.open.bankingapi.ru/auth/bank-token?client_id=team003&client_secret=WzuKQTQrmefPsCLAB8OtkP5gXjO38iBF`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const tokenData = await tokenResponse.json();
    const bankToken = tokenData.access_token;

    const paymentResponse = await fetch(`https://${bankId}.open.bankingapi.ru/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${bankToken}`,
        'X-Requesting-Bank': 'team003',
        'X-Consent-Id': consentId
      },
      body: JSON.stringify({
        "consent_id": consentId,
        "amount": amount,
        "currency": "RUB", 
        "debtor_account": fromAccount,
        "creditor_account": toAccount,
        "creditor_name": "FinHelper Transfer",
        "reference": `transfer-${Date.now()}`,
        "transaction_information": description
      })
    });

    console.log('📊 Статус платежа от банка:', paymentResponse.status);

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new Error(`Платеж: ${paymentResponse.status} - ${errorText}`);
    }

    const paymentData = await paymentResponse.json();
    console.log('✅ Платеж от банка:', paymentData);
    
    res.json(paymentData);

  } catch (error) {
    console.error('❌ Ошибка прокси платежа:', error);
    res.status(500).json({ error: error.message });
  }
});



