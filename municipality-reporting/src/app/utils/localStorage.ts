// utils/localStorage.ts
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "resident" | "staff" | "employee";
  department?: string; // For employees: "roads", "water", "electricity", "waste", "safety", "parks"
  createdAt: string;
  preferences?: {
    emailNotifications: boolean;
    browserNotifications: boolean;
    theme: "light" | "dark";
  };
}

export interface StatusHistoryEntry {
  status: "pending" | "in-progress" | "resolved" | "rejected";
  changedBy: string; // user name or "System"
  changedAt: string;
  note?: string;
}

export interface Issue {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  photoData?: string; // Base64 encoded image
  aiCategory?: string;
  aiConfidence?: number;
  status: "pending" | "in-progress" | "resolved" | "rejected";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  staffNotes?: string;
  assignedTo?: string; // Legacy field - now using assignedToEmployee
  department?: string; // Department assigned to (e.g., "roads", "water", "electricity")
  assignedToEmployee?: string; // Employee ID assigned to handle this issue
  assignedToEmployeeName?: string; // Employee name for display
  assignedBy?: string; // Staff member who assigned the issue
  assignedAt?: string; // When the issue was assigned
  residentConfirmed?: boolean; // Resident confirmed issue is resolved
  residentConfirmedAt?: string; // When resident confirmed resolution
  residentRejected?: boolean; // Resident reported issue not resolved
  residentRejectedAt?: string; // When resident rejected resolution
  residentFeedback?: string; // Resident's feedback about the issue
  statusHistory?: StatusHistoryEntry[];
  viewCount?: number;
  // Comprehensive AI Analysis
  aiAnalysis?: {
    issueType: string;
    keywords: string[];
    detailedAnalysis: {
      problemIdentification: string;
      severityAssessment: string;
      impactAnalysis: string;
      rootCause: string;
      visualEvidence: string[];
    };
    recommendations: {
      immediateActions: string[];
      longTermSolutions: string[];
      preventiveMeasures: string[];
    };
    estimatedResolution: {
      timeframe: string;
      resources: string[];
      estimatedCost: string;
      workersRequired: number;
    };
    safetyConsiderations: {
      riskLevel: string;
      hazards: string[];
      precautions: string[];
    };
  };
}

const USERS_KEY = "limpopo_users";
const CURRENT_USER_KEY = "limpopo_current_user";
const ISSUES_KEY = "limpopo_issues";

// Simple hash function for password storage (for demo purposes)
// In production, use a proper backend with bcrypt or similar
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};

