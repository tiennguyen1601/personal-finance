import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
}

export function Skeleton({ width, height = 16, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

export function SkeletonCard({ style }: { style?: CSSProperties }) {
  return (
    <div className="glass-card" style={{ padding: '20px 22px', ...style }}>
      <Skeleton height={13} style={{ marginBottom: 10, width: '55%' }} />
      <Skeleton height={28} style={{ width: '75%' }} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
      {[90, 130, 100, 60, 80, 60].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <Skeleton width={w} height={14} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonGoalCard({ style }: { style?: CSSProperties }) {
  return (
    <div className="glass-card" style={{ padding: 20, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <div style={{ flex: 1 }}>
          <Skeleton height={15} style={{ marginBottom: 6, width: '60%' }} />
          <Skeleton height={12} style={{ width: '40%' }} />
        </div>
      </div>
      <Skeleton height={10} borderRadius={999} style={{ marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Skeleton height={34} borderRadius={10} style={{ flex: 1 }} />
        <Skeleton width={60} height={34} borderRadius={10} />
        <Skeleton width={60} height={34} borderRadius={10} />
      </div>
    </div>
  );
}
