/** Shown while an admin page loads its data, so moving between admin screens feels instant. */
export default function Loading() {
  return (
    <div className="max-w-5xl animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-12 w-64 rounded-xl bg-pine-2" />
      <div className="mt-8 space-y-3">
        <div className="h-20 rounded-2xl bg-pine" />
        <div className="h-20 rounded-2xl bg-pine" />
        <div className="h-20 rounded-2xl bg-pine" />
      </div>
    </div>
  );
}
