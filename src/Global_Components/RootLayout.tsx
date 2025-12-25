import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import FloatingGoogleAuth from './FloatingGoogleAuth';

export default function RootLayout() {
  return (
    <>
      <Outlet />
      <FloatingGoogleAuth />
      <Toaster richColors position='top-center' />
    </>
  );
}
