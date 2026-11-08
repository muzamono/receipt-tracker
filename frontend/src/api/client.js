import axios from 'axios'

const baseURL = 'http://192.168.100.172:8000'

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