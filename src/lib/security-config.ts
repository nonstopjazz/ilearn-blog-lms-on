// src/lib/security-config.ts

/**
 * 安全配置文件
 * 用於管理用戶權限和管理員設定
 */

// 管理員 Email 列表 (在真實環境中，這應該來自環境變數或資料庫)
export const ADMIN_EMAILS = [
  // 'admin@example.com',  // 已註解掉的範例 email
  // 'admin@yourdomain.com', // 已註解掉的範例 email
  
  'nonstopjazz@gmail.com',  // 您的管理員 email
  
  // 注意：在生產環境中，建議使用環境變數來管理這些設定
  // 例如：process.env.ADMIN_EMAILS?.split(',') || []
];

// 角色定義
export enum UserRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor', 
  STUDENT = 'student',
  GUEST = 'guest'
}

// 權限定義
export enum Permission {
  // 管理員權限
  ADMIN_ACCESS = 'admin_access',
  USER_MANAGEMENT = 'user_management',
  COURSE_MANAGEMENT = 'course_management',
  QUIZ_MANAGEMENT = 'quiz_management',
  BLOG_MANAGEMENT = 'blog_management',
  ANALYTICS_ACCESS = 'analytics_access',
  SYSTEM_SETTINGS = 'system_settings',
  
  // 教師權限
  COURSE_CREATE = 'course_create',
  COURSE_EDIT = 'course_edit',
  QUIZ_CREATE = 'quiz_create',
  QUIZ_EDIT = 'quiz_edit',
  
  // 學生權限
  COURSE_ACCESS = 'course_access',
  QUIZ_TAKE = 'quiz_take',
  BLOG_READ = 'blog_read',
}

// 角色權限對應
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.ADMIN_ACCESS,
    Permission.USER_MANAGEMENT,
    Permission.COURSE_MANAGEMENT,
    Permission.QUIZ_MANAGEMENT,
    Permission.BLOG_MANAGEMENT,
    Permission.ANALYTICS_ACCESS,
    Permission.SYSTEM_SETTINGS,
    Permission.COURSE_CREATE,
    Permission.COURSE_EDIT,
    Permission.QUIZ_CREATE,
    Permission.QUIZ_EDIT,
    Permission.COURSE_ACCESS,
    Permission.QUIZ_TAKE,
    Permission.BLOG_READ,
  ],
  [UserRole.INSTRUCTOR]: [
    Permission.COURSE_CREATE,
    Permission.COURSE_EDIT,
    Permission.QUIZ_CREATE,
    Permission.QUIZ_EDIT,
    Permission.COURSE_ACCESS,
    Permission.QUIZ_TAKE,
    Permission.BLOG_READ,
  ],
  [UserRole.STUDENT]: [
    Permission.COURSE_ACCESS,
    Permission.QUIZ_TAKE,
    Permission.BLOG_READ,
  ],
  [UserRole.GUEST]: [
    Permission.BLOG_READ,
  ],
};

// 受保護的路由
export const PROTECTED_ROUTES = {
  // 需要管理員權限的路由
  ADMIN_ONLY: [
    '/admin',
    '/admin/*'
  ],
  
  // 需要認證但不需要特殊權限的路由
  AUTH_REQUIRED: [
    '/my-courses',
    '/quiz/*/take',
    '/user/*'
  ],
  
  // 完全公開的路由
  PUBLIC: [
    '/',
    '/auth',
    '/blog',
    '/blog/*',
    '/courses',
    '/courses/*',
    '/quiz',
    '/unauthorized'
  ]
};

/**
 * 檢查用戶是否為管理員
 * @param user Supabase 用戶對象
 * @returns 是否為管理員
 */
export function isAdmin(user: any): boolean {
  if (!user) return false;
  
  // 方法1: 檢查用戶 metadata
  if (user.user_metadata?.role === UserRole.ADMIN || user.user_metadata?.is_admin) {
    return true;
  }
  
  // 方法2: 檢查 email 白名單
  if (user.email && ADMIN_EMAILS.includes(user.email)) {
    return true;
  }
  
  return false;
}

/**
 * 獲取用戶角色
 * @param user Supabase 用戶對象
 * @returns 用戶角色
 */
export function getUserRole(user: any): UserRole {
  if (!user) return UserRole.GUEST;
  
  if (isAdmin(user)) return UserRole.ADMIN;
  
  // 檢查其他角色
  const metadataRole = user.user_metadata?.role;
  if (metadataRole && Object.values(UserRole).includes(metadataRole)) {
    return metadataRole;
  }
  
  // 預設為學生
  return UserRole.STUDENT;
}

/**
 * 檢查用戶是否有特定權限
 * @param user Supabase 用戶對象
 * @param permission 權限
 * @returns 是否有權限
 */
export function hasPermission(user: any, permission: Permission): boolean {
  const role = getUserRole(user);
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * 檢查路由是否需要特定權限
 * @param pathname 路由路徑
 * @returns 所需權限級別
 */
export function getRoutePermissionLevel(pathname: string): 'public' | 'auth' | 'admin' {
  // 檢查是否為管理員路由
  if (PROTECTED_ROUTES.ADMIN_ONLY.some(route => {
    if (route.endsWith('/*')) {
      return pathname.startsWith(route.slice(0, -2));
    }
    return pathname === route;
  })) {
    return 'admin';
  }
  
  // 檢查是否需要認證
  if (PROTECTED_ROUTES.AUTH_REQUIRED.some(route => {
    if (route.endsWith('/*')) {
      return pathname.startsWith(route.slice(0, -2));
    }
    return pathname === route;
  })) {
    return 'auth';
  }
  
  // 預設為公開
  return 'public';
}

/**
 * 安全配置驗證
 * 確保管理員配置正確
 */
export function validateSecurityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 檢查是否有管理員配置
  if (ADMIN_EMAILS.length === 0) {
    errors.push('警告：沒有配置任何管理員 email');
  }
  
  // 檢查是否包含範例 email
  if (ADMIN_EMAILS.includes('admin@example.com')) {
    errors.push('安全警告：請移除範例管理員 email (admin@example.com)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}