import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  HandCoins,
  Inbox,
  Package,
  ReceiptText,
  Search,
  Send,
  ShoppingBag,
  Star,
  Truck,
  User,
  X,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import {
  apiAcceptOffer,
  apiApproveReturn,
  apiCancelOffer,
  apiCancelOrder,
  apiCompleteOrder,
  apiConfirmOrder,
  apiCreateReview,
  apiFetchOffers,
  apiFetchOrder,
  apiFetchOrders,
  apiFetchProductById,
  apiRejectOffer,
  apiRejectReturn,
  apiRequestReturn,
  resolveMediaUrl,
} from '../services/api';
import { startDepositCheckout, startPlatformFeeCheckout } from '../services/payment';
import { getRecentOrderIds, rememberOrderId } from '../services/orderHistory';
import './Operations.css';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

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

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Đặt hàng' },
  { key: 'PROCESSING', label: 'Đang giao dịch' },
  { key: 'COMPLETED', label: 'Hoàn tất' },
];

const stepIndexByStatus = { PENDING: 0, PROCESSING: 1, COMPLETED: 2, RETURN_REQUESTED: 2 };

// Việc đang chờ chính người dùng xử lý — dùng để gắn nhãn & đẩy đơn lên đầu.
const getOrderAction = (order, isBuyer, isSeller) => {
  const status = String(order.status);
  if (isSeller && status === 'PENDING') {
    return order.sellerShippingFeePaid
      ? { label: 'Cần xác nhận', tone: 'confirm' }
      : { label: 'Cần thanh toán phí', tone: 'pay' };
  }
  if (isBuyer && status === 'PROCESSING') return { label: 'Chờ bạn hoàn tất', tone: 'complete' };
  if (isSeller && status === 'RETURN_REQUESTED') return { label: 'Cần xử lý trả hàng', tone: 'return' };
  return null;
};

const SORT_OPTIONS = [
  { key: 'recent', label: 'Mới nhất' },
  { key: 'oldest', label: 'Cũ nhất' },
  { key: 'amount', label: 'Giá trị cao → thấp' },
];

