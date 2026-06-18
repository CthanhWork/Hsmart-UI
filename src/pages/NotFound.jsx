import { Link } from 'react-router-dom';
import './Operations.css';

const NotFound = () => (
  <div className="page-state">
    <h1>Không tìm thấy trang</h1>
    <p>Đường dẫn này không thuộc ứng dụng H-Smart.</p>
    <Link className="btn btn-primary" to="/">Quay lại chợ</Link>
  </div>
);

export default NotFound;
