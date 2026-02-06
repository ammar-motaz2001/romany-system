import { Navigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
}

export default function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  // Always call hooks at the top level
  const { currentUser } = useApp();

  // If no current user, redirect to login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // If user is admin, grant access to all routes
  if (currentUser.role === 'admin') {
    return <>{children}</>;
  }

  // If no specific permission is required, allow access
  if (!permission) {
    return <>{children}</>;
  }

  // Check if user has the required permission
  const hasPermission = currentUser.permissions?.[permission as keyof typeof currentUser.permissions];

  if (!hasPermission) {
    // Show a "No Access" message instead of redirecting
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح لك بالدخول</h2>
          <p className="text-gray-600 mb-6">ليس لديك صلاحية للوصول إلى هذه الصفحة. يرجى التواصل مع المدير للحصول على الصلاحيات اللازمة.</p>
          <a 
            href="/dashboard" 
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            العودة للوحة التحكم
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}