// Nhãn ngắn cho nút hành động nhanh ngay trên dòng đơn.
const ROW_ACTION_LABEL = {
  pay: 'Thanh toán phí',
  confirm: 'Xác nhận đơn',
  complete: 'Hoàn tất',
  return: 'Xử lý trả',
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
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [confirmFiles, setConfirmFiles] = useState([]);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sortKey, setSortKey] = useState('recent');
  const [needsActionOnly, setNeedsActionOnly] = useState(false);
  const [listQuery, setListQuery] = useState('');
  const [offersOpen, setOffersOpen] = useState(false);
  const [productInfo, setProductInfo] = useState({});
  const fetchedProductIds = useRef(new Set());

  const loadOrder = async (id, quiet = false) => {
    if (!id) return;

    try {
      const order = await apiFetchOrder(id);
      rememberOrderId(order.id);
      setOrders((current) => [order, ...current.filter((item) => String(item.id) !== String(order.id))]);
    } catch (requestError) {
      if (!quiet) setError(requestError.message || 'Không thể tải đơn hàng này.');
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
        if (active) setError(requestError.message || 'Không thể tải danh sách giao dịch.');
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

  // Tải thông tin sản phẩm (ảnh + giá) cho các đơn để hiển thị trực quan hơn.
  useEffect(() => {
    const ids = [...new Set(orders.map((order) => String(order.productId)).filter(Boolean))]
      .filter((id) => !fetchedProductIds.current.has(id));
    if (!ids.length) return undefined;

    ids.forEach((id) => fetchedProductIds.current.add(id));
    let active = true;
    Promise.all(ids.map((id) => apiFetchProductById(id).then((product) => [id, product]).catch(() => [id, null])))
      .then((entries) => {
        if (!active) return;
        setProductInfo((current) => {
          const next = { ...current };
          entries.forEach(([id, product]) => { if (product) next[id] = product; });
          return next;
        });
      });

    return () => { active = false; };
  }, [orders]);

  const productOf = (order) => productInfo[String(order?.productId)] || null;

  // Ảnh & giá: ưu tiên sản phẩm còn hiển thị công khai, nếu không (đơn đã hủy,
  // sản phẩm đã ẩn/bán/xóa) thì dùng snapshot lưu sẵn trên đơn.
  const orderImageOf = (order) => productOf(order)?.imageUrl || resolveMediaUrl(order?.productImageUrl) || null;
  const orderPriceOf = (order) => productOf(order)?.price ?? order?.productAmount ?? null;

  const copyOrderId = (id) => {
    navigator.clipboard?.writeText(String(id))
      .then(() => toast.success('Đã sao chép mã đơn.'))
      .catch(() => {});
  };

  useEffect(() => {
    // Reset các form trong modal mỗi khi mở đơn khác.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfirmFiles([]);
    setShowReturnForm(false);
    setReturnReason('');
    setShowRejectForm(false);
    setRejectReason('');
  }, [activeOrderId]);

  useEffect(() => {
    if (!activeOrderId) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') setActiveOrderId(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [activeOrderId]);

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
      setError(requestError.message || 'Không thể cập nhật trạng thái đơn hàng.');
    }
  };

  const replaceOrder = (next) => {
    setOrders((current) => current.map((order) => (order.id === next.id ? next : order)));
  };

  // Seller xác nhận đơn kèm ảnh bằng chứng (tuỳ chọn).
  const confirmOrder = async (order) => {
    setError('');
    try {
      const next = await apiConfirmOrder(order.id, confirmFiles);
      replaceOrder(next);
      setConfirmFiles([]);
      toast.success('Đã xác nhận đơn hàng.');
      setFeedback('Đã xác nhận đơn hàng.');
    } catch (requestError) {
      setError(requestError.message || 'Không thể xác nhận đơn hàng.');
    }
  };

  // Seller thanh toán phí nền tảng qua VNPay trước khi được xác nhận đơn (mục 3.1).
  const payPlatformFee = async (order) => {
    setError('');
    try {
      await startPlatformFeeCheckout(order.id);
      // Trình duyệt sẽ rời trang sang cổng VNPay.
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo thanh toán phí nền tảng.');
    }
  };

  // Buyer gửi yêu cầu trả hàng.
  const requestReturn = async (order) => {
    if (!returnReason.trim()) {
      setError('Vui lòng nhập lý do trả hàng.');
      return;
    }
    setError('');
    try {
      const next = await apiRequestReturn(order.id, returnReason.trim());
      replaceOrder(next);
      setShowReturnForm(false);
      setReturnReason('');
      toast.success('Đã gửi yêu cầu trả hàng.');
      setFeedback('Đã gửi yêu cầu trả hàng.');
    } catch (requestError) {
      setError(requestError.message || 'Không thể gửi yêu cầu trả hàng.');
    }
  };

  // Seller phản hồi yêu cầu trả hàng.
  const respondReturn = async (order, action) => {
    setError('');
    try {
      const next = action === 'approve'
        ? await apiApproveReturn(order.id)
        : await apiRejectReturn(order.id, rejectReason.trim() || undefined);
      replaceOrder(next);
      setShowRejectForm(false);
      setRejectReason('');
      toast.success(action === 'approve' ? 'Đã duyệt trả hàng.' : 'Đã từ chối trả hàng.');
      setFeedback(action === 'approve' ? 'Đã duyệt trả hàng.' : 'Đã từ chối trả hàng.');
    } catch (requestError) {
      setError(requestError.message || 'Không thể xử lý yêu cầu trả hàng.');
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
      setError(requestError.message || 'Không thể cập nhật lời đề nghị này.');
    }
  };

  const checkoutOffer = async (offer) => {
    setError('');

    try {
      // Đơn từ offer cũng phải trả cọc qua VNPay trước khi được tạo.
      await startDepositCheckout(offer.productId, 'VIETTEL_POST', offer.id);
      // Trình duyệt sẽ rời trang sang cổng VNPay.
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo đơn hàng từ lời đề nghị này.');
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
      setError(requestError.message || 'Không thể gửi đánh giá lúc này.');
    }
  };

  const userKeys = [user?.id, user?.username].filter(Boolean).map(String);
  const sentOffers = offers.filter((offer) => userKeys.includes(String(offer.buyerId)));
  const receivedOffers = offers.filter((offer) => userKeys.includes(String(offer.sellerId)));
  const pendingOrders = orders.filter((order) => order.status === 'PENDING').length;
  const processingOrders = orders.filter((order) => order.status === 'PROCESSING').length;
  const completedOrders = orders.filter((order) => order.status === 'COMPLETED').length;

  const buyOrders = orders.filter((order) => userKeys.includes(String(order.buyerId)));
  const sellOrders = orders.filter((order) => userKeys.includes(String(order.sellerId)));

  const roleTabs = [
    { key: 'all', label: 'Tất cả', count: orders.length },
    { key: 'buy', label: 'Đơn mua', count: buyOrders.length },
    { key: 'sell', label: 'Đơn bán', count: sellOrders.length },
  ];

  const statusTabs = [
    { key: 'all', label: 'Mọi trạng thái' },
    { key: 'PENDING', label: 'Chờ xử lý' },
    { key: 'PROCESSING', label: 'Đang xử lý' },
    { key: 'COMPLETED', label: 'Hoàn tất' },
    { key: 'RETURN_REQUESTED', label: 'Yêu cầu trả' },
    { key: 'RETURNED', label: 'Đã trả' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  const orderActionFor = (order) => getOrderAction(
    order,
    userKeys.includes(String(order.buyerId)),
    userKeys.includes(String(order.sellerId)),
  );
  const needsActionCount = orders.filter(orderActionFor).length;

  // Hành động nhanh trên dòng đơn. Trả hàng cần chọn duyệt/từ chối nên mở popup.
  const runRowAction = (order, tone) => {
    if (tone === 'pay') return payPlatformFee(order);
    if (tone === 'confirm') return updateOrder(order.id, 'confirm');
    if (tone === 'complete') return updateOrder(order.id, 'complete');
    return setActiveOrderId(order.id);
  };

  const keyword = listQuery.trim().toLowerCase();
  const filteredOrders = orders
    .filter((order) => {
      const matchesRole = roleFilter === 'all'
        || (roleFilter === 'buy' && userKeys.includes(String(order.buyerId)))
        || (roleFilter === 'sell' && userKeys.includes(String(order.sellerId)));
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesAction = !needsActionOnly || Boolean(orderActionFor(order));
      const matchesKeyword = !keyword || [
        order.id,
        order.productTitle,
        order.productId,
        order.buyerId,
        order.sellerId,
      ].filter((value) => value != null).some((value) => String(value).toLowerCase().includes(keyword));
      return matchesRole && matchesStatus && matchesAction && matchesKeyword;
    })
    .sort((a, b) => {
      // Đơn cần xử lý luôn nổi lên đầu, sau đó áp dụng tiêu chí sắp xếp.
      const actionRank = (orderActionFor(b) ? 1 : 0) - (orderActionFor(a) ? 1 : 0);
      if (actionRank !== 0) return actionRank;
      if (sortKey === 'amount') return Number(b.amount || 0) - Number(a.amount || 0);
      if (sortKey === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

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

  const activeOrder = orders.find((order) => String(order.id) === String(activeOrderId)) || null;

  const renderOrderDetails = (order) => {
    const isBuyer = userKeys.includes(String(order.buyerId));
    const isSeller = userKeys.includes(String(order.sellerId));
    const reviewDraft = getReviewDraft(order.id);
    const isCancelled = order.status === 'CANCELLED';
    const isReturned = order.status === 'RETURNED';
    const evidenceImages = Array.isArray(order.evidenceImages) ? order.evidenceImages : [];
    const activeStep = stepIndexByStatus[order.status] ?? -1;
    const product = productOf(order);

    return (
      <>
        <div className="order-hero-product">
          <span className="order-hero-img">
            {orderImageOf(order)
              ? <img src={orderImageOf(order)} alt={order.productTitle || 'Sản phẩm'} />
              : <Package size={26} aria-hidden="true" />}
          </span>
          <div className="order-hero-copy">
            <strong>{order.productTitle || product?.title || `Sản phẩm #${order.productId}`}</strong>
            {orderPriceOf(order) != null ? (
              <span className="order-hero-price">{formatCurrency(orderPriceOf(order))}</span>
            ) : null}
            <Link
              to={`/products/${order.productId}`}
              className="order-hero-link"
              onClick={() => setActiveOrderId(null)}
            >
              Xem trang sản phẩm <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {isCancelled ? (
          <div className="order-timeline order-timeline-cancelled">
            Đơn hàng đã bị hủy{order.updatedAt ? ` · ${formatDateTime(order.updatedAt)}` : ''}
          </div>
        ) : isReturned ? (
          <div className="order-timeline order-timeline-cancelled">
            Đơn hàng đã được trả hàng{order.updatedAt ? ` · ${formatDateTime(order.updatedAt)}` : ''}
          </div>
        ) : (
          <ol className="order-timeline" aria-label="Tiến trình đơn hàng">
            {ORDER_STEPS.map((step, index) => {
              const state = index < activeStep ? 'done' : index === activeStep ? 'current' : 'todo';
              return (
                <li key={step.key} className={`order-step order-step-${state}`}>
                  <span className="order-step-dot" />
                  <span className="order-step-label">{step.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="order-highlight-grid">
          <div className="order-highlight">
            <span><HandCoins size={14} aria-hidden="true" /> Tổng tiền</span>
            <strong>{formatCurrency(order.amount)}</strong>
          </div>
          <div className="order-highlight">
            <span><Truck size={14} aria-hidden="true" /> Phí vận chuyển</span>
            <strong>{formatCurrency(order.shippingFee)}</strong>
          </div>
          {order.platformFee != null ? (
            <div className="order-highlight">
              <span><ReceiptText size={14} aria-hidden="true" /> Phí nền tảng</span>
              <strong>{formatCurrency(order.platformFee)}</strong>
            </div>
          ) : null}
          <div className="order-highlight">
            <span> Mã vận đơn</span>
            <strong>{order.trackingCode || 'Chưa có'}</strong>
          </div>
        </div>

        <dl className="fact-list order-facts">
          <div><dt>Mã đơn hàng</dt><dd translate="no">#{order.id}</dd></div>
          {order.productTitle ? <div><dt>Sản phẩm</dt><dd>{order.productTitle}</dd></div> : null}
          <div><dt>Mã sản phẩm</dt><dd translate="no">#{order.productId}</dd></div>
          <div><dt>Người mua</dt><dd translate="no">#{order.buyerId}</dd></div>
          <div><dt>Người bán</dt><dd translate="no">#{order.sellerId}</dd></div>
          <div><dt>Giao hàng</dt><dd>{deliveryMethodLabel(order.deliveryMethod)}</dd></div>
          <div><dt>Ngày tạo</dt><dd>{formatDateTime(order.createdAt)}</dd></div>
          <div><dt>Cập nhật</dt><dd>{formatDateTime(order.updatedAt)}</dd></div>
        </dl>

        {evidenceImages.length ? (
          <div className="order-evidence">
            <h3>Ảnh bằng chứng giao hàng</h3>
            <div className="order-evidence-grid">
              {evidenceImages.map((url, index) => {
                const resolved = resolveMediaUrl(url);
                return (
                  <a key={`${order.id}-evidence-${index}`} href={resolved} target="_blank" rel="noreferrer">
                    <img src={resolved} alt={`Bằng chứng ${index + 1}`} />
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}

        {order.returnReason ? (
          <div className="order-return-box">
            <strong>Yêu cầu trả hàng</strong>
            <p>{order.returnReason}</p>
            {order.returnRequestedAt ? <small>Gửi lúc {formatDateTime(order.returnRequestedAt)}</small> : null}
            {order.returnRejectReason ? (
              <p className="order-return-reject">Bị từ chối: {order.returnRejectReason}</p>
            ) : null}
          </div>
        ) : null}

        <div className="button-row order-action-row">
          {isSeller && order.status === 'PENDING' ? (
            <button className="btn btn-secondary" type="button" onClick={() => updateOrder(order.id, 'cancel')}>
              Hủy đơn
            </button>
          ) : null}

          {isBuyer && order.status === 'PENDING' ? (
            <button className="btn btn-secondary" type="button" onClick={() => updateOrder(order.id, 'cancel')}>
              Hủy đơn
            </button>
          ) : null}

          {isBuyer && order.status === 'PROCESSING' ? (
            <button className="btn btn-primary" type="button" onClick={() => updateOrder(order.id, 'complete')}>
              Hoàn tất đơn
            </button>
          ) : null}

          {isSeller && order.status === 'RETURN_REQUESTED' ? (
            <button className="btn btn-primary" type="button" onClick={() => respondReturn(order, 'approve')}>
              Duyệt trả hàng
            </button>
          ) : null}
        </div>

        {isSeller && order.status === 'PENDING' ? (
          order.sellerShippingFeePaid ? (
            <div className="order-confirm-block">
              <label className="order-evidence-upload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setConfirmFiles(Array.from(event.target.files || []))}
                />
                <span>
                  {confirmFiles.length
                    ? `${confirmFiles.length} ảnh bằng chứng đã chọn`
                    : 'Đính kèm ảnh bằng chứng (tuỳ chọn)'}
                </span>
              </label>
              <button className="btn btn-primary" type="button" onClick={() => confirmOrder(order)}>
                Xác nhận đơn
              </button>
            </div>
          ) : (
            <div className="order-fee-block">
              <p className="order-fee-hint">
                Bạn cần thanh toán phí nền tảng
                {order.platformFee != null ? ` ${formatCurrency(order.platformFee)}` : ''}
                {' '}qua VNPay trước khi xác nhận đơn hàng.
              </p>
              <button className="btn btn-primary" type="button" onClick={() => payPlatformFee(order)}>
                Thanh toán phí nền tảng
              </button>
            </div>
          )
        ) : null}

        {isBuyer && order.status === 'COMPLETED' && !order.returnReason ? (
          showReturnForm ? (
            <form
              className="order-inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                requestReturn(order);
              }}
            >
              <label>
                Lý do trả hàng
                <textarea
                  required
                  value={returnReason}
                  onChange={(event) => setReturnReason(event.target.value)}
                  placeholder="Mô tả vấn đề của sản phẩm để người bán xem xét…"
                />
              </label>
              <div className="button-row compact-buttons">
                <button className="btn btn-primary" type="submit">Gửi yêu cầu</button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowReturnForm(false)}>
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className="button-row order-action-row">
              <button className="btn btn-secondary" type="button" onClick={() => setShowReturnForm(true)}>
                Yêu cầu trả hàng
              </button>
            </div>
          )
        ) : null}

        {isSeller && order.status === 'RETURN_REQUESTED' ? (
          showRejectForm ? (
            <form
              className="order-inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                respondReturn(order, 'reject');
              }}
            >
              <label>
                Lý do từ chối <span className="field-optional">(tuỳ chọn)</span>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Giải thích vì sao từ chối yêu cầu trả hàng…"
                />
              </label>
              <div className="button-row compact-buttons">
                <button className="btn btn-primary" type="submit">Xác nhận từ chối</button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowRejectForm(false)}>
                  Quay lại
                </button>
              </div>
            </form>
          ) : (
            <div className="button-row order-action-row">
              <button className="btn btn-secondary" type="button" onClick={() => setShowRejectForm(true)}>
                Từ chối trả hàng
              </button>
            </div>
          )
        ) : null}

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
      </>
    );
  };

  const selectStatus = (status) => {
    setNeedsActionOnly(false);
    setStatusFilter(status);
  };

  const summaryCards = [
    {
      label: 'Tổng đơn',
      value: orders.length,
      icon: ReceiptText,
      onClick: () => { selectStatus('all'); setRoleFilter('all'); },
      active: !needsActionOnly && statusFilter === 'all',
    },
    {
      label: 'Chờ xử lý',
      value: pendingOrders,
      icon: Clock3,
      onClick: () => selectStatus('PENDING'),
      active: !needsActionOnly && statusFilter === 'PENDING',
    },
    {
      label: 'Đang giao dịch',
      value: processingOrders,
      icon: Truck,
      onClick: () => selectStatus('PROCESSING'),
      active: !needsActionOnly && statusFilter === 'PROCESSING',
    },
    {
      label: 'Hoàn tất',
      value: completedOrders,
      icon: BadgeCheck,
      onClick: () => selectStatus('COMPLETED'),
      active: !needsActionOnly && statusFilter === 'COMPLETED',
    },
    {
      label: 'Cần bạn xử lý',
      value: needsActionCount,
      icon: AlertCircle,
      accent: true,
      onClick: () => { setNeedsActionOnly(true); setStatusFilter('all'); setRoleFilter('all'); },
      active: needsActionOnly,
    },
  ];

  return (
    <main className="operations-page container orders-page-shell">
      <section className="orders-header">
        <h1 className="orders-title">Đơn hàng của tôi</h1>

        <form className="orders-lookup" onSubmit={lookup}>
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <input
              required
              type="search"
              name="orderId"
              autoComplete="off"
              spellCheck={false}
              inputMode="numeric"
              aria-label="Tìm mã đơn hàng"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Nhập mã đơn hàng…"
            />
          </label>

          <button className="btn btn-primary" type="submit">Tìm đơn</button>
        </form>
      </section>

      <section className="order-summary-grid" aria-label="Tóm tắt đơn hàng">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const className = [
            'order-summary-card',
            card.active ? 'is-active' : '',
            card.accent ? 'is-accent' : '',
          ].filter(Boolean).join(' ');
          return (
            <button type="button" className={className} key={card.label} onClick={card.onClick}>
              <span className="order-summary-icon"><Icon size={18} aria-hidden="true" /></span>
              <div>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
              </div>
            </button>
          );
        })}
      </section>

      {error ? <div className="feedback feedback-error" aria-live="polite">{error}</div> : null}
      {feedback ? <div className="feedback feedback-success" aria-live="polite">{feedback}</div> : null}

      <section className="offer-center offer-panel">
        <button
          type="button"
          className={`offer-panel-toggle${offersOpen ? ' is-open' : ''}`}
          onClick={() => setOffersOpen((open) => !open)}
          aria-expanded={offersOpen}
        >
          <span className="offer-panel-title">
            <HandCoins size={18} aria-hidden="true" />
            Lời đề nghị
            <span className="offer-panel-count">{sentOffers.length + receivedOffers.length}</span>
          </span>
          <span className="offer-panel-hint">
            {offersOpen ? 'Thu gọn' : 'Xem'}
            <ChevronDown size={18} aria-hidden="true" className="offer-panel-chevron" />
          </span>
        </button>

        <div className="two-column offer-columns" hidden={!offersOpen}>
          <div className="offer-column">
            <div className="offer-column-head">
              <h3 className="subsection-title">
                <Send size={16} aria-hidden="true" />
                Đã gửi
              </h3>
              <span>{sentOffers.length}</span>
            </div>

            <div className="stack-list">
              {sentOffers.length ? sentOffers.map((offer) => renderOfferCard(offer, 'sent')) : (
                <div className="surface muted empty-surface">Bạn chưa gửi lời đề nghị nào.</div>
              )}
            </div>
          </div>

          <div className="offer-column">
            <div className="offer-column-head">
              <h3 className="subsection-title">
                <Inbox size={16} aria-hidden="true" />
                Đã nhận
              </h3>
              <span>{receivedOffers.length}</span>
            </div>

            <div className="stack-list">
              {receivedOffers.length ? receivedOffers.map((offer) => renderOfferCard(offer, 'received')) : (
                <div className="surface muted empty-surface">Chưa có lời đề nghị nào từ người mua.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="order-list-section" aria-label="Danh sách đơn hàng">
        <div className="order-list-head">
          <div className="section-heading order-list-heading">
            <div>
              <h2>Đơn hàng <span className="order-count-hint">{filteredOrders.length}</span></h2>
            </div>

            <div className="order-list-tools">
              <label className="search-field order-list-search">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  name="orderListSearch"
                  autoComplete="off"
                  value={listQuery}
                  onChange={(event) => setListQuery(event.target.value)}
                  placeholder="Lọc theo mã đơn, sản phẩm…"
                />
              </label>

              <select
                className="order-sort-select"
                name="orderSort"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value)}
                aria-label="Sắp xếp đơn hàng"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="order-filter-bar">
            <div className="order-role-tabs" role="tablist" aria-label="Vai trò">
              {roleTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={roleFilter === tab.key}
                  className={roleFilter === tab.key ? 'active' : ''}
                  onClick={() => setRoleFilter(tab.key)}
                >
                  {tab.label}
                  <span>{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="order-status-chips">
              <button
                type="button"
                className={`order-action-chip${needsActionOnly ? ' active' : ''}`}
                onClick={() => setNeedsActionOnly((value) => !value)}
              >
                <AlertCircle size={14} aria-hidden="true" />
                Cần xử lý
                {needsActionCount ? <span>{needsActionCount}</span> : null}
              </button>
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={!needsActionOnly && statusFilter === tab.key ? 'active' : ''}
                  onClick={() => selectStatus(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="order-list-shell">
          {loading && orders.length === 0
            ? [0, 1, 2, 3].map((index) => (
              <div className="order-line-item order-skeleton" key={`order-skeleton-${index}`} aria-hidden="true">
                <span className="oli-thumb sk-box" />
                <span className="oli-main">
                  <span className="sk-line sk-line-lg" />
                  <span className="sk-line sk-line-sm" />
                </span>
                <span className="oli-side"><span className="sk-line sk-line-amt" /></span>
              </div>
            ))
            : filteredOrders.map((order) => {
              const isBuyer = userKeys.includes(String(order.buyerId));
              const counterpartLabel = isBuyer ? 'Người bán' : 'Người mua';
              const counterpartId = isBuyer ? order.sellerId : order.buyerId;
              const action = orderActionFor(order);
              const openModal = () => setActiveOrderId(order.id);

              return (
                <div
                  role="button"
                  tabIndex={0}
                  className={`order-line-item${action ? ' is-action' : ''}`}
                  key={order.id}
                  onClick={openModal}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openModal();
                    }
                  }}
                >
                  <span className="oli-thumb">
                    {orderImageOf(order)
                      ? <img src={orderImageOf(order)} alt={order.productTitle || 'Sản phẩm'} loading="lazy" />
                      : <Package size={20} aria-hidden="true" />}
                  </span>

                  <span className="oli-main">
                    <span className="oli-top">
                      <span className={`oli-role oli-role-${isBuyer ? 'buy' : 'sell'}`}>
                        {isBuyer ? 'Mua' : 'Bán'}
                      </span>
                      <span className="oli-id" translate="no">Đơn hàng #{order.id}</span>
                      <StatusBadge status={order.status} />
                      {action ? <span className={`oli-action oli-action-${action.tone}`}>{action.label}</span> : null}
                    </span>
                    <span className="oli-meta">
                      <span className="oli-product">{order.productTitle || `Sản phẩm #${order.productId}`}</span>
                      <span translate="no">{counterpartLabel} #{counterpartId}</span>
                      <span>{formatDateTime(order.createdAt)}</span>
                    </span>
                  </span>

                  <span className="oli-side">
                    <strong>{formatCurrency(order.amount)}</strong>
                    {action ? (
                      <button
                        type="button"
                        className={`oli-quick oli-quick-${action.tone}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          runRowAction(order, action.tone);
                        }}
                      >
                        {ROW_ACTION_LABEL[action.tone]}
                      </button>
                    ) : (
                      <span className="oli-view">Xem chi tiết <ChevronRight size={15} aria-hidden="true" /></span>
                    )}
                  </span>
                </div>
              );
            })}

          {!loading && needsActionOnly && filteredOrders.length === 0 ? (
            <div className="page-state order-empty-filter">Bạn không có đơn nào cần xử lý ngay. 🎉</div>
          ) : null}

          {!loading && !needsActionOnly && orders.length > 0 && filteredOrders.length === 0 ? (
            <div className="page-state order-empty-filter">Không có đơn hàng phù hợp với bộ lọc.</div>
          ) : null}

          {!loading && orders.length === 0 ? (
            <div className="order-empty">
              <span className="order-empty-icon"><ShoppingBag size={30} aria-hidden="true" /></span>
              <strong>Chưa có đơn hàng nào</strong>
              <p>Khi bạn mua hoặc bán thành công, đơn hàng sẽ xuất hiện ở đây.</p>
              <Link to="/" className="btn btn-primary">Khám phá sản phẩm</Link>
            </div>
          ) : null}
        </div>
      </section>

      {activeOrder ? (
        <div className="order-modal-overlay" onClick={() => setActiveOrderId(null)}>
          <div
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Đơn hàng #${activeOrder.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="order-modal-head">
              <div className="order-modal-head-copy">
                <h2 translate="no">
                  Đơn hàng #{activeOrder.id}
                  <button
                    type="button"
                    className="order-copy-id"
                    onClick={() => copyOrderId(activeOrder.id)}
                    aria-label="Sao chép mã đơn"
                    title="Sao chép mã đơn"
                  >
                    <Copy size={14} aria-hidden="true" />
                  </button>
                </h2>
                <p>
                  <span className="order-modal-role">
                    <User size={13} aria-hidden="true" />
                    {userKeys.includes(String(activeOrder.buyerId))
                      ? 'Bạn là người mua'
                      : userKeys.includes(String(activeOrder.sellerId))
                        ? 'Bạn là người bán'
                        : 'Đơn hàng liên quan'}
                  </span>
                </p>
              </div>

              <div className="order-modal-head-actions">
                <StatusBadge status={activeOrder.status} />
                <button
                  type="button"
                  className="order-modal-close"
                  onClick={() => setActiveOrderId(null)}
                  aria-label="Đóng"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="order-modal-body">
              {renderOrderDetails(activeOrder)}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default Orders;
