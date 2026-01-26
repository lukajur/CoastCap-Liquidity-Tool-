import { useState } from 'react';
import { useCompanies, useCategories, useTransactions } from './hooks/useDatabase';
import Navigation from './components/Navigation';
import CompanyManager from './components/CompanyManager';
import CategoryManager from './components/CategoryManager';
import PaymentForm from './components/PaymentForm';
import CalendarView from './components/CalendarView';
import TableView from './components/TableView';
import MonthlyForecast from './components/MonthlyForecast';
import PaymentModal from './components/PaymentModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  const {
    companies,
    loading: companiesLoading,
    addCompany,
    updateCompany,
    deleteCompany,
  } = useCompanies();

  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const {
    transactions,
    loading: transactionsLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

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

  const isLoading = companiesLoading || categoriesLoading || transactionsLoading;

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
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'calendar' && (
          <CalendarView
            transactions={transactions}
            companies={companies}
            onSelectPayment={handleSelectPayment}
          />
        )}

        {activeTab === 'table' && (
          <TableView
            transactions={transactions}
            companies={companies}
            categories={categories}
            onEdit={handleEditPayment}
            onDelete={handleDeletePayment}
          />
        )}

        {activeTab === 'forecast' && (
          <MonthlyForecast transactions={transactions} />
        )}

        {activeTab === 'payments' && (
          <PaymentForm
            companies={companies}
            categories={categories}
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
      </main>

      {selectedPayment && (
        <PaymentModal
          payment={selectedPayment}
          company={selectedCompany}
          category={selectedCategory}
          onClose={() => setSelectedPayment(null)}
          onEdit={handleEditPayment}
          onDelete={handleDeletePayment}
        />
      )}
    </div>
  );
}
