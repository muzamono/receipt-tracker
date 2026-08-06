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

const PRESET_COLORS = [
    '#5B8A72', '#6FA8A0', '#7A9CC6', '#B8A1C9',
    '#A65D57', '#D4956B', '#C9A66B', '#D4B483',
    '#9B9580', '#8A8780', '#6B9080', '#C9908E'
  ]

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(PRESET_COLORS[0])

  function fetchCategories() {
    client.get('/categories').then(res => setCategories(res.data))
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    client.post('/categories', { name: newName.trim(), color: newColor }).then(() => {
      setNewName('')
      setNewColor(PRESET_COLORS[0])
      fetchCategories()
    })
  }

  function handleDelete(id) {
    client.delete(`/categories/${id}`).then(fetchCategories)
  }

  function startEdit(cat) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color || PRESET_COLORS[0])
  }

  function handleUpdate(id) {
    if (!editName.trim()) return
    client.put(`/categories/${id}`, { name: editName.trim(), color: editColor }).then(() => {
      setEditingId(null)
      fetchCategories()
    })
  }

  function ColorPicker({ value, onChange }) {
    const [localValue, setLocalValue] = useState(value)

    function handleInput(e) {
      setLocalValue(e.target.value)
    }

    function handleBlur() {
      onChange(localValue)
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="color"
          value={localValue}
          onInput={handleInput}
          onBlur={handleBlur}
          style={{
            width: '48px',
            height: '48px',
            border: '1px solid #E5E2DA',
            borderRadius: '8px',
            padding: '2px',
            cursor: 'pointer'
          }}
        />
        <span className="mono" style={{ fontSize: '13px', color: '#8A8780' }}>
          {localValue}
        </span>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#8A8780', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Categories
      </h2>

      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <input
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={inputStyle}
        />
        <ColorPicker value={newColor} onChange={setNewColor} />
        <button type="submit" style={{
          padding: '12px',
          background: '#5B8A72',
          color: '#FAFAF8',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 600
        }}>
          Add Category
        </button>
      </form>

      {categories.map(c => (
        <div key={c.id} style={{
          background: '#FFFFFF',
          border: '1px solid #E5E2DA',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '8px'
        }}>
          {editingId === c.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={inputStyle}
              />
              <ColorPicker value={editColor} onChange={setEditColor} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => handleUpdate(c.id)}
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
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: c.color || '#8A8780',
                  display: 'inline-block'
                }} />
                <span style={{ fontSize: '14px' }}>{c.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => startEdit(c)}
                  style={{ background: 'none', border: 'none', color: '#5B8A72', fontSize: '12px', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: '12px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}