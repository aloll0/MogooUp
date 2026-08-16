import { api } from "./api";

// Workspace interfaces
export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMember {
  _id: string;
  workspaceId: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  role: "owner" | "admin" | "manager" | "member" | "guest";
  status: "active" | "invited" | "suspended";
}

// Client Project interfaces
export interface ClientProjectService {
  name: string;
  isChecked: boolean;
}

export interface ClientProject {
  _id: string;
  workspaceId: string;
  clientName: string;
  description?: string;
  services: ClientProjectService[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Space interfaces
export interface Space {
  _id: string;
  workspaceId: string;
  name: string;
  description?: string;
  color?: string;
  isPrivate: boolean;
  allowedMembers: string[];
}

// List interfaces
export interface List {
  _id: string;
  spaceId: string;
  folderId?: string | null;
  name: string;
  position: number;
}

export interface Attachment {
  name: string;
  url: string;
  publicId: string;
  size: number;
}

export interface LoggedTimeEntry {
  _id?: string;
  userId: string;
  hours: number;
  comment?: string;
  date?: string;
}

export interface ChecklistItem {
  _id?: string;
  title: string;
  isCompleted: boolean;
}

// Task interfaces
export interface Task {
  _id: string;
  workspaceId: string;
  spaceId: string;
  listId: string;
  parentTaskId?: string | null;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignees: Array<{
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  }>;
  reporterId: string;
  startDate?: string | null;
  dueDate?: string | null;
  tags: string[];
  attachments: Attachment[];
  checklist?: ChecklistItem[];
  position: number;
  timeEstimate?: number;
  loggedTime?: LoggedTimeEntry[];
  needsRevision?: boolean;
  revisionNotes?: Array<{
    _id?: string;
    notes: string;
    requestedBy: {
      _id: string;
      fullName: string;
      email: string;
      avatarUrl?: string;
    } | string;
    createdAt: string;
  }>;
}

export interface Comment {
  _id: string;
  taskId: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  content: string;
  mentions: string[];
  createdAt: string;
}

// Goals & OKRs interfaces
export interface KeyResult {
  _id?: string;
  title: string;
  targetType: "percentage" | "number";
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
}

export interface Goal {
  _id: string;
  workspaceId: string;
  ownerId: string;
  title: string;
  description: string;
  status: "active" | "completed" | "cancelled";
  startDate?: string | null;
  endDate?: string | null;
  keyResults: KeyResult[];
  createdAt: string;
  updatedAt: string;
}

// Scratchpad interfaces
export interface Scratchpad {
  _id: string;
  userId: string;
  content: string;
}

// Activity Log interfaces
export interface ActivityLog {
  _id: string;
  workspaceId: string;
  userId: {
    _id: string;
    fullName: string;
    avatarUrl?: string;
  };
  entityType: "task" | "workspace" | "list" | "space" | "folder";
  entityId: string;
  action: "created" | "updated" | "deleted" | "moved";
  details?: {
    title?: string;
    changes?: Record<string, any>;
  };
  createdAt: string;
}

export const taskflowService = {
  // Workspaces
  getWorkspaces: async (): Promise<Workspace[]> => {
    const response = await api.get("/workspaces");
    return response.data.data.workspaces;
  },

  getWorkspaceBySlug: async (slug: string): Promise<Workspace> => {
    const response = await api.get(`/workspaces/slug/${slug}`);
    return response.data.data.workspace;
  },

  createWorkspace: async (name: string, slug?: string): Promise<Workspace> => {
    const response = await api.post("/workspaces", { name, slug });
    return response.data.data.workspace;
  },

  getWorkspaceMembers: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const response = await api.get(`/workspaces/${workspaceId}/members`);
    return response.data.data.members;
  },

  inviteWorkspaceMember: async (workspaceId: string, email: string, role: string): Promise<any> => {
    const response = await api.post(`/workspaces/${workspaceId}/invite`, { email, role });
    return response.data.data;
  },

  updateWorkspaceMemberRole: async (workspaceId: string, userId: string, role: string): Promise<any> => {
    const response = await api.put(`/workspaces/${workspaceId}/members`, { userId, role });
    return response.data.data;
  },

  // Spaces
  getSpaces: async (workspaceId: string): Promise<Space[]> => {
    const response = await api.get(`/spaces/workspace/${workspaceId}`);
    return response.data.data.spaces;
  },

  createSpace: async (spaceData: {
    workspaceId: string;
    name: string;
    description?: string;
    color?: string;
    isPrivate?: boolean;
    allowedMembers?: string[];
  }): Promise<Space> => {
    const response = await api.post("/spaces", spaceData);
    return response.data.data.space;
  },

  deleteSpace: async (spaceId: string): Promise<void> => {
    await api.delete(`/spaces/${spaceId}`);
  },

  // Lists
  getLists: async (spaceId: string): Promise<List[]> => {
    const response = await api.get(`/lists/space/${spaceId}`);
    return response.data.data.lists;
  },

  createList: async (spaceId: string, name: string, position: number, folderId?: string | null): Promise<List> => {
    const response = await api.post("/lists", { spaceId, folderId, name, position });
    return response.data.data.list;
  },

  updateList: async (listId: string, updateData: Partial<List>): Promise<List> => {
    const response = await api.put(`/lists/${listId}`, updateData);
    return response.data.data.list;
  },

  deleteList: async (listId: string): Promise<void> => {
    await api.delete(`/lists/${listId}`);
  },

  // Tasks
  getTasksByList: async (listId: string): Promise<Task[]> => {
    const response = await api.get(`/tasks/list/${listId}`);
    return response.data.data.tasks;
  },

  getTasksByWorkspace: async (workspaceId: string): Promise<Task[]> => {
    const response = await api.get(`/tasks/workspace/${workspaceId}`);
    return response.data.data.tasks;
  },

  getTaskById: async (taskId: string): Promise<Task> => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data.data.task;
  },

