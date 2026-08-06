import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import client, { receiptImageUrl, baseURL } from '../api/client'
import ExpenseForm from '../components/ExpenseForm'
import MonthPicker from '../components/MonthPicker'

export default function Expenses() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [formMode, setFormMode] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)

  function fetchExpenses() {
    client.get('/expenses').then(res => setExpenses(res.data))
  }

  function fetchCategories() {
    client.get('/categories').then(res => setCategories(res.data))
  }

  function fetchPaymentTypes() {
    client.get('/payment-types').then(res => setPaymentTypes(res.data))
  }

  useEffect(() => {
    fetchExpenses()
    fetchCategories()
    fetchPaymentTypes()
  }, [])

  function handleDelete(id) {
    client.delete(`/expenses/${id}`).then(fetchExpenses)
  }

  function handleDone() {
    setFormMode(null)
    setEditingExpense(null)
    fetchExpenses()
  }

  function startEdit(expense) {
    setEditingExpense(expense)
    setFormMode('edit')
  }

  function startAdd() {
    setEditingExpense(null)
    setFormMode(formMode === 'add' ? null : 'add')
  }

  function getCategory(id) {
    return categories.find(c => c.id === id)
  }

  function getPaymentType(id) {
    return paymentTypes.find(p => p.id === id)
  }

  const now = new Date()
  const hasMonthFilter = searchParams.has('year') && searchParams.has('month')
  const year = hasMonthFilter ? parseInt(searchParams.get('year')) : now.getFullYear()
  const month = hasMonthFilter ? parseInt(searchParams.get('month')) : now.getMonth()

  function handleMonthChange(newYear, newMonth) {
    setSearchParams({ year: newYear, month: newMonth })
  }

  function clearFilter() {
    setSearchParams({})
  }

  const filteredExpenses = hasMonthFilter
    ? expenses.filter(e => {
        const d = new Date(e.expense_date)
        return d.getMonth() === month && d.getFullYear() === year
      })
    : expenses

  const csvUrl = hasMonthFilter
    ? `${baseURL}/expenses/export/csv?year=${year}&month=${month}`
    : `${baseURL}/expenses/export/csv`

  return (
    <div>
      {hasMonthFilter ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <MonthPicker year={year} month={month} onChange={handleMonthChange} />
          </div>
          <button
            onClick={clearFilter}
            style={{
              background: 'none',
              border: '1px solid #E5E2DA',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#1A1A1A',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Show All
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', color: '#8A8780' }}>Showing all expenses</span>
          <button
            onClick={() => handleMonthChange(now.getFullYear(), now.getMonth())}
            style={{
              background: 'none',
              border: '1px solid #E5E2DA',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#1A1A1A',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Filter by Month
          </button>
        </div>
      )}

      <a
        href={csvUrl}
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '12px',
          border: '1px solid #E5E2DA',
          borderRadius: '10px',
          fontSize: '14px',
          color: '#1A1A1A',
          textDecoration: 'none',
          marginBottom: '10px'
        }}
      >
        {hasMonthFilter ? 'Export CSV (this month)' : 'Export CSV (all)'}
      </a>

      <button
        onClick={startAdd}
        style={{
          width: '100%',
          padding: '14px',
          background: formMode === 'add' ? '#E5E2DA' : '#5B8A72',
          color: formMode === 'add' ? '#1A1A1A' : '#FAFAF8',
          border: 'none',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: 600,
          marginBottom: '16px'
        }}
      >
        {formMode === 'add' ? 'Cancel' : '+ Add Expense'}
      </button>

      {formMode && (
        <div style={{ marginBottom: '20px' }}>
          <ExpenseForm onSuccess={handleDone} expense={editingExpense} />
          {formMode === 'edit' && (
            <button
              onClick={() => { setFormMode(null); setEditingExpense(null) }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'none',
                border: '1px solid #E5E2DA',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#8A8780',
                marginTop: '8px'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {filteredExpenses.length === 0 && (
        <p style={{ color: '#8A8780', fontSize: '14px' }}>No expenses to show.</p>
      )}

      {filteredExpenses.map(e => {
        const category = getCategory(e.category_id)
        const paymentType = getPaymentType(e.payment_type_id)
        const accentColor = category?.color || '#E5E2DA'

        return (
          <div key={e.id} style={{
            background: '#FFFFFF',
            border: '1px solid #E5E2DA',
            borderLeft: `4px solid ${accentColor}`,
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                  {e.merchant || 'Unnamed'}
                </p>
                <p className="mono" style={{ fontSize: '12px', color: '#8A8780', marginBottom: '2px' }}>
                  {e.expense_date}
                </p>
                {category && (
                  <p style={{ fontSize: '12px', color: '#8A8780', marginBottom: '2px' }}>
                    {category.name}
                  </p>
                )}
                {paymentType && (
                  <p style={{ fontSize: '12px', color: '#8A8780', marginBottom: '2px' }}>
                    {paymentType.name}
                  </p>
                )}
                {e.notes && (
                  <p style={{ fontSize: '13px', color: '#8A8780', marginTop: '4px' }}>
                    Notes: {e.notes}
                  </p>
                )}
                {e.receipt?.file_path && (
                  <a href={receiptImageUrl(e.receipt.file_path)} target="_blank" rel="noopener noreferrer">
                    <img
                      src={receiptImageUrl(e.receipt.file_path)}
                      alt="Receipt"
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px', border: '1px solid #E5E2DA' }}
                    />
                  </a>
                )}
              </div>
              <span className="mono" style={{ fontWeight: 600, fontSize: '15px', color: '#5B8A72', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                {e.currency} {parseFloat(e.total_amount).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => startEdit(e)}
                style={{ background: 'none', border: 'none', color: '#5B8A72', fontSize: '12px', cursor: 'pointer', padding: 0 }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(e.id)}
                style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: '12px', cursor: 'pointer', padding: 0 }}
              >
                Delete
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}