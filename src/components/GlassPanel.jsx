export default function GlassPanel({ title, children, rightAction, className = '' }) {
  return (
    <section className={`glass-panel ${className}`.trim()}>
      <div className="panel-header">
        {title && <h3>{title}</h3>}
        {rightAction}
      </div>
      {children}
    </section>
  );
}
