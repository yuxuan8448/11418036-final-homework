export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt?: any;
}

export interface Project {
  id: string;
  name: string;
  color: string; // Pastel / muted Japanese theme color coding
  userId: string;
  createdAt: any;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  projectId: string; // references Project.id
  userId: string;    // references UserProfile.uid
  dueDate: string;   // format: 'YYYY-MM-DD'
  priority: TaskPriority;
  category: string;  // name of category (or direct Project connection)
  createdAt: any;
  updatedAt: any;
}

export type ActiveView = 'list' | 'calendar';
export type FilterType = 'all' | 'today' | 'upcoming' | 'completed' | 'project';
