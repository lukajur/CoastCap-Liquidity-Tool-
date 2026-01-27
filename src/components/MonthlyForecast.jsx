import { useState, useMemo } from 'react';
import { formatCurrency, convertToBaseCurrency } from '../utils/helpers';

export default function MonthlyForecast({
  transactions,
  exchangeRates = [],
  baseCurrency = 'EUR',
  currencies = [],
}) {
  const [viewCurrency, setViewCurrency] = useState(baseCurrency);
  // Helper to convert amount to view currency
  const toViewCurrency = (amount, fromCurrency) => {
    if (fromCurrency === viewCurrency) return amount;

    // First convert to base currency if needed
    let baseAmount = amount;
    if (fromCurrency !== baseCurrency) {
      const converted = convertToBaseCurrency(amount, fromCurrency, baseCurrency, exchangeRates);
      baseAmount = converted !== null ? converted : amount;
    }

    // Then convert from base currency to view currency
    if (viewCurrency === baseCurrency) return baseAmount;

    const rate = exchangeRates.find(
      (r) => r.fromCurrency === baseCurrency && r.toCurrency === viewCurrency
    );
    return rate ? baseAmount * rate.rate : baseAmount;
  };

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];

    // Generate 13 months (current + next 12)
    for (let i = 0; i < 13; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        earnings: 0,
        payments: 0,
      });
    }

    // Aggregate transactions by month, converting to view currency
    transactions.forEach((t) => {
      const date = new Date(t.dueDate);
      const monthIndex = months.findIndex(
        (m) => m.year === date.getFullYear() && m.month === date.getMonth()
      );
      if (monthIndex !== -1) {
        const convertedAmount = toViewCurrency(t.amount, t.currency || 'EUR');
        if (t.type === 'earning') {
          months[monthIndex].earnings += convertedAmount;
        } else {
          months[monthIndex].payments += convertedAmount;
        }
      }
    });

    // Calculate net flow and running balance
    let runningBalance = 0;
    return months.map((m) => {
      const netFlow = m.earnings - m.payments;
      runningBalance += netFlow;
      return {
        ...m,
        netFlow,
        runningBalance,
      };
    });
  }, [transactions, exchangeRates, viewCurrency, baseCurrency]);

  const maxAmount = useMemo(() => {
    return Math.max(
      ...monthlyData.map((m) => Math.max(m.earnings, m.payments, Math.abs(m.netFlow)))
    ) || 1;
  }, [monthlyData]);

  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => ({
        earnings: acc.earnings + m.earnings,
        payments: acc.payments + m.payments,
        netFlow: acc.netFlow + m.netFlow,
      }),
      { earnings: 0, payments: 0, netFlow: 0 }
    );
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* Currency Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Liquidity Forecast</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">View in:</label>
            <select
              value={viewCurrency}
              onChange={(e) => setViewCurrency(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.length > 0 ? (
                currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Expected Earnings ({viewCurrency})</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(totals.earnings, viewCurrency)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Expected Payments ({viewCurrency})</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totals.payments, viewCurrency)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Net Cash Flow ({viewCurrency})</p>
          <p className={`text-2xl font-bold ${totals.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totals.netFlow, viewCurrency)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Final Balance ({viewCurrency})</p>
          <p className={`text-2xl font-bold ${monthlyData[monthlyData.length - 1]?.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(monthlyData[monthlyData.length - 1]?.runningBalance || 0, viewCurrency)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Chart</h2>
        <div className="space-y-3">
          {monthlyData.map((month, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-20 text-sm font-medium text-gray-600 shrink-0">
                {month.label}
              </div>
              <div className="flex-1 flex items-center gap-2">
                {/* Earnings bar */}
                <div className="flex-1 h-6 bg-gray-100 rounded relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-blue-500 rounded"
                    style={{ width: `${(month.earnings / maxAmount) * 100}%` }}
                  />
                  {month.earnings > 0 && (
                    <span className="absolute left-2 top-0 h-full flex items-center text-xs text-white font-medium">
                      +{formatCurrency(month.earnings, viewCurrency)}
                    </span>
                  )}
                </div>
                {/* Payments bar */}
                <div className="flex-1 h-6 bg-gray-100 rounded relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-red-500 rounded"
                    style={{ width: `${(month.payments / maxAmount) * 100}%` }}
                  />
                  {month.payments > 0 && (
                    <span className="absolute left-2 top-0 h-full flex items-center text-xs text-white font-medium">
                      -{formatCurrency(month.payments, viewCurrency)}
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-28 text-right text-sm font-medium shrink-0 ${
                month.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {month.netFlow >= 0 ? '+' : ''}{formatCurrency(month.netFlow, viewCurrency)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Earnings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Payments</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Month</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Earnings</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Payments</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Net Flow</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Cumulative Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthlyData.map((month, idx) => (
                <tr key={idx} className={idx === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {month.label}
                    {idx === 0 && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">
                    {month.earnings > 0 ? formatCurrency(month.earnings, viewCurrency) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                    {month.payments > 0 ? formatCurrency(month.payments, viewCurrency) : '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${
                    month.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {month.netFlow >= 0 ? '+' : ''}{formatCurrency(month.netFlow, viewCurrency)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${
                    month.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(month.runningBalance, viewCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2">
              <tr>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">Total (13 months)</td>
                <td className="px-4 py-3 text-sm text-right text-blue-600 font-bold">
                  {formatCurrency(totals.earnings, viewCurrency)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-red-600 font-bold">
                  {formatCurrency(totals.payments, viewCurrency)}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-bold ${
                  totals.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totals.netFlow >= 0 ? '+' : ''}{formatCurrency(totals.netFlow, viewCurrency)}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
