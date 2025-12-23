import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Resources } from './pages/Resources'
import { Users as UsersPage } from './pages/Users'
import { Tasks } from './pages/Tasks'
import { Sectors } from './pages/Sectors'
import { SectorDetail } from './pages/SectorDetail'
import { Meetings } from './pages/Meetings'
import { Layout } from './components/Layout'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="sectors" element={<Sectors />} />
              <Route path="sectors/:id" element={<SectorDetail />} />
              <Route path="sectors/my-sector" element={<SectorDetail />} />
              <Route path="resources" element={<Resources />} />
              <Route path="meetings" element={<Meetings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
