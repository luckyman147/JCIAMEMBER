
import { createBrowserRouter } from 'react-router-dom'
import Login from '../features/Authentication/pages/LoginPage'
import Register from '../features/Authentication/pages/register'
import Home from '../features/Home/pages/home'
import RhAdvisorPage from '../features/Authentication/pages/RhAdvisorPage'
import UnauthorizedPage from '../Global_Components/UnauthorizedPage'
import ProtectedRoute from '../Global_Components/ProtectedRoute'
import ErrorBoundary from '../lib/ErrorBoundary'
import AllActivitiesPage from '../features/Activities/pages/AllActivitiesPage'
import ActivityForm from '../features/Activities/pages/ActivityForm'
import ActivityDetails from '../features/Activities/pages/ActivityDetails'
import { TeamsPage, TeamDetailsPage } from '../features/Teams'
import RecruitmentPage from '../features/Recruitment/pages/RecruitmentPage'
import TemplateCreatePage from '../features/Recruitment/pages/TemplateCreatePage'
import CandidateEvaluationPage from '../features/Recruitment/pages/CandidateEvaluationPage'
import MembersPage from '../features/Members/pages/MembersPage'
import MemberDetailsPage from '../features/Members/pages/MemberDetailsPage'
import { EXECUTIVE_LEVELS } from '../utils/roles'

export const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <Home /> },
  { path: '/pending-validation', element: <RhAdvisorPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  
  // Guest-only routes (login/register)
  {
    path: '/register',
    element: (
      <ProtectedRoute requireGuest={true}>
        <ErrorBoundary>
          <Register />
        </ErrorBoundary>
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <ProtectedRoute requireGuest={true}>
        <Login />
      </ProtectedRoute>
    ),
  },

  // Activities routes
  {
    path: '/activities',
    element: (
      <ProtectedRoute>
        <AllActivitiesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/activities/new',
    element: (
      <ProtectedRoute allowedRoles={EXECUTIVE_LEVELS}>
        <ActivityForm />
      </ProtectedRoute>
    ),
  },
  {
    path: '/activities/:id/edit',
    element: (
      <ProtectedRoute allowedRoles={EXECUTIVE_LEVELS}>
        <ActivityForm />
      </ProtectedRoute>
    ),
  },
  {
    path: '/activities/:id/GET',
    element: <ActivityDetails />,
  },

  // Teams routes
  {
    path: '/teams',
    element: (
      <ProtectedRoute>
        <TeamsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/teams/:id',
    element: (
      <ProtectedRoute>
        <TeamDetailsPage />
      </ProtectedRoute>
    ),
  },

  // Recruitment routes
  {
    path: '/recruitment',
    element: (
      <ProtectedRoute allowedRoles={EXECUTIVE_LEVELS}>
        <RecruitmentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/recruitment/templates/:id/edit',
    element: (
      <ProtectedRoute allowedRoles={EXECUTIVE_LEVELS}>
        <TemplateCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/recruitment/templates/new',
    element: (
      <ProtectedRoute allowedRoles={EXECUTIVE_LEVELS}>
        <TemplateCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/recruitment/candidates/:id',
    element: (
      <ProtectedRoute allowedRoles={EXECUTIVE_LEVELS}>
        <CandidateEvaluationPage />
      </ProtectedRoute>
    ),
  },

  // Members routes
  {
    path: '/members',
    element: (
      <ProtectedRoute allowedRoles={EXECUTIVE_LEVELS}>
        <MembersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/members/:id',
    element: (
      <ProtectedRoute>
        <MemberDetailsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/me',
    element: (
      <ProtectedRoute>
        <MemberDetailsPage />
      </ProtectedRoute>
    ),
  },
])
