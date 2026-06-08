import { useEffect, useState } from 'react';
import { Ban, Check, Flag, PackageSearch, Plus, X } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import {
  apiBanUser,
  apiCreateCategory,
  apiFetchAdminStats,
  apiFetchPendingReports,
  apiFetchProductPage,
  apiModerateProduct,
  apiProcessReport,
} from '../services/api';
import './Operations.css';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [userId, setUserId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const load = async () => {
    setError('');
    try {
      const [nextStats, productPage, reportPage] = await Promise.all([
        apiFetchAdminStats(),
        apiFetchProductPage({ status: 'PENDING_REVIEW', size: 50 }),
        apiFetchPendingReports(0, 50),
      ]);
      setStats(nextStats);
      setProducts(productPage.content);
      setReports(reportPage.content);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    Promise.all([
      apiFetchAdminStats(),
      apiFetchProductPage({ status: 'PENDING_REVIEW', size: 50 }),
      apiFetchPendingReports(0, 50),
    ]).then(([nextStats, productPage, reportPage]) => {
      setStats(nextStats);
      setProducts(productPage.content);
      setReports(reportPage.content);
    }).catch((requestError) => setError(requestError.message));
  }, []);

  const run = async (action, successMessage) => {
    setError('');
    try {
      await action();
      setFeedback(successMessage);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitBan = (event) => {
    event.preventDefault();
    run(() => apiBanUser(userId), `User ${userId} was banned.`);
    setUserId('');
  };

  const submitCategory = (event) => {
    event.preventDefault();
    run(() => apiCreateCategory(categoryName), `Category ${categoryName} was created.`);
    setCategoryName('');
  };

  return (
    <div className="operations-page container">
      <header className="operations-header"><div><p className="eyebrow">Administration</p><h1>Moderation console</h1><p>Review marketplace risk, reports, users, and categories.</p></div></header>
      {error ? <div className="feedback feedback-error">{error}</div> : null}
      {feedback ? <div className="feedback feedback-success">{feedback}</div> : null}

      <section className="stats-grid operational-stats">
        <div className="stat-tile"><span>Total users</span><strong>{stats?.totalUsers ?? '-'}</strong></div>
        <div className="stat-tile"><span>Selling products</span><strong>{stats?.totalSellingProducts ?? '-'}</strong></div>
        <div className="stat-tile"><span>Completed revenue</span><strong>{stats ? `${Number(stats.totalCompletedRevenue || 0).toLocaleString('vi-VN')} VND` : '-'}</strong></div>
      </section>

      <div className="admin-tools">
        <form className="surface inline-tool" onSubmit={submitBan}>
          <div><Ban size={18} /><strong>Ban user</strong></div>
          <input required value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="User ID" />
          <button className="btn btn-secondary">Ban</button>
        </form>
        <form className="surface inline-tool" onSubmit={submitCategory}>
          <div><Plus size={18} /><strong>Create category</strong></div>
          <input required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="English category label" />
          <button className="btn btn-secondary">Create</button>
        </form>
      </div>

      <section className="surface table-shell">
        <div className="section-heading"><div><p className="eyebrow">Queue</p><h2>Products pending review</h2></div><PackageSearch size={20} /></div>
        <table className="data-table">
          <thead><tr><th>Product</th><th>Seller</th><th>AI result</th><th>Actions</th></tr></thead>
          <tbody>{products.map((product) => {
            const detection = product.aiMetadata[0];
            return <tr key={product.id}>
              <td><strong>{product.title}</strong><br /><StatusBadge status={product.status} /></td>
              <td>{product.sellerId}</td>
              <td>{detection?.label || 'Unavailable'} {detection ? `(${Math.round(Number(detection.confidence ?? detection.score ?? 0) * 100)}%)` : ''}</td>
              <td><div className="button-row compact-buttons">
                <button className="btn btn-primary" onClick={() => run(() => apiModerateProduct(product.id, 'APPROVE'), `Product ${product.id} approved.`)}><Check size={15} /> Approve</button>
                <button className="btn btn-secondary danger-action" onClick={() => run(() => apiModerateProduct(product.id, 'REJECT'), `Product ${product.id} rejected.`)}><X size={15} /> Reject</button>
              </div></td>
            </tr>;
          })}</tbody>
        </table>
        {products.length === 0 ? <div className="page-state">No products are waiting for manual review.</div> : null}
      </section>

      <section className="surface table-shell">
        <div className="section-heading"><div><p className="eyebrow">Safety</p><h2>Pending reports</h2></div><Flag size={20} /></div>
        <table className="data-table">
          <thead><tr><th>Report</th><th>Product</th><th>Reason</th><th>Actions</th></tr></thead>
          <tbody>{reports.map((report) => <tr key={report.id}>
            <td>#{report.id}<br /><span className="muted">{report.reporterId}</span></td>
            <td>#{report.productId}</td><td>{report.reason}</td>
            <td><div className="button-row compact-buttons">
              <button className="btn btn-primary" onClick={() => run(() => apiProcessReport(report.id, 'HIDE_PRODUCT'), `Report ${report.id} processed.`)}>Hide product</button>
              <button className="btn btn-secondary" onClick={() => run(() => apiProcessReport(report.id, 'DISMISS'), `Report ${report.id} dismissed.`)}>Dismiss</button>
            </div></td>
          </tr>)}</tbody>
        </table>
        {reports.length === 0 ? <div className="page-state">No reports are waiting for action.</div> : null}
      </section>
    </div>
  );
};

export default Admin;
