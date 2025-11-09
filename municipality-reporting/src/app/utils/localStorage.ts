// utils/localStorage.ts
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: string;
}

const USERS_KEY = "limpopo_users";
const CURRENT_USER_KEY = "limpopo_current_user";

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
};
