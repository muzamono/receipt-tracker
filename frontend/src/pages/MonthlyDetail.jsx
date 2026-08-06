import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import client from '../api/client'
import MonthPicker from '../components/MonthPicker'

const COLORS = ['#5B8A72', '#C49A6C', '#8A8780', '#A65D57', '#7A9CC6', '#B8A1C9', '#D4B483']

export default function MonthlyDetail() {
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

  const byCategory = {}
  filtered.forEach(e => {
    const cat = e.category_id || 'none'
    byCategory[cat] = (byCategory[cat] || 0) + parseFloat(e.total_amount)
  })

  const categoryName = (id) => {
    if (id === 'none') return 'Uncategorized'
    const found = categories.find(c => c.id === parseInt(id))
    return found ? found.name : 'Unknown'
  }

  const categoryColor = (id) => {
    if (id === 'none') return '#8A8780'
    const found = categories.find(c => c.id === parseInt(id))
    return found?.color || '#8A8780'
  }

  const chartData = Object.entries(byCategory).map(([cat, amount]) => ({
    name: categoryName(cat),
    value: amount,
    color: categoryColor(cat)
  }))

  const total = filtered.reduce((sum, e) => sum + parseFloat(e.total_amount), 0)

  return (
    <div>
      <button
        onClick={() => navigate(`/?year=${year}&month=${month}`)}
        style={{
          background: 'none',
          border: 'none',
          color: '#5B8A72',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '16px',
          padding: 0,
          cursor: 'pointer'
        }}
      >
        ← Back to Dashboard
      </button>

      <div style={{ marginBottom: '16px' }}>
        <MonthPicker year={year} month={month} onChange={handleMonthChange} />
      </div>

      <p className="mono" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '20px' }}>
        RM {total.toFixed(2)}
      </p>

      {chartData.length === 0 ? (
        <p style={{ color: '#8A8780', fontSize: '14px' }}>No expenses to show for this month.</p>
      ) : (
        <>
          <div style={{ height: '260px', marginBottom: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `RM ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {chartData
            .sort((a, b) => b.value - a.value)
            .map((entry) => (
              <div key={entry.name} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px dashed #E5E2DA'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: entry.color,
                    display: 'inline-block'
                  }} />
                  <span style={{ fontSize: '14px' }}>{entry.name}</span>
                </div>
                <span className="mono" style={{ fontSize: '14px', fontWeight: 500 }}>
                  RM {entry.value.toFixed(2)}
                </span>
              </div>
            ))}
        </>
      )}
    </div>
  )
}