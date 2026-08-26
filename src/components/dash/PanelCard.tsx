import type { Panel } from '@/lib/types'
import styles from './PanelCard.module.css'

export default function PanelCard({
  title, span, children,
}: {
  title: string
  span?: Panel['span']
  children: React.ReactNode
}) {
  return (
    <div className={styles.pc} style={{ gridColumn: `span ${span ?? 1}` }}>
      <div className={styles.pt}>{title}</div>
      {children}
    </div>
  )
}
