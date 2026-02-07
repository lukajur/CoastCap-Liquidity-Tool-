import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Landmark,
  Calendar,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  convertToBaseCurrency,
  getISOWeekNumber,
  getWeekStart,
  getWeekEnd,
  getCurrentWeekInfo,
} from '../utils/helpers';

export default function LiquidityDashboard({
  bankAccounts,
  transactions,
  companies,
  exchangeRates,
  baseCurrency = 'EUR',
}) {
  // Calculate current total balance
  const currentTotalBalance = useMemo(() => {
    return bankAccounts
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
  }, [bankAccounts, exchangeRates, baseCurrency]);

  // Calculate balances by company
  const balancesByCompany = useMemo(() => {
    return companies.map((company) => {
      const companyAccounts = bankAccounts.filter(
        (a) => a.companyId === company.id && a.status === 'active'
      );
      const balance = companyAccounts.reduce((total, account) => {
        const converted = convertToBaseCurrency(
          account.currentBalance,
          account.currency,
          baseCurrency,
          exchangeRates
        );
        return total + (converted !== null ? converted : account.currentBalance);
      }, 0);
      return { ...company, balance, accountCount: companyAccounts.length };
    });
  }, [companies, bankAccounts, exchangeRates, baseCurrency]);

  // Calculate projected balances for next 12 weeks
  const weeklyProjections = useMemo(() => {
    const { weekNumber: currentWeek, year: currentYear } = getCurrentWeekInfo();
    const projections = [];
    let runningBalance = currentTotalBalance;

    // Get all unpaid transactions
    const unpaidTransactions = transactions.filter(
      (t) => t.status !== 'paid' && t.status !== 'skipped'
    );

    for (let i = 0; i < 12; i++) {
      let weekNum = currentWeek + i;
      let year = currentYear;

      // Handle year overflow (simplified)
      if (weekNum > 52) {
        weekNum = weekNum - 52;
        year = currentYear + 1;
      }

      const weekStart = getWeekStart(weekNum, year);
      const weekEnd = getWeekEnd(weekNum, year);

      // Find transactions for this week
      const weekTransactions = unpaidTransactions.filter((t) => {
        const dueDate = new Date(t.dueDate);
        return dueDate >= weekStart && dueDate <= weekEnd;
      });

      const earnings = weekTransactions
        .filter((t) => t.type === 'earning')
        .reduce((sum, t) => {
          const converted = convertToBaseCurrency(
            t.amount,
            t.currency || 'EUR',
            baseCurrency,
            exchangeRates
          );
          return sum + (converted !== null ? converted : t.amount);
        }, 0);

      const payments = weekTransactions
        .filter((t) => t.type === 'payment' || !t.type)
        .reduce((sum, t) => {
          const converted = convertToBaseCurrency(
            t.amount,
            t.currency || 'EUR',
            baseCurrency,
            exchangeRates
          );
          return sum + (converted !== null ? converted : t.amount);
        }, 0);

      const netChange = earnings - payments;
      runningBalance = runningBalance + netChange;

      projections.push({
        week: weekNum,
        year,
        weekStart,
        weekEnd,
        earnings,
        payments,
        netChange,
        projectedBalance: runningBalance,
        transactionCount: weekTransactions.length,
        isCurrent: i === 0,
      });
    }

    return projections;
  }, [currentTotalBalance, transactions, exchangeRates, baseCurrency]);

  // Find weeks with negative balance
  const negativeWeeks = useMemo(() => {
    return weeklyProjections.filter((w) => w.projectedBalance < 0);
  }, [weeklyProjections]);

  // Find weeks with low balance (below threshold)
  const lowBalanceThreshold = 10000; // Could make this configurable
  const lowBalanceWeeks = useMemo(() => {
    return weeklyProjections.filter(
      (w) => w.projectedBalance >= 0 && w.projectedBalance < lowBalanceThreshold
    );
  }, [weeklyProjections]);

  // Get upcoming big transactions
  const upcomingBigPayments = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          (t.type === 'payment' || !t.type) &&
          t.status !== 'paid' &&
          t.status !== 'skipped'
      )
      .map((t) => ({
        ...t,
        convertedAmount: convertToBaseCurrency(
          t.amount,
          t.currency || 'EUR',
          baseCurrency,
          exchangeRates
        ) || t.amount,
      }))
      .sort((a, b) => b.convertedAmount - a.convertedAmount)
      .slice(0, 5);
  }, [transactions, exchangeRates, baseCurrency]);

  const upcomingBigEarnings = useMemo(() => {
    return transactions
      .filter(
        (t) => t.type === 'earning' && t.status !== 'paid' && t.status !== 'skipped'
      )
      .map((t) => ({
        ...t,
        convertedAmount: convertToBaseCurrency(
          t.amount,
          t.currency || 'EUR',
          baseCurrency,
          exchangeRates
        ) || t.amount,
      }))
      .sort((a, b) => b.convertedAmount - a.convertedAmount)
      .slice(0, 5);
  }, [transactions, exchangeRates, baseCurrency]);

  // Simple visual bar chart for weekly projections
  const maxBalance = useMemo(() => {
    const balances = weeklyProjections.map((w) => Math.abs(w.projectedBalance));
    return Math.max(...balances, 1);
  }, [weeklyProjections]);

  // Projected balance at specific points
  const projectedIn1Week = weeklyProjections[1]?.projectedBalance || currentTotalBalance;
  const projectedIn4Weeks = weeklyProjections[3]?.projectedBalance || currentTotalBalance;
  const projectedIn12Weeks = weeklyProjections[11]?.projectedBalance || currentTotalBalance;

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Balance */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Current Total Balance</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(currentTotalBalance, baseCurrency)}
              </p>
              <p className="text-indigo-200 text-xs mt-2">
                {bankAccounts.filter((a) => a.status === 'active').length} active accounts
              </p>
            </div>
            <Landmark className="text-indigo-200" size={48} />
          </div>
        </div>

        {/* Projected in 1 Week */}
        <div className="bg-white rounded-xl p-5 shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">In 1 Week</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  projectedIn1Week >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}
              >
                {formatCurrency(projectedIn1Week, baseCurrency)}
              </p>
              <p
                className={`text-xs mt-2 flex items-center gap-1 ${
                  projectedIn1Week >= currentTotalBalance
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {projectedIn1Week >= currentTotalBalance ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {formatCurrency(Math.abs(projectedIn1Week - currentTotalBalance), baseCurrency)}
              </p>
            </div>
            <Calendar className="text-gray-300" size={32} />
          </div>
        </div>

        {/* Projected in 1 Month */}
        <div className="bg-white rounded-xl p-5 shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">In 4 Weeks</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  projectedIn4Weeks >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}
              >
                {formatCurrency(projectedIn4Weeks, baseCurrency)}
              </p>
              <p
                className={`text-xs mt-2 flex items-center gap-1 ${
                  projectedIn4Weeks >= currentTotalBalance
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {projectedIn4Weeks >= currentTotalBalance ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {formatCurrency(Math.abs(projectedIn4Weeks - currentTotalBalance), baseCurrency)}
              </p>
            </div>
            <Calendar className="text-gray-300" size={32} />
          </div>
        </div>

        {/* Projected in 3 Months */}
        <div className="bg-white rounded-xl p-5 shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">In 12 Weeks</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  projectedIn12Weeks >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}
              >
                {formatCurrency(projectedIn12Weeks, baseCurrency)}
              </p>
              <p
                className={`text-xs mt-2 flex items-center gap-1 ${
                  projectedIn12Weeks >= currentTotalBalance
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {projectedIn12Weeks >= currentTotalBalance ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {formatCurrency(
                  Math.abs(projectedIn12Weeks - currentTotalBalance),
                  baseCurrency
                )}
              </p>
            </div>
            <Calendar className="text-gray-300" size={32} />
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(negativeWeeks.length > 0 || lowBalanceWeeks.length > 0) && (
        <div className="bg-white rounded-xl p-5 shadow border">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={20} />
            Balance Alerts
          </h3>
          <div className="space-y-3">
            {negativeWeeks.map((week) => (
              <div
                key={`${week.year}-${week.week}`}
                className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="text-red-600" size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-red-800">
                    Negative Balance in Week {week.week}
                  </p>
                  <p className="text-sm text-red-600">
                    Projected: {formatCurrency(week.projectedBalance, baseCurrency)} on{' '}
                    {formatDate(week.weekStart)}
                  </p>
                </div>
                <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-medium">
                  Critical
                </span>
              </div>
            ))}
            {lowBalanceWeeks.map((week) => (
              <div
                key={`${week.year}-${week.week}`}
                className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertTriangle className="text-yellow-600" size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-yellow-800">
                    Low Balance in Week {week.week}
                  </p>
                  <p className="text-sm text-yellow-600">
                    Projected: {formatCurrency(week.projectedBalance, baseCurrency)} (below{' '}
                    {formatCurrency(lowBalanceThreshold, baseCurrency)})
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                  Warning
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12-Week Projection Chart */}
      <div className="bg-white rounded-xl p-5 shadow border">
        <h3 className="font-semibold text-gray-900 mb-4">12-Week Balance Projection</h3>
        <div className="space-y-2">
          {weeklyProjections.map((week, index) => {
            const barWidth = Math.abs(week.projectedBalance) / maxBalance * 100;
            const isNegative = week.projectedBalance < 0;
            const isLow = week.projectedBalance >= 0 && week.projectedBalance < lowBalanceThreshold;

            return (
              <div key={`${week.year}-${week.week}`} className="flex items-center gap-3">
                <div className="w-20 text-right text-sm text-gray-600">
                  <span className={week.isCurrent ? 'font-bold text-indigo-600' : ''}>
                    W{week.week}
                  </span>
                </div>
                <div className="flex-1 h-8 bg-gray-100 rounded relative overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${
                      isNegative
                        ? 'bg-red-500'
                        : isLow
                        ? 'bg-yellow-400'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-2">
                    <span
                      className={`text-xs font-medium ${
                        barWidth > 30 ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {formatCurrency(week.projectedBalance, baseCurrency)}
                    </span>
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span
                    className={`text-xs ${
                      week.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {week.netChange >= 0 ? '+' : ''}
                    {formatCurrency(week.netChange, baseCurrency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-400" />
            <span>Low (below {formatCurrency(lowBalanceThreshold, baseCurrency)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Negative</span>
          </div>
        </div>
      </div>

      {/* Company Balances & Big Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance by Company */}
        <div className="bg-white rounded-xl p-5 shadow border">
          <h3 className="font-semibold text-gray-900 mb-4">Balance by Company</h3>
          <div className="space-y-3">
            {balancesByCompany
              .filter((c) => c.accountCount > 0)
              .sort((a, b) => b.balance - a.balance)
              .map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{company.name}</p>
                    <p className="text-xs text-gray-500">
                      {company.accountCount} account{company.accountCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        company.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(company.balance, baseCurrency)}
                    </p>
                  </div>
                </div>
              ))}
            {balancesByCompany.filter((c) => c.accountCount > 0).length === 0 && (
              <p className="text-gray-500 text-sm italic">
                No bank accounts configured yet
              </p>
            )}
          </div>
        </div>

        {/* Biggest Upcoming Payments */}
        <div className="bg-white rounded-xl p-5 shadow border">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowUpCircle className="text-red-500" size={20} />
            Biggest Upcoming Payments
          </h3>
          <div className="space-y-2">
            {upcomingBigPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{payment.payee}</p>
                  <p className="text-xs text-gray-500">{formatDate(payment.dueDate)}</p>
                </div>
                <span className="font-semibold text-red-600 text-sm">
                  -{formatCurrency(payment.convertedAmount, baseCurrency)}
                </span>
              </div>
            ))}
            {upcomingBigPayments.length === 0 && (
              <p className="text-gray-500 text-sm italic">No upcoming payments</p>
            )}
          </div>
        </div>

        {/* Biggest Upcoming Earnings */}
        <div className="bg-white rounded-xl p-5 shadow border">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowDownCircle className="text-green-500" size={20} />
            Biggest Upcoming Earnings
          </h3>
          <div className="space-y-2">
            {upcomingBigEarnings.map((earning) => (
              <div
                key={earning.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{earning.payee}</p>
                  <p className="text-xs text-gray-500">{formatDate(earning.dueDate)}</p>
                </div>
                <span className="font-semibold text-green-600 text-sm">
                  +{formatCurrency(earning.convertedAmount, baseCurrency)}
                </span>
              </div>
            ))}
            {upcomingBigEarnings.length === 0 && (
              <p className="text-gray-500 text-sm italic">No upcoming earnings</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Status */}
      {negativeWeeks.length === 0 && lowBalanceWeeks.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="font-semibold text-green-800">All Clear!</p>
              <p className="text-sm text-green-600">
                No balance warnings for the next 12 weeks. Your liquidity looks healthy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
