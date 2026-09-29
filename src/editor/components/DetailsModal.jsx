import { useEffect, useRef, useState } from 'react'
import { normalizeMobile } from '../validation.js'

/* Customer-details modal. Lazy-loaded by Editor (React.lazy) so it isn't in
   the initial bundle — it only ships once the user clicks Upload.
   Owns its own form state and validation; hands a clean { name, mobile }
   back to Editor on confirm. */
export default function DetailsModal({ onConfirm, onCancel }) {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  const nameOk = name.trim().length > 0
  const normalizedMobile = normalizeMobile(mobile)
  const mobileOk = normalizedMobile !== null

  function handleConfirm() {
    if (!nameOk || !mobileOk) {
      setShowErrors(true)
      return
    }
    onConfirm({ name: name.trim(), mobile: normalizedMobile })
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="details-title">
        <h2 id="details-title">Your details</h2>
        <p className="lede">
          So we can match your print file to your order. We only use this to reach you about this print.
        </p>

        <div className="field">
          <label htmlFor="cust-name">Name</label>
          <input
            id="cust-name"
            ref={nameRef}
            type="text"
            autoComplete="name"
            placeholder="e.g. Rahul Sharma"
            inputMode="text"
            className={showErrors && !nameOk ? 'invalid' : ''}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="err">{showErrors && !nameOk ? 'Please enter your name.' : ''}</div>
        </div>

        <div className="field">
          <label htmlFor="cust-mobile">Mobile number</label>
          <input
            id="cust-mobile"
            type="tel"
            autoComplete="tel"
            placeholder="10-digit Indian mobile"
            inputMode="tel"
            className={showErrors && !mobileOk ? 'invalid' : ''}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <div className="err">
            {showErrors && !mobileOk ? 'Enter a valid 10-digit Indian mobile number.' : ''}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" type="button" onClick={handleConfirm} disabled={!nameOk || !mobileOk}>
            Upload now
          </button>
        </div>
      </div>
    </div>
  )
}
