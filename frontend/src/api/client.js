import axios from 'axios'

// Production build: same origin as the page, API under /api.
// Dev server: backend on port 8000 of whatever host the page was opened from.
const baseURL = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000/api`
  : '/api'

export { baseURL }

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export function uploadReceipt(file) {
  const formData = new FormData()
  formData.append('file', file)
  return client.post('/receipts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function extractReceipt(file) {
  const formData = new FormData()
  formData.append('file', file)
  return client.post('/receipts/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function receiptImageUrl(filename) {
  return `${baseURL}/receipt-images/${filename}`
}

export default client