export const storageUtils = {
  // Get all users
  getUsers: (): User[] => {
    if (typeof window === "undefined") return [];
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  },

  // Add a new user
  addUser: (user: Omit<User, "id" | "createdAt">): User => {
    const users = storageUtils.getUsers();
    const newUser: User = {
      ...user,
      password: hashPassword(user.password), // Hash password before storing
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
  },

  // Find user by email
  findUserByEmail: (email: string): User | undefined => {
    const users = storageUtils.getUsers();
    return users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  },

  // Validate login
  validateLogin: (email: string, password: string): User | null => {
    const user = storageUtils.findUserByEmail(email);
    const hashedPassword = hashPassword(password);
    if (user && user.password === hashedPassword) {
      return user;
    }
    return null;
  },

  // Set current user
  setCurrentUser: (user: User): void => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  // Get current user
  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Check if email exists
  emailExists: (email: string): boolean => {
    return !!storageUtils.findUserByEmail(email);
  },

  // === ISSUES MANAGEMENT ===

  // Get all issues
  getIssues: (): Issue[] => {
    if (typeof window === "undefined") return [];
    const issues = localStorage.getItem(ISSUES_KEY);
    return issues ? JSON.parse(issues) : [];
  },

  // Add a new issue
  addIssue: (issue: Omit<Issue, "id" | "createdAt" | "updatedAt">): Issue => {
    const issues = storageUtils.getIssues();
    const newIssue: Issue = {
      ...issue,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0,
      statusHistory: [
        {
          status: issue.status,
          changedBy: "System",
          changedAt: new Date().toISOString(),
          note: "Report created",
        },
      ],
    };
    issues.push(newIssue);
    localStorage.setItem(ISSUES_KEY, JSON.stringify(issues));
    return newIssue;
  },

  // Get issues by user ID
  getIssuesByUser: (userId: string): Issue[] => {
    const issues = storageUtils.getIssues();
    return issues.filter((issue) => issue.userId === userId);
  },

  // Get issue by ID
  getIssueById: (issueId: string): Issue | undefined => {
    const issues = storageUtils.getIssues();
    return issues.find((issue) => issue.id === issueId);
  },

  // Update issue
  updateIssue: (
    issueId: string,
    updates: Partial<Issue>,
    changedBy?: string,
    note?: string
  ): Issue | null => {
    const issues = storageUtils.getIssues();
    const index = issues.findIndex((issue) => issue.id === issueId);

    if (index === -1) return null;

    const oldStatus = issues[index].status;
    const newStatus = updates.status;

    // Add status history if status changed
    const statusHistory = [...(issues[index].statusHistory || [])];
    if (newStatus && newStatus !== oldStatus) {
      statusHistory.push({
        status: newStatus,
        changedBy: changedBy || "System",
        changedAt: new Date().toISOString(),
        note,
      });
    }

    const updatedIssue = {
      ...issues[index],
      ...updates,
      statusHistory,
      updatedAt: new Date().toISOString(),
      resolvedAt:
        newStatus === "resolved" && !issues[index].resolvedAt
          ? new Date().toISOString()
          : issues[index].resolvedAt,
    };

    issues[index] = updatedIssue;
    localStorage.setItem(ISSUES_KEY, JSON.stringify(issues));
    return updatedIssue;
  },

  // Increment view count
  incrementViewCount: (issueId: string): void => {
    const issues = storageUtils.getIssues();
    const index = issues.findIndex((issue) => issue.id === issueId);

    if (index !== -1) {
      issues[index].viewCount = (issues[index].viewCount || 0) + 1;
      localStorage.setItem(ISSUES_KEY, JSON.stringify(issues));
    }
  },

  // Delete issue
  deleteIssue: (issueId: string): boolean => {
    const issues = storageUtils.getIssues();
    const filteredIssues = issues.filter((issue) => issue.id !== issueId);

    if (filteredIssues.length === issues.length) return false;

    localStorage.setItem(ISSUES_KEY, JSON.stringify(filteredIssues));
    return true;
  },

  // Get issues by status
  getIssuesByStatus: (status: Issue["status"]): Issue[] => {
    const issues = storageUtils.getIssues();
    return issues.filter((issue) => issue.status === status);
  },

  // Get issues statistics
  getIssuesStats: () => {
    const issues = storageUtils.getIssues();
    return {
      total: issues.length,
      pending: issues.filter((i) => i.status === "pending").length,
      inProgress: issues.filter((i) => i.status === "in-progress").length,
      resolved: issues.filter((i) => i.status === "resolved").length,
      rejected: issues.filter((i) => i.status === "rejected").length,
      urgent: issues.filter((i) => i.priority === "urgent").length,
      high: issues.filter((i) => i.priority === "high").length,
    };
  },

  // Get employees by department
  getEmployeesByDepartment: (department: string): User[] => {
    const users = storageUtils.getUsers();
    return users.filter(
      (user) => user.role === "employee" && user.department === department
    );
  },

  // Get all employees
  getAllEmployees: (): User[] => {
    const users = storageUtils.getUsers();
    return users.filter((user) => user.role === "employee");
  },

  // Get issues assigned to employee
  getIssuesAssignedToEmployee: (employeeId: string): Issue[] => {
    const issues = storageUtils.getIssues();
    return issues.filter((issue) => issue.assignedToEmployee === employeeId);
  },

  // Get issues by department
  getIssuesByDepartment: (department: string): Issue[] => {
    const issues = storageUtils.getIssues();
    return issues.filter((issue) => issue.department === department);
  },

  // Assign issue to department and employee
  assignIssue: (
    issueId: string,
    department: string,
    employeeId: string,
    employeeName: string,
    assignedBy: string
  ): Issue | null => {
    const issues = storageUtils.getIssues();
    const index = issues.findIndex((issue) => issue.id === issueId);

    if (index === -1) return null;

    const statusHistory = [...(issues[index].statusHistory || [])];
    statusHistory.push({
      status: issues[index].status,
      changedBy: assignedBy,
      changedAt: new Date().toISOString(),
      note: `Assigned to ${department} department - ${employeeName}`,
    });

    const updatedIssue = {
      ...issues[index],
      department,
      assignedToEmployee: employeeId,
      assignedToEmployeeName: employeeName,
      assignedBy,
      assignedAt: new Date().toISOString(),
      statusHistory,
      updatedAt: new Date().toISOString(),
    };

    issues[index] = updatedIssue;
    localStorage.setItem(ISSUES_KEY, JSON.stringify(issues));
    return updatedIssue;
  },

  // Resident confirms issue resolution
  confirmResolution: (issueId: string, residentName: string): Issue | null => {
    const issues = storageUtils.getIssues();
    const index = issues.findIndex((issue) => issue.id === issueId);

    if (index === -1) return null;

    const statusHistory = [...(issues[index].statusHistory || [])];
    statusHistory.push({
      status: issues[index].status,
      changedBy: residentName,
      changedAt: new Date().toISOString(),
      note: "Resident confirmed issue has been resolved",
    });

    const updatedIssue = {
      ...issues[index],
      residentConfirmed: true,
      residentConfirmedAt: new Date().toISOString(),
      statusHistory,
      updatedAt: new Date().toISOString(),
    };

    issues[index] = updatedIssue;
    localStorage.setItem(ISSUES_KEY, JSON.stringify(issues));
    return updatedIssue;
  },

  // Resident reports issue not resolved
  rejectResolution: (
    issueId: string,
    residentName: string,
    feedback: string
  ): Issue | null => {
    const issues = storageUtils.getIssues();
    const index = issues.findIndex((issue) => issue.id === issueId);

    if (index === -1) return null;

    const statusHistory = [...(issues[index].statusHistory || [])];
    statusHistory.push({
      status: "in-progress",
      changedBy: residentName,
      changedAt: new Date().toISOString(),
      note: `Resident reported issue not resolved: ${feedback}`,
    });

    const updatedIssue = {
      ...issues[index],
      status: "in-progress" as const,
      residentRejected: true,
      residentRejectedAt: new Date().toISOString(),
      residentFeedback: feedback,
      statusHistory,
      updatedAt: new Date().toISOString(),
    };

    issues[index] = updatedIssue;
    localStorage.setItem(ISSUES_KEY, JSON.stringify(issues));
    return updatedIssue;
  },
};

// Dashboard-specific data types and utilities
export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "active" | "pending" | "completed";
  createdAt: string;
  userId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
  userId: string;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  size: string;
  uploadedAt: string;
  userId: string;
}

