// test-proxy.js
const testProxy = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    const data = await response.json();
    console.log('✅ Прокси работает:', data);
  } catch (error) {
    console.error('❌ Прокси не работает:', error);
  }
};

testProxy();