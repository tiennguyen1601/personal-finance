import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 52, marginBottom: 14, opacity: 0.7 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 8 }}>{title}</div>
      {description && (
        <div style={{ fontSize: 14, marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>{description}</div>
      )}
      {action}
    </div>
  );
}
