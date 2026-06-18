import { useEffect, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import {
  apiAcceptOffer,
  apiCancelOffer,
  apiCancelOrder,
  apiCompleteOrder,
  apiConfirmOrder,
  apiCreateOrder,
  apiCreateReview,
  apiFetchOrder,
  apiFetchOffers,
  apiFetchOrders,
  apiRejectOffer,
} from '../services/api';
import { getRecentOrderIds, rememberOrderId } from '../services/orderHistory';
import './Operations.css';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return 'Không rõ';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Không rõ';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
};

const deliveryMethodLabel = (method) => {
  if (method === 'GHTK') return 'Giao Hàng Tiết Kiệm';
  if (method === 'VIETTEL_POST') return 'Viettel Post';
  return 'Đơn vị vận chuyển';
};

const actionMessage = (action) => {
  if (action === 'confirm') return 'Đã xác nhận đơn hàng.';
  if (action === 'cancel') return 'Đã hủy đơn hàng.';
  return 'Đơn hàng đã hoàn tất.';
};

const Orders = () => {
  const { user } = useUser();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [orders, setOrders] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewByOrder, setReviewByOrder] = useState({});
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
    let active = true;

    Promise.all([apiFetchOrders(), apiFetchOffers().catch(() => [])])
      .then(([data, offerData]) => {
        if (!active) return;

        const nextOrders = Array.isArray(data) ? data : [];
        setOrders(nextOrders);
        setOffers(Array.isArray(offerData) ? offerData : []);
        nextOrders.forEach((order) => rememberOrderId(order.id));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
      const next = action === 'confirm'
        ? await apiConfirmOrder(id)
        : action === 'cancel'
          ? await apiCancelOrder(id)
          : await apiCompleteOrder(id);
      setOrders((current) => current.map((order) => (order.id === next.id ? next : order)));
      toast.success(actionMessage(action));
      setFeedback(actionMessage(action));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateOffer = async (offer, action) => {
    setError('');
    try {
      const next = action === 'accept'
        ? await apiAcceptOffer(offer.id)
        : action === 'reject'
          ? await apiRejectOffer(offer.id)
          : await apiCancelOffer(offer.id);
      setOffers((current) => current.map((item) => (item.id === next.id ? next : item)));
      toast.success('Đã cập nhật lời đề nghị.');
      setFeedback('Đã cập nhật lời đề nghị.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const checkoutOffer = async (offer) => {
    setError('');
    try {
      const order = await apiCreateOrder(offer.productId, 'VIETTEL_POST', offer.id);
      rememberOrderId(order.id);
      setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
      setOffers((current) => current.map((item) => (
        item.id === offer.id ? { ...item, status: 'ORDERED' } : item
      )));
      toast.success(`Đặt hàng thành công. Mã đơn của bạn là #${order.id}.`);
      setFeedback('Đã tạo đơn hàng bằng giá ưu đãi.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateReviewDraft = (orderIdValue, field, value) => {
    setReviewByOrder((current) => ({
      ...current,
      [orderIdValue]: {
        rating: current[orderIdValue]?.rating || '5',
        comment: current[orderIdValue]?.comment || '',
        [field]: value,
      },
    }));
  };

  const getReviewDraft = (orderIdValue) => reviewByOrder[orderIdValue] || { rating: '5', comment: '' };

  const submitReview = async (event, order) => {
    event.preventDefault();
    try {
      const draft = getReviewDraft(order.id);
      await apiCreateReview({
        orderId: order.id,
        rating: Number(draft.rating),
        comment: draft.comment,
      });
      toast.success('Đã gửi đánh giá thành công.');
      setFeedback('Đã gửi đánh giá thành công.');
      setReviewByOrder((current) => ({
        ...current,
        [order.id]: { rating: '5', comment: '' },
      }));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const userKeys = [user?.id, user?.username].filter(Boolean).map(String);
  const sentOffers = offers.filter((offer) => userKeys.includes(String(offer.buyerId)));
  const receivedOffers = offers.filter((offer) => userKeys.includes(String(offer.sellerId)));
  const pendingOrders = orders.filter((order) => order.status === 'PENDING').length;
  const processingOrders = orders.filter((order) => order.status === 'PROCESSING').length;
  const completedOrders = orders.filter((order) => order.status === 'COMPLETED').length;

  const renderOfferCard = (offer, direction) => {
    const isSent = direction === 'sent';
    const canSellerAct = !isSent && offer.status === 'PENDING';
    const canBuyerCancel = isSent && offer.status === 'PENDING';
    const canBuyerCheckout = isSent && offer.status === 'ACCEPTED';

    return (
      <article className="offer-row surface" key={`${direction}-${offer.id}`}>
        <div className="offer-row-header">
          <div>
            <h3>Lời đề nghị #{offer.id}</h3>
            <p>
              Sản phẩm #{offer.productId}
              {' · '}
              Hết hạn {formatDateTime(offer.expiresAt)}
            </p>
          </div>
          <StatusBadge status={offer.status} />
        </div>

        <div className="offer-price-strip">
          <div className="offer-price-cell">
            <span>Giá gốc</span>
            <strong>{formatCurrency(offer.originalPrice)}</strong>
          </div>
          <div className="offer-price-cell">
            <span>Giá đề nghị</span>
            <strong>{formatCurrency(offer.offerPrice)}</strong>
          </div>
          <div className="offer-price-cell">
            <span>Mức giảm</span>
            <strong>{offer.discountPercent}%</strong>
          </div>
        </div>

        <div className="button-row compact-buttons">
          {canSellerAct ? (
            <>
              <button className="btn btn-primary" type="button" onClick={() => updateOffer(offer, 'accept')}>
                Chấp nhận
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => updateOffer(offer, 'reject')}>
                Từ chối
              </button>
            </>
          ) : null}
          {canBuyerCancel ? (
            <button className="btn btn-secondary" type="button" onClick={() => updateOffer(offer, 'cancel')}>
              Hủy đề nghị
            </button>
          ) : null}
          {canBuyerCheckout ? (
            <button className="btn btn-primary" type="button" onClick={() => checkoutOffer(offer)}>
              Mua với giá ưu đãi
            </button>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <div className="operations-page container">
      <header className="operations-header orders-hero">
        <div>
          <p className="orders-eyebrow">Theo dõi giao dịch</p>
          <h1>Đơn hàng</h1>
          <p className="operations-subtitle">
            Xem nhanh trạng thái xử lý, tra cứu mã đơn và hoàn tất các bước mua bán mà không phải đọc một danh sách rối mắt.
          </p>
        </div>
      </header>

      <section className="order-summary-grid" aria-label="Tóm tắt đơn hàng">
        <article className="order-summary-card">
          <span>Tổng đơn</span>
          <strong>{orders.length}</strong>
        </article>
        <article className="order-summary-card">
          <span>Chờ xử lý</span>
          <strong>{pendingOrders}</strong>
        </article>
        <article className="order-summary-card">
          <span>Đang giao dịch</span>
          <strong>{processingOrders}</strong>
        </article>
        <article className="order-summary-card">
          <span>Hoàn tất</span>
          <strong>{completedOrders}</strong>
        </article>
      </section>

      <form className="catalog-toolbar lookup-panel" onSubmit={lookup}>
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            required
            name="orderId"
            autoComplete="off"
            aria-label="Tìm mã đơn hàng"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Nhập mã đơn hàng…"
          />
        </label>
        <button className="btn btn-primary" type="submit">Tìm đơn</button>
      </form>

      {error ? <div className="feedback feedback-error" aria-live="polite">{error}</div> : null}
      {feedback ? <div className="feedback feedback-success" aria-live="polite">{feedback}</div> : null}

      <section className="offer-center">
        <div className="section-heading">
          <h2>Lời đề nghị</h2>
        </div>
        <div className="two-column offer-columns">
          <div>
            <h3 className="subsection-title">Đã gửi</h3>
            <div className="stack-list">
              {sentOffers.length ? sentOffers.map((offer) => renderOfferCard(offer, 'sent')) : (
                <div className="surface muted">Bạn chưa gửi lời đề nghị nào.</div>
              )}
            </div>
          </div>
          <div>
            <h3 className="subsection-title">Đã nhận</h3>
            <div className="stack-list">
              {receivedOffers.length ? receivedOffers.map((offer) => renderOfferCard(offer, 'received')) : (
                <div className="surface muted">Chưa có lời đề nghị từ người mua.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="order-list-shell" aria-label="Danh sách đơn hàng">
        {orders.map((order) => {
          const isBuyer = userKeys.includes(String(order.buyerId));
          const isSeller = userKeys.includes(String(order.sellerId));
          const reviewDraft = getReviewDraft(order.id);

          return (
            <article className="surface order-card" key={order.id}>
              <div className="order-main">
                <div className="order-card-top">
                  <div className="order-card-title">
                    <div className="order-meta-row">
                      <span className="order-meta-pill">Đơn #{order.id}</span>
                      <span className="order-meta-pill">Sản phẩm #{order.productId}</span>
                      <span className="order-meta-pill">{deliveryMethodLabel(order.deliveryMethod)}</span>
                    </div>
                    <h2>Đơn hàng #{order.id}</h2>
                    <p>
                      {isBuyer ? 'Bạn là người mua' : isSeller ? 'Bạn là người bán' : 'Đơn hàng liên quan'}
                      {' · '}
                      <Link to={`/products/${order.productId}`}>Xem sản phẩm</Link>
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="order-highlight-grid">
                  <div className="order-highlight">
                    <span>Tổng tiền</span>
                    <strong>{formatCurrency(order.amount)}</strong>
                  </div>
                  <div className="order-highlight">
                    <span>Phí vận chuyển</span>
                    <strong>{formatCurrency(order.shippingFee)}</strong>
                  </div>
                  <div className="order-highlight">
                    <span>Mã vận đơn</span>
                    <strong>{order.trackingCode || 'Chưa có'}</strong>
                  </div>
                </div>

                <dl className="fact-list order-facts">
                  <div><dt>Mã sản phẩm</dt><dd>{order.productId}</dd></div>
                  <div><dt>Người mua</dt><dd>{order.buyerId}</dd></div>
                  <div><dt>Người bán</dt><dd>{order.sellerId}</dd></div>
                  <div><dt>Giao hàng</dt><dd>{deliveryMethodLabel(order.deliveryMethod)}</dd></div>
                </dl>

                <div className="button-row order-action-row">
                  {isSeller && order.status === 'PENDING' ? (
                    <button className="btn btn-primary" type="button" onClick={() => updateOrder(order.id, 'confirm')}>
                      Xác nhận đơn
                    </button>
                  ) : null}
                  {(isBuyer || isSeller) && order.status === 'PENDING' ? (
                    <button className="btn btn-secondary" type="button" onClick={() => updateOrder(order.id, 'cancel')}>
                      Hủy đơn
                    </button>
                  ) : null}
                  {isBuyer && order.status === 'PROCESSING' ? (
                    <button className="btn btn-primary" type="button" onClick={() => updateOrder(order.id, 'complete')}>
                      Hoàn tất đơn
                    </button>
                  ) : null}
                </div>
              </div>

              {isBuyer && order.status === 'COMPLETED' ? (
                <form className="review-form" onSubmit={(event) => submitReview(event, order)}>
                  <h3><Star size={16} aria-hidden="true" /> Đánh giá người bán</h3>
                  <label>
                    Điểm đánh giá
                    <select
                      name={`rating-${order.id}`}
                      value={reviewDraft.rating}
                      onChange={(event) => updateReviewDraft(order.id, 'rating', event.target.value)}
                    >
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}/5</option>)}
                    </select>
                  </label>
                  <label>
                    Nhận xét
                    <textarea
                      required
                      name={`comment-${order.id}`}
                      value={reviewDraft.comment}
                      onChange={(event) => updateReviewDraft(order.id, 'comment', event.target.value)}
                      placeholder="Chia sẻ trải nghiệm mua hàng…"
                    />
                  </label>
                  <button className="btn btn-secondary" type="submit">Gửi đánh giá</button>
                </form>
              ) : null}
            </article>
          );
        })}
      </section>

      {loading ? <div className="page-state">Đang tải đơn hàng…</div> : null}
      {!loading && orders.length === 0 ? <div className="page-state">Chưa có đơn hàng nào.</div> : null}
    </div>
  );
};

export default Orders;
