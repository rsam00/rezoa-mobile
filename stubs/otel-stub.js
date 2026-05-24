// Stub for @opentelemetry/api
// Supabase pulls in OpenTelemetry for tracing, but its dynamic import()
// syntax is incompatible with the Hermes JS engine used in React Native.
// This stub prevents the build failure by replacing the OTEL package
// with a no-op implementation.
module.exports = {
  trace: {
    getTracer: () => ({
      startSpan: () => ({ end: () => {}, setAttribute: () => {}, setStatus: () => {} }),
      startActiveSpan: (_name, fn) => fn({ end: () => {}, setAttribute: () => {}, setStatus: () => {} }),
    }),
    getActiveSpan: () => null,
    setSpan: (ctx) => ctx,
    deleteSpan: (ctx) => ctx,
  },
  context: {
    with: (_ctx, fn) => fn(),
    bind: (_ctx, fn) => fn,
    active: () => ({}),
  },
  propagation: {
    inject: () => {},
    extract: (_ctx) => _ctx,
  },
  SpanStatusCode: { UNSET: 0, OK: 1, ERROR: 2 },
  diag: {
    createComponentLogger: () => ({ debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }),
  },
};
