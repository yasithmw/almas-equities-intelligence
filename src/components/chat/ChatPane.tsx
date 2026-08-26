// Minimal stub for Task 6 (the shell). Task 7 replaces this file in
// place with the real chat thread, composer, mode pills and chart card
// pinned by Exhibit B. This exists only so the shell's routing test has
// a composer placeholder to find.
export default function ChatPane() {
  return (
    <div style={{ padding: 24 }}>
      <input
        type="text"
        aria-label="Ask a question"
        placeholder="Ask about any stock, sector, client or index…"
      />
    </div>
  )
}
