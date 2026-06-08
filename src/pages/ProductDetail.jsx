import { useEffect, useState } from 'react';
import { Heart, MessageCircle, ShoppingCart, Flag, Star } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import { useUser } from '../context/UserContext';
import {
  apiCreateOrder,
  apiFetchProductById,
  apiFetchSellerReviews,
  apiSubmitReport,
  apiToggleWishlist,
} from '../services/api';
import { rememberOrderId } from '../services/orderHistory';
import './Operations.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useUser();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reportReason, setReportReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const nextProduct = await apiFetchProductById(id);
        setProduct(nextProduct);
        const sellerReviews = await apiFetchSellerReviews(nextProduct.sellerId);
        setReviews(Array.isArray(sellerReviews) ? sellerReviews : []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const requireAccount = () => {
    if (!isAuthenticated) {
      setError('Sign in to perform this action.');
      return false;
    }
    return true;
  };

  const buyProduct = async () => {
    if (!requireAccount()) return;
    setError('');
    try {
      const order = await apiCreateOrder(product.id);
      rememberOrderId(order.id);
      navigate(`/orders?orderId=${order.id}`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const toggleWishlist = async () => {
    if (!requireAccount()) return;
    try {
      const response = await apiToggleWishlist(product.id);
      setFeedback(response?.message || 'Wishlist updated.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!requireAccount()) return;
    if (!reportReason.trim()) return;
    try {
      await apiSubmitReport(product.id, reportReason.trim());
      setReportReason('');
      setFeedback('Report submitted for administrator review.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (loading) return <div className="page-state">Loading product...</div>;
  if (!product) return <div className="page-state">{error || 'Product not found.'}</div>;

  const detection = product.aiMetadata[0];
  const confidence = Number(detection?.confidence ?? detection?.score ?? 0);
  const isOwner = user && String(product.sellerId) === String(user.username || user.id);

  return (
    <div className="operations-page container">
      <div className="detail-layout">
        <section className="detail-media">
          <img src={product.imageUrl} alt={product.title} />
        </section>

        <section className="surface detail-summary">
          <div className="row-between">
            <StatusBadge status={product.status} />
            <span className="muted">{product.categoryName || 'Uncategorized'}</span>
          </div>
          <h1>{product.title}</h1>
          <div className="detail-price">{Number(product.price).toLocaleString('vi-VN')} VND</div>
          <p>{product.description || 'No description was provided.'}</p>

          <dl className="fact-list">
            <div><dt>Seller ID</dt><dd>{product.sellerId}</dd></div>
            <div><dt>Saved by users</dt><dd>{product.likeCount}</dd></div>
            <div><dt>AI label</dt><dd>{detection?.label || 'Unavailable'}</dd></div>
            <div><dt>AI confidence</dt><dd>{confidence ? `${Math.round(confidence * 100)}%` : 'Unavailable'}</dd></div>
          </dl>

          {error ? <div className="feedback feedback-error">{error}</div> : null}
          {feedback ? <div className="feedback feedback-success">{feedback}</div> : null}

          {!isOwner ? (
            <div className="button-row">
              <button className="btn btn-primary" onClick={buyProduct} disabled={product.status !== 'APPROVED'}>
                <ShoppingCart size={17} /> Create order
              </button>
              <button className="btn btn-secondary" onClick={toggleWishlist}>
                <Heart size={17} /> Save
              </button>
              <Link className="btn btn-secondary" to={`/chat?participantId=${encodeURIComponent(product.sellerId)}&productId=${product.id}`}>
                <MessageCircle size={17} /> Chat
              </Link>
            </div>
          ) : (
            <Link className="btn btn-secondary" to={`/products/${product.id}/edit`}>Edit listing</Link>
          )}
        </section>
      </div>

      <div className="two-column">
        <section className="surface">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Seller feedback</p>
              <h2>Reviews</h2>
            </div>
            <span className="muted">{reviews.length} total</span>
          </div>
          {reviews.length === 0 ? <p className="muted">This seller has no reviews yet.</p> : (
            <div className="stack-list">
              {reviews.map((review) => (
                <article key={review.id} className="list-row">
                  <div>
                    <strong>{review.buyerId}</strong>
                    <p>{review.comment || 'No written comment.'}</p>
                  </div>
                  <span className="rating"><Star size={14} fill="currentColor" /> {review.rating}/5</span>
                </article>
              ))}
            </div>
          )}
        </section>

        {!isOwner ? (
          <section className="surface">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Safety</p>
                <h2>Report listing</h2>
              </div>
              <Flag size={18} />
            </div>
            <form className="form-stack" onSubmit={submitReport}>
              <label>
                Reason
                <textarea
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  required
                  placeholder="Describe the issue for the administrator"
                />
              </label>
              <button className="btn btn-secondary" type="submit">Submit report</button>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default ProductDetail;
