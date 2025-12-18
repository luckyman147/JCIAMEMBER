import { Toaster } from 'sonner'
import './App.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router/router'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position='top-center' />
    </>
  )
}

export default App
