import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { User, Lock, Flower2, Phone } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useApp } from '@/app/context/AppContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getFirstAvailablePage } from '@/app/utils/permissions';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithCredentials, currentUser } = useApp();
  const { t, currentLanguage } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const firstAvailablePage = getFirstAvailablePage(currentUser);
      navigate(firstAvailablePage, { replace: true });
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const success = await loginWithCredentials({ username, password });
      if (!success) {
        setError(
          currentLanguage === 'ar'
            ? 'اسم المستخدم أو كلمة المرور غير صحيحة'
            : 'Invalid username or password'
        );
      }
      // Redirect is handled by useEffect when currentUser is set (avoids race with context update)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-8">
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-2xl">
              <Flower2 className="w-8 h-8 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">Hi Salon</h1>
              <p className="text-sm text-gray-500">{currentLanguage === 'ar' ? 'بساطة في الإدارة، تميز في الخدمة' : 'Simple Management, Excellent Service'}</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('loginTitle')}</h2>
            <p className="text-gray-600">{t('loginSubtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('username')}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-12"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-12"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                <span className="text-sm text-gray-600 ml-2">{t('rememberMe')}</span>
              </label>
              <Link 
                to="/support"
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6 rounded-xl text-lg font-medium"
            >
              {isSubmitting ? (currentLanguage === 'ar' ? 'جاري الدخول...' : 'Signing in...') : t('login')}
            </Button>

            <div className="text-center">
              <span className="text-gray-600">{currentLanguage === 'ar' ? 'هل تواجه مشكلة في الدخول؟ ' : 'Having trouble logging in? '}</span>
              <Link 
                to="/support"
                className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                {currentLanguage === 'ar' ? 'اتصل بالدعم الفني' : 'Contact Support'}
              </Link>
            </div>
          </form>
        </div>

        {/* Right Side - Welcome Section */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 p-8 md:p-12 flex flex-col justify-center items-center text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="mb-8 flex justify-center">
              <div className="w-80 h-80 bg-white/20 backdrop-blur-md rounded-3xl p-6 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=800&fit=crop"
                  alt={currentLanguage === 'ar' ? 'مركز التجميل' : 'Beauty Center'}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4">
              {currentLanguage === 'ar' ? 'أدِر مركزك بكل سهولة وبساطة' : 'Manage Your Center with Ease'}
            </h2>
            <p className="text-lg text-white/90 max-w-md mx-auto">
              {currentLanguage === 'ar' ? 'خلي الجمال شغلك، والإدارة علينا' : 'Focus on Beauty, Leave Management to Us'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}