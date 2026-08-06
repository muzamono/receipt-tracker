import Categories from './Categories'
import PaymentTypes from './PaymentTypes'

export default function Settings() {
  return (
    <div>
      <Categories />
      <div style={{ height: '28px' }} />
      <PaymentTypes />
    </div>
  )
}