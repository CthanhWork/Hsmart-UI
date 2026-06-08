import { Link } from 'react-router-dom';
import './Operations.css';

const NotFound = () => (
  <div className="page-state">
    <h1>Page not found</h1>
    <p>This route is not part of the H-Smart application.</p>
    <Link className="btn btn-primary" to="/">Return to marketplace</Link>
  </div>
);

export default NotFound;
