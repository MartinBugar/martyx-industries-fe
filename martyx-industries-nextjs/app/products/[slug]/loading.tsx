import { SkeletonProductDetail } from '@/components/Skeleton';

export default function ProductDetailLoading() {
  return (
    <div className="main-content">
      <div className="container">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6" style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.25rem',
            animation: 'pulse 1.5s infinite'
          }} />
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <div style={{
            width: '80px',
            height: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.25rem',
            animation: 'pulse 1.5s infinite'
          }} />
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <div style={{
            width: '120px',
            height: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.25rem',
            animation: 'pulse 1.5s infinite'
          }} />
        </div>

        {/* Product Detail Skeleton */}
        <SkeletonProductDetail />
      </div>
    </div>
  );
}
