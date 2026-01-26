import { useState, useEffect } from 'react';
import { Save, X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { generateId } from '../utils/helpers';

const initialFormState = {
  type: 'payment',
  amount: '',
  dueDate: '',
  companyId: '',
  payee: '',
  reference: '',
  categoryId: '',
  status: 'to_pay',
};

export default function PaymentForm({
  companies,
  categories,
  onSubmit,
  editingPayment,
  onCancelEdit,
}) {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingPayment) {
      setForm({
        type: editingPayment.type || 'payment',
        amount: editingPayment.amount.toString(),
        dueDate: editingPayment.dueDate,
        companyId: editingPayment.companyId,
        payee: editingPayment.payee,
        reference: editingPayment.reference || '',
        categoryId: editingPayment.categoryId || '',
        status: editingPayment.status,
      });
    } else {
      setForm(initialFormState);
    }
  }, [editingPayment]);

  const validate = () => {
    const newErrors = {};
    if (!form.amount || parseFloat(form.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!form.dueDate) {
      newErrors.dueDate = 'Please select a due date';
    }
    if (!form.companyId) {
      newErrors.companyId = 'Please select a company';
    }
    if (!form.payee.trim()) {
      newErrors.payee = 'Please enter a payee name';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payment = {
      id: editingPayment?.id || generateId(),
      type: form.type,
      amount: parseFloat(form.amount),
      dueDate: form.dueDate,
      companyId: form.companyId,
      payee: form.payee.trim(),
      reference: form.reference.trim(),
      categoryId: form.categoryId,
      status: form.status,
    };

    onSubmit(payment);
    setForm(initialFormState);
    setErrors({});
  };

  const handleCancel = () => {
    setForm(initialFormState);
    setErrors({});
    onCancelEdit?.();
  };

  const isEarning = form.type === 'earning';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingPayment ? 'Edit Entry' : 'Add New Entry'}
        </h2>

        {companies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">
              No companies available. Please add a company first.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'payment' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                    !isEarning
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ArrowUpCircle size={20} />
                  <span className="font-medium">Payment (Outgoing)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'earning' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                    isEarning
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ArrowDownCircle size={20} />
                  <span className="font-medium">Earning (Incoming)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dueDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  value={form.companyId}
                  onChange={(e) =>
                    setForm({ ...form, companyId: e.target.value })
                  }
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.companyId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.companyId && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEarning ? 'Payer Name' : 'Payee Name'}
              </label>
              <input
                type="text"
                value={form.payee}
                onChange={(e) => setForm({ ...form, payee: e.target.value })}
                placeholder={isEarning ? 'Who is paying you?' : 'Who are you paying?'}
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.payee ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.payee && (
                <p className="mt-1 text-sm text-red-600">{errors.payee}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference / Description
              </label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="What is this for?"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="to_pay">{isEarning ? 'Expected' : 'To Pay'}</option>
                <option value="postponed">Postponed</option>
                <option value="paid">{isEarning ? 'Received' : 'Paid'}</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className={`flex items-center gap-2 text-white px-6 py-2 rounded-lg transition-colors ${
                  isEarning
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <Save size={18} />
                {editingPayment ? 'Update Entry' : isEarning ? 'Add Earning' : 'Add Payment'}
              </button>
              {editingPayment && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X size={18} />
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
