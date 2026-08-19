const BooleanBadge = ({ value, trueLabel, falseLabel }) => (
  <span className={`adm-boolean-badge ${value ? 'is-true' : 'is-false'}`}>
    {value ? trueLabel : falseLabel}
  </span>
);

export default BooleanBadge;
