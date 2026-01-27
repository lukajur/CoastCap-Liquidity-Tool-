import { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { formatCurrency } from '../utils/helpers';
import { RefreshCw } from 'lucide-react';

export default function CalendarView({
  transactions,
  companies,
  onSelectPayment,
  baseCurrency = 'EUR',
}) {
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRecurring, setFilterRecurring] = useState('all');

  const events = useMemo(() => {
    let filtered = transactions;

    if (filterCompanyId) {
      filtered = filtered.filter((p) => p.companyId === filterCompanyId);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((p) => (p.type || 'payment') === filterType);
    }

    if (filterRecurring === 'recurring') {
      filtered = filtered.filter((p) => p.isRecurring);
    } else if (filterRecurring === 'one-time') {
      filtered = filtered.filter((p) => !p.isRecurring);
    }

    return filtered.map((transaction) => {
      const company = companies.find((c) => c.id === transaction.companyId);
      const isEarning = transaction.type === 'earning';
      const prefix = isEarning ? '+' : '-';
      const currency = transaction.currency || 'EUR';
      const isRecurring = transaction.isRecurring;

      let className = isEarning
        ? `fc-event-earning-${transaction.status}`
        : `fc-event-${transaction.status}`;

      if (isRecurring) {
        className += ' fc-event-recurring';
      }

      const recurringPrefix = isRecurring ? '↻ ' : '';

      return {
        id: transaction.id,
        title: `${recurringPrefix}${prefix} ${transaction.payee} - ${formatCurrency(transaction.amount, currency)}`,
        date: transaction.dueDate,
        className,
        extendedProps: {
          payment: transaction,
          company,
          isRecurring,
        },
      };
    });
  }, [transactions, companies, filterCompanyId, filterType, filterRecurring]);

  const handleEventClick = (info) => {
    const { payment } = info.event.extendedProps;
    onSelectPayment(payment);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Transaction Calendar</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            <span>To Pay</span>
            <span className="w-3 h-3 rounded bg-yellow-500 ml-1"></span>
            <span>Postponed</span>
            <span className="w-3 h-3 rounded bg-green-500 ml-1"></span>
            <span>Paid</span>
            <span className="w-3 h-3 rounded bg-blue-500 ml-2"></span>
            <span>Earning</span>
            <span className="ml-2 flex items-center gap-1 text-gray-600">
              <RefreshCw size={12} />
              <span>Recurring</span>
            </span>
          </div>
          <select
            value={filterRecurring}
            onChange={(e) => setFilterRecurring(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Entries</option>
            <option value="recurring">Recurring Only</option>
            <option value="one-time">One-time Only</option>
          </select>
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
            value={filterCompanyId}
            onChange={(e) => setFilterCompanyId(e.target.value)}
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

      <style>{`
        .fc-event-recurring {
          opacity: 0.75;
          border-left: 3px solid currentColor !important;
        }
        .fc-event-to_pay {
          background-color: #ef4444 !important;
          border-color: #dc2626 !important;
        }
        .fc-event-postponed {
          background-color: #f59e0b !important;
          border-color: #d97706 !important;
        }
        .fc-event-paid {
          background-color: #22c55e !important;
          border-color: #16a34a !important;
        }
        .fc-event-skipped {
          background-color: #9ca3af !important;
          border-color: #6b7280 !important;
          text-decoration: line-through;
        }
        .fc-event-earning-to_pay {
          background-color: #3b82f6 !important;
          border-color: #2563eb !important;
        }
        .fc-event-earning-postponed {
          background-color: #60a5fa !important;
          border-color: #3b82f6 !important;
        }
        .fc-event-earning-paid {
          background-color: #1d4ed8 !important;
          border-color: #1e40af !important;
        }
        .fc-event-earning-skipped {
          background-color: #9ca3af !important;
          border-color: #6b7280 !important;
          text-decoration: line-through;
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        height="auto"
        eventDisplay="block"
      />
    </div>
  );
}
