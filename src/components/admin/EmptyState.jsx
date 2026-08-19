const EmptyState = ({ icon: Icon, title, children }) => (
  <div className="adm-empty-state">
    {Icon ? <Icon size={24} aria-hidden="true" /> : null}
    {title ? <p>{title}</p> : null}
    {children ? <small>{children}</small> : null}
  </div>
);

export default EmptyState;
