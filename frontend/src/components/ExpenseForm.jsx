import { useState, useEffect } from 'react'
import client, { uploadReceipt, receiptImageUrl } from '../api/client'

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #E5E2DA',
  borderRadius: '8px',
  fontSize: '15px',
  background: '#FFFFFF',
  fontFamily: 'inherit'
}

const emptyForm = {
  merchant: '',
  expense_date: new Date().toISOString().split('T')[0],
  total_amount: '',
  currency: 'MYR',
  category_id: '',
  payment_type_id: '',
  notes: '',
  receipt_id: null
}

export default function ExpenseForm({ onSuccess, expense }) {
  const [categories, setCategories] = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    client.get('/categories').then(res => setCategories(res.data))
    client.get('/payment-types').then(res => setPaymentTypes(res.data))
  }, [])

  useEffect(() => {
    if (expense) {
      setForm({
        merchant: expense.merchant || '',
        expense_date: expense.expense_date,
        total_amount: expense.total_amount,
        currency: expense.currency,
        category_id: expense.category_id || '',
        payment_type_id: expense.payment_type_id || '',
        notes: expense.notes || '',
        receipt_id: expense.receipt_id || null
      })
      if (expense.receipt?.file_path) {
        setPhotoPreview(receiptImageUrl(expense.receipt.file_path))
      }
    }
  }, [expense])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setPhotoPreview(URL.createObjectURL(file))
    setUploading(true)

    uploadReceipt(file).then(res => {
      setForm(f => ({ ...f, receipt_id: res.data.id }))
      setUploading(false)
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      ...form,
      total_amount: parseFloat(form.total_amount),
      category_id: parseInt(form.category_id),
      payment_type_id: form.payment_type_id ? parseInt(form.payment_type_id) : null
    }

    const request = expense
      ? client.put(`/expenses/${expense.id}`, payload)
      : client.post('/expenses', payload)

    request.then(() => {
      onSuccess()
      if (!expense) {
        setForm(emptyForm)
        setPhotoPreview(null)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <input name="merchant" placeholder="Merchant" value={form.merchant} onChange={handleChange} style={inputStyle} />
      <input name="expense_date" type="date" value={form.expense_date} onChange={handleChange} required style={inputStyle} />
      <input name="total_amount" type="number" step="0.01" placeholder="Amount" value={form.total_amount} onChange={handleChange} required style={inputStyle} />
      <select name="category_id" value={form.category_id} onChange={handleChange} required style={inputStyle}>
        <option value="">Select category</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select name="payment_type_id" value={form.payment_type_id} onChange={handleChange} style={inputStyle}>
        <option value="">Select payment type (optional)</option>
        {paymentTypes.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <input name="notes" placeholder="Notes (optional)" value={form.notes} onChange={handleChange} style={inputStyle} />

      <label style={{
        display: 'block',
        padding: '12px',
        border: '1px dashed #E5E2DA',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#8A8780',
        textAlign: 'center',
        cursor: 'pointer'
      }}>
        {uploading ? 'Uploading...' : photoPreview ? 'Change Receipt Photo' : 'Add Receipt Photo'}
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          style={{ display: 'none' }}
        />
      </label>

      {photoPreview && (
        <img
          src={photoPreview}
          alt="Receipt preview"
          style={{ width: '100%', borderRadius: '8px', border: '1px solid #E5E2DA' }}
        />
      )}

      <button type="submit" disabled={uploading} style={{
        padding: '14px',
        background: '#5B8A72',
        color: '#FAFAF8',
        border: 'none',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: 600,
        marginTop: '4px',
        opacity: uploading ? 0.6 : 1
      }}>
        {expense ? 'Update Expense' : 'Save Expense'}
      </button>
    </form>
  )
}