import { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { formatCurrency } from '../utils/helpers';

export default function CalendarView({
  transactions,
  companies,
  onSelectPayment,
}) {
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [filterType, setFilterType] = useState('all');

  const events = useMemo(() => {
    let filtered = transactions;

    if (filterCompanyId) {
      filtered = filtered.filter((p) => p.companyId === filterCompanyId);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((p) => (p.type || 'payment') === filterType);
    }

    return filtered.map((transaction) => {
      const company = companies.find((c) => c.id === transaction.companyId);
      const isEarning = transaction.type === 'earning';
      const prefix = isEarning ? '+' : '-';

      return {
        id: transaction.id,
        title: `${prefix} ${transaction.payee} - ${formatCurrency(transaction.amount)}`,
        date: transaction.dueDate,
        className: isEarning
          ? `fc-event-earning-${transaction.status}`
          : `fc-event-${transaction.status}`,
        extendedProps: {
          payment: transaction,
          company,
        },
      };
    });
  }, [transactions, companies, filterCompanyId, filterType]);

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
          </div>
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
