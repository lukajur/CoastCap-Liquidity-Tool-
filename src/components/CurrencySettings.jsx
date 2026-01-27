import { useState } from 'react';
import { RefreshCw, Plus, Trash2, Star, Key, Clock, AlertCircle, Check } from 'lucide-react';
import { generateId, formatCurrency } from '../utils/helpers';

export default function CurrencySettings({
  currencies,
  exchangeRates,
  settings,
  onAddCurrency,
  onDeleteCurrency,
  onSetDefaultCurrency,
  onUpdateSettings,
  onRefreshRates,
  onUpsertRate,
  refreshing,
}) {
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '' });
  const [apiKey, setApiKey] = useState(settings.exchangeRateApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [manualRate, setManualRate] = useState({ from: '', to: '', rate: '' });

  const baseCurrency = settings.baseCurrency || 'EUR';

  const handleAddCurrency = async (e) => {
    e.preventDefault();
    if (!newCurrency.code || !newCurrency.name) return;

    try {
      await onAddCurrency({
        code: newCurrency.code.toUpperCase(),
        name: newCurrency.name,
        symbol: newCurrency.symbol || newCurrency.code.toUpperCase(),
      });
      setNewCurrency({ code: '', name: '', symbol: '' });
      setSuccess('Currency added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteCurrency = async (code) => {
    if (code === baseCurrency) {
      setError('Cannot delete the base currency');
      setTimeout(() => setError(null), 5000);
      return;
    }
    if (!confirm(`Delete currency ${code}? This cannot be undone.`)) return;
    try {
      await onDeleteCurrency(code);
      setSuccess('Currency deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSetDefault = async (code) => {
    try {
      await onSetDefaultCurrency(code);
      setSuccess(`${code} is now the base currency`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      await onUpdateSettings({ exchangeRateApiKey: apiKey });
      setSuccess('API key saved');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRefreshRates = async () => {
    setError(null);
    try {
      const result = await onRefreshRates();
      setSuccess(`Exchange rates updated (${result.ratesUpdated} rates)`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleManualRate = async (e) => {
    e.preventDefault();
    if (!manualRate.from || !manualRate.to || !manualRate.rate) return;

    try {
      await onUpsertRate(manualRate.from, manualRate.to, parseFloat(manualRate.rate));
      // Also add the inverse rate
      await onUpsertRate(manualRate.to, manualRate.from, 1 / parseFloat(manualRate.rate));
      setManualRate({ from: '', to: '', rate: '' });
      setSuccess('Exchange rate updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700">
          <Check size={20} />
          {success}
        </div>
      )}

      {/* API Key Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key size={20} />
          Exchange Rate API Configuration
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure your API key from{' '}
          <a
            href="https://www.exchangerate-api.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            exchangerate-api.com
          </a>{' '}
          (free tier available with 1,500 requests/month).
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            onClick={handleSaveApiKey}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Key
          </button>
        </div>
      </div>

      {/* Exchange Rate Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={20} />
            Exchange Rates
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Last update: {formatLastUpdate(settings.lastRateUpdate)}
            </span>
            <button
              onClick={handleRefreshRates}
              disabled={refreshing || !apiKey}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Rates'}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Base currency: <strong>{baseCurrency}</strong>
        </div>

        {exchangeRates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">From</th>
                  <th className="px-4 py-2 text-left">To</th>
                  <th className="px-4 py-2 text-right">Rate</th>
                  <th className="px-4 py-2 text-right">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exchangeRates
                  .filter((r) => r.fromCurrency === baseCurrency)
                  .map((rate) => (
                    <tr key={`${rate.fromCurrency}-${rate.toCurrency}`}>
                      <td className="px-4 py-2">{rate.fromCurrency}</td>
                      <td className="px-4 py-2">{rate.toCurrency}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {rate.rate.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500">
                        1 {rate.fromCurrency} = {formatCurrency(rate.rate, rate.toCurrency)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No exchange rates available. Add an API key and click "Refresh Rates" to fetch current rates.
          </p>
        )}

        {/* Manual Rate Override */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Manual Rate Override</h3>
          <form onSubmit={handleManualRate} className="flex gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <select
                value={manualRate.from}
                onChange={(e) => setManualRate({ ...manualRate, from: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <select
                value={manualRate.to}
                onChange={(e) => setManualRate({ ...manualRate, to: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rate</label>
              <input
                type="number"
                step="0.0001"
                value={manualRate.rate}
                onChange={(e) => setManualRate({ ...manualRate, rate: e.target.value })}
                placeholder="1.0000"
                className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!manualRate.from || !manualRate.to || !manualRate.rate}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300"
            >
              Set Rate
            </button>
          </form>
        </div>
      </div>

      {/* Currency Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Currencies</h2>

        {/* Add Currency Form */}
        <form onSubmit={handleAddCurrency} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCurrency.code}
            onChange={(e) =>
              setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase().slice(0, 3) })
            }
            placeholder="Code (e.g., JPY)"
            maxLength={3}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
          />
          <input
            type="text"
            value={newCurrency.name}
            onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
            placeholder="Name (e.g., Japanese Yen)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={newCurrency.symbol}
            onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
            placeholder="Symbol (e.g., ¥)"
            className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!newCurrency.code || !newCurrency.name}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Plus size={18} />
            Add
          </button>
        </form>

        {/* Currency List */}
        <div className="space-y-2">
          {currencies.map((currency) => (
            <div
              key={currency.code}
              className={`flex items-center justify-between p-3 rounded-lg ${
                currency.code === baseCurrency ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-gray-900">{currency.code}</span>
                <span className="text-gray-600">{currency.name}</span>
                <span className="text-gray-400">({currency.symbol})</span>
                {currency.code === baseCurrency && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Base Currency
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currency.code !== baseCurrency && (
                  <>
                    <button
                      onClick={() => handleSetDefault(currency.code)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                      title="Set as base currency"
                    >
                      <Star size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCurrency(currency.code)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete currency"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
