import React, { useState, useEffect } from 'react';
import { Task, Project, TaskPriority } from '../types';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>, id?: string) => Promise<void>;
  editingTask: Task | null;
  projects: Project[];
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  editingTask,
  projects,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Set default form values dynamically when editing task or opening fresh modal
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setProjectId(editingTask.projectId || '');
      setDueDate(editingTask.dueDate);
      setPriority(editingTask.priority);
    } else {
      setTitle('');
      setDescription('');
      setProjectId(projects.length > 0 ? projects[0].id : '');
      
      // Default due date to current local date
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDueDate(`${yyyy}-${mm}-${dd}`);
      
      setPriority('medium');
    }
    setError('');
  }, [editingTask, isOpen, projects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('請填寫日程標題 (件名)。');
      return;
    }
    if (!dueDate) {
      setError('請填寫預計完成日期。');
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => p.id === projectId);
      const categoryName = selectedProj ? selectedProj.name : '未分類';

      const payload: Partial<Task> = {
        title: title.trim(),
        description: description.trim(),
        projectId: projectId || '',
        category: categoryName,
        dueDate,
        priority,
      };

      await onSave(payload, editingTask?.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('儲存日程失敗，請重新嘗試。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4a4a3a]/30 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-white rounded-xl border border-natural-border shadow-2xl overflow-hidden"
        id="task-form-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#f2f1e9] border-b border-natural-border">
          <h3 className="font-sans text-xs font-semibold text-natural-dark">
            {editingTask ? '日程編集 • 編輯手帳日程' : '日程作成 • 建立手帳日程'}
          </h3>
          <button onClick={onClose} className="p-1 text-natural-light hover:text-natural-dark rounded-md transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="flex items-center gap-2 p-2.5 text-xs font-sans text-red-600 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-natural-text">行程標題 (件名) *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：提寄文案、和山田先生喝咖啡、瑜伽課..."
              maxLength={80}
              className="w-full px-3 py-2 text-xs font-sans placeholder-natural-muted bg-natural-badge border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary focus:bg-white transition-all text-natural-dark"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-natural-text">日程備忘 (メモ)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加細節備註、地點或聯絡資訊..."
              rows={3}
              maxLength={400}
              className="w-full px-3 py-2 text-xs font-sans placeholder-natural-muted bg-natural-badge border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary focus:bg-white transition-all text-natural-dark resize-none animate-none"
            />
          </div>

          {/* Project classifications and Priority */}
          <div className="grid grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-natural-text">所屬專案 (カテゴリ)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-sans bg-natural-badge border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary focus:bg-white transition-all text-natural-dark cursor-pointer animate-none"
              >
                <option value="">未分類</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-natural-text">重要度 (優先度)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-1.5 text-xs font-sans bg-natural-badge border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary focus:bg-white transition-all text-natural-dark cursor-pointer animate-none"
              >
                <option value="low">低重要度 (低)</option>
                <option value="medium">一般行程 (中)</option>
                <option value="high">極重要項目 (高)</option>
              </select>
            </div>

          </div>

          {/* Due date picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-natural-text">預計完成日期 (期限) *</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-natural-light" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-sans bg-natural-badge border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary focus:bg-white transition-all text-natural-dark cursor-pointer animate-none"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-natural-border mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-sans font-medium text-natural-light hover:text-natural-dark bg-natural-badge hover:bg-natural-border/30 rounded-lg transition-all cursor-pointer border border-natural-border/30 animate-none"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-1.5 text-xs font-sans font-medium text-white bg-natural-primary hover:bg-natural-primary-hover active:bg-[#4d4d38] rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 animate-none"
            >
              {saving ? '保存中...' : '確認儲存'}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
