export default function PlaceholderView({ title, icon, description }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</div>
      <div style={{ fontSize: 13, maxWidth: 300, textAlign: 'center', lineHeight: 1.6 }}>{description}</div>
      <div style={{ padding: '8px 20px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>🚀 Coming in Sprint 4</div>
    </div>
  );
}
