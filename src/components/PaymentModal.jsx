import { X, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getDaysUntilDue,
  getWeekNumber,
  convertToBaseCurrency,
} from '../utils/helpers';

export default function PaymentModal({
  payment,
  company,
  category,
  onClose,
  onEdit,
  onDelete,
  exchangeRates = [],
  baseCurrency = 'EUR',
}) {
  if (!payment) return null;

  const daysUntilDue = getDaysUntilDue(payment.dueDate);
  const weekNumber = getWeekNumber(payment.dueDate);
  const isEarning = payment.type === 'earning';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className={isEarning ? 'text-blue-600' : 'text-red-600'}>
              {isEarning ? <ArrowDownCircle size={24} /> : <ArrowUpCircle size={24} />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEarning ? 'Earning Details' : 'Payment Details'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-500">
              {isEarning ? 'Payer' : 'Payee'}
            </label>
            <p className="text-lg font-medium text-gray-900">{payment.payee}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Amount</label>
            <p className={`text-2xl font-bold ${isEarning ? 'text-blue-600' : 'text-red-600'}`}>
              {isEarning ? '+' : '-'}{formatCurrency(payment.amount, payment.currency || 'EUR')}
            </p>
            {payment.currency && payment.currency !== baseCurrency && (
              <p className="text-sm text-gray-500">
                ({formatCurrency(
                  convertToBaseCurrency(payment.amount, payment.currency, baseCurrency, exchangeRates) || payment.amount,
                  baseCurrency
                )})
              </p>
            )}
          </div>

          {payment.reference && (
            <div>
              <label className="text-sm text-gray-500">Reference</label>
              <p className="text-gray-900">{payment.reference}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">Due Date</label>
              <p className="text-gray-900">{formatDate(payment.dueDate)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Week</label>
              <p className="text-gray-900">{weekNumber}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Days Until Due</label>
              <p
                className={`font-medium ${
                  daysUntilDue < 0
                    ? 'text-red-600'
                    : daysUntilDue <= 7
                    ? 'text-yellow-600'
                    : 'text-gray-900'
                }`}
              >
                {daysUntilDue < 0
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : daysUntilDue === 0
                  ? 'Due today'
                  : `${daysUntilDue} days`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">Company</label>
              <p className="text-gray-900">{company?.name || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Category</label>
              {category ? (
                <span className="inline-block px-2 py-1 rounded text-sm font-medium bg-purple-100 text-purple-800">
                  {category.name}
                </span>
              ) : (
                <p className="text-gray-400">-</p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-500">Status</label>
              <span
                className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStatusColorForType(
                  payment.status,
                  payment.type
                )}`}
              >
                {getStatusLabelForType(payment.status, payment.type)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={() => onEdit(payment)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Pencil size={16} />
            Edit
          </button>
          <button
            onClick={() => onDelete(payment.id)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
