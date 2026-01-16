import React, { useState, useCallback, useRef, useEffect, JSX } from 'react';

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const normalizeDate = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const getDayMs = (date: Date): number => normalizeDate(date).getTime();
const getDayDiffInclusive = (a: Date, b: Date): number =>
  Math.floor(Math.abs(getDayMs(b) - getDayMs(a)) / MS_IN_DAY) + 1;

interface CalendarProps {
  theme?: 'dark' | 'light';
  primaryColor?: string;
}

type DateRange = {
  from: Date | null;
  to: Date | null;
};

type MonthsRange = {
  start: number;
  end: number;
};

type MonthToDisplay = {
  month: number;
  year: number;
  date: Date;
  index: number;
};

type CalendarDay = {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
};

export default function Calendar ({
  theme = 'dark',
  primaryColor = '#3b82f6',
} : CalendarProps) : JSX.Element {
  const today = new Date();
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<Date | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [monthsRange, setMonthsRange] = useState<MonthsRange>({ start: -5, end: 5 });
  const isLoadingRef = useRef<boolean>(false);
  const [containerHeight, setContainerHeight] = useState<number>(400);

  const isDark = theme === 'dark';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate months to display based on range
  const generateMonthsToDisplay = useCallback((): MonthToDisplay[] => {
    const monthsArray: MonthToDisplay[] = [];
    const startDate = new Date(today.getFullYear(), today.getMonth() + monthsRange.start, 1);
    const totalMonths = monthsRange.end - monthsRange.start + 1;
    
    for (let i = 0; i < totalMonths; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      monthsArray.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        date: date,
        index: monthsRange.start + i
      });
    }
    return monthsArray;
  }, [monthsRange]);

  const monthsToDisplay = generateMonthsToDisplay();

  // Get days in month
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days for a specific month
  const generateCalendarDays = (month: number, year: number): CalendarDay[] => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days: CalendarDay[] = [];

    // Previous month's trailing days
    const prevMonthDays = getDaysInMonth(
      month === 0 ? 11 : month - 1,
      month === 0 ? year - 1 : year
    );
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(
          month === 0 ? year - 1 : year,
          month === 0 ? 11 : month - 1,
          prevMonthDays - i
        )
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(
          month === 11 ? year + 1 : year,
          month === 11 ? 0 : month + 1,
          i
        )
      });
    }

    return days;
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const now = new Date();
    return date.getDate() === now.getDate() &&
           date.getMonth() === now.getMonth() &&
           date.getFullYear() === now.getFullYear();
  };

  // Check if date is selected
  const isSelected = (date: Date): boolean => {
    if (!range.from) return false;
    const dateMs = getDayMs(date);
    const fromMs = getDayMs(range.from);
    const toMs = range.to ? getDayMs(range.to) : fromMs;
    return dateMs >= Math.min(fromMs, toMs) && dateMs <= Math.max(fromMs, toMs);
  };

  // Check if date is range start
  const isRangeStart = (date: Date): boolean => {
    if (!range.from) return false;
    return getDayMs(date) === getDayMs(range.from);
  };

  // Check if date is range end
  const isRangeEnd = (date: Date): boolean => {
    if (!range.to) return false;
    return getDayMs(date) === getDayMs(range.to);
  };

  // Handle mouse down
  const handleMouseDown = (date: Date): void => {
    const normalized = normalizeDate(date);
    setIsDragging(true);
    dragStartRef.current = normalized;
    setRange({ from: normalized, to: null });
  };

  // Handle mouse enter
  const handleMouseEnter = (date: Date): void => {
    if (!isDragging || !dragStartRef.current) return;
    const current = normalizeDate(date);
    const startMs = getDayMs(dragStartRef.current);
    const currentMs = getDayMs(current);
    const start = startMs <= currentMs ? dragStartRef.current : current;
    const end = startMs <= currentMs ? current : dragStartRef.current;
    setRange({ from: start, to: end });
  };

  // Handle mouse up
  const handleMouseUp = (): void => {
    if (isDragging) {
      setIsDragging(false);
      if (range.from && !range.to) {
        setRange({ from: normalizeDate(range.from), to: normalizeDate(range.from) });
      }
      dragStartRef.current = null;
    }
  };

  // Handle infinite scroll
  const handleScroll = useCallback((_: Event): void => {
    if (!scrollContainerRef.current || isLoadingRef.current) return;

    const container = scrollContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // Load more at bottom (scroll near end)
    if (scrollHeight - scrollTop - clientHeight < 200) {
      isLoadingRef.current = true;
      setMonthsRange(prev => ({
        ...prev,
        end: prev.end + 5
      }));
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }

    // Load more at top (scroll near start)
    if (scrollTop < 200) {
      isLoadingRef.current = true;
      const previousScrollHeight = scrollHeight;
      
      setMonthsRange(prev => ({
        ...prev,
        start: prev.start - 5
      }));
      
      // Maintain scroll position after adding content at top
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const newScrollHeight = scrollContainerRef.current.scrollHeight;
          scrollContainerRef.current.scrollTop = scrollTop + (newScrollHeight - previousScrollHeight);
        }
        isLoadingRef.current = false;
      }, 100);
    }
  }, []);

  // Add scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll as EventListener);
      return () => container.removeEventListener('scroll', handleScroll as EventListener);
    }
  }, [handleScroll]);

  // Add global mouse up listener
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, range]);

  // Handle escape key to clear selection
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRange({ from: null, to: null });
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Scroll to current month on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentMonthElement = scrollContainerRef.current.querySelector(
        '[data-month-index="0"]'
      ) as HTMLElement | null;
      if (currentMonthElement) {
        currentMonthElement.scrollIntoView({ block: 'start' });
      }
    }
  }, []);

  // Track visible month to show/hide Today button
  const [visibleMonth, setVisibleMonth] = useState<{ month: number; year: number }>({
    month: today.getMonth(),
    year: today.getFullYear(),
  });
  const [mousePosition, setMousePosition] = useState<{ y: number }>({ y: 0 });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      setMousePosition({ y: relativeY });
    };

    container.addEventListener('mousemove', handleMouseMove);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const monthIndexAttr = target.getAttribute('data-month-index');
          if (entry.isIntersecting && entry.intersectionRatio > 0.5 && monthIndexAttr !== null) {
            const monthIndex = parseInt(monthIndexAttr, 10);
            const date = new Date(today.getFullYear(), today.getMonth() + monthIndex, 1);
            setVisibleMonth({ month: date.getMonth(), year: date.getFullYear() });
          }
        });
      },
      { threshold: 0.5, root: container }
    );

    const monthElements = container.querySelectorAll('.month-container');
    monthElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [monthsToDisplay, today]);

  // Scroll to today
  const scrollToToday = (): void => {
    if (scrollContainerRef.current) {
      const currentMonthElement = scrollContainerRef.current.querySelector(
        '[data-month-index="0"]'
      ) as HTMLElement | null;
      if (currentMonthElement) {
        currentMonthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Calculate info with proper formatting
  const getDaysDifference = (): number => {
    if (!range.from) return 0;
    const to = range.to ?? range.from;
    return getDayDiffInclusive(range.from, to);
  };

  const formatDuration = (days: number): string => {
    if (days <= 30) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
    
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    
    if (months < 12) {
      return remainingDays > 0 
        ? `${months} ${months === 1 ? 'month' : 'months'} (${days} days)`
        : `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    let result = `${years} ${years === 1 ? 'year' : 'years'}`;
    if (remainingMonths > 0) {
      result += `, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    }
    if (remainingDays > 0) {
      result += `, ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
    }
    return result;
  };

  const getDaysFromToday = (): number => {
    if (!range.from) return 0;
    const todayMs = getDayMs(new Date());
    const targetMs = getDayMs(range.from);
    return Math.round((targetMs - todayMs) / MS_IN_DAY);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Convert hex to RGB
  const hexToRgb = (
    hex: string
  ): {
    r: number;
    g: number;
    b: number;
  } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
  };

  const rgb = hexToRgb(primaryColor);
  const primaryRgb = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  const rootStyle = {
    '--primary-rgb': primaryRgb,
  } as React.CSSProperties;

  const infoBoxThreshold = containerHeight / 2;
  const infoBoxStyle: React.CSSProperties =
    mousePosition.y < infoBoxThreshold ? { bottom: '4px' } : { top: '4px' };

  return (
    <div
      className={`h-full w-full flex items-center justify-center p-2 ${
        isDark ? 'bg-gray-950' : 'bg-gray-50'
      }`}
      style={rootStyle}
    >
      <div
        className={`h-full w-full max-w-md rounded-lg border relative overflow-hidden ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        {/* Today Button - Fixed at top right */}
        {(visibleMonth.month !== today.getMonth() || visibleMonth.year !== today.getFullYear()) && (
          <button
            onClick={scrollToToday}
            className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors shadow-lg ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-750' 
                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
            }`}
            title="Go to current month"
          >
            Today
          </button>
        )}

        {/* Info Box - Floating over calendar */}
        {range.from && (
          <div
            className={`absolute left-4 z-20 px-3 py-2 rounded-md border text-xs shadow-lg transition-all ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-gray-200'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            style={infoBoxStyle}
          >
            {range.from && (!range.to || range.from.getTime() === range.to.getTime()) ? (
              <div>
                <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {formatDate(range.from)}
                </p>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getDaysFromToday() === 0 
                    ? 'Today' 
                    : 
                    `
                    ${Math.abs(getDaysFromToday())} ${Math.abs(getDaysFromToday()) === 1 ? 'day' : 'days'} ${getDaysFromToday() > 0  ? 'from now' : 'ago'}
                    `
                  }
                </p>
              </div>
            ) : (
              <div>
                <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {range.from && range.to ? `${formatDate(range.from)} - ${formatDate(range.to)}` : ''}
                </p>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDuration(getDaysDifference())} selected
                </p>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Calendar */}
        <div
          ref={scrollContainerRef}
          className="calendar-scroll-container select-none p-4 sm:p-6"
          style={{
            height: '400px',
            overflowY: 'scroll',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {monthsToDisplay.map((monthData) => {
            const calendarDays = generateCalendarDays(monthData.month, monthData.year);

            return (
              <div
                key={`${monthData.year}-${monthData.month}`}
                className="month-container mb-6"
                data-month-index={monthData.index}
              >
                {/* Month Header */}
                <div className={`text-center mb-3 sticky top-0 z-10 py-2 ${
                  isDark ? 'bg-gray-900' : 'bg-white'
                }`}>
                  <h3 className={`text-sm font-semibold ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {months[monthData.month]} {monthData.year}
                  </h3>
                </div>

                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className={`text-center text-xs font-medium py-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((dayObj, idx) => {
                    const selected = isSelected(dayObj.date);
                    const rangeStart = isRangeStart(dayObj.date);
                    const rangeEnd = isRangeEnd(dayObj.date);
                    const todayDate = isToday(dayObj.date);

                    return (
                      <button
                        key={idx}
                        onMouseDown={() => handleMouseDown(dayObj.date)}
                        onMouseEnter={() => handleMouseEnter(dayObj.date)}
                        style={{
                          backgroundColor:
                            selected && (rangeStart || rangeEnd)
                              ? `rgb(${primaryRgb})`
                              : selected
                              ? `rgba(${primaryRgb}, 0.15)`
                              : todayDate && !selected
                              ? isDark
                                ? '#1f2937'
                                : '#f3f4f6'
                              : 'transparent',
                          color: selected && (rangeStart || rangeEnd) ? '#ffffff' : undefined,
                        }}
                        className={`
                          h-9 text-sm rounded-md transition-colors relative
                          ${
                            !dayObj.isCurrentMonth
                              ? isDark
                                ? 'text-gray-600'
                                : 'text-gray-400'
                              : isDark
                              ? 'text-gray-200'
                              : 'text-gray-900'
                          }
                          ${todayDate && !selected ? 'font-semibold' : ''}
                          ${selected && rangeStart && !rangeEnd ? 'rounded-r-none' : ''}
                          ${selected && rangeEnd && !rangeStart ? 'rounded-l-none' : ''}
                          ${!selected ? (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100') : ''}
                        `}
                      >
                        {dayObj.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .calendar-scroll-container::-webkit-scrollbar {
          display: none;
        }
        button {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};