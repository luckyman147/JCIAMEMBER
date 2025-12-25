import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/Authentication/auth.context';
import { useTranslation } from 'react-i18next';
import { X, LogIn, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const FloatingGoogleAuth: React.FC = () => {
  const { user, googleSignIn, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show after 10 seconds if not logged in and not dismissed
    if (!user && !loading && !isDismissed && !isVisible) {
      const showTimer = setTimeout(() => setIsVisible(true), 10000);
      return () => clearTimeout(showTimer);
    }
    
    // Once visible, hide after 10 seconds and mark as dismissed so it doesn't loop
    if (isVisible) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setIsDismissed(true);
      }, 10000);
      return () => clearTimeout(hideTimer);
    }

    if (user) {
      setIsVisible(false);
    }
  }, [user, loading, isDismissed, isVisible]);

  if (!isVisible || user || ['/login', '/register'].includes(location.pathname)) return null;

  const isRTL = i18n.language === 'ar';

  return (
    <div 
      className={`fixed bottom-24 left-4 right-4 md:bottom-6 md:left-auto ${isRTL ? 'md:left-6 md:right-auto' : 'md:right-6'} md:w-auto z-[100] animate-in slide-in-from-bottom-10 fade-in duration-700`}
    >
      <div className="relative group max-w-sm mx-auto md:max-w-none">
        {/* Main Badge */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-slate-700 p-5 w-full md:min-w-[360px] overflow-hidden flex flex-col gap-4">
          
          {/* Close Button */}
          <button 
            onClick={() => {
                setIsVisible(false);
                setIsDismissed(true);
            }}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* User Preview Logic - In a real app we'd try to get Hint, here we use a generic prompt */}
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 flex items-center justify-center relative overflow-hidden shrink-0 shadow-inner">
                <svg viewBox="0 0 24 24" className="w-7 h-7">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                </svg>
             </div>
             <div className="flex flex-col min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{t('auth.fastConnect')}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{t('auth.continueWithGoogle')}</p>
             </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => googleSignIn()}
            className="w-full bg-(--color-myPrimary) hover:bg-(--color-myAccent) text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 group/btn"
          >
            <LogIn className="w-4 h-4" />
            {t('auth.signIn')}
            <ChevronRight className={`w-4 h-4 transition-transform group-hover/btn:translate-x-1 ${isRTL ? 'rotate-180' : ''}`} />
          </button>

          {/* Bottom Branding */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
             <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Secure Google Authentication</span>
          </div>
        </div>

        {/* Floating Ring Decor */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-[20px] blur opacity-10 group-hover:opacity-20 transition-opacity -z-10"></div>
      </div>
    </div>
  );
};

export default FloatingGoogleAuth;