  createTask: async (taskData: {
    listId: string;
    title: string;
    description?: string;
    priority?: string;
    assignees?: string[];
  }): Promise<Task> => {
    const response = await api.post("/tasks", taskData);
    return response.data.data.task;
  },

  updateTask: async (taskId: string, updateData: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/${taskId}`, updateData);
    return response.data.data.task;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  // Comments
  getComments: async (taskId: string): Promise<Comment[]> => {
    const response = await api.get(`/comments/task/${taskId}`);
    return response.data.data.comments;
  },

  createComment: async (taskId: string, content: string, mentions: string[] = []): Promise<Comment> => {
    const response = await api.post("/comments", { taskId, content, mentions });
    return response.data.data.comment;
  },

  // Notifications
  getNotifications: async (): Promise<any[]> => {
    const response = await api.get("/notifications");
    return response.data.data.notifications;
  },

  markNotificationAsRead: async (notificationId: string): Promise<any> => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data.data.notification;
  },

  markAllNotificationsAsRead: async (): Promise<any> => {
    const response = await api.post("/notifications/mark-all-read");
    return response.data.data;
  },

  // Scratchpad API
  getScratchpad: async (): Promise<Scratchpad> => {
    const response = await api.get("/scratchpad");
    return response.data.data.scratchpad;
  },

  updateScratchpad: async (content: string): Promise<Scratchpad> => {
    const response = await api.put("/scratchpad", { content });
    return response.data.data.scratchpad;
  },

  // Goals & OKRs API
  getGoals: async (workspaceId: string): Promise<Goal[]> => {
    const response = await api.get(`/goals/workspace/${workspaceId}`);
    return response.data.data.goals;
  },

  createGoal: async (goalData: {
    workspaceId: string;
    title: string;
    description?: string;
    startDate?: string | null;
    endDate?: string | null;
    keyResults?: KeyResult[];
  }): Promise<Goal> => {
    const response = await api.post("/goals", goalData);
    return response.data.data.goal;
  },

  updateGoal: async (goalId: string, updateData: Partial<Goal>): Promise<Goal> => {
    const response = await api.put(`/goals/${goalId}`, updateData);
    return response.data.data.goal;
  },

  deleteGoal: async (goalId: string): Promise<void> => {
    await api.delete(`/goals/${goalId}`);
  },

  // Activities
  getTaskActivities: async (taskId: string): Promise<ActivityLog[]> => {
    const response = await api.get(`/activities/task/${taskId}`);
    return response.data.data.activities;
  },

  // System Administration
  getAdminUsers: async (): Promise<any[]> => {
    const response = await api.get("/auth/admin/users");
    return response.data.data.users;
  },

  approveUser: async (userId: string): Promise<any> => {
    const response = await api.put(`/auth/admin/users/${userId}/approve`);
    return response.data.data.user;
  },

  suspendUser: async (userId: string): Promise<any> => {
    const response = await api.put(`/auth/admin/users/${userId}/suspend`);
    return response.data.data.user;
  },

  getAdminWorkspaces: async (): Promise<any[]> => {
    const response = await api.get("/auth/admin/workspaces");
    return response.data.data.workspaces;
  },

  requestTaskRevision: async (taskId: string, data: { notes: string; assigneeId?: string; listId?: string }): Promise<Task> => {
    const response = await api.post(`/tasks/${taskId}/revision`, data);
    return response.data.data.task;
  },

  // Client Projects & Services Checklist
  getClientProjects: async (workspaceId: string): Promise<ClientProject[]> => {
    const response = await api.get(`/workspaces/${workspaceId}/clients`);
    return response.data.data.clients;
  },

  createClientProject: async (workspaceId: string, data: Partial<ClientProject>): Promise<ClientProject> => {
    const response = await api.post(`/workspaces/${workspaceId}/clients`, data);
    return response.data.data.client;
  },

  updateClientProject: async (workspaceId: string, clientId: string, data: Partial<ClientProject>): Promise<ClientProject> => {
    const response = await api.put(`/workspaces/${workspaceId}/clients/${clientId}`, data);
    return response.data.data.client;
  },

  deleteClientProject: async (workspaceId: string, clientId: string): Promise<void> => {
    await api.delete(`/workspaces/${workspaceId}/clients/${clientId}`);
  },
};
