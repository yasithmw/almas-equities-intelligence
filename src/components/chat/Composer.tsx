import ModePills from './ModePills'
import styles from './Composer.module.css'

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
}

// Ports the client brief's .comp / .compbar / .send (grep-verified,
// exec summary lines 386 to 389 as of this write, but anchored by class
// not line since the document keeps moving) with the mocked static
// placeholder span and glyph replaced by a real input and a real
// button, per the accessibility rule every control is a real <button>.
// .modes lives in its own file (ModePills) since the brief lists it as
// a separate component, but is rendered here because in the source
// document .modes is .comp's other direct child, a sibling of .compbar.
export default function Composer({ value, onChange, onSend, disabled }: Props) {
  function submit() {
    if (disabled || value.trim().length === 0) return
    onSend()
  }

  return (
    <div className={styles.comp}>
      <div className={styles.compbar}>
        <input
          type="text"
          className={styles.input}
          aria-label="Ask a question"
          placeholder="Ask about any stock, sector, client or index…"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
        <button
          type="button"
          aria-label="Ask"
          className={styles.send}
          disabled={disabled || value.trim().length === 0}
          onClick={submit}
        >
          <span aria-hidden="true">&#8593;</span>
        </button>
      </div>
      <ModePills />
    </div>
  )
}
