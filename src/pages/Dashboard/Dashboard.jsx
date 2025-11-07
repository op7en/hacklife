import React from 'react'
import './Dashboard.css';
import { useBanks } from '../../hooks/useBanks'
import BankConnection from '../../components/BankConnection/BankConnection';
import AccountsList from '../../components/AccountsList/AccountsList';
import TransactionsList from '../../components/TransactionsList/TransactionsList';
import PremiumBanner from '../../components/PremiumBanner/PremiumBanner';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import Footer from '../../components/Footer/Footer'
import Header from '../../components/Header/Header';
import TransferMoney from '../../components/TransferMoney/TransferMoney'

const Dashboard = () => {
  const { 
    connectedBanks, 
    accounts, 
    transactions, 
    totalBalance, 
    isLoading, 
    error, 
    isPremium,
    activatePremium,
    connectBank,
    refreshData,
    makeTransfer
  } = useBanks();
  return (
    <div className='dashboard'>
      <Header isPremium={isPremium}/>
      
      <main className="app-main">
        {error && (
          <ErrorMessage message={error} onRetry={refreshData} />
        )}

        {isLoading && <LoadingSpinner />}

        <PremiumBanner 
        isPremium={isPremium}
        onActivatePremium={activatePremium}
        />

        <BankConnection 
          connectedBanks={connectedBanks}
          onConnectBank={connectBank}
          onRefreshData={refreshData}
          isLoading={isLoading}
          error={error}
        />

        {!isLoading && accounts.length > 0 && (
          <>
            <AccountsList 
              accounts={accounts} 
              totalBalance={totalBalance} 
            />
          \    
    <TransferMoney 
      accounts={accounts}
      onTransfer={makeTransfer}
      isLoading={isLoading} // ← используем обычный isLoading
    />
            <TransactionsList 
              transactions={transactions} 
            />
          </>
        )}

        {!isLoading && connectedBanks.length === 0 && (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-icon">🏦</div>
              <h2>Подключите ваш первый банк</h2>
              <p>Начните с VBank чтобы увидеть все ваши счета и транзакции в одном месте</p>
              <button 
                onClick={() => connectBank('vbank')}
                className="welcome-button"
                disabled={isLoading}
              >
                {isLoading ? 'Подключение...' : 'Подключить VBank'}
              </button>
            </div>
          </div>
        )}
      </main>
      
      <Footer/>
    </div>
  )
}

export default Dashboard