import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import './App.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router/router'

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position='top-center' />
    </>
  )
}

export default App
