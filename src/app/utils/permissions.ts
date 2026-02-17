/**
 * Helper function to get the first available page for a user based on permissions
 * @param user - The current user object with role and permissions
 * @returns The path to the first available page
 */
export function getFirstAvailablePage(user: { role: string; permissions?: Record<string, boolean> } | null): string {
  if (!user) return '/dashboard';
  
  // Admin has access to all pages, default to dashboard
  if (user.role === 'admin') {
    return '/dashboard';
  }

  // Define menu items with their paths and permissions (same order as in Sidebar)
  const menuItems = [
    { path: '/dashboard', permission: 'dashboard' },
    { path: '/pos', permission: 'sales' },
    { path: '/invoices', permission: 'sales' },
    { path: '/customers', permission: 'customers' },
    { path: '/appointments', permission: 'appointments' },
    { path: '/inventory', permission: 'inventory' },
    { path: '/services', permission: 'services' },
    { path: '/expenses', permission: 'expenses' },
    { path: '/shifts', permission: 'shifts' },
    { path: '/employees', permission: 'employees' },
    { path: '/attendance', permission: 'attendance' },
    { path: '/payroll', permission: 'payroll' },
    { path: '/reports', permission: 'reports' },
    { path: '/suppliers', permission: 'suppliers' },
    { path: '/settings', permission: 'settings' },
  ];

  // Find the first page the user has permission for
  for (const item of menuItems) {
    if (user.permissions?.[item.permission as keyof typeof user.permissions] === true) {
      return item.path;
    }
  }

  // If no permissions found, default to dashboard (will show access denied)
  return '/dashboard';
}
