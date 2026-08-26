import styles from './DemoBand.module.css'

// Free surface (design brief): nothing like this exists in the client's
// document. Reads as product chrome that happens to be honest, not as a
// warning: aqua ground and ink (Almas's own colour, not a --warn/--down
// alert colour), no icon, no dismiss affordance. Non-dismissible by
// construction: there is no state here to close, and no button renders.
export default function DemoBand() {
  return (
    <div role="note" className={styles.band}>
      Demonstration environment. Illustrative data, not Almas Equities data.
    </div>
  )
}
