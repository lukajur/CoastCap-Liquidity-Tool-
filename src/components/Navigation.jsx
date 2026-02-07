import { Calendar, Table, Building2, PlusCircle, Settings, TrendingUp, LogOut, Coins, RefreshCw, LayoutDashboard, Landmark } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'table', label: 'Table View', icon: Table },
  { id: 'forecast', label: 'Forecast', icon: TrendingUp },
  { id: 'payments', label: 'Add Entry', icon: PlusCircle },
  { id: 'recurring', label: 'Recurring', icon: RefreshCw },
  { id: 'bank-accounts', label: 'Bank Accounts', icon: Landmark },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'categories', label: 'Categories', icon: Settings },
  { id: 'currencies', label: 'Currencies', icon: Coins },
];

export default function Navigation({ activeTab, onTabChange, onLogout }) {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold text-gray-900">
            Liquidity Forecast
          </h1>
          <div className="flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors ml-2"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
