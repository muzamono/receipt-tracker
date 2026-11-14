import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'
import MonthlyDetail from './pages/MonthlyDetail'

export default function App() {
  return (
    <BrowserRouter>
      <header style={{
        padding: '20px 16px 12px',
        borderBottom: '1px solid #E5E2DA'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          kira-kira
        </h1>
      </header>

      <main style={{ flex: 1, padding: '16px' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/monthly" element={<MonthlyDetail />} />
        </Routes>
      </main>

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: '480px',
        margin: '0 auto',
        display: 'flex',
        borderTop: '1px solid #E5E2DA',
        background: '#FAFAF8'
      }}>
        {[
          { to: '/', label: 'Dashboard' },
          { to: '/expenses', label: 'Expenses' },
          { to: '/settings', label: 'Settings' }
        ].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              flex: 1,
              textAlign: 'center',
              padding: '14px 0',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              color: isActive ? '#5B8A72' : '#8A8780',
              borderTop: isActive ? '2px solid #5B8A72' : '2px solid transparent'
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </BrowserRouter>
  )
}