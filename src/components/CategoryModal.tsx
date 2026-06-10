import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { X, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, id?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  editingProject: Project | null;
}

// Muted traditional Japanese pastel color palette
export const JAPANESE_PALETTE = [
  { hex: '#FFF1F2', border: '#FECDD3', text: '#9F1239', name: '桜色 (Sakura Pink)' },
  { hex: '#F0FDF4', border: '#DCFCE7', text: '#166534', name: '抹茶 (Matcha Green)' },
  { hex: '#EFF6FF', border: '#DBEAFE', text: '#1E40AF', name: '瑠璃 (Ruri Indigo)' },
  { hex: '#FFFBEB', border: '#FEF3C7', text: '#92400E', name: '砂色 (Suna Sand)' },
  { hex: '#FAF5FF', border: '#E9D5FF', text: '#6B21A8', name: '藤紫 (Fuji Violet)' },
  { hex: '#FDF2F8', border: '#FCE7F3', text: '#9D174D', name: '撫子 (Nadeshiko Rose)' },
  { hex: '#FAF9F6', border: '#E7E5E4', text: '#44403C', name: '薄鈍 (Stone Gray)' },
];

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingProject,
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState(JAPANESE_PALETTE[0].hex);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setColorHex(editingProject.color);
    } else {
      setName('');
      setColorHex(JAPANESE_PALETTE[0].hex);
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave(name.trim(), colorHex, editingProject?.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!editingProject || !onDelete) return;
    if (window.confirm(`確定要刪除「${editingProject.name}」專案分類嗎？分類下的任務將會被移至未分類。`)) {
      setSaving(true);
      try {
        await onDelete(editingProject.id);
        onClose();
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4a4a3a]/30 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-sm bg-white rounded-xl border border-natural-border shadow-xl overflow-hidden"
        id="category-modal"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-natural-border bg-[#f2f1e9]">
          <h3 className="font-sans text-xs font-semibold text-natural-dark">
            {editingProject ? '分類設定 • 編輯專案' : '分類作成 • 新增專案分類'}
          </h3>
          <button onClick={onClose} className="p-1 text-natural-light hover:text-natural-dark rounded-md">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-natural-text">分類名稱 (カテゴリ名)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：仕事、個人學習、日和紀錄..."
              maxLength={20}
              className="w-full px-3 py-1.5 text-xs font-sans placeholder-natural-muted bg-natural-badge border border-natural-border rounded-lg focus:outline-none focus:border-natural-primary focus:bg-white transition-all text-natural-dark"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-natural-text">日本傳統色・和風配色 (カラー)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {JAPANESE_PALETTE.map((color) => {
                const isSelected = colorHex === color.hex;
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setColorHex(color.hex)}
                    className="flex items-center justify-between p-2 rounded-lg border text-[10px] font-medium text-left transition-all cursor-pointer"
                    style={{
                      backgroundColor: color.hex,
                      borderColor: isSelected ? '#5a5a40' : color.border,
                      boxShadow: isSelected ? '0 1px 3px 0 rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <span style={{ color: color.text }}>{color.name}</span>
                    {isSelected && (
                      <Check size={12} className="text-natural-dark font-bold" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-natural-border">
            {editingProject && onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={saving}
                className="px-3 py-1.5 text-xs font-sans font-medium text-red-700 bg-red-50 hover:bg-red-100/60 rounded-md transition-all cursor-pointer disabled:opacity-50"
              >
                刪除分類
              </button>
            )}
            <div className="flex-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-sans font-medium text-natural-light hover:text-natural-dark bg-natural-badge rounded-md transition-all cursor-pointer border border-natural-border/30"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-3 py-1.5 text-xs font-sans font-medium text-white bg-natural-primary hover:bg-natural-primary-hover rounded-md shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? '保存中...' : '確認儲存'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
