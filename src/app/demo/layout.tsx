// A dedicated segment boundary for /demo. The root layout (src/app/layout.tsx)
// already supplies <html>/<body>, the token sheet and the font links, so
// there is no additional chrome to add here; DemoShell (rendered by
// page.tsx) is a full-viewport application, not page content that needs
// wrapping. This file exists so the /demo route has its own layout to
// extend later without touching the root layout.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
