import { useEffect, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import { useUser } from '../context/UserContext';
import {
  apiAcceptOffer,
  apiCancelOrder,
  apiCancelOffer,
  apiCompleteOrder,
  apiConfirmOrder,
  apiCreateReview,
  apiCreateOrder,
  apiFetchOrder,
  apiFetchOrders,
  apiFetchOffers,
  apiRejectOffer,
} from '../services/api';
import { getRecentOrderIds, rememberOrderId } from '../services/orderHistory';
import './Operations.css';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [orders, setOrders] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
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
    let active = true;
    setLoading(true);
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
      setFeedback('Đã tạo đơn hàng bằng giá ưu đãi.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitReview = async (event, order) => {
    event.preventDefault();
    try {
      await apiCreateReview({ orderId: order.id, rating: Number(review.rating), comment: review.comment });
      setFeedback('Đã gửi đánh giá thành công.');
      setReview({ rating: '5', comment: '' });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const userKeys = [user?.id, user?.username].filter(Boolean).map(String);
  const sentOffers = offers.filter((offer) => userKeys.includes(String(offer.buyerId)));
  const receivedOffers = offers.filter((offer) => userKeys.includes(String(offer.sellerId)));

  const renderOfferCard = (offer, direction) => {
    const isSent = direction === 'sent';
    const canSellerAct = !isSent && offer.status === 'PENDING';
    const canBuyerCancel = isSent && offer.status === 'PENDING';
    const canBuyerCheckout = isSent && offer.status === 'ACCEPTED';

    return (
      <article className="offer-row surface" key={`${direction}-${offer.id}`}>
        <div className="row-between">
          <div>
            <h3>Lời đề nghị #{offer.id}</h3>
            <p>Sản phẩm #{offer.productId}</p>
          </div>
          <StatusBadge status={offer.status} />
        </div>
        <dl className="fact-list compact">
          <div><dt>Giá gốc</dt><dd>{Number(offer.originalPrice || 0).toLocaleString('vi-VN')} VND</dd></div>
          <div><dt>Giá đề nghị</dt><dd>{Number(offer.offerPrice || 0).toLocaleString('vi-VN')} VND</dd></div>
          <div><dt>Mức giảm</dt><dd>{offer.discountPercent}%</dd></div>
          <div><dt>Hết hạn</dt><dd>{offer.expiresAt ? new Date(offer.expiresAt).toLocaleString('vi-VN') : 'Không rõ'}</dd></div>
        </dl>
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
      <header className="operations-header">
        <div>
          <h1>Đơn hàng</h1>
        </div>
      </header>

      <form className="catalog-toolbar" onSubmit={lookup}>
        <label className="search-field">
          <Search size={18} />
          <input
            required
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Mã đơn hàng"
          />
        </label>
        <button className="btn btn-primary">Tìm đơn</button>
      </form>

      {error ? <div className="feedback feedback-error">{error}</div> : null}
      {feedback ? <div className="feedback feedback-success">{feedback}</div> : null}

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

      <div className="stack-list">
        {orders.map((order) => {
          const isBuyer = userKeys.includes(String(order.buyerId));
          const isSeller = userKeys.includes(String(order.sellerId));
          return (
            <article className="surface order-row" key={order.id}>
              <div className="order-main">
                <div className="row-between">
                  <h2>Đơn hàng #{order.id}</h2>
                  <StatusBadge status={order.status} />
                </div>
                <dl className="fact-list">
                  <div><dt>Mã sản phẩm</dt><dd>{order.productId}</dd></div>
                  <div><dt>Người mua</dt><dd>{order.buyerId}</dd></div>
                  <div><dt>Người bán</dt><dd>{order.sellerId}</dd></div>
                  <div><dt>Tổng tiền</dt><dd>{Number(order.amount || 0).toLocaleString('vi-VN')} VND</dd></div>
                  <div><dt>Phí vận chuyển</dt><dd>{Number(order.shippingFee || 0).toLocaleString('vi-VN')} VND</dd></div>
                  <div><dt>Giao hàng</dt><dd>{deliveryMethodLabel(order.deliveryMethod)}</dd></div>
                  <div><dt>Mã vận đơn</dt><dd>{order.trackingCode || 'Chưa có'}</dd></div>
                </dl>
                <div className="button-row">
                  {isSeller && order.status === 'PENDING' ? (
                    <button className="btn btn-primary" onClick={() => updateOrder(order.id, 'confirm')}>
                      Xác nhận đơn
                    </button>
                  ) : null}
                  {(isBuyer || isSeller) && order.status === 'PENDING' ? (
                    <button className="btn btn-secondary" onClick={() => updateOrder(order.id, 'cancel')}>
                      Hủy đơn
                    </button>
                  ) : null}
                  {isBuyer && order.status === 'PROCESSING' ? (
                    <button className="btn btn-primary" onClick={() => updateOrder(order.id, 'complete')}>
                      Hoàn tất đơn
                    </button>
                  ) : null}
                </div>
              </div>

              {isBuyer && order.status === 'COMPLETED' ? (
                <form className="review-form" onSubmit={(event) => submitReview(event, order)}>
                  <h3><Star size={16} /> Đánh giá người bán</h3>
                  <label>
                    Điểm đánh giá
                    <select value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })}>
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}/5</option>)}
                    </select>
                  </label>
                  <label>
                    Nhận xét
                    <textarea
                      required
                      value={review.comment}
                      onChange={(event) => setReview({ ...review, comment: event.target.value })}
                    />
                  </label>
                  <button className="btn btn-secondary">Gửi đánh giá</button>
                </form>
              ) : null}
            </article>
          );
        })}
      </div>

      {loading ? <div className="page-state">Dang tai don hang...</div> : null}
      {!loading && orders.length === 0 ? <div className="page-state">Chua co don hang nao.</div> : null}
    </div>
  );
};

export default Orders;
