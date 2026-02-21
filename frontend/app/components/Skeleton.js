export function CardSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card skeleton-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text short" />
          <div className="pill-row">
            <div className="skeleton skeleton-pill" />
            <div className="skeleton skeleton-pill" />
          </div>
        </div>
      ))}
    </>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="card">
      <div className="skeleton skeleton-avatar-large" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text short" />
    </div>
  );
}

export function TextSkeleton({ width = "100%" }) {
  return <div className="skeleton skeleton-text" style={{ width }} />;
}
