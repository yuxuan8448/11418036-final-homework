import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from './firebase';
import { Project, Task, ActiveView, FilterType } from './types';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TaskCard from './components/TaskCard';
import CalendarView from './components/CalendarView';
import TaskModal from './components/TaskModal';
import CategoryModal from './components/CategoryModal';
import AuthModal from './components/AuthModal';
import { Plus, ListFilter, Leaf, CalendarClock, FolderCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Real-time collections state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // App view controls
  const [activeView, setActiveView] = useState<ActiveView>('list');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Editing contexts
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Date pre-set for calendar manual days trigger
  const [modalPresetDate, setModalPresetDate] = useState<string | null>(null);

  // 1. Subscribe to Authentication status changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
      
      if (!currentUser) {
        // Clear state if logged out
        setTasks([]);
        setProjects([]);
        setIsAuthModalOpen(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time synchronizations from Firestore (Auth guarded)
  useEffect(() => {
    if (!user) return;

    // Real-time synchronization of Projects (Custom categories)
    const projectsPath = 'projects';
    const qProjects = query(
      collection(db, projectsPath),
      where('userId', '==', user.uid)
    );

    const unsubProjects = onSnapshot(
      qProjects,
      (snapshot) => {
        const list: Project[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Project);
        });
        
        // Sort in memory by createdAt to avoid composite index requirement
        list.sort((a, b) => {
          const tA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt.seconds || 0) * 1000) : 0;
          const tB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt.seconds || 0) * 1000) : 0;
          return tA - tB;
        });
        
        setProjects(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, projectsPath);
      }
    );

    // Real-time synchronization of Tasks
    const tasksPath = 'tasks';
    const qTasks = query(
      collection(db, tasksPath),
      where('userId', '==', user.uid)
    );

    const unsubTasks = onSnapshot(
      qTasks,
      (snapshot) => {
        const list: Task[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Task);
        });
        
        // Sort in memory by dueDate to avoid composite index requirement
        list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
        
        setTasks(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, tasksPath);
      }
    );

    return () => {
      unsubProjects();
      unsubTasks();
    };
  }, [user]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Custom counts calculation for Sidebar labels
  const getFilterCounts = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const counts = {
      all: tasks.length,
      today: tasks.filter(t => t.dueDate === todayStr && !t.completed).length,
      upcoming: tasks.filter(t => t.dueDate > todayStr && !t.completed).length,
      completed: tasks.filter(t => t.completed).length,
      projectCounts: {} as Record<string, number>,
    };

    projects.forEach(p => {
      counts.projectCounts[p.id] = tasks.filter(t => t.projectId === p.id && !t.completed).length;
    });

    return counts;
  };

  // Tasks mutation helpers
  const handleSaveTask = async (taskData: Partial<Task>, id?: string) => {
    if (!user) return;
    const tasksPath = 'tasks';

    try {
      if (id) {
        // Edit item
        const taskRef = doc(db, tasksPath, id);
        await updateDoc(taskRef, {
          ...taskData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create item
        const generatedId = doc(collection(db, tasksPath)).id;
        await setDoc(doc(db, tasksPath, generatedId), {
          ...taskData,
          id: generatedId,
          completed: false,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, `${tasksPath}/${id || 'new'}`);
    }
  };

  const handleToggleTaskComplete = async (taskId: string, currentStatus: boolean) => {
    if (!user) return;
    const tasksPath = 'tasks';
    try {
      const taskRef = doc(db, tasksPath, taskId);
      await updateDoc(taskRef, {
        completed: !currentStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${tasksPath}/${taskId}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    const tasksPath = 'tasks';
    try {
      await deleteDoc(doc(db, tasksPath, taskId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${tasksPath}/${taskId}`);
    }
  };

  // Projects / Category mutation helpers
  const handleSaveCategory = async (name: string, colorHex: string, id?: string) => {
    if (!user) return;
    const projectsPath = 'projects';

    try {
      if (id) {
        const projectRef = doc(db, projectsPath, id);
        await updateDoc(projectRef, {
          name,
          color: colorHex,
        });
      } else {
        const generatedId = doc(collection(db, projectsPath)).id;
        await setDoc(doc(db, projectsPath, generatedId), {
          id: generatedId,
          name,
          color: colorHex,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, `${projectsPath}/${id || 'new'}`);
    }
  };

  const handleDeleteCategory = async (projectId: string) => {
    if (!user) return;
    const projectsPath = 'projects';
    const tasksPath = 'tasks';

    try {
      // 1. Delete project category itself
      await deleteDoc(doc(db, projectsPath, projectId));

      // 2. Uncategorize any tasks locked under this project
      const affectedTasks = tasks.filter(t => t.projectId === projectId);
      for (const t of affectedTasks) {
        await updateDoc(doc(db, tasksPath, t.id), {
          projectId: '',
          category: '未分類',
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${projectsPath}/${projectId}`);
    }
  };

  // Triggering new task creation preset on calendar click
  const handleAddTaskOnDateClick = (dateStr: string) => {
    setEditingTask(null);
    setModalPresetDate(dateStr);
    setIsTaskModalOpen(true);
  };

  // Combined Task Filters & search
  const filteredTasks = tasks.filter((task) => {
    // 1. Global text search match
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(queryLower);
      const matchDesc = task.description?.toLowerCase().includes(queryLower) || false;
      const matchCategory = task.category?.toLowerCase().includes(queryLower) || false;
      if (!matchTitle && !matchDesc && !matchCategory) return false;
    }

    // 2. Sidebar active list category filter
    if (activeFilter === 'project') {
      return task.projectId === selectedProjectId;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (activeFilter === 'today') {
      return task.dueDate === todayStr && !task.completed;
    }
    if (activeFilter === 'upcoming') {
      return task.dueDate > todayStr && !task.completed;
    }
    if (activeFilter === 'completed') {
      return task.completed;
    }

    return true; // 'all'
  });

  const getActiveFilterTitle = () => {
    if (activeFilter === 'project') {
      const proj = projects.find(p => p.id === selectedProjectId);
      return proj ? `專案分類：${proj.name}` : '未分類行程';
    }
    if (activeFilter === 'today') return '本日待辦日程 (今日的分)';
    if (activeFilter === 'upcoming') return '未來規劃日程 (今後の予定)';
    if (activeFilter === 'completed') return '已完成手帳 (完了済記録)';
    return '全部日程 (すべての記録)';
  };

  // Render centered spinner during authenticating state
  if (authChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-natural-bg font-sans">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-natural-border/50 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-t-natural-primary rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-[10px] font-medium text-natural-light font-sans tracking-widest uppercase">
          手帳載入中 • Loading Planner
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col selection:bg-natural-border/30">
      
      {/* 1. Universal Top Navbar Header */}
      <Navbar
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogout={handleLogout}
        onTriggerLogin={() => setIsAuthModalOpen(true)}
      />

      {/* 2. Main Workspace Layout */}
      {user ? (
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-8 gap-6">
          
          {/* Responsive Left Sidebar options */}
          <Sidebar
            projects={projects}
            activeView={activeView}
            setActiveView={setActiveView}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            counts={getFilterCounts()}
            onAddCategoryClick={() => {
              setEditingProject(null);
              setIsCategoryModalOpen(true);
            }}
            onEditCategoryClick={(proj) => {
              setEditingProject(proj);
              setIsCategoryModalOpen(true);
            }}
          />

          {/* Right Workspace Board */}
          <main className="flex-1 min-w-0 flex flex-col gap-5">
            
            {/* Board Title Section and Floating Addition Trigger */}
            <div className="flex items-center justify-between p-4 bg-white border border-natural-card-border rounded-xl shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 rounded bg-natural-primary"></div>
                <div>
                  <h2 className="text-xs md:text-sm font-semibold text-natural-dark tracking-tight">
                    {getActiveFilterTitle()}
                  </h2>
                  <p className="text-[10px] text-natural-light font-sans leading-none mt-0.5">
                    日系手帳 • {filteredTasks.length} 個行程記錄
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingTask(null);
                  setModalPresetDate(null);
                  setIsTaskModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-natural-primary hover:bg-natural-primary-hover rounded-lg shadow-sm transition-all cursor-pointer"
                id="create-task-trigger-btn"
              >
                <Plus size={14} />
                <span>新增日程 (作成)</span>
              </button>
            </div>

            {/* View Grid rendering switches */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {activeView === 'list' ? (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                    id="task-list-view"
                  >
                    {filteredTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white border border-dashed border-natural-border rounded-2xl">
                        <Leaf size={32} className="text-natural-light animate-bounce mb-3" />
                        <h3 className="font-sans text-xs font-semibold text-natural-dark">
                          這裡很安靜 (待件なし)
                        </h3>
                        <p className="text-xs text-natural-light mt-1 max-w-sm leading-relaxed">
                          沒有找到相符的手帳行程。點擊上方「新增日程」，或更換其他日期分類來記錄生活細微。
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            onToggleComplete={handleToggleTaskComplete}
                            onEdit={(taskItem) => {
                              setEditingTask(taskItem);
                              setIsTaskModalOpen(true);
                            }}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    id="task-calendar-view"
                  >
                    <CalendarView
                      tasks={tasks}
                      projects={projects}
                      onAddTaskOnDate={handleAddTaskOnDateClick}
                      onEditTask={(taskItem) => {
                        setEditingTask(taskItem);
                        setIsTaskModalOpen(true);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </main>
        </div>
      ) : (
        /* Landing Showcase Centered welcome Board (when logged out) */
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-natural-border rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
            
            {/* Visual Intro side */}
            <div className="bg-[#f5f5f0] p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-natural-border relative">
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-natural-border text-natural-primary">
                  <Leaf size={18} className="text-natural-primary" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-semibold text-natural-dark tracking-tight">Komorebi 日系手帳</h2>
                  <p className="text-[10px] text-natural-light font-mono tracking-widest uppercase">Personal Schedule Planner</p>
                </div>
                <p className="text-xs text-natural-text leading-relaxed font-sans">
                  一個專心致志於尋求內心平靜與日程精進而設計的個人手帳系統。融合古典和風美學的大自然色調、專案自訂指標分類、生活作息指引與優美的行事曆視圖，帶給您安靜雅致的時間調度體驗。
                </p>
              </div>

              {/* Serene Bento highlights */}
              <div className="space-y-3 pt-6">
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-natural-card-border shadow-xs">
                  <CalendarClock size={16} className="text-amber-700" />
                  <div className="text-left">
                    <h4 className="text-xs font-semibold text-natural-dark leading-tight">日曆日程可視化</h4>
                    <p className="text-[10px] text-natural-light">雙向視圖無縫切換，一目瞭然</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-natural-card-border shadow-xs">
                  <FolderCheck size={16} className="text-natural-primary" />
                  <div className="text-left">
                    <h4 className="text-xs font-semibold text-natural-dark leading-tight">日本傳統和風分層</h4>
                    <p className="text-[10px] text-natural-light">美化專案類別標籤，裝扮您的手帳</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 font-mono text-[9px] text-[#5a5a40] text-center uppercase tracking-wider">
                暮色手帳 • KOMOREBI SYSTEM
              </div>
            </div>

            {/* Prompt Authenticate Login Trigger side */}
            <div className="p-8 bg-white flex flex-col justify-center items-center text-center space-y-6">
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-natural-dark">開始體驗唯美手帳</h3>
                <p className="text-xs text-natural-light max-w-xs mx-auto">
                  安全加密的使用者身份驗證系統，支援帳號密碼與 Google 認證，保存您神聖的每日計劃。
                </p>
              </div>

              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full max-w-xs py-3 px-4 text-xs font-semibold text-white bg-natural-primary hover:bg-natural-primary-hover active:bg-natural-dark rounded-xl shadow-md transition-all cursor-pointer"
                id="landing-login-btn"
              >
                註冊 / 登入手帳帳本
              </button>

              <p className="text-[10px] text-natural-light font-light italic">
                “ 記錄生活的碎片，拼湊完整的自己。 ”
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 3. Global Control Modals */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onSuccess={() => setIsAuthModalOpen(false)}
          />
        )}

        {isTaskModalOpen && (
          <TaskModal
            isOpen={isTaskModalOpen}
            onClose={() => {
              setIsTaskModalOpen(false);
              setEditingTask(null);
              setModalPresetDate(null);
            }}
            onSave={async (taskData, id) => {
              // If we have preset date from calendar day click:
              if (!id && modalPresetDate) {
                taskData.dueDate = modalPresetDate;
              }
              await handleSaveTask(taskData, id);
            }}
            editingTask={editingTask}
            projects={projects}
          />
        )}

        {isCategoryModalOpen && (
          <CategoryModal
            isOpen={isCategoryModalOpen}
            onClose={() => {
              setIsCategoryModalOpen(false);
              setEditingProject(null);
            }}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
            editingProject={editingProject}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
