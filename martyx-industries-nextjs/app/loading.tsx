export default function Loading() {
  return (
    <div className="main-content">
      <div className="container">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--border-color)',
            borderTopColor: 'var(--accent-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    </div>
  );
}
