import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';
import {
  getCurrentWeekInfo,
  getWeeksInYear,
  formatWeekRange,
  getPreviousWeek,
  getNextWeek,
  getMonthWeeks,
  getWeekDateRange,
} from '../utils/helpers';

export default function WeekSelector({
  fromWeek,
  toWeek,
  year,
  onWeekChange,
  weekViewMode = '1',
  onViewModeChange,
}) {
  const [showCustomRange, setShowCustomRange] = useState(weekViewMode === 'custom');
  const [jumpToWeek, setJumpToWeek] = useState('');

  const currentWeekInfo = useMemo(() => getCurrentWeekInfo(), []);
  const weeksInYear = useMemo(() => getWeeksInYear(year), [year]);

  const isCurrentWeek = fromWeek === currentWeekInfo.weekNumber &&
                        toWeek === currentWeekInfo.weekNumber &&
                        year === currentWeekInfo.year;

  const handlePreviousWeek = () => {
    const span = toWeek - fromWeek;
    const prev = getPreviousWeek(fromWeek, year);
    if (span === 0) {
      onWeekChange(prev.weekNumber, prev.weekNumber, prev.year);
    } else {
      // Move the entire range back by 1 week
      const newFrom = getPreviousWeek(fromWeek, year);
      const newTo = getPreviousWeek(toWeek, year);
      // Handle cross-year ranges carefully
      if (newFrom.year === newTo.year) {
        onWeekChange(newFrom.weekNumber, newTo.weekNumber, newFrom.year);
      } else {
        // Keep it simple: just move to previous week
        onWeekChange(prev.weekNumber, prev.weekNumber, prev.year);
      }
    }
  };

  const handleNextWeek = () => {
    const span = toWeek - fromWeek;
    const next = getNextWeek(toWeek, year);
    if (span === 0) {
      onWeekChange(next.weekNumber, next.weekNumber, next.year);
    } else {
      // Move the entire range forward by 1 week
      const newFrom = getNextWeek(fromWeek, year);
      const newTo = getNextWeek(toWeek, year);
      if (newFrom.year === newTo.year) {
        onWeekChange(newFrom.weekNumber, newTo.weekNumber, newFrom.year);
      } else {
        onWeekChange(next.weekNumber, next.weekNumber, next.year);
      }
    }
  };

  const handleCurrentWeek = () => {
    onWeekChange(currentWeekInfo.weekNumber, currentWeekInfo.weekNumber, currentWeekInfo.year);
    onViewModeChange('1');
    setShowCustomRange(false);
  };

  const handleNextWeekQuick = () => {
    const next = getNextWeek(currentWeekInfo.weekNumber, currentWeekInfo.year);
    onWeekChange(next.weekNumber, next.weekNumber, next.year);
    onViewModeChange('1');
    setShowCustomRange(false);
  };

  const handleThisMonth = () => {
    const now = new Date();
    const monthWeeks = getMonthWeeks(now.getFullYear(), now.getMonth());
    if (monthWeeks.length > 0) {
      const first = monthWeeks[0];
      const last = monthWeeks[monthWeeks.length - 1];
      // Only support same-year ranges for simplicity
      if (first.year === last.year) {
        onWeekChange(first.weekNumber, last.weekNumber, first.year);
        onViewModeChange('custom');
        setShowCustomRange(true);
      } else {
        // Cross-year month - just show first week
        onWeekChange(first.weekNumber, first.weekNumber, first.year);
      }
    }
  };

  const handleViewModeChange = (mode) => {
    onViewModeChange(mode);
    if (mode === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
      const weeks = parseInt(mode, 10);
      const newTo = Math.min(fromWeek + weeks - 1, weeksInYear);
      onWeekChange(fromWeek, newTo, year);
    }
  };

  const handleJumpToWeek = () => {
    const weekNum = parseInt(jumpToWeek, 10);
    if (weekNum >= 1 && weekNum <= weeksInYear) {
      const span = toWeek - fromWeek;
      const newTo = Math.min(weekNum + span, weeksInYear);
      onWeekChange(weekNum, newTo, year);
      setJumpToWeek('');
    }
  };

  const handleCustomFromChange = (value) => {
    const newFrom = parseInt(value, 10);
    if (newFrom >= 1 && newFrom <= toWeek) {
      onWeekChange(newFrom, toWeek, year);
    }
  };

  const handleCustomToChange = (value) => {
    const newTo = parseInt(value, 10);
    if (newTo >= fromWeek && newTo <= weeksInYear) {
      onWeekChange(fromWeek, newTo, year);
    }
  };

  const handleYearChange = (newYear) => {
    const newWeeksInYear = getWeeksInYear(newYear);
    const newFrom = Math.min(fromWeek, newWeeksInYear);
    const newTo = Math.min(toWeek, newWeeksInYear);
    onWeekChange(newFrom, newTo, newYear);
  };

  // Generate week options for dropdowns
  const weekOptions = useMemo(() => {
    const options = [];
    for (let i = 1; i <= weeksInYear; i++) {
      options.push(i);
    }
    return options;
  }, [weeksInYear]);

  // Format display text
  const displayText = useMemo(() => {
    if (fromWeek === toWeek) {
      return `Week ${fromWeek}: ${formatWeekRange(fromWeek, year)}`;
    }
    const { start } = getWeekDateRange(fromWeek, year);
    const { end } = getWeekDateRange(toWeek, year);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `Week ${fromWeek}-${toWeek}: ${startStr} - ${endStr}`;
  }, [fromWeek, toWeek, year]);

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
      {/* Main Navigation Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Week Display & Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousWeek}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft size={20} />
          </button>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
            isCurrentWeek
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200 text-gray-800'
          }`}>
            <Calendar size={18} />
            <span className="text-sm sm:text-base whitespace-nowrap">{displayText}</span>
            {isCurrentWeek && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Current</span>
            )}
          </div>

          <button
            onClick={handleNextWeek}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
            title="Next Week"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Jump to Week */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={weeksInYear}
              value={jumpToWeek}
              onChange={(e) => setJumpToWeek(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJumpToWeek()}
              placeholder="Week #"
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleJumpToWeek}
              disabled={!jumpToWeek}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Go
            </button>
          </div>

          <select
            value={year}
            onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* View Mode & Quick Actions Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-indigo-100">
        {/* View Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <div className="flex items-center gap-1">
            {['1', '2', '4'].map((mode) => (
              <button
                key={mode}
                onClick={() => handleViewModeChange(mode)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  weekViewMode === mode && !showCustomRange
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mode} week{mode !== '1' ? 's' : ''}
              </button>
            ))}
            <button
              onClick={() => handleViewModeChange('custom')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showCustomRange
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Quick Jump Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCurrentWeek}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isCurrentWeek
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <RotateCcw size={14} />
            Current Week
          </button>
          <button
            onClick={handleNextWeekQuick}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Next Week
          </button>
          <button
            onClick={handleThisMonth}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            This Month
          </button>
        </div>
      </div>

      {/* Custom Range Inputs */}
      {showCustomRange && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-indigo-100">
          <span className="text-sm text-gray-600">From Week:</span>
          <select
            value={fromWeek}
            onChange={(e) => handleCustomFromChange(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {weekOptions.filter(w => w <= toWeek).map((w) => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">To Week:</span>
          <select
            value={toWeek}
            onChange={(e) => handleCustomToChange(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {weekOptions.filter(w => w >= fromWeek).map((w) => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
