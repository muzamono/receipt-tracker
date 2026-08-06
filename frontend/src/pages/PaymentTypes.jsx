import { useState, useEffect } from 'react'
import client from '../api/client'

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #E5E2DA',
  borderRadius: '8px',
  fontSize: '15px',
  background: '#FFFFFF',
  fontFamily: 'inherit'
}

export default function PaymentTypes() {
  const [paymentTypes, setPaymentTypes] = useState([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  function fetchPaymentTypes() {
    client.get('/payment-types').then(res => setPaymentTypes(res.data))
  }

  useEffect(() => {
    fetchPaymentTypes()
  }, [])

  function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    client.post('/payment-types', { name: newName.trim() }).then(() => {
      setNewName('')
      fetchPaymentTypes()
    })
  }

  function handleDelete(id) {
    client.delete(`/payment-types/${id}`).then(fetchPaymentTypes)
  }

  function startEdit(pt) {
    setEditingId(pt.id)
    setEditName(pt.name)
  }

  function handleUpdate(id) {
    if (!editName.trim()) return
    client.put(`/payment-types/${id}`, { name: editName.trim() }).then(() => {
      setEditingId(null)
      fetchPaymentTypes()
    })
  }

  return (
    <div>
      <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#8A8780', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Payment Types
      </h2>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          placeholder="New payment type"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="submit" style={{
          padding: '12px 16px',
          background: '#5B8A72',
          color: '#FAFAF8',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 600
        }}>
          Add
        </button>
      </form>

      {paymentTypes.map(pt => (
        <div key={pt.id} style={{
          background: '#FFFFFF',
          border: '1px solid #E5E2DA',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          {editingId === pt.id ? (
            <>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ ...inputStyle, flex: 1, padding: '8px' }}
              />
              <button
                onClick={() => handleUpdate(pt.id)}
                style={{ background: 'none', border: 'none', color: '#5B8A72', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                style={{ background: 'none', border: 'none', color: '#8A8780', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: '14px' }}>{pt.name}</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => startEdit(pt)}
                  style={{ background: 'none', border: 'none', color: '#5B8A72', fontSize: '12px', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(pt.id)}
                  style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: '12px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}