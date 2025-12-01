import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { User, UserPreferences, Role, Permission, SystemSettings } from '@/types';

interface UserStore {
  // Current user
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // User preferences
  preferences: UserPreferences;
  
  // Roles and permissions
  roles: Role[];
  userPermissions: Permission[];
  
  // System settings
  systemSettings: SystemSettings[];
  
  // UI state
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  
  // Preferences
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setLastUsedPaymentMethod: (method: string) => void;
  setTableColumns: (tableId: string, columns: string[]) => void;
  
  // Permissions
  setRoles: (roles: Role[]) => void;
  setUserPermissions: (permissions: Permission[]) => void;
  
  // Permission checking
  hasPermission: (module: string, action: string, itemId?: string) => boolean;
  hasAnyPermission: (module: string, actions: string[]) => boolean;
  hasAllPermissions: (module: string, actions: string[]) => boolean;
  
  // System settings
  setSystemSettings: (settings: SystemSettings[]) => void;
  getSetting: (key: string, defaultValue?: any) => any;
  
  // UI state
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  
  // Role helpers
  getCurrentUserRole: () => Role | null;
  getCurrentUserRoleName: () => string;
  
  // Local storage helpers
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        (set, get) => ({
          // Initial state
          currentUser: null,
          isAuthenticated: false,
          preferences: {
            tableColumns: {},
            lastUsedPaymentMethod: 'cash',
            dateFormat: 'MM/dd/yyyy',
            currency: 'USD',
            timezone: 'UTC',
          },
          roles: [],
          userPermissions: [],
          systemSettings: [],
          sidebarCollapsed: false,
          theme: 'system',
          language: 'en',

          // Actions
          setCurrentUser: (user) => set({ currentUser: user }),
          
          setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

          // Preferences
          updatePreferences: (preferences) => set((state) => ({
            preferences: { ...state.preferences, ...preferences }
          })),

          setLastUsedPaymentMethod: (method) => set((state) => ({
            preferences: {
              ...state.preferences,
              lastUsedPaymentMethod: method,
            }
          })),

          setTableColumns: (tableId, columns) => set((state) => ({
            preferences: {
              ...state.preferences,
              tableColumns: {
                ...state.preferences.tableColumns,
                [tableId]: columns,
              },
            }
          })),

          // Permissions
          setRoles: (roles) => set({ roles }),
          
          setUserPermissions: (permissions) => set({ userPermissions: permissions }),

          // Permission checking
          hasPermission: (module, action, itemId) => {
            return true;
          },

          hasAnyPermission: (module, actions) => {
            return true;
          },

          hasAllPermissions: (module, actions) => {
            return true;
          },

          // System settings
          setSystemSettings: (settings) => set({ systemSettings: settings }),

          getSetting: (key, defaultValue = null) => {
            const { systemSettings } = get();
            const setting = systemSettings.find(s => s.key === key);
            return setting ? setting.value : defaultValue;
          },

          // UI state
          setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
          
          setTheme: (theme) => set({ theme }),
          
          setLanguage: (language) => set({ language }),

          // Role helpers
          getCurrentUserRole: () => {
            const { currentUser, roles } = get();
            if (!currentUser) return null;
            return roles.find(role => role.id === currentUser.roleId) || null;
          },

          getCurrentUserRoleName: () => {
            const role = get().getCurrentUserRole();
            return role?.name || 'Unknown';
          },

          // Local storage helpers
          saveToLocalStorage: () => {
            const { preferences, sidebarCollapsed, theme, language } = get();
            const data = {
              preferences,
              sidebarCollapsed,
              theme,
              language,
            };
            localStorage.setItem('user-store', JSON.stringify(data));
          },

          loadFromLocalStorage: () => {
            try {
              const stored = localStorage.getItem('user-store');
              if (stored) {
                const data = JSON.parse(stored);
                set(data);
              }
            } catch (error) {
              console.error('Error loading from localStorage:', error);
            }
          },
        })
      ),
      {
        name: 'user-store',
        partialize: (state) => ({
          preferences: state.preferences,
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          language: state.language,
        }),
      }
    )
  )
);
