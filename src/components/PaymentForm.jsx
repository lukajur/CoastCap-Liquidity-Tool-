import { useState, useEffect } from 'react';
import { Save, X, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { generateId, getFrequencyLabel } from '../utils/helpers';

const initialFormState = {
  type: 'payment',
  amount: '',
  currency: 'EUR',
  dueDate: '',
  companyId: '',
  payee: '',
  reference: '',
  categoryId: '',
  status: 'to_pay',
  isRecurring: false,
  frequency: 'monthly',
  endType: 'never',
  endDate: '',
  occurrencesCount: '',
};

export default function PaymentForm({
  companies,
  categories,
  currencies = [],
  onSubmit,
  onSubmitRecurring,
  editingPayment,
  onCancelEdit,
  templates = [],
}) {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [editMode, setEditMode] = useState(null);

  const isEditingRecurringInstance = editingPayment?.isRecurring && editingPayment?.recurringTemplateId;
  const template = isEditingRecurringInstance
    ? templates.find(t => t.id === editingPayment.recurringTemplateId)
    : null;

  useEffect(() => {
    if (editingPayment) {
      setForm({
        type: editingPayment.type || 'payment',
        amount: editingPayment.amount.toString(),
        currency: editingPayment.currency || 'EUR',
        dueDate: editingPayment.dueDate,
        companyId: editingPayment.companyId,
        payee: editingPayment.payee,
        reference: editingPayment.reference || '',
        categoryId: editingPayment.categoryId || '',
        status: editingPayment.status,
        isRecurring: false,
        frequency: 'monthly',
        endType: 'never',
        endDate: '',
        occurrencesCount: '',
      });
      setEditMode(null);
    } else {
      setForm(initialFormState);
      setEditMode(null);
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
    if (form.isRecurring && form.endType === 'date' && !form.endDate) {
      newErrors.endDate = 'Please select an end date';
    }
    if (form.isRecurring && form.endType === 'occurrences' && (!form.occurrencesCount || parseInt(form.occurrencesCount) < 1)) {
      newErrors.occurrencesCount = 'Please enter a valid number of occurrences';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (form.isRecurring && onSubmitRecurring) {
      const recurringTemplate = {
        id: generateId(),
        type: form.type,
        amount: parseFloat(form.amount),
        currency: form.currency,
        frequency: form.frequency,
        startDate: form.dueDate,
        endDate: form.endType === 'date' ? form.endDate : null,
        occurrencesCount: form.endType === 'occurrences' ? parseInt(form.occurrencesCount) : null,
        companyId: form.companyId,
        payee: form.payee.trim(),
        reference: form.reference.trim(),
        categoryId: form.categoryId,
        status: 'active',
      };
      onSubmitRecurring(recurringTemplate);
    } else {
      const payment = {
        id: editingPayment?.id || generateId(),
        type: form.type,
        amount: parseFloat(form.amount),
        currency: form.currency,
        dueDate: form.dueDate,
        companyId: form.companyId,
        payee: form.payee.trim(),
        reference: form.reference.trim(),
        categoryId: form.categoryId,
        status: form.status,
        isException: editMode === 'instance' ? true : editingPayment?.isException,
        recurringTemplateId: editingPayment?.recurringTemplateId,
        isRecurring: editingPayment?.isRecurring,
        occurrenceDate: editingPayment?.occurrenceDate,
      };
      onSubmit(payment, editMode);
    }
    setForm(initialFormState);
    setErrors({});
    setEditMode(null);
  };

  const handleCancel = () => {
    setForm(initialFormState);
    setErrors({});
    setEditMode(null);
    onCancelEdit?.();
  };

  const isEarning = form.type === 'earning';
  const isPaid = editingPayment?.status === 'paid';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingPayment ? 'Edit Entry' : 'Add New Entry'}
        </h2>

        {isEditingRecurringInstance && editMode === null && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={18} className="text-blue-600" />
              <span className="font-medium text-blue-900">
                This is part of a recurring series
              </span>
            </div>
            {template && (
              <p className="text-sm text-blue-700 mb-3">
                {template.payee} - {getFrequencyLabel(template.frequency)}
              </p>
            )}
            {isPaid ? (
              <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                This payment has already been processed and cannot be edited.
              </p>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode('instance')}
                  className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                >
                  Edit This Instance Only
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode('series')}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Entire Series
                </button>
              </div>
            )}
          </div>
        )}

        {isPaid && editingPayment ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              This payment has already been processed and cannot be modified.
            </p>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Go Back
            </button>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">
              No companies available. Please add a company first.
            </p>
          </div>
        ) : (isEditingRecurringInstance && editMode === null) ? null : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {editMode === 'series' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                Changes will apply to all future unpaid occurrences in this series.
              </div>
            )}
            {editMode === 'instance' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                This will create an exception for this occurrence only.
              </div>
            )}

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

            <div className="grid grid-cols-3 gap-4">
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
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.length > 0 ? (
                    currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CHF">CHF (CHF)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.isRecurring ? 'Start Date' : 'Due Date'}
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

            {/* Recurring Toggle - only show for new entries */}
            {!editingPayment && (
              <div className="border-t border-b py-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRecurring}
                    onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <RefreshCw size={18} className={form.isRecurring ? 'text-blue-600' : 'text-gray-400'} />
                    <span className={`font-medium ${form.isRecurring ? 'text-blue-700' : 'text-gray-700'}`}>
                      Make this a recurring {isEarning ? 'earning' : 'payment'}
                    </span>
                  </div>
                </label>

                {form.isRecurring && (
                  <div className="mt-4 pl-8 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        value={form.frequency}
                        onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Condition
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="endType"
                            value="never"
                            checked={form.endType === 'never'}
                            onChange={() => setForm({ ...form, endType: 'never', endDate: '', occurrencesCount: '' })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">No end date (ongoing)</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="endType"
                            value="date"
                            checked={form.endType === 'date'}
                            onChange={() => setForm({ ...form, endType: 'date', occurrencesCount: '' })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">End on date</span>
                          {form.endType === 'date' && (
                            <input
                              type="date"
                              value={form.endDate}
                              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                              className={`ml-2 rounded-lg border px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.endDate ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                          )}
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="endType"
                            value="occurrences"
                            checked={form.endType === 'occurrences'}
                            onChange={() => setForm({ ...form, endType: 'occurrences', endDate: '' })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">After</span>
                          {form.endType === 'occurrences' && (
                            <>
                              <input
                                type="number"
                                min="1"
                                value={form.occurrencesCount}
                                onChange={(e) => setForm({ ...form, occurrencesCount: e.target.value })}
                                className={`w-20 rounded-lg border px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors.occurrencesCount ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="12"
                              />
                              <span className="text-sm text-gray-700">occurrences</span>
                            </>
                          )}
                        </label>
                      </div>
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                      )}
                      {errors.occurrencesCount && (
                        <p className="mt-1 text-sm text-red-600">{errors.occurrencesCount}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {!form.isRecurring && (
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
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className={`flex items-center gap-2 text-white px-6 py-2 rounded-lg transition-colors ${
                  isEarning
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {form.isRecurring ? <RefreshCw size={18} /> : <Save size={18} />}
                {editingPayment
                  ? (editMode === 'series' ? 'Update Series' : 'Update Entry')
                  : form.isRecurring
                    ? `Create Recurring ${isEarning ? 'Earning' : 'Payment'}`
                    : isEarning ? 'Add Earning' : 'Add Payment'}
              </button>
              {(editingPayment || editMode) && (
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
