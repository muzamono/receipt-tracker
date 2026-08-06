import { useRef } from 'react'

const monthStyle = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '4px 8px'
}

export default function MonthPicker({ year, month, onChange, dark }) {
  const inputRef = useRef(null)

  function shift(delta) {
    let newMonth = month + delta
    let newYear = year
    if (newMonth < 0) {
      newMonth = 11
      newYear -= 1
    } else if (newMonth > 11) {
      newMonth = 0
      newYear += 1
    }
    onChange(newYear, newMonth)
  }

  function handlePicker(e) {
    const value = e.target.value
    if (!value) return
    const [y, m] = value.split('-')
    onChange(parseInt(y), parseInt(m) - 1)
  }

  function openPicker() {
    if (inputRef.current?.showPicker) {
      inputRef.current.showPicker()
    }
  }

  const label = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const arrowColor = '#8A8780'
  const monthValue = `${year}-${String(month + 1).padStart(2, '0')}`

  const pillStyle = dark
    ? { background: 'rgba(255,255,255,0.08)', color: '#FAFAF8', border: '1px solid rgba(255,255,255,0.15)' }
    : { background: '#FFFFFF', color: '#1A1A1A', border: '1px solid #E5E2DA' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button onClick={() => shift(-1)} style={{ ...monthStyle, color: arrowColor }}>‹</button>
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <div style={{
          ...pillStyle,
          fontSize: '13px',
          fontWeight: 500,
          padding: '6px 14px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{label}</span>
          <span style={{ fontSize: '18px', opacity: 0.6 }}>▾</span>
        </div>
        <input
          ref={inputRef}
          type="month"
          value={monthValue}
          onChange={handlePicker}
          onClick={openPicker}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            border: 'none',
            cursor: 'pointer'
          }}
        />
      </div>
      <button onClick={() => shift(1)} style={{ ...monthStyle, color: arrowColor }}>›</button>
    </div>
  )
}