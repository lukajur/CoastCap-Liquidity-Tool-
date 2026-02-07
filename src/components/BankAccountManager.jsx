import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Landmark, AlertTriangle, Clock } from 'lucide-react';
import { formatCurrency, formatDate, convertToBaseCurrency } from '../utils/helpers';
import { generateId } from '../utils/helpers';

export default function BankAccountManager({
  bankAccounts,
  companies,
  currencies,
  exchangeRates,
  baseCurrency = 'EUR',
  onAdd,
  onUpdate,
  onUpdateBalance,
  onDelete,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [updateBalanceId, setUpdateBalanceId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Form state for new account
  const [newAccount, setNewAccount] = useState({
    companyId: '',
    accountName: '',
    currency: 'EUR',
    currentBalance: 0,
    bankName: '',
    iban: '',
    accountNumber: '',
    lowBalanceThreshold: 5000,
  });

  // Form state for editing
  const [editData, setEditData] = useState({});

  // Balance update state
  const [newBalance, setNewBalance] = useState('');
  const [balanceNotes, setBalanceNotes] = useState('');

  const handleAdd = async () => {
    if (!newAccount.companyId || !newAccount.accountName.trim()) return;

    const account = {
      id: generateId(),
      ...newAccount,
      accountName: newAccount.accountName.trim(),
      currentBalance: parseFloat(newAccount.currentBalance) || 0,
      lowBalanceThreshold: parseFloat(newAccount.lowBalanceThreshold) || 5000,
    };

    await onAdd(account);
    setNewAccount({
      companyId: '',
      accountName: '',
      currency: 'EUR',
      currentBalance: 0,
      bankName: '',
      iban: '',
      accountNumber: '',
      lowBalanceThreshold: 5000,
    });
    setShowAddForm(false);
  };

  const handleUpdate = async (id) => {
    if (!editData.accountName?.trim()) return;
    await onUpdate(id, {
      ...editData,
      currentBalance: parseFloat(editData.currentBalance) || 0,
      lowBalanceThreshold: parseFloat(editData.lowBalanceThreshold) || 5000,
    });
    setEditingId(null);
    setEditData({});
  };

  const handleUpdateBalance = async (id) => {
    const balance = parseFloat(newBalance);
    if (isNaN(balance)) return;
    await onUpdateBalance(id, balance, 'manual', null, balanceNotes || null);
    setUpdateBalanceId(null);
    setNewBalance('');
    setBalanceNotes('');
  };

  const handleDelete = async (id) => {
    await onDelete(id);
    setDeleteConfirmId(null);
  };

  const startEdit = (account) => {
    setEditingId(account.id);
    setEditData({ ...account });
  };

  const startUpdateBalance = (account) => {
    setUpdateBalanceId(account.id);
    setNewBalance(account.currentBalance.toString());
    setBalanceNotes('');
  };

  // Group accounts by company
  const accountsByCompany = companies.reduce((acc, company) => {
    acc[company.id] = bankAccounts.filter((a) => a.companyId === company.id);
    return acc;
  }, {});

  // Filter by selected company
  const displayCompanies = selectedCompanyId
    ? companies.filter((c) => c.id === selectedCompanyId)
    : companies;

  // Calculate totals
  const calculateCompanyTotal = (accounts) => {
    return accounts.reduce((total, account) => {
      if (account.status !== 'active') return total;
      const converted = convertToBaseCurrency(
        account.currentBalance,
        account.currency,
        baseCurrency,
        exchangeRates
      );
      return total + (converted !== null ? converted : account.currentBalance);
    }, 0);
  };

  const totalBalance = bankAccounts
    .filter((a) => a.status === 'active')
    .reduce((total, account) => {
      const converted = convertToBaseCurrency(
        account.currentBalance,
        account.currency,
        baseCurrency,
        exchangeRates
      );
      return total + (converted !== null ? converted : account.currentBalance);
    }, 0);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Landmark className="text-indigo-600" size={24} />
              Bank Account Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track balances across all company accounts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Add Account
            </button>
          </div>
        </div>

        {/* Total Balance Summary */}
        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">Total Balance (All Accounts)</p>
              <p className="text-2xl font-bold text-indigo-900">
                {formatCurrency(totalBalance, baseCurrency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {bankAccounts.filter((a) => a.status === 'active').length} active accounts
              </p>
              <p className="text-sm text-gray-500">
                across {new Set(bankAccounts.map((a) => a.companyId)).size} companies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-medium text-gray-900 mb-3">Add New Bank Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <select
                value={newAccount.companyId}
                onChange={(e) => setNewAccount({ ...newAccount, companyId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                value={newAccount.accountName}
                onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                placeholder="e.g., Operating Account"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={newAccount.currency}
                onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={newAccount.currentBalance}
                onChange={(e) => setNewAccount({ ...newAccount, currentBalance: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                placeholder="e.g., Deutsche Bank"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IBAN
              </label>
              <input
                type="text"
                value={newAccount.iban}
                onChange={(e) => setNewAccount({ ...newAccount, iban: e.target.value })}
                placeholder="DE89..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Balance Alert
              </label>
              <input
                type="number"
                step="100"
                value={newAccount.lowBalanceThreshold}
                onChange={(e) => setNewAccount({ ...newAccount, lowBalanceThreshold: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAdd}
                disabled={!newAccount.companyId || !newAccount.accountName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check size={18} />
                Save
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts List by Company */}
      <div className="divide-y">
        {displayCompanies.map((company) => {
          const accounts = accountsByCompany[company.id] || [];
          if (accounts.length === 0 && selectedCompanyId) return null;

          const companyTotal = calculateCompanyTotal(accounts);

          return (
            <div key={company.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{company.name}</h3>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Total: </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(companyTotal, baseCurrency)}
                  </span>
                </div>
              </div>

              {accounts.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No bank accounts added yet</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => {
                    const isLowBalance =
                      account.currentBalance < account.lowBalanceThreshold;
                    const isEditing = editingId === account.id;
                    const isUpdatingBalance = updateBalanceId === account.id;

                    if (isEditing) {
                      return (
                        <div
                          key={account.id}
                          className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <input
                              type="text"
                              value={editData.accountName}
                              onChange={(e) =>
                                setEditData({ ...editData, accountName: e.target.value })
                              }
                              className="rounded border border-gray-300 px-2 py-1 text-sm"
                              placeholder="Account Name"
                            />
                            <input
                              type="text"
                              value={editData.bankName || ''}
                              onChange={(e) =>
                                setEditData({ ...editData, bankName: e.target.value })
                              }
                              className="rounded border border-gray-300 px-2 py-1 text-sm"
                              placeholder="Bank Name"
                            />
                            <input
                              type="number"
                              value={editData.lowBalanceThreshold}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  lowBalanceThreshold: e.target.value,
                                })
                              }
                              className="rounded border border-gray-300 px-2 py-1 text-sm"
                              placeholder="Low Balance Alert"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdate(account.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditData({});
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (isUpdatingBalance) {
                      return (
                        <div
                          key={account.id}
                          className="p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Update balance for {account.accountName}
                          </p>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              step="0.01"
                              value={newBalance}
                              onChange={(e) => setNewBalance(e.target.value)}
                              className="w-40 rounded border border-gray-300 px-2 py-1 text-sm"
                              placeholder="New Balance"
                            />
                            <span className="text-sm text-gray-500">{account.currency}</span>
                            <input
                              type="text"
                              value={balanceNotes}
                              onChange={(e) => setBalanceNotes(e.target.value)}
                              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                              placeholder="Notes (optional)"
                            />
                            <button
                              onClick={() => handleUpdateBalance(account.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => {
                                setUpdateBalanceId(null);
                                setNewBalance('');
                                setBalanceNotes('');
                              }}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={account.id}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          isLowBalance
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {account.accountName}
                              </p>
                              {isLowBalance && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">
                                  <AlertTriangle size={12} />
                                  Low
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {account.bankName || 'No bank specified'}
                              {account.iban && ` - ${account.iban.slice(0, 8)}...`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p
                              className={`text-lg font-semibold ${
                                account.currentBalance >= 0
                                  ? 'text-green-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {formatCurrency(account.currentBalance, account.currency)}
                            </p>
                            {account.currency !== baseCurrency && (
                              <p className="text-xs text-gray-500">
                                {formatCurrency(
                                  convertToBaseCurrency(
                                    account.currentBalance,
                                    account.currency,
                                    baseCurrency,
                                    exchangeRates
                                  ) || account.currentBalance,
                                  baseCurrency
                                )}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                              <Clock size={10} />
                              {account.lastUpdated
                                ? formatDate(account.lastUpdated)
                                : 'Never updated'}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startUpdateBalance(account)}
                              className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-sm"
                              title="Update Balance"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => startEdit(account)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            {deleteConfirmId === account.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(account.id)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(account.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {bankAccounts.length === 0 && !showAddForm && (
        <div className="p-8 text-center text-gray-500">
          <Landmark className="mx-auto mb-3 text-gray-300" size={48} />
          <p>No bank accounts added yet.</p>
          <p className="text-sm mt-1">
            Add your first account to start tracking balances.
          </p>
        </div>
      )}
    </div>
  );
}
