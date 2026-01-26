import { useState, useMemo } from 'react';
import { ArrowUpDown, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getDaysUntilDue,
  getStatusColor,
  getStatusLabel,
  getWeekNumber,
} from '../utils/helpers';

export default function TableView({
  transactions,
  companies,
  categories,
  onEdit,
  onDelete,
}) {
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (selectedCompanyId) {
      filtered = filtered.filter((p) => p.companyId === selectedCompanyId);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((p) => (p.type || 'payment') === filterType);
    }

    return [...filtered].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'type':
          aVal = a.type || 'payment';
          bVal = b.type || 'payment';
          break;
        case 'dueDate':
          aVal = new Date(a.dueDate);
          bVal = new Date(b.dueDate);
          break;
        case 'weekNumber':
          aVal = getWeekNumber(a.dueDate);
          bVal = getWeekNumber(b.dueDate);
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'payee':
          aVal = a.payee.toLowerCase();
          bVal = b.payee.toLowerCase();
          break;
        case 'reference':
          aVal = (a.reference || '').toLowerCase();
          bVal = (b.reference || '').toLowerCase();
          break;
        case 'category':
          const catA = categories.find((c) => c.id === a.categoryId);
          const catB = categories.find((c) => c.id === b.categoryId);
          aVal = (catA?.name || '').toLowerCase();
          bVal = (catB?.name || '').toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'daysUntilDue':
          aVal = getDaysUntilDue(a.dueDate);
          bVal = getDaysUntilDue(b.dueDate);
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, companies, categories, selectedCompanyId, filterType, sortField, sortDirection]);

  const summary = useMemo(() => {
    const unpaidPayments = filteredTransactions.filter(
      (p) => (p.type || 'payment') === 'payment' && p.status !== 'paid'
    );
    const unpaidEarnings = filteredTransactions.filter(
      (p) => p.type === 'earning' && p.status !== 'paid'
    );
    const totalPayments = unpaidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalEarnings = unpaidEarnings.reduce((sum, p) => sum + p.amount, 0);
    const overdue = unpaidPayments.filter((p) => getDaysUntilDue(p.dueDate) < 0);
    const overdueAmount = overdue.reduce((sum, p) => sum + p.amount, 0);
    return { totalPayments, totalEarnings, overdueAmount, overdueCount: overdue.length };
  }, [filteredTransactions]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortHeader = ({ field, children }) => (
    <th
      className="px-3 py-3 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          size={12}
          className={sortField === field ? 'text-blue-600' : 'text-gray-400'}
        />
      </div>
    </th>
  );

  const getTypeColor = (type) => {
    return type === 'earning' ? 'text-blue-600' : 'text-red-600';
  };

  const getStatusColorForType = (status, type) => {
    if (type === 'earning') {
      switch (status) {
        case 'to_pay':
          return 'bg-blue-100 text-blue-800';
        case 'postponed':
          return 'bg-blue-50 text-blue-600';
        case 'paid':
          return 'bg-blue-200 text-blue-900';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
    return getStatusColor(status);
  };

  const getStatusLabelForType = (status, type) => {
    if (type === 'earning') {
      switch (status) {
        case 'to_pay':
          return 'Expected';
        case 'paid':
          return 'Received';
        default:
          return getStatusLabel(status);
      }
    }
    return getStatusLabel(status);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Transaction Table
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="payment">Payments Only</option>
              <option value="earning">Earnings Only</option>
            </select>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-600">Expected Earnings</p>
            <p className="text-xl font-bold text-blue-900">
              {formatCurrency(summary.totalEarnings)}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-sm text-red-600">Upcoming Payments</p>
            <p className="text-xl font-bold text-red-900">
              {formatCurrency(summary.totalPayments)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-600">Net Position</p>
            <p className={`text-xl font-bold ${
              summary.totalEarnings - summary.totalPayments >= 0
                ? 'text-green-900'
                : 'text-red-900'
            }`}>
              {formatCurrency(summary.totalEarnings - summary.totalPayments)}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-sm text-yellow-600">Overdue ({summary.overdueCount})</p>
            <p className="text-xl font-bold text-yellow-900">
              {formatCurrency(summary.overdueAmount)}
            </p>
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          {selectedCompanyId || filterType !== 'all'
            ? 'No transactions found matching filters.'
            : 'No transactions added yet.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <SortHeader field="type">Type</SortHeader>
                <SortHeader field="weekNumber">Week</SortHeader>
                <SortHeader field="dueDate">Due Date</SortHeader>
                <SortHeader field="payee">Payee/Payer</SortHeader>
                <SortHeader field="reference">Reference</SortHeader>
                <SortHeader field="category">Category</SortHeader>
                <SortHeader field="amount">Amount</SortHeader>
                <SortHeader field="status">Status</SortHeader>
                <SortHeader field="daysUntilDue">Days</SortHeader>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const daysUntilDue = getDaysUntilDue(transaction.dueDate);
                const weekNumber = getWeekNumber(transaction.dueDate);
                const company = companies.find(
                  (c) => c.id === transaction.companyId
                );
                const category = categories.find(
                  (c) => c.id === transaction.categoryId
                );
                const type = transaction.type || 'payment';
                const isEarning = type === 'earning';

                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className={`flex items-center gap-1 ${getTypeColor(type)}`}>
                        {isEarning ? (
                          <ArrowDownCircle size={16} />
                        ) : (
                          <ArrowUpCircle size={16} />
                        )}
                        <span className="text-xs font-medium">
                          {isEarning ? 'IN' : 'OUT'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {weekNumber}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDate(transaction.dueDate)}
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.payee}
                        </p>
                        <p className="text-xs text-gray-500">
                          {company?.name || 'Unknown'}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {transaction.reference || '-'}
                    </td>
                    <td className="px-3 py-3">
                      {category ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {category.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className={`px-3 py-3 text-sm font-medium whitespace-nowrap ${getTypeColor(type)}`}>
                      {isEarning ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColorForType(
                          transaction.status,
                          type
                        )}`}
                      >
                        {getStatusLabelForType(transaction.status, type)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`text-sm font-medium ${
                          daysUntilDue < 0
                            ? 'text-red-600'
                            : daysUntilDue <= 7
                            ? 'text-yellow-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {daysUntilDue < 0
                          ? `${Math.abs(daysUntilDue)} overdue`
                          : daysUntilDue === 0
                          ? 'Today'
                          : `${daysUntilDue}d`}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit(transaction)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(transaction.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
