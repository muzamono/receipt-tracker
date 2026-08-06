import axios from 'axios'

const baseURL = 'http://my-ip-address:8000'

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

export function receiptImageUrl(filename) {
  return `${baseURL}/receipt-images/${filename}`
}

export default client