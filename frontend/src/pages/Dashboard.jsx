import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import client from '../api/client'
import MonthPicker from '../components/MonthPicker'

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])

  const now = new Date()
  const year = parseInt(searchParams.get('year')) || now.getFullYear()
  const month = searchParams.get('month') !== null ? parseInt(searchParams.get('month')) : now.getMonth()

  useEffect(() => {
    client.get('/expenses').then(res => setExpenses(res.data))
    client.get('/categories').then(res => setCategories(res.data))
  }, [])

  function handleMonthChange(newYear, newMonth) {
    setSearchParams({ year: newYear, month: newMonth })
  }

  const filtered = expenses.filter(e => {
    const d = new Date(e.expense_date)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const total = filtered.reduce((sum, e) => sum + parseFloat(e.total_amount), 0)

  const byCategory = {}
  filtered.forEach(e => {
    const cat = e.category_id || 'Uncategorized'
    byCategory[cat] = (byCategory[cat] || 0) + parseFloat(e.total_amount)
  })

  const categoryName = (id) => {
    if (id === 'Uncategorized') return 'Uncategorized'
    const found = categories.find(c => c.id === parseInt(id))
    return found ? found.name : 'Unknown'
  }

  return (
    <div>
      <div style={{
        background: '#1A1A1A',
        color: '#FAFAF8',
        borderRadius: '12px',
        padding: '20px 20px 24px',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <MonthPicker year={year} month={month} onChange={handleMonthChange} dark />
        </div>
        <div onClick={() => navigate(`/monthly?year=${year}&month=${month}`)} style={{ cursor: 'pointer' }}>
          <p className="mono" style={{ fontSize: '32px', fontWeight: 600 }}>
            RM {total.toFixed(2)}
          </p>
          <p style={{ fontSize: '12px', color: '#8A8780', marginTop: '8px' }}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} · Tap for breakdown
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#8A8780', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        By Category
      </h2>

      {Object.entries(byCategory).length === 0 && (
        <p style={{ color: '#8A8780', fontSize: '14px' }}>No expenses logged this month.</p>
      )}

      {Object.entries(byCategory).map(([cat, amount]) => (
        <div key={cat} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px dashed #E5E2DA'
        }}>
          <span style={{ fontSize: '14px' }}>{categoryName(cat)}</span>
          <span className="mono" style={{ fontSize: '14px', fontWeight: 500 }}>
            RM {amount.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )
}