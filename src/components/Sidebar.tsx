import { Project, ActiveView, FilterType } from '../types';
import { 
  Calendar, 
  ListTodo, 
  Clock, 
  Compass, 
  CheckSquare, 
  Folder, 
  FolderPlus, 
  ChevronRight,
  Settings,
  Flame,
  Plus
} from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  onAddCategoryClick: () => void;
  onEditCategoryClick: (project: Project) => void;
  counts: {
    all: number;
    today: number;
    upcoming: number;
    completed: number;
    projectCounts: Record<string, number>;
  };
}

export default function Sidebar({
  projects,
  activeView,
  setActiveView,
  activeFilter,
  setActiveFilter,
  selectedProjectId,
  setSelectedProjectId,
  onAddCategoryClick,
  onEditCategoryClick,
  counts,
}: SidebarProps) {

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
    setSelectedProjectId(null);
  };

  const handleProjectClick = (projectId: string) => {
    setActiveFilter('project');
    setSelectedProjectId(projectId);
  };

  return (
    <aside className="w-full md:w-64 bg-natural-sidebar border-r border-natural-border p-6 flex flex-col gap-6" id="app-sidebar">
      
      {/* 1. Schedulers View Mode (List vs Day Calendar Grid) */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase text-natural-muted tracking-widest font-sans">
          表示形式 • 視圖切換
        </h3>
        <div className="grid grid-cols-2 gap-1 p-1 bg-natural-badge rounded-lg border border-natural-border/40">
          <button
            onClick={() => setActiveView('list')}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-sans font-medium rounded-md transition-all cursor-pointer ${
              activeView === 'list' 
                ? 'bg-white text-natural-primary shadow-sm' 
                : 'text-natural-light hover:text-natural-dark hover:bg-natural-badge-hover/50'
            }`}
            id="sidebar-view-list"
          >
            <ListTodo size={14} />
            <span>任務看板</span>
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-sans font-medium rounded-md transition-all cursor-pointer ${
              activeView === 'calendar' 
                ? 'bg-white text-natural-primary shadow-sm' 
                : 'text-natural-light hover:text-natural-dark hover:bg-natural-badge-hover/50'
            }`}
            id="sidebar-view-calendar"
          >
            <Calendar size={14} />
            <span>行事曆</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Date and State Filters */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-semibold uppercase text-natural-muted tracking-widest font-sans mb-2">
          時間過濾 • 行程分類
        </h3>
        <nav className="space-y-1">
          <button
            onClick={() => handleFilterClick('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-sans text-left transition-all cursor-pointer ${
              activeFilter === 'all' && !selectedProjectId
                ? 'bg-white text-natural-primary shadow-sm border border-natural-border/60'
                : 'text-natural-light hover:bg-natural-badge-hover hover:text-natural-dark'
            }`}
            id="filter-all-btn"
          >
            <div className="flex items-center gap-2">
              <Compass size={14} className={activeFilter === 'all' && !selectedProjectId ? 'text-natural-primary' : 'text-natural-light'} />
              <span>所有行程 (すべて)</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              activeFilter === 'all' && !selectedProjectId ? 'bg-natural-badge text-natural-primary' : 'bg-natural-badge text-natural-light'
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => handleFilterClick('today')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-sans text-left transition-all cursor-pointer ${
              activeFilter === 'today' && !selectedProjectId
                ? 'bg-white text-natural-primary shadow-sm border border-natural-border/60'
                : 'text-natural-light hover:bg-natural-badge-hover hover:text-natural-dark'
            }`}
            id="filter-today-btn"
          >
            <div className="flex items-center gap-2">
              <Clock size={14} className={activeFilter === 'today' && !selectedProjectId ? 'text-natural-primary' : 'text-amber-700'} />
              <span>今日日程 (今日)</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              activeFilter === 'today' && !selectedProjectId ? 'bg-natural-badge text-natural-primary' : 'bg-natural-badge text-natural-light'
            }`}>
              {counts.today}
            </span>
          </button>

          <button
            onClick={() => handleFilterClick('upcoming')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-sans text-left transition-all cursor-pointer ${
              activeFilter === 'upcoming' && !selectedProjectId
                ? 'bg-white text-natural-primary shadow-sm border border-natural-border/60'
                : 'text-natural-light hover:bg-natural-badge-hover hover:text-natural-dark'
            }`}
            id="filter-upcoming-btn"
          >
            <div className="flex items-center gap-2">
              <Flame size={14} className={activeFilter === 'upcoming' && !selectedProjectId ? 'text-natural-primary' : 'text-indigo-600'} />
              <span>即將到來 (今後)</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              activeFilter === 'upcoming' && !selectedProjectId ? 'bg-natural-badge text-natural-primary' : 'bg-natural-badge text-natural-light'
            }`}>
              {counts.upcoming}
            </span>
          </button>

          <button
            onClick={() => handleFilterClick('completed')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-sans text-left transition-all cursor-pointer ${
              activeFilter === 'completed' && !selectedProjectId
                ? 'bg-white text-natural-primary shadow-sm border border-natural-border/60'
                : 'text-natural-light hover:bg-natural-badge-hover hover:text-natural-dark'
            }`}
            id="filter-completed-btn"
          >
            <div className="flex items-center gap-2">
              <CheckSquare size={14} className={activeFilter === 'completed' && !selectedProjectId ? 'text-natural-primary' : 'text-emerald-700'} />
              <span>已完成 (完了済み)</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              activeFilter === 'completed' && !selectedProjectId ? 'bg-emerald-50 text-emerald-800' : 'bg-natural-badge text-natural-light'
            }`}>
              {counts.completed}
            </span>
          </button>
        </nav>
      </div>

      {/* 3. Project Categories lists with customizable styles */}
      <div className="flex-1 flex flex-col gap-2 min-h-[220px]">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase text-natural-muted tracking-widest font-sans">
            專案分類 • カテゴリ
          </h3>
          <button
            onClick={onAddCategoryClick}
            className="p-1 hover:bg-natural-badge-hover text-natural-light hover:text-natural-dark rounded transition-colors cursor-pointer border border-transparent hover:border-natural-border"
            title="新增專案分類"
            id="add-category-btn"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
          {projects.length === 0 ? (
            <div className="px-3 py-4 text-center rounded-lg border border-dashed border-natural-border bg-natural-badge/40">
              <span className="text-[10px] text-natural-muted font-sans font-light">尚未建立專案分類</span>
            </div>
          ) : (
            projects.map((project) => {
              const isSelected = activeFilter === 'project' && selectedProjectId === project.id;
              const count = counts.projectCounts[project.id] || 0;
              return (
                <div
                  key={project.id}
                  className={`flex items-center justify-between group px-3 py-1.5 rounded-lg transition-all border ${
                    isSelected 
                      ? 'border-natural-primary/50 shadow-xs' 
                      : 'border-transparent hover:bg-natural-badge-hover hover:border-natural-border/40'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${project.color}30` : 'transparent',
                    color: isSelected ? '#5a5a40' : 'inherit'
                  }}
                >
                  <button
                    onClick={() => handleProjectClick(project.id)}
                    className="flex-1 flex items-center gap-2 text-xs font-medium font-sans text-left text-natural-text whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer"
                  >
                    <Folder size={12} className="shrink-0" style={{ color: project.color || '#5a5a40' }} />
                    <span className="truncate">{project.name}</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-natural-badge border border-natural-border/30 rounded text-natural-light">
                      {count}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCategoryClick(project);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-natural-dark text-natural-light rounded transition-opacity cursor-pointer duration-200"
                      title="分類設定"
                    >
                      <Settings size={11} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Japanese Zen Graphic footer detail */}
        <div className="pt-4 mt-auto border-t border-natural-border">
          <div className="p-3 bg-[#f5f5f0] border border-[#e0dfd5] rounded-xl">
            <h4 className="text-[10px] font-semibold text-natural-primary font-sans tracking-wide">
              【暮色禪語】
            </h4>
            <p className="text-[10px] text-natural-light mt-1 leading-relaxed font-sans font-light italic">
              "昨日已歸寂靜，明日尚在路上。唯有今日的光景，值得在手帳中一筆一劃地度過。"
            </p>
          </div>
        </div>
      </div>

    </aside>
  );
}
