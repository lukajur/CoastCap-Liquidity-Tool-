export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ISO week number calculation (Week 1 = first week with Thursday in new year)
export function getISOWeekNumber(dateString) {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

// Get ISO week year (can differ from calendar year at year boundaries)
export function getISOWeekYear(dateString) {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  return date.getFullYear();
}

// Legacy week number for backwards compatibility
export function getWeekNumber(dateString) {
  return getISOWeekNumber(dateString);
}

// Get the Monday (start) of a given ISO week
export function getWeekStart(weekNumber, year) {
  // January 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  // Find the Monday of week 1
  const dayOfWeek = jan4.getDay() || 7; // Sunday = 7
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - (dayOfWeek - 1));
  // Add weeks
  const weekStart = new Date(week1Monday);
  weekStart.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
  return weekStart;
}

// Get the Sunday (end) of a given ISO week
export function getWeekEnd(weekNumber, year) {
  const weekStart = getWeekStart(weekNumber, year);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

// Get formatted date range for a week
export function getWeekDateRange(weekNumber, year) {
  const start = getWeekStart(weekNumber, year);
  const end = getWeekEnd(weekNumber, year);
  return { start, end };
}

// Format a week date range as a string
export function formatWeekRange(weekNumber, year) {
  const { start, end } = getWeekDateRange(weekNumber, year);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

// Get current week info
export function getCurrentWeekInfo() {
  const today = new Date();
  const weekNumber = getISOWeekNumber(today.toISOString());
  const year = getISOWeekYear(today.toISOString());
  return { weekNumber, year };
}

// Get total weeks in a year (52 or 53)
export function getWeeksInYear(year) {
  const dec31 = new Date(year, 11, 31);
  const week = getISOWeekNumber(dec31.toISOString());
  // If Dec 31 is in week 1 of next year, check Dec 24
  if (week === 1) {
    return getISOWeekNumber(new Date(year, 11, 24).toISOString());
  }
  return week;
}

// Navigate to previous week (handles year boundaries)
export function getPreviousWeek(weekNumber, year) {
  if (weekNumber === 1) {
    const prevYear = year - 1;
    return { weekNumber: getWeeksInYear(prevYear), year: prevYear };
  }
  return { weekNumber: weekNumber - 1, year };
}

// Navigate to next week (handles year boundaries)
export function getNextWeek(weekNumber, year) {
  const weeksInYear = getWeeksInYear(year);
  if (weekNumber >= weeksInYear) {
    return { weekNumber: 1, year: year + 1 };
  }
  return { weekNumber: weekNumber + 1, year };
}

// Check if a date falls within a week range
export function isDateInWeekRange(dateString, fromWeek, toWeek, year) {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  const { start: rangeStart } = getWeekDateRange(fromWeek, year);
  const { end: rangeEnd } = getWeekDateRange(toWeek, year);
  rangeStart.setHours(0, 0, 0, 0);
  rangeEnd.setHours(23, 59, 59, 999);
  return date >= rangeStart && date <= rangeEnd;
}

// Get weeks that overlap with current month
export function getMonthWeeks(year, month) {
  const weeks = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let currentDate = new Date(firstDay);
  while (currentDate <= lastDay) {
    const weekNum = getISOWeekNumber(currentDate.toISOString());
    const weekYear = getISOWeekYear(currentDate.toISOString());
    const key = `${weekYear}-${weekNum}`;
    if (!weeks.find(w => `${w.year}-${w.weekNumber}` === key)) {
      weeks.push({ weekNumber: weekNum, year: weekYear });
    }
    currentDate.setDate(currentDate.getDate() + 7);
  }

  // Also check the last day
  const lastWeekNum = getISOWeekNumber(lastDay.toISOString());
  const lastWeekYear = getISOWeekYear(lastDay.toISOString());
  const lastKey = `${lastWeekYear}-${lastWeekNum}`;
  if (!weeks.find(w => `${w.year}-${w.weekNumber}` === lastKey)) {
    weeks.push({ weekNumber: lastWeekNum, year: lastWeekYear });
  }

  return weeks.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.weekNumber - b.weekNumber;
  });
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
