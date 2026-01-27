export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getWeekNumber(dateString) {
  const date = new Date(dateString);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

// Currency locale mapping for proper formatting
const currencyLocales = {
  EUR: 'de-DE',
  USD: 'en-US',
  GBP: 'en-GB',
  CHF: 'de-CH',
};

export function formatCurrency(amount, currency = 'EUR') {
  const locale = currencyLocales[currency] || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatCurrencyWithEquivalent(amount, currency, baseCurrency, convertedAmount) {
  const original = formatCurrency(amount, currency);
  if (currency === baseCurrency || convertedAmount === null || convertedAmount === undefined) {
    return original;
  }
  const equivalent = formatCurrency(convertedAmount, baseCurrency);
  return `${original} (${equivalent})`;
}

export function convertToBaseCurrency(amount, fromCurrency, baseCurrency, exchangeRates) {
  if (fromCurrency === baseCurrency) return amount;
  const rate = exchangeRates.find(
    (r) => r.fromCurrency === fromCurrency && r.toCurrency === baseCurrency
  );
  if (!rate) return null;
  return amount * rate.rate;
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getDaysUntilDue(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getStatusColor(status) {
  switch (status) {
    case 'to_pay':
      return 'bg-red-100 text-red-800';
    case 'postponed':
      return 'bg-yellow-100 text-yellow-800';
    case 'paid':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case 'to_pay':
      return 'To Pay';
    case 'postponed':
      return 'Postponed';
    case 'paid':
      return 'Paid';
    case 'skipped':
      return 'Skipped';
    default:
      return status;
  }
}

// Recurring payment helpers
export function getFrequencyLabel(frequency) {
  switch (frequency) {
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'yearly':
      return 'Yearly';
    default:
      return frequency;
  }
}

export function getNextOccurrenceDate(currentDate, frequency) {
  const next = new Date(currentDate);
  const originalDay = new Date(currentDate).getDate();

  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      handleEndOfMonth(next, originalDay);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      handleEndOfMonth(next, originalDay);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      handleEndOfMonth(next, originalDay);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
      handleEndOfMonth(next, originalDay);
  }

  return next;
}

function handleEndOfMonth(date, originalDay) {
  const lastDayOfMonth = getLastDayOfMonth(date.getFullYear(), date.getMonth());
  if (originalDay > lastDayOfMonth) {
    date.setDate(lastDayOfMonth);
  } else {
    date.setDate(originalDay);
  }
}

export function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function generateOccurrences(template, untilDate) {
  const occurrences = [];
  let currentDate = new Date(template.startDate);
  const endDate = template.endDate ? new Date(template.endDate) : null;
  const maxDate = untilDate ? new Date(untilDate) : new Date();

  if (!untilDate) {
    maxDate.setMonth(maxDate.getMonth() + 12);
  }

  let count = 0;
  const maxCount = template.occurrencesCount || Infinity;

  while (currentDate <= maxDate && count < maxCount) {
    if (endDate && currentDate > endDate) break;

    occurrences.push({
      ...template,
      dueDate: currentDate.toISOString().split('T')[0],
      recurringTemplateId: template.id,
      isRecurring: true
    });

    currentDate = getNextOccurrenceDate(currentDate, template.frequency);
    count++;

    if (count > 1000) break;
  }

  return occurrences;
}

export function getRecurringDescription(template, transactionCount) {
  const freq = getFrequencyLabel(template?.frequency || 'monthly');
  if (template?.occurrencesCount) {
    const remaining = template.occurrencesCount - (transactionCount || 0);
    return `${freq} (${remaining} remaining)`;
  }
  if (template?.endDate) {
    return `${freq} (until ${formatDate(template.endDate)})`;
  }
  return `${freq} (Ongoing)`;
}
