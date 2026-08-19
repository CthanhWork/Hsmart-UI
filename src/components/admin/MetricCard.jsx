const MetricCard = ({ icon: Icon, tone = 'blue', label, value, caption }) => (
  <article className={`adm-metric-card tone-${tone}`}>
    <span className="adm-metric-icon">
      {Icon ? <Icon size={18} aria-hidden="true" /> : null}
    </span>
    <div className="adm-metric-copy">
      <p>{label}</p>
      <strong>{value}</strong>
      {caption ? <small>{caption}</small> : null}
    </div>
  </article>
);

export default MetricCard;
