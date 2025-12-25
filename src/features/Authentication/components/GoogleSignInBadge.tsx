import React from 'react';
import { useAuth } from '../auth.context';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';

const GoogleSignInBadge: React.FC = () => {
  const { googleSignIn } = useAuth();
  const { t } = useTranslation();

  return (
    <button
      onClick={() => googleSignIn()}
      className="group relative flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-1.5 pe-4 rounded-full shadow-md hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 animate-in fade-in slide-in-from-right-4"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
            fill="#EA4335"
          />
        </svg>
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">
          {t('auth.fastConnect')}
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
          {t('auth.continueWithGoogle')}
        </span>
      </div>
      <div className="ms-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <LogIn className="w-3 h-3 text-blue-500" />
      </div>
    </button>
  );
};

export default GoogleSignInBadge;
