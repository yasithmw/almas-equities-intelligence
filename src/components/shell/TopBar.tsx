import { ALMAS_LOGO_SRC } from './almas-logo'
import DeskSwitcher from './DeskSwitcher'
import styles from './TopBar.module.css'

// Ports the client brief's .mbar: the Almas logotype on the left (.l),
// the desk switcher on the right (.r), in place of the static "Dealer /
// R. Fernando" pill Exhibit B shows for its one frozen screenshot.
export default function TopBar() {
  return (
    <header className={styles.bar}>
      <div className={styles.l}>
        {/* alt="" as in the source: the adjacent wordmark already names it */}
        <img src={ALMAS_LOGO_SRC} alt="" className={styles.logo} />
        <span className={styles.word}>Almas Equities</span>
      </div>
      <div className={styles.r}>
        <DeskSwitcher />
      </div>
    </header>
  )
}