const SERVICES_KEY = "limpopo_services";
const NOTIFICATIONS_KEY = "limpopo_notifications";
const DOCUMENTS_KEY = "limpopo_documents";

export const dashboardUtils = {
  // Services
  getServices: (userId: string): Service[] => {
    if (typeof window === "undefined") return [];
    const services = localStorage.getItem(SERVICES_KEY);
    const allServices: Service[] = services ? JSON.parse(services) : [];
    return allServices.filter((service) => service.userId === userId);
  },

  addService: (
    service: Omit<Service, "id" | "createdAt">,
    userId: string
  ): Service => {
    const services = localStorage.getItem(SERVICES_KEY);
    const allServices: Service[] = services ? JSON.parse(services) : [];
    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      userId,
    };
    allServices.push(newService);
    localStorage.setItem(SERVICES_KEY, JSON.stringify(allServices));
    return newService;
  },

  updateServiceStatus: (serviceId: string, status: Service["status"]): void => {
    const services = localStorage.getItem(SERVICES_KEY);
    const allServices: Service[] = services ? JSON.parse(services) : [];
    const updatedServices = allServices.map((service) =>
      service.id === serviceId ? { ...service, status } : service
    );
    localStorage.setItem(SERVICES_KEY, JSON.stringify(updatedServices));
  },

  // Notifications
  getNotifications: (userId: string): Notification[] => {
    if (typeof window === "undefined") return [];
    const notifications = localStorage.getItem(NOTIFICATIONS_KEY);
    const allNotifications: Notification[] = notifications
      ? JSON.parse(notifications)
      : [];
    return allNotifications.filter((notif) => notif.userId === userId);
  },

  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "read">,
    userId: string
  ): Notification => {
    const notifications = localStorage.getItem(NOTIFICATIONS_KEY);
    const allNotifications: Notification[] = notifications
      ? JSON.parse(notifications)
      : [];
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
      userId,
    };
    allNotifications.push(newNotification);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(allNotifications));
    return newNotification;
  },

  markNotificationAsRead: (notificationId: string): void => {
    const notifications = localStorage.getItem(NOTIFICATIONS_KEY);
    const allNotifications: Notification[] = notifications
      ? JSON.parse(notifications)
      : [];
    const updatedNotifications = allNotifications.map((notif) =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    localStorage.setItem(
      NOTIFICATIONS_KEY,
      JSON.stringify(updatedNotifications)
    );
  },

  getUnreadNotificationsCount: (userId: string): number => {
    const notifications = dashboardUtils.getNotifications(userId);
    return notifications.filter((notif) => !notif.read).length;
  },

  // Documents
  getDocuments: (userId: string): Document[] => {
    if (typeof window === "undefined") return [];
    const documents = localStorage.getItem(DOCUMENTS_KEY);
    const allDocuments: Document[] = documents ? JSON.parse(documents) : [];
    return allDocuments.filter((doc) => doc.userId === userId);
  },

  addDocument: (
    document: Omit<Document, "id" | "uploadedAt">,
    userId: string
  ): Document => {
    const documents = localStorage.getItem(DOCUMENTS_KEY);
    const allDocuments: Document[] = documents ? JSON.parse(documents) : [];
    const newDocument: Document = {
      ...document,
      id: Date.now().toString(),
      uploadedAt: new Date().toISOString(),
      userId,
    };
    allDocuments.push(newDocument);
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(allDocuments));
    return newDocument;
  },

  deleteDocument: (documentId: string): void => {
    const documents = localStorage.getItem(DOCUMENTS_KEY);
    const allDocuments: Document[] = documents ? JSON.parse(documents) : [];
    const updatedDocuments = allDocuments.filter(
      (doc) => doc.id !== documentId
    );
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updatedDocuments));
  },

  // Initialize sample data for new user
  initializeSampleData: (userId: string): void => {
    // Add sample services
    dashboardUtils.addService(
      {
        title: "ID Document Application",
        description: "Application for new ID document",
        category: "Documents",
        status: "pending",
        userId: userId,
      },
      userId
    );

    dashboardUtils.addService(
      {
        title: "Business License Renewal",
        description: "Annual business license renewal",
        category: "Business",
        status: "active",
        userId: userId,
      },
      userId
    );

    // Add sample notifications
    dashboardUtils.addNotification(
      {
        title: "Welcome to Limpopo Portal",
        message:
          "Your account has been successfully created. Explore the dashboard to access government services.",
        type: "success",
        userId: userId,
      },
      userId
    );

    dashboardUtils.addNotification(
      {
        title: "Document Verification Required",
        message:
          "Please upload your proof of residence to complete your profile.",
        type: "warning",
        userId: userId,
      },
      userId
    );
  },
};
