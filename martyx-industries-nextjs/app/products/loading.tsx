import { SkeletonProductCard } from '@/components/Skeleton';

export default function ProductsLoading() {
  return (
    <div className="main-content">
      <div className="container">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div style={{
            width: '200px',
            height: '40px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            animation: 'pulse 1.5s infinite'
          }} />
          <div style={{
            width: '400px',
            height: '24px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.375rem',
            animation: 'pulse 1.5s infinite'
          }} />
        </div>

        {/* Product Grid Skeleton */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {[...Array(8)].map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
