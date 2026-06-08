import { useEffect, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import { useUser } from '../context/UserContext';
import { apiCompleteOrder, apiConfirmOrder, apiCreateReview, apiFetchOrder } from '../services/api';
import { getRecentOrderIds, rememberOrderId } from '../services/orderHistory';
import './Operations.css';

const Orders = () => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [orders, setOrders] = useState([]);
  const [review, setReview] = useState({ rating: '5', comment: '' });
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadOrder = async (id, quiet = false) => {
    if (!id) return;
    try {
      const order = await apiFetchOrder(id);
      rememberOrderId(order.id);
      setOrders((current) => [order, ...current.filter((item) => String(item.id) !== String(order.id))]);
    } catch (requestError) {
      if (!quiet) setError(requestError.message);
    }
  };

  useEffect(() => {
    const ids = searchParams.get('orderId')
      ? [searchParams.get('orderId'), ...getRecentOrderIds()]
      : getRecentOrderIds();
    [...new Set(ids)].forEach((id) => loadOrder(id, true));
  }, [searchParams]);

  const lookup = (event) => {
    event.preventDefault();
    setError('');
    setSearchParams(orderId ? { orderId } : {});
    loadOrder(orderId);
  };

  const updateOrder = async (id, action) => {
    setError('');
    try {
      const next = action === 'confirm' ? await apiConfirmOrder(id) : await apiCompleteOrder(id);
      setOrders((current) => current.map((order) => (order.id === next.id ? next : order)));
      setFeedback(action === 'confirm' ? 'Order confirmed.' : 'Order completed.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitReview = async (event, order) => {
    event.preventDefault();
    try {
      await apiCreateReview({ orderId: order.id, rating: Number(review.rating), comment: review.comment });
      setFeedback('Review submitted successfully.');
      setReview({ rating: '5', comment: '' });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const userKeys = [user?.id, user?.username].filter(Boolean).map(String);

  return (
    <div className="operations-page container">
      <header className="operations-header"><div><p className="eyebrow">Transactions</p><h1>Orders</h1><p>Look up an order by ID and continue the buyer or seller workflow.</p></div></header>
      <form className="catalog-toolbar" onSubmit={lookup}>
        <label className="search-field"><Search size={18} /><input required value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order ID" /></label>
        <button className="btn btn-primary">Find order</button>
      </form>
      <p className="context-note">Order-service does not expose a list endpoint. This page remembers IDs created or opened in this browser.</p>
      {error ? <div className="feedback feedback-error">{error}</div> : null}
      {feedback ? <div className="feedback feedback-success">{feedback}</div> : null}
      <div className="stack-list">
        {orders.map((order) => {
          const isBuyer = userKeys.includes(String(order.buyerId));
          const isSeller = userKeys.includes(String(order.sellerId));
          return (
            <article className="surface order-row" key={order.id}>
              <div className="order-main">
                <div className="row-between"><h2>Order #{order.id}</h2><StatusBadge status={order.status} /></div>
                <dl className="fact-list">
                  <div><dt>Product ID</dt><dd>{order.productId}</dd></div>
                  <div><dt>Buyer</dt><dd>{order.buyerId}</dd></div>
                  <div><dt>Seller</dt><dd>{order.sellerId}</dd></div>
                  <div><dt>Total</dt><dd>{Number(order.amount || 0).toLocaleString('vi-VN')} VND</dd></div>
                  <div><dt>Shipping fee</dt><dd>{Number(order.shippingFee || 0).toLocaleString('vi-VN')} VND</dd></div>
                  <div><dt>Tracking code</dt><dd>{order.trackingCode || 'Not assigned'}</dd></div>
                </dl>
                <div className="button-row">
                  {isSeller && order.status === 'PENDING' ? <button className="btn btn-primary" onClick={() => updateOrder(order.id, 'confirm')}>Confirm order</button> : null}
                  {isBuyer && order.status === 'PROCESSING' ? <button className="btn btn-primary" onClick={() => updateOrder(order.id, 'complete')}>Complete order</button> : null}
                </div>
              </div>
              {isBuyer && order.status === 'COMPLETED' ? (
                <form className="review-form" onSubmit={(event) => submitReview(event, order)}>
                  <h3><Star size={16} /> Review seller</h3>
                  <label>Rating<select value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })}>
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}/5</option>)}
                  </select></label>
                  <label>Comment<textarea required value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} /></label>
                  <button className="btn btn-secondary">Submit review</button>
                </form>
              ) : null}
            </article>
          );
        })}
      </div>
      {orders.length === 0 ? <div className="page-state">Enter an order ID to begin.</div> : null}
    </div>
  );
};

export default Orders;
