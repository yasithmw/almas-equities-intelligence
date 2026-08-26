'use client'

import { useDemo } from './DemoContext'
import styles from './SideRail.module.css'

// Icons ported verbatim from the client brief's .mside (New chat, Chat,
// Dashboards); Search is omitted, the task brief's rail content list is
// New chat, Chat, Dashboards, then Today.
function NewChatIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" aria-hidden="true">
      <path d="M8 3.4v9.2M3.4 8h9.2" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinejoin="round" aria-hidden="true">
      <path d="M14 9.4A1.6 1.6 0 0 1 12.4 11H5.2L2 13.6V3.6A1.6 1.6 0 0 1 3.6 2h8.8A1.6 1.6 0 0 1 14 3.6z" />
    </svg>
  )
}

function DashboardsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <rect x="2.2" y="2.2" width="5" height="5" rx="1.2" />
      <rect x="8.8" y="2.2" width="5" height="5" rx="1.2" />
      <rect x="2.2" y="8.8" width="5" height="5" rx="1.2" />
      <rect x="8.8" y="8.8" width="5" height="5" rx="1.2" />
    </svg>
  )
}

// Ports the client brief's .mside: New chat, Chat, Dashboards, then a
// Today group listing history. Ruling R3: history entries are plain
// divs (.mrec), never buttons, so a suggested question that has already
// been asked still resolves to exactly one button once it is also
// asked from the chat pane's own suggestions. The list is wrapped in
// data-testid="rail-history" for Task 7 to assert against.
export default function SideRail() {
  const { view, setView, history, newChat } = useDemo()

  return (
    <nav className={styles.side} aria-label="Demo navigation">
      {/* aria-label rather than relying on the child span's text: below
          820px that text is display:none (icon-only), and the icon is
          aria-hidden, which would otherwise leave this button with no
          accessible name at all on a real mobile screen reader.
          Ruling R20: calls newChat(), not just setView('chat'), so a
          control labelled "New chat" actually starts a new one instead
          of just switching to a view that may already hold a thread. */}
      <button
        type="button"
        aria-label="New chat"
        className={`${styles.mi} ${styles.dk}`}
        onClick={() => newChat()}
      >
        <NewChatIcon />
        <span className={styles.text} aria-hidden="true">New chat</span>
      </button>

      <button
        type="button"
        aria-pressed={view === 'chat'}
        className={view === 'chat' ? `${styles.mi} ${styles.act}` : styles.mi}
        onClick={() => setView('chat')}
      >
        <ChatIcon />
        <span className={styles.text}>Chat</span>
      </button>

      <button
        type="button"
        aria-pressed={view === 'dashboards'}
        className={view === 'dashboards' ? `${styles.mi} ${styles.act}` : styles.mi}
        onClick={() => setView('dashboards')}
      >
        <DashboardsIcon />
        <span className={styles.text}>Dashboards</span>
      </button>

      {history.length > 0 && (
        <>
          <div className={styles.mgrp}>Today</div>
          <div data-testid="rail-history" className={styles.history}>
            {history.map((q) => (
              <div key={q} className={styles.mrec}>{q}</div>
            ))}
          </div>
        </>
      )}
    </nav>
  )
}
