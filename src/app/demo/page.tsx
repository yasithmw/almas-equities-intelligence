import DemoShell from '@/components/shell/DemoShell'

// Overrides the root layout's title for this route. Both are set to the same
// string: the layout covers any other route (and the 404), this covers /demo,
// and a client who bookmarks the tab should see one name either way.
export const metadata = { title: 'Almas Intelligence | Concept Preview' }

export default function DemoPage() {
  return <DemoShell />
}
