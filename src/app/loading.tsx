export default function Loading() {
  return (
    <div className="pageShell" role="status" aria-live="polite">
      <div className="emptyState">
        <span className="loadingSpinner" aria-hidden="true" />
        <p>Loading…</p>
      </div>
    </div>
  );
}
