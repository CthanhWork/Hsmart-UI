import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  Percent,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import StatusBadge from '../components/common/StatusBadge';
import { useUser } from '../context/UserContext';
import {
  apiCreateOffer,
  apiCreateOrder,
  apiEstimateGuestShipping,
  apiEstimateShipping,
  apiFetchDistricts,
  apiFetchProductById,
  apiFetchProductPage,
  apiFetchProvinces,
  apiFetchSellerReviews,
  apiSubmitReport,
  apiToggleWishlist,
} from '../services/api';
import { rememberOrderId } from '../services/orderHistory';
import './ProductDetail.css';

const formatPrice = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useUser();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [reportReason, setReportReason] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [showOfferConfirm, setShowOfferConfirm] = useState(false);
  const [showGuestShippingModal, setShowGuestShippingModal] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('VIETTEL_POST');
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [shippingEstimateError, setShippingEstimateError] = useState('');
  const [shippingEstimateLoading, setShippingEstimateLoading] = useState(false);
  const [guestProvinces, setGuestProvinces] = useState([]);
  const [guestDistricts, setGuestDistricts] = useState([]);
  const [guestShippingForm, setGuestShippingForm] = useState({ provinceCode: '', districtCode: '' });
  const [selectedDiscountPercent, setSelectedDiscountPercent] = useState(10);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const nextProduct = await apiFetchProductById(id);
        setProduct(nextProduct);

        const [sellerReviews, featuredPage] = await Promise.all([
          apiFetchSellerReviews(nextProduct.sellerId).catch(() => []),
          apiFetchProductPage({ status: 'APPROVED', size: 5 }).catch(() => ({ content: [] })),
        ]);

        setReviews(Array.isArray(sellerReviews) ? sellerReviews : []);
        setFeaturedProducts(
          (featuredPage.content || [])
            .filter((item) => String(item.id) !== String(nextProduct.id))
            .slice(0, 3),
        );
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id || !isAuthenticated || product.status !== 'APPROVED') {
      setShippingEstimate(null);
      setShippingEstimateError('');
      return;
    }
    if (user && String(product.sellerId) === String(user.username || user.id)) {
      setShippingEstimate(null);
      setShippingEstimateError('');
      return;
    }

    let active = true;
    setShippingEstimateLoading(true);
    setShippingEstimateError('');
    apiEstimateShipping(product.id, deliveryMethod)
      .then((estimate) => {
        if (!active) return;
        setShippingEstimate(estimate);
      })
      .catch((requestError) => {
        if (!active) return;
        setShippingEstimate(null);
        setShippingEstimateError(requestError.message || 'KhÃ´ng thá»ƒ tÃ­nh phÃ­ váº­n chuyá»ƒn lÃºc nÃ y.');
      })
      .finally(() => {
        if (active) setShippingEstimateLoading(false);
      });

    return () => {
      active = false;
    };
  }, [deliveryMethod, isAuthenticated, product?.id, product?.sellerId, product?.status, user]);

  useEffect(() => {
    if (!showGuestShippingModal || guestProvinces.length > 0) return;

    apiFetchProvinces()
      .then((data) => setGuestProvinces(Array.isArray(data) ? data : []))
      .catch((requestError) => setShippingEstimateError(requestError.message));
  }, [guestProvinces.length, showGuestShippingModal]);

  useEffect(() => {
    if (!guestShippingForm.provinceCode) {
      setGuestDistricts([]);
      return;
    }

    apiFetchDistricts(guestShippingForm.provinceCode)
      .then((data) => setGuestDistricts(Array.isArray(data) ? data : []))
      .catch((requestError) => setShippingEstimateError(requestError.message));
  }, [guestShippingForm.provinceCode]);

  const requireAccount = () => {
    if (!isAuthenticated) {
      setError('Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ thá»±c hiá»‡n thao tÃ¡c nÃ y.');
      return false;
    }
    return true;
  };

  const submitGuestShippingEstimate = async (event) => {
    event.preventDefault();
    const province = guestProvinces.find((item) => String(item.code) === String(guestShippingForm.provinceCode));
    const district = guestDistricts.find((item) => String(item.code) === String(guestShippingForm.districtCode));
    if (!province || !district) {
      setShippingEstimateError('Vui lòng chọn tỉnh/thành và quận/huyện.');
      return;
    }

    try {
      setShippingEstimateLoading(true);
      setShippingEstimateError('');
      const estimate = await apiEstimateGuestShipping({
        productId: product.id,
        deliveryMethod,
        province: province.name,
        district: district.name,
      });
      setShippingEstimate(estimate);
      setShowGuestShippingModal(false);
    } catch (requestError) {
      setShippingEstimateError(requestError.message);
    } finally {
      setShippingEstimateLoading(false);
    }
  };

  const openPurchaseConfirm = () => {
    if (!requireAccount()) return;
    setFeedback('');
    setError('');
    setShowPurchaseConfirm(true);
  };

  const openOfferConfirm = () => {
    if (!requireAccount()) return;
    setFeedback('');
    setError('');
    setShowOfferConfirm(true);
  };

  const buyProduct = async () => {
    if (!requireAccount()) return;
    setError('');

    try {
      setIsOrdering(true);
      const order = await apiCreateOrder(product.id, deliveryMethod);
      rememberOrderId(order.id);
      navigate(`/orders?orderId=${order.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsOrdering(false);
    }
  };

  const submitOffer = async () => {
    if (!requireAccount()) return;
    setError('');

    try {
      setIsSubmittingOffer(true);
      const offer = await apiCreateOffer({
        productId: product.id,
        discountPercent: selectedDiscountPercent,
      });
      setShowOfferConfirm(false);
      setFeedback(
        `ÄÃ£ gá»­i Ä‘á» nghá»‹ ${formatPrice(offer.offerPrice)} cho ngÆ°á»i bÃ¡n. Äá» nghá»‹ sáº½ tá»± háº¿t háº¡n sau 24 giá».`,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const toggleWishlist = async () => {
    if (!requireAccount()) return;
    setError('');

    try {
      const response = await apiToggleWishlist(product.id);
      setFeedback(response?.message || 'ÄÃ£ cáº­p nháº­t danh sÃ¡ch yÃªu thÃ­ch.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!requireAccount()) return;
    if (!reportReason.trim()) return;
    setError('');

    try {
      await apiSubmitReport(product.id, reportReason.trim());
      setReportReason('');
      setFeedback('BÃ¡o cÃ¡o Ä‘Ã£ Ä‘Æ°á»£c gá»­i Ä‘á»ƒ quáº£n trá»‹ viÃªn xem xÃ©t.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const sellerStats = useMemo(() => {
    const averageRating = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
      : 0;

    return {
      averageRating,
      displayRating: averageRating ? averageRating.toFixed(1) : 'ChÆ°a cÃ³',
    };
  }, [reviews]);

  if (loading) {
    return (
      <main className="shopee-detail-page">
        <div className="shopee-detail-shell">
          <div className="detail-skeleton detail-skeleton-main" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="shopee-detail-page">
        <div className="product-detail-empty">
          <p>{error || 'KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m.'}</p>
          <Link to="/" className="outline-orange-button">Quay láº¡i chá»£</Link>
        </div>
      </main>
    );
  }

  const isOwner = user && String(product.sellerId) === String(user.username || user.id);
  const isApproved = product.status === 'APPROVED';
  const comparePrice = Math.round(Number(product.price || 0) * 1.18);
  const galleryImages = Array.isArray(product.imageUrls) && product.imageUrls.length
    ? product.imageUrls
    : [product.imageUrl];
  const activeImage = galleryImages[activeImageIndex] || galleryImages[0] || product.imageUrl;
  const sellerLocation = [product.sellerDistrict, product.sellerProvince].filter(Boolean).join(', ');
  const selectedOfferPrice = Math.round(Number(product.price || 0) * (100 - selectedDiscountPercent) / 100);
  const estimatedShippingFee = shippingEstimate?.shippingFee;

  return (
    <main className="shopee-detail-page">
      <div className="shopee-detail-shell">
        <nav className="detail-breadcrumb" aria-label="ÄÆ°á»ng dáº«n sáº£n pháº©m">
          <Link to="/">H-Smart</Link>
          <span>{product.categoryName || 'Sáº£n pháº©m'}</span>
          <span>{product.title}</span>
        </nav>

        <section className="shopee-product-main">
          <div className="product-gallery-panel">
            <div className="main-gallery-image">
              <img src={activeImage} alt={product.title} />
            </div>

            <div className="gallery-thumbnail-row" aria-label="áº¢nh sáº£n pháº©m">
              {galleryImages.map((image, index) => (
                <button
                  className={index === activeImageIndex ? 'active' : ''}
                  key={`${product.id}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={image} alt={`${product.title} ${index + 1}`} />
                </button>
              ))}
            </div>

            <div className="gallery-social-row">
              <span>Chia sáº»:</span>
              <button type="button">Zalo</button>
              <button type="button">Facebook</button>
              <button type="button">Link</button>
              <button type="button" onClick={toggleWishlist} className="gallery-like-button">
                <Heart size={16} />
                ÄÃ£ thÃ­ch ({product.likeCount || 0})
              </button>
            </div>
          </div>

          <div className="product-buy-panel">
            <div className="product-title-row">
              {isApproved ? (
                <span className="assurance-badge">
                  <BadgeCheck size={15} />
                  H-Smart Báº£o Äáº£m
                </span>
              ) : (
                <StatusBadge status={product.status} />
              )}
              <h1>{product.title}</h1>
            </div>

            <div className="rating-row">
              <span className="rating-score">{sellerStats.displayRating}</span>
              <span className="rating-stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={14} fill="currentColor" />
                ))}
              </span>
              <span>{reviews.length} Ä‘Ã¡nh giÃ¡</span>
              <span>{product.likeCount || 0} Ä‘Ã£ thÃ­ch</span>
              <small>Tá»‘ cÃ¡o</small>
            </div>

            <div className="price-band">
              <span className="original-price">{formatPrice(comparePrice)}</span>
              <strong>{formatPrice(product.price)}</strong>
            </div>

            <dl className="purchase-options">
              <div>
                <dt>Địa điểm</dt>
                <dd><MapPin size={15} /> {sellerLocation || 'Người bán chưa cập nhật địa điểm'}</dd>
              </div>
              <div>
                <dt>Vận chuyển</dt>
                <dd className="shipping-estimate-row">
                  <Truck size={15} />
                  {shippingEstimateLoading
                    ? 'Đang tính phí vận chuyển...'
                    : estimatedShippingFee != null
                      ? `${deliveryMethod === 'VIETTEL_POST' ? 'Viettel Post' : 'GHTK'} dự kiến ${formatPrice(estimatedShippingFee)}`
                      : isAuthenticated
                        ? shippingEstimateError || 'Chưa có phí vận chuyển dự kiến'
                        : (
                          <button
                            className="inline-link-button"
                            type="button"
                            onClick={() => setShowGuestShippingModal(true)}
                          >
                            Giao tới: Chọn địa chỉ
                          </button>
                        )}
                </dd>
              </div>
              <div>
                <dt>An tâm mua sắm</dt>
                <dd><ShieldCheck size={15} /> H-Smart giữ quyền lợi người mua cho đến khi giao nhận thành công</dd>
              </div>
              <div>
                <dt>PhÃ¢n loáº¡i</dt>
                <dd>
                  <button className="variant-chip active" type="button">
                    {product.categoryName || 'Sáº£n pháº©m'}
                  </button>
                  <button className="variant-chip" type="button">CÃ²n hÃ ng</button>
                </dd>
              </div>
              <div>
                <dt>Sá»‘ lÆ°á»£ng</dt>
                <dd className="quantity-control">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                    <Minus size={13} />
                  </button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => value + 1)}>
                    <Plus size={13} />
                  </button>
                </dd>
              </div>
            </dl>

            <div className="detail-alert-stack">
              {error ? <div className="detail-alert detail-alert-error"><p>{error}</p></div> : null}
              {feedback ? <div className="detail-alert detail-alert-success"><p>{feedback}</p></div> : null}
            </div>

            {!isOwner ? (
              <div className="shopee-action-row">
                <button className="outline-orange-button" onClick={toggleWishlist} type="button">
                  <ShoppingCart size={17} />
                  ThÃªm vÃ o giá» hÃ ng
                </button>
                <button className="solid-orange-button" onClick={openPurchaseConfirm} disabled={!isApproved} type="button">
                  Mua ngay
                </button>
                <button className="outline-gray-button" onClick={openOfferConfirm} disabled={!isApproved} type="button">
                  <Percent size={16} />
                  Trả giá
                </button>
                <Link
                  className="outline-gray-button"
                  to={`/chat?participantId=${encodeURIComponent(product.sellerId)}&productId=${product.id}`}
                >
                  <MessageCircle size={16} />
                  Chat
                </Link>
              </div>
            ) : (
              <Link className="outline-orange-button owner-edit-button" to={`/products/${product.id}/edit`}>
                Sá»­a tin Ä‘Äƒng
              </Link>
            )}
          </div>
        </section>

        <section className="seller-shop-strip">
          <div className="seller-identity">
            <div className="seller-avatar-shop"><Store size={24} /></div>
            <div>
              <strong>{product.sellerId}</strong>
              <span>Online gáº§n Ä‘Ã¢y</span>
              <div className="seller-shop-actions">
                <Link to={`/chat?participantId=${encodeURIComponent(product.sellerId)}&productId=${product.id}`}>
                  <MessageCircle size={14} />
                  Chat ngay
                </Link>
                <Link to="/">Xem shop</Link>
              </div>
            </div>
          </div>

          <div className="seller-shop-stats">
            <div><span>ÄÃ¡nh giÃ¡</span><strong>{reviews.length}</strong></div>
            <div><span>Äiá»ƒm trung bÃ¬nh</span><strong>{sellerStats.displayRating}</strong></div>
          </div>
        </section>

        <div className="detail-content-layout">
          <div className="detail-content-main">
            <section className="detail-info-block">
              <h2>Chi tiáº¿t sáº£n pháº©m</h2>
              <dl>
                <div><dt>Danh má»¥c</dt><dd>H-Smart / {product.categoryName || 'Sáº£n pháº©m'}</dd></div>
                <div><dt>TÃ¬nh tráº¡ng</dt><dd>ÄÃ£ qua sá»­ dá»¥ng, cÃ²n hoáº¡t Ä‘á»™ng tá»‘t</dd></div>
                <div><dt>NgÆ°á»i bÃ¡n</dt><dd>{product.sellerId}</dd></div>
              </dl>
            </section>

            <section className="detail-info-block">
              <h2>MÃ´ táº£ sáº£n pháº©m</h2>
              <p className="description-text">{product.description || 'NgÆ°á»i bÃ¡n chÆ°a cung cáº¥p mÃ´ táº£.'}</p>
            </section>

            <section className="detail-info-block review-block">
              <h2>ÄÃ¡nh giÃ¡ sáº£n pháº©m</h2>
              <div className="review-score-board">
                <strong>{sellerStats.displayRating} <span>trÃªn 5</span></strong>
                <span className="rating-stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={18} fill="currentColor" />
                  ))}
                </span>
                <div className="review-filter-row">
                  <button className="active" type="button">Táº¥t cáº£</button>
                  <button type="button">5 sao</button>
                  <button type="button">CÃ³ bÃ¬nh luáº­n</button>
                  <button type="button">CÃ³ hÃ¬nh áº£nh</button>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="empty-review-text">ChÆ°a cÃ³ Ä‘Ã¡nh giÃ¡ cho ngÆ°á»i bÃ¡n nÃ y.</p>
              ) : (
                <ul className="review-list">
                  {reviews.map((review) => (
                    <li key={review.id}>
                      <div className="review-avatar">
                        {String(review.buyerId || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <strong>{review.buyerId}</strong>
                        <span className="rating-stars">
                          {Array.from({ length: review.rating || 5 }).map((_, index) => (
                            <Star key={index} size={13} fill="currentColor" />
                          ))}
                        </span>
                        <p>{review.comment || 'KhÃ´ng cÃ³ nháº­n xÃ©t.'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="detail-sidebar">
            <section className="sidebar-card">
              <h3>Sáº£n pháº©m ná»•i báº­t</h3>
              {featuredProducts.length ? (
                <div className="sidebar-product-grid">
                  {featuredProducts.map((item) => <ProductCard key={item.id} product={item} variant="compact" />)}
                </div>
              ) : (
                <div className="sidebar-product-fallback">
                  <img src={activeImage} alt={product.title} />
                  <span>{product.categoryName || 'Sáº£n pháº©m'} giÃ¡ tá»‘t</span>
                  <strong>{formatPrice(product.price)}</strong>
                </div>
              )}
            </section>

            {!isOwner ? (
              <section className="sidebar-card report-card">
                <h3>BÃ¡o cÃ¡o tin Ä‘Äƒng</h3>
                <form onSubmit={submitReport}>
                  <textarea
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    required
                    placeholder="LÃ½ do bÃ¡o cÃ¡o"
                  />
                  <button type="submit"><Flag size={14} /> Gá»­i bÃ¡o cÃ¡o</button>
                </form>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
      {showPurchaseConfirm ? (
        <div className="purchase-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="purchase-confirm-title">
          <section className="purchase-confirm-modal">
            <button
              className="purchase-confirm-close"
              type="button"
              onClick={() => setShowPurchaseConfirm(false)}
              aria-label="ÄÃ³ng xÃ¡c nháº­n Ä‘áº·t hÃ ng"
            >
              <X size={18} />
            </button>
            <h2 id="purchase-confirm-title">XÃ¡c nháº­n Ä‘áº·t hÃ ng</h2>
            <p className="purchase-confirm-copy">
              Kiá»ƒm tra láº¡i sáº£n pháº©m vÃ  phÆ°Æ¡ng thá»©c giao hÃ ng trÆ°á»›c khi táº¡o Ä‘Æ¡n. Sau bÆ°á»›c nÃ y ngÆ°á»i bÃ¡n sáº½ nháº­n Ä‘Æ°á»£c yÃªu cáº§u xÃ¡c nháº­n.
            </p>

            <div className="purchase-confirm-product">
              <img src={activeImage} alt={product.title} />
              <div>
                <strong>{product.title}</strong>
                <span>{product.categoryName || 'Sáº£n pháº©m'}</span>
                <b>{formatPrice(product.price)}</b>
              </div>
            </div>

            <fieldset className="delivery-method-options">
              <legend>PhÆ°Æ¡ng thá»©c giao hÃ ng</legend>
              <label className={deliveryMethod === 'GHTK' ? 'active' : ''}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="GHTK"
                  checked={deliveryMethod === 'GHTK'}
                  onChange={(event) => setDeliveryMethod(event.target.value)}
                />
                <span>
                  <strong>Giao HÃ ng Tiáº¿t Kiá»‡m</strong>
                  <small>Há»‡ thá»‘ng tÃ­nh phÃ­ ship tá»« Ä‘á»‹a chá»‰ ngÆ°á»i mua vÃ  ngÆ°á»i bÃ¡n. Náº¿u GHTK lá»—i, Ä‘Æ¡n sáº½ khÃ´ng Ä‘Æ°á»£c táº¡o.</small>
                </span>
              </label>
              <label className={deliveryMethod === 'VIETTEL_POST' ? 'active' : ''}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="VIETTEL_POST"
                  checked={deliveryMethod === 'VIETTEL_POST'}
                  onChange={(event) => setDeliveryMethod(event.target.value)}
                />
                <span>
                  <strong>Viettel Post</strong>
                  <small>Há»‡ thá»‘ng dÃ¹ng API demo cá»§a Viettel Post Ä‘á»ƒ tÃ­nh phÃ­ vÃ  táº¡o váº­n Ä‘Æ¡n khi ngÆ°á»i bÃ¡n xÃ¡c nháº­n.</small>
                </span>
              </label>
            </fieldset>

            <dl className="purchase-confirm-total">
              <div>
                <dt>Táº¡m tÃ­nh</dt>
                <dd>{formatPrice(product.price)}</dd>
              </div>
              <div>
                <dt>PhÃ­ váº­n chuyá»ƒn</dt>
                <dd>{estimatedShippingFee != null ? formatPrice(estimatedShippingFee) : 'Tính khi tạo đơn'}</dd>
              </div>
              <div>
                <dt>Tổng dự kiến</dt>
                <dd>{estimatedShippingFee != null ? formatPrice(Number(product.price || 0) + Number(estimatedShippingFee || 0)) : formatPrice(product.price)}</dd>
              </div>
            </dl>

            <div className="purchase-confirm-actions">
              <button className="outline-gray-button" type="button" onClick={() => setShowPurchaseConfirm(false)}>
                Quay láº¡i
              </button>
              <button className="solid-orange-button" type="button" onClick={buyProduct} disabled={isOrdering}>
                {isOrdering ? 'Äang táº¡o Ä‘Æ¡n...' : 'XÃ¡c nháº­n Ä‘áº·t hÃ ng'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {showOfferConfirm ? (
        <div className="purchase-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="offer-confirm-title">
          <section className="purchase-confirm-modal offer-confirm-modal">
            <button
              className="purchase-confirm-close"
              type="button"
              onClick={() => setShowOfferConfirm(false)}
              aria-label="Đóng trả giá"
            >
              <X size={18} />
            </button>
            <h2 id="offer-confirm-title">Trả giá nhanh</h2>
            <p className="purchase-confirm-copy">
              Chọn mức đề nghị gửi cho người bán. Người bán có thể chấp nhận, từ chối hoặc tiếp tục thương lượng qua tin nhắn.
            </p>

            <div className="purchase-confirm-product">
              <img src={activeImage} alt={product.title} />
              <div>
                <strong>{product.title}</strong>
                <span>Giá niêm yết: {formatPrice(product.price)}</span>
                <b>Giá đề nghị: {formatPrice(selectedOfferPrice)}</b>
              </div>
            </div>

            <div className="offer-discount-grid" role="group" aria-label="Chọn mức giảm giá">
              {[5, 10, 15].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  className={selectedDiscountPercent === percent ? 'active' : ''}
                  onClick={() => setSelectedDiscountPercent(percent)}
                >
                  <span>Giảm {percent}%</span>
                  <strong>{formatPrice(Math.round(Number(product.price || 0) * (100 - percent) / 100))}</strong>
                </button>
              ))}
            </div>

            <div className="purchase-confirm-actions">
              <button className="outline-gray-button" type="button" onClick={() => setShowOfferConfirm(false)}>
                Hủy
              </button>
              <button className="solid-orange-button" type="button" onClick={submitOffer} disabled={isSubmittingOffer}>
                {isSubmittingOffer ? 'Đang gửi...' : 'Gửi trả giá'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {showGuestShippingModal ? (
        <div className="purchase-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="guest-shipping-title">
          <section className="purchase-confirm-modal guest-shipping-modal">
            <button
              className="purchase-confirm-close"
              type="button"
              onClick={() => setShowGuestShippingModal(false)}
              aria-label="Đóng chọn địa chỉ"
            >
              <X size={18} />
            </button>
            <h2 id="guest-shipping-title">Ước tính phí vận chuyển</h2>
            <p className="purchase-confirm-copy">
              Chọn nhanh tỉnh/thành và quận/huyện nhận hàng để xem phí ship dự kiến.
            </p>
            <form className="guest-shipping-form" onSubmit={submitGuestShippingEstimate}>
              <label>
                Tỉnh/Thành phố
                <select
                  value={guestShippingForm.provinceCode}
                  onChange={(event) => setGuestShippingForm({
                    provinceCode: event.target.value,
                    districtCode: '',
                  })}
                  required
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {guestProvinces.map((province) => (
                    <option key={province.code} value={province.code}>{province.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Quận/Huyện
                <select
                  value={guestShippingForm.districtCode}
                  onChange={(event) => setGuestShippingForm((current) => ({
                    ...current,
                    districtCode: event.target.value,
                  }))}
                  disabled={!guestShippingForm.provinceCode}
                  required
                >
                  <option value="">Chọn quận/huyện</option>
                  {guestDistricts.map((district) => (
                    <option key={district.code} value={district.code}>{district.name}</option>
                  ))}
                </select>
              </label>
              <div className="purchase-confirm-actions">
                <button className="outline-gray-button" type="button" onClick={() => setShowGuestShippingModal(false)}>
                  Hủy
                </button>
                <button className="solid-orange-button" type="submit" disabled={shippingEstimateLoading}>
                  {shippingEstimateLoading ? 'Đang tính...' : 'Tính phí ship'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {!isOwner ? (
        <div className="mobile-sticky-actions">
          <Link
            className="mobile-chat-action"
            to={`/chat?participantId=${encodeURIComponent(product.sellerId)}&productId=${product.id}`}
          >
            <MessageCircle size={18} />
            Chat ngay
          </Link>
          <button className="mobile-offer-action" onClick={openOfferConfirm} disabled={!isApproved} type="button">
            <Percent size={18} />
            Trả giá
          </button>
          <button className="mobile-buy-action" onClick={openPurchaseConfirm} disabled={!isApproved} type="button">
            Mua ngay
          </button>
        </div>
      ) : null}
    </main>
  );
};

export default ProductDetail;
