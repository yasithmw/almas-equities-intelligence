// Recharts' ResponsiveContainer measures its box through a
// ResizeObserver, which jsdom does not implement, so every chart under
// test threw on mount. The stub reports nothing, which is the honest
// answer under jsdom: there is no layout to observe. Charts therefore
// draw no geometry in tests, and each chart renders an off-screen table
// of the same numbers (see components/dash/chart-frame.tsx) which is
// what the assertions read.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}
