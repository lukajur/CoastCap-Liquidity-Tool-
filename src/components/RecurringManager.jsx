import { useState, useMemo } from 'react';
import {
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getFrequencyLabel,
  getStatusLabel,
  getDaysUntilDue,
} from '../utils/helpers';

export default function RecurringManager({
  templates,
  transactions,
  companies,
  categories,
  onPause,
  onResume,
  onDelete,
  onEdit,
  onAddNew,
  onSkipOccurrence,
  baseCurrency = 'EUR',
  exchangeRates = [],
}) {
  const [expandedTemplates, setExpandedTemplates] = useState(new Set());
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [templates, filterType, filterStatus]);

  const stats = useMemo(() => {
    const activePayments = templates.filter(t => t.status === 'active' && t.type === 'payment');
    const activeEarnings = templates.filter(t => t.status === 'active' && t.type === 'earning');

    const monthlyPayments = activePayments.reduce((sum, t) => {
      let multiplier = 1;
      if (t.frequency === 'weekly') multiplier = 4.33;
      else if (t.frequency === 'quarterly') multiplier = 1/3;
      else if (t.frequency === 'yearly') multiplier = 1/12;
      return sum + (t.amount * multiplier);
    }, 0);

    const monthlyEarnings = activeEarnings.reduce((sum, t) => {
      let multiplier = 1;
      if (t.frequency === 'weekly') multiplier = 4.33;
      else if (t.frequency === 'quarterly') multiplier = 1/3;
      else if (t.frequency === 'yearly') multiplier = 1/12;
      return sum + (t.amount * multiplier);
    }, 0);

    return {
      activeCount: templates.filter(t => t.status === 'active').length,
      pausedCount: templates.filter(t => t.status === 'paused').length,
      monthlyPayments,
      monthlyEarnings,
    };
  }, [templates]);

  const getTemplateTransactions = (templateId) => {
    return transactions
      .filter(t => t.recurringTemplateId === templateId)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  const getNextDueDate = (templateId) => {
    const templateTransactions = getTemplateTransactions(templateId);
    const unpaid = templateTransactions.filter(t => t.status !== 'paid' && t.status !== 'skipped');
    if (unpaid.length === 0) return null;
    return unpaid[0].dueDate;
  };

  const toggleExpand = (templateId) => {
    const newExpanded = new Set(expandedTemplates);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedTemplates(newExpanded);
  };

  const handleDelete = (template) => {
    if (confirm(`Delete recurring ${template.type} "${template.payee}"? This will also delete all unpaid future occurrences.`)) {
      onDelete(template.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Recurring</p>
          <p className="text-2xl font-bold text-blue-600">{stats.activeCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Paused</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pausedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Monthly Payments (avg)</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.monthlyPayments, baseCurrency)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Monthly Earnings (avg)</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.monthlyEarnings, baseCurrency)}
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <RefreshCw size={20} className="text-blue-600" />
            Recurring Templates
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="payment">Payments</option>
              <option value="earning">Earnings</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <button
              onClick={onAddNew}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <PlusCircle size={16} />
              New Recurring
            </button>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No recurring templates found.</p>
            <p className="text-sm mt-1">Create a recurring payment or earning to get started.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTemplates.map((template) => {
              const company = companies.find(c => c.id === template.companyId);
              const category = categories.find(c => c.id === template.categoryId);
              const nextDue = getNextDueDate(template.id);
              const isExpanded = expandedTemplates.has(template.id);
              const templateTransactions = getTemplateTransactions(template.id);
              const isEarning = template.type === 'earning';

              return (
                <div key={template.id} className={template.status === 'paused' ? 'bg-gray-50' : ''}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isEarning ? 'bg-blue-100' : 'bg-red-100'}`}>
                          {isEarning ? (
                            <ArrowDownCircle size={20} className="text-blue-600" />
                          ) : (
                            <ArrowUpCircle size={20} className="text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{template.payee}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              template.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {template.status === 'active' ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span>{company?.name || 'Unknown'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <RefreshCw size={12} />
                              {getFrequencyLabel(template.frequency)}
                            </span>
                            {category && (
                              <>
                                <span>•</span>
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                  {category.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${isEarning ? 'text-blue-600' : 'text-red-600'}`}>
                            {isEarning ? '+' : '-'}{formatCurrency(template.amount, template.currency)}
                          </p>
                          {nextDue && (
                            <p className="text-sm text-gray-500">
                              Next: {formatDate(nextDue)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {template.status === 'active' ? (
                            <button
                              onClick={() => onPause(template.id)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                              title="Pause"
                            >
                              <Pause size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => onResume(template.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Resume"
                            >
                              <Play size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => onEdit(template)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(template)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            onClick={() => toggleExpand(template.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title={isExpanded ? 'Hide occurrences' : 'Show occurrences'}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Upcoming Occurrences (next 6 months)
                        </h4>
                        {templateTransactions.length === 0 ? (
                          <p className="text-sm text-gray-500">No occurrences generated yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {templateTransactions.slice(0, 12).map((t) => {
                              const daysUntil = getDaysUntilDue(t.dueDate);
                              return (
                                <div
                                  key={t.id}
                                  className={`flex items-center justify-between p-2 rounded ${
                                    t.status === 'paid' ? 'bg-green-50' :
                                    t.status === 'skipped' ? 'bg-gray-100' :
                                    t.isException ? 'bg-amber-50' : 'bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600 w-24">
                                      {formatDate(t.dueDate)}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      t.status === 'paid' ? 'bg-green-100 text-green-700' :
                                      t.status === 'skipped' ? 'bg-gray-200 text-gray-600' :
                                      t.status === 'postponed' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {getStatusLabel(t.status)}
                                    </span>
                                    {t.isException && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                                        Modified
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-sm font-medium ${isEarning ? 'text-blue-600' : 'text-red-600'}`}>
                                      {formatCurrency(t.amount, t.currency)}
                                    </span>
                                    {t.status !== 'paid' && t.status !== 'skipped' && (
                                      <button
                                        onClick={() => onSkipOccurrence(template.id, t.id)}
                                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                                      >
                                        Skip
                                      </button>
                                    )}
                                    <span className={`text-xs ${
                                      daysUntil < 0 ? 'text-red-600' :
                                      daysUntil <= 7 ? 'text-yellow-600' :
                                      'text-gray-500'
                                    }`}>
                                      {daysUntil < 0
                                        ? `${Math.abs(daysUntil)}d overdue`
                                        : daysUntil === 0
                                          ? 'Today'
                                          : `${daysUntil}d`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            {templateTransactions.length > 12 && (
                              <p className="text-sm text-gray-500 text-center pt-2">
                                +{templateTransactions.length - 12} more occurrences
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
