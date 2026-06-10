import React, { useState } from 'react';
import { Task, Project } from '../types';
import { ChevronLeft, ChevronRight, Plus, Folder } from 'lucide-react';
import { motion } from 'motion/react';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  onAddTaskOnDate: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
}

export default function CalendarView({
  tasks,
  projects,
  onAddTaskOnDate,
  onEditTask,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  // Days-of-week headers
  const WEEKDAYS = ['日 (Sun)', '一 (Mon)', '二 (Tue)', '三 (Wed)', '四 (Thu)', '五 (Fri)', '六 (Sat)'];

  const monthNames = [
    '一月 (睦月 - Mutsuki)',
    '二月 (如月 - Kisaragi)',
    '三月 (弥生 - Yayoi)',
    '四月 (卯月 - Uzuki)',
    '五月 (皐月 - Satsuki)',
    '六月 (水無月 - Minazuki)',
    '七月 (文月 - Fumizuki)',
    '八月 (葉月 - Hazuki)',
    '九月 (長月 - Nagatsuki)',
    '十月 (神無月 - Kannazuki)',
    '十一月 (霜月 - Shimotsuki)',
    '十二月 (師走 - Shiwasu)',
  ];

  // Calendar logic offsets
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevMonthDays.push({
      day: totalDaysInPrevMonth - i,
      isCurrentMonth: false,
      dateString: `${year}-${String(month).padStart(2, '0')}-${String(totalDaysInPrevMonth - i).padStart(2, '0')}`,
    });
  }

  const currentMonthDays = [];
  for (let i = 1; i <= totalDaysInMonth; i++) {
    currentMonthDays.push({
      day: i,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
    });
  }

  // Trailing slots for a full 42 grid grid (6 rows x 7 columns)
  const remainingSlots = 42 - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = [];
  for (let i = 1; i <= remainingSlots; i++) {
    nextMonthDays.push({
      day: i,
      isCurrentMonth: false,
      dateString: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
    });
  }

  const calendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleTodayGo = () => {
    setCurrentDate(new Date());
  };

  // Get tasks scheduled for a spec date
  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(task => task.dueDate === dateStr);
  };

  return (
    <div className="bg-white border border-natural-border rounded-2xl shadow-xs overflow-hidden flex flex-col font-sans" id="calendar-view-container">
      
      {/* Calendar Header Navigation Row */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-natural-border/60 bg-[#f5f5f0]/50">
        <div>
          <h2 className="text-sm font-semibold text-natural-dark flex items-center gap-1.5">
            <span className="font-mono text-base">{year}年</span>
            <span>{monthNames[month]}</span>
          </h2>
          <p className="text-[10px] text-natural-light font-sans tracking-wide">日誌行事曆視圖 • スケジュール</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTodayGo}
            className="px-3 py-1 text-xs font-medium text-natural-dark bg-white border border-natural-border rounded-md hover:bg-natural-badge cursor-pointer"
          >
            今日
          </button>
          
          <div className="flex items-center border border-natural-border rounded-md bg-white">
            <button
              onClick={handlePrevMonth}
              className="p-1 px-1.5 hover:bg-natural-badge text-natural-light hover:text-natural-dark border-r border-natural-border cursor-pointer"
              title="前一個月"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 px-1.5 hover:bg-natural-badge text-natural-light hover:text-natural-dark cursor-pointer"
              title="下一個月"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Week Day Titles Grid */}
      <div className="grid grid-cols-7 border-b border-natural-border/60 bg-[#f5f5f0] text-center text-[10px] font-semibold text-natural-light py-2">
        {WEEKDAYS.map((day, idx) => (
          <div key={idx} className={idx === 0 || idx === 6 ? 'text-rose-700' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* 42 Monthly Grid slots */}
      <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-natural-border/45 flex-1 min-h-[480px]">
        {calendarDays.map((cell, idx) => {
          const dayTasks = getTasksForDate(cell.dateString);
          const isToday = cell.dateString === new Date().toISOString().split('T')[0];

          return (
            <div
              key={idx}
              className={`relative flex flex-col p-2 min-h-[80px] group transition-all hover:bg-natural-badge/20 ${
                cell.isCurrentMonth ? 'bg-white' : 'bg-natural-badge/30 text-natural-muted'
              }`}
            >
              {/* Date Indicator and addition button */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono font-medium flex items-center justify-center w-5 h-5 rounded-full ${
                  isToday 
                    ? 'bg-natural-primary text-white text-[11px] font-bold ring-2 ring-natural-primary/20' 
                    : cell.isCurrentMonth ? 'text-natural-dark' : 'text-natural-muted'
                }`}>
                  {cell.day}
                </span>

                <button
                  onClick={() => onAddTaskOnDate(cell.dateString)}
                  className="p-0.5 text-transparent group-hover:text-natural-muted hover:text-natural-primary rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="在此日期新增日程"
                >
                  <Plus size={11} />
                </button>
              </div>

              {/* Day Scheduled Tasks Pill List */}
              <div className="flex-1 overflow-y-auto space-y-1 max-h-[72px] pr-0.5">
                {dayTasks.map(task => {
                  const assocProject = projects.find(p => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                      className={`px-1.5 py-0.5 text-[9px] font-sans rounded-sm transition-all cursor-pointer truncate border ${
                        task.completed 
                          ? 'line-through bg-natural-badge text-natural-muted border-natural-border/30 font-light' 
                          : 'bg-white text-natural-dark border-natural-border/75 hover:border-natural-primary'
                      }`}
                      style={{
                        backgroundColor: !task.completed && assocProject ? `${assocProject.color}1F` : '',
                        borderColor: !task.completed && assocProject ? `${assocProject.color}45` : '',
                        color: !task.completed && assocProject ? '#5a5a40' : ''
                      }}
                      title={task.title}
                    >
                      <span className="truncate block select-none">
                        {task.completed ? '✓ ' : ''}
                        {task.title}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
