import { Task, Project } from '../types';
import { Calendar, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { MouseEvent } from 'react';

interface TaskCardProps {
  key?: string | number;
  task: Task;
  projects: Project[];
  onToggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function TaskCard({
  task,
  projects,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  // Find associated project details to render color coding
  const associatedProject = projects.find(p => p.id === task.projectId);

  // Check if date is overdue
  const isOverdue = () => {
    if (task.completed) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return task.dueDate < todayStr;
  };

  // Human-readable priority mapping with traditional colors
  const priorityConfig = {
    low: { bg: 'bg-natural-badge text-natural-light border border-natural-border/50', label: '低重要度' },
    medium: { bg: 'bg-[#ebeae0]/80 text-natural-primary border border-natural-border/70', label: '重要' },
    high: { bg: 'bg-[#c9a98a]/20 text-[#a37042] border border-[#c9a98a]/40', label: '極重要' },
  };

  const currPriority = priorityConfig[task.priority] || priorityConfig.medium;

  const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除此條手帳行程嗎？')) {
      try {
        await onDelete(task.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`group p-4 bg-white border border-natural-card-border rounded-xl shadow-xs hover:border-natural-primary hover:shadow-sm transition-all-custom flex items-start gap-3.5 cursor-pointer select-none ${
        task.completed ? 'bg-[#fcfcfc] border-natural-border/40 opacity-70' : ''
      }`}
      onClick={() => onEdit(task)}
      id={`task-card-${task.id}`}
    >
      {/* Delicate Custom Checked Circle Stamp (Japanese Hand-stamped style) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task.id, task.completed);
        }}
        className={`w-5 h-5 rounded-full border-1.5 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
          task.completed
            ? 'border-natural-primary bg-natural-primary text-white scale-105'
            : 'border-natural-border hover:border-natural-primary hover:bg-natural-badge'
        }`}
        title={task.completed ? '標記為未完成' : '標記為已完成'}
      >
        {task.completed && (
          <span className="text-[10px] font-bold">✓</span>
        )}
      </button>

      {/* Task Information Block */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Priority Tag */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium leading-none ${currPriority.bg}`}>
            {currPriority.label}
          </span>

          {/* Project Pill Category (if associated) */}
          {associatedProject && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-sans font-medium leading-none border"
              style={{
                backgroundColor: associatedProject.color ? `${associatedProject.color}20` : '#f5f5f0',
                color: '#5a5a40',
                borderColor: associatedProject.color ? `${associatedProject.color}40` : '#e8e7e0',
              }}
            >
              {associatedProject.name}
            </span>
          )}
        </div>

        {/* Task Title & Striking */}
        <h4 className={`text-xs md:text-sm font-sans font-medium text-natural-dark break-words leading-snug transition-all ${
          task.completed ? 'line-through text-natural-muted font-light' : ''
        }`}>
          {task.title}
        </h4>

        {/* Task Description Memo */}
        {task.description && (
          <p className={`text-[11px] font-sans text-natural-light font-light leading-relaxed line-clamp-2 ${
            task.completed ? 'line-through text-natural-muted' : ''
          }`}>
            {task.description}
          </p>
        )}

        {/* Date and Expiration indicators */}
        <div className="flex items-center gap-3 pt-1 text-[11px] font-sans">
          <span className={`flex items-center gap-1 font-mono ${
            isOverdue() ? 'text-red-700 font-medium' : 'text-natural-light font-light'
          }`}>
            <Calendar size={11} className="shrink-0" />
            <span>{task.dueDate}</span>
            {isOverdue() && (
              <span className="flex items-center gap-0.5 text-red-700 ml-1 font-sans">
                <AlertCircle size={10} />
                行程已逾 (期限已過)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Hover Settings/Actions triggers */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1.5 hover:bg-natural-badge text-natural-light hover:text-natural-dark rounded transition-colors cursor-pointer"
          title="編輯日常"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 hover:bg-natural-badge text-natural-light hover:text-red-600 rounded transition-colors cursor-pointer"
          title="刪除日常"
        >
          <Trash2 size={12} />
        </button>
      </div>

    </motion.div>
  );
}
