// services/bankingApi.js
const API_BASE_URL = 'https://open.bankingapi.ru/api/v1'; // уточните URL

class BankingApiService {
  constructor() {
    this.token = localStorage.getItem('bank_api_token');
  }

  async authenticate(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) throw new Error('Auth failed');
    const data = await response.json();
    this.token = data.access_token;
    return data;
  }

  async getAccounts() {
    return this.makeRequest('/accounts');
  }

  async getTransactions(accountId) {
    return this.makeRequest(`/accounts/${accountId}/transactions`);
  }

  async makeRequest(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }
}

export const bankingApi = new BankingApiService();