import { useState, useEffect } from 'react';
import { useCompanies, useCategories, useTransactions, useExchangeRates, useSettings, useCurrencies } from './hooks/useDatabase';
import { authApi } from './api';
import Navigation from './components/Navigation';
import CompanyManager from './components/CompanyManager';
import CategoryManager from './components/CategoryManager';
import PaymentForm from './components/PaymentForm';
import CalendarView from './components/CalendarView';
import TableView from './components/TableView';
import MonthlyForecast from './components/MonthlyForecast';
import PaymentModal from './components/PaymentModal';
import CurrencySettings from './components/CurrencySettings';
import Login from './components/Login';

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    authApi.status()
      .then((data) => {
        setIsAuthenticated(data.authenticated);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  const handleLogin = async (username, password) => {
    await authApi.login(username, password);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await authApi.logout();
    setIsAuthenticated(false);
  };

  const {
    companies,
    loading: companiesLoading,
    addCompany,
    updateCompany,
    deleteCompany,
  } = useCompanies(isAuthenticated);

  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories(isAuthenticated);

  const {
    transactions,
    loading: transactionsLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions(isAuthenticated);

  const {
    exchangeRates,
    loading: ratesLoading,
    refreshing: ratesRefreshing,
    refreshRates,
    upsertRate,
    refetch: refetchRates,
  } = useExchangeRates(isAuthenticated);

  const {
    settings,
    loading: settingsLoading,
    updateSettings,
  } = useSettings(isAuthenticated);

  const {
    currencies,
    loading: currenciesLoading,
    addCurrency,
    deleteCurrency,
    setDefaultCurrency,
  } = useCurrencies(isAuthenticated);

  const baseCurrency = settings.baseCurrency || 'EUR';

  const handleAddOrUpdatePayment = async (payment) => {
    const exists = transactions.find((p) => p.id === payment.id);
    if (exists) {
      await updateTransaction(payment.id, payment);
    } else {
      await addTransaction(payment);
    }
    setEditingPayment(null);
  };

  const handleDeletePayment = async (paymentId) => {
    await deleteTransaction(paymentId);
    setSelectedPayment(null);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setSelectedPayment(null);
    setActiveTab('payments');
  };

  const handleSelectPayment = (payment) => {
    setSelectedPayment(payment);
  };

  const selectedCompany = selectedPayment
    ? companies.find((c) => c.id === selectedPayment.companyId)
    : null;

  const selectedCategory = selectedPayment
    ? categories.find((c) => c.id === selectedPayment.categoryId)
    : null;

  // Show loading while checking auth
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const isLoading = companiesLoading || categoriesLoading || transactionsLoading || ratesLoading || settingsLoading || currenciesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'calendar' && (
          <CalendarView
            transactions={transactions}
            companies={companies}
            onSelectPayment={handleSelectPayment}
            baseCurrency={baseCurrency}
          />
        )}

        {activeTab === 'table' && (
          <TableView
            transactions={transactions}
            companies={companies}
            categories={categories}
            exchangeRates={exchangeRates}
            baseCurrency={baseCurrency}
            onEdit={handleEditPayment}
            onDelete={handleDeletePayment}
          />
        )}

        {activeTab === 'forecast' && (
          <MonthlyForecast
            transactions={transactions}
            exchangeRates={exchangeRates}
            baseCurrency={baseCurrency}
            currencies={currencies}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentForm
            companies={companies}
            categories={categories}
            currencies={currencies}
            onSubmit={handleAddOrUpdatePayment}
            editingPayment={editingPayment}
            onCancelEdit={() => setEditingPayment(null)}
          />
        )}

        {activeTab === 'companies' && (
          <CompanyManager
            companies={companies}
            onAdd={addCompany}
            onUpdate={updateCompany}
            onDelete={deleteCompany}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
          />
        )}

        {activeTab === 'currencies' && (
          <CurrencySettings
            currencies={currencies}
            exchangeRates={exchangeRates}
            settings={settings}
            onAddCurrency={addCurrency}
            onDeleteCurrency={deleteCurrency}
            onSetDefaultCurrency={setDefaultCurrency}
            onUpdateSettings={updateSettings}
            onRefreshRates={refreshRates}
            onUpsertRate={upsertRate}
            refreshing={ratesRefreshing}
          />
        )}
      </main>

      {selectedPayment && (
        <PaymentModal
          payment={selectedPayment}
          company={selectedCompany}
          category={selectedCategory}
          onClose={() => setSelectedPayment(null)}
          onEdit={handleEditPayment}
          onDelete={handleDeletePayment}
          exchangeRates={exchangeRates}
          baseCurrency={baseCurrency}
        />
      )}
    </div>
  );
}
