import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import BeansPage from './pages/BeansPage'
import BeanFormPage from './pages/BeanFormPage'
import BeanDetailPage from './pages/BeanDetailPage'
import ExtractionsPage from './pages/ExtractionsPage'
import ExtractionFormPage from './pages/ExtractionFormPage'
import BestRecipesPage from './pages/BestRecipesPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/beans" replace />} />
          <Route path="beans" element={<BeansPage />} />
          <Route path="beans/new" element={<BeanFormPage />} />
          <Route path="beans/:id" element={<BeanDetailPage />} />
          <Route path="beans/:id/edit" element={<BeanFormPage />} />
          <Route path="extractions" element={<ExtractionsPage />} />
          <Route path="extractions/new" element={<ExtractionFormPage />} />
          <Route path="extractions/new/:beanId" element={<ExtractionFormPage />} />
          <Route path="best-recipes" element={<BestRecipesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
