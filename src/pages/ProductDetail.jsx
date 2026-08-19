import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Percent,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  X,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import StatusBadge from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import {
  apiCreateOffer,
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
import { startDepositCheckout } from '../services/payment';
import './ProductDetail.css';

const formatPrice = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const ProductDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const { isAuthenticated, user } = useUser();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [reportReason, setReportReason] = useState('');
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
        setShippingEstimateError(requestError.message || 'Không thể tính phí vận chuyển lúc này.');
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
      setError('Vui lòng đăng nhập để thực hiện thao tác này.');
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
      // Tạo cọc rồi chuyển sang VNPay. Đơn hàng chỉ được tạo sau khi trả cọc.
      await startDepositCheckout(product.id, deliveryMethod);
      // Trình duyệt sẽ rời trang sang cổng VNPay; không reset trạng thái ở đây.
    } catch (requestError) {
      setError(requestError.message);
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
      toast.success(`Đã gửi trả giá ${formatPrice(offer.offerPrice)} cho người bán.`);
      setFeedback(
        `Đã gửi đề nghị ${formatPrice(offer.offerPrice)} cho người bán. Đề nghị sẽ tự hết hạn sau 24 giờ.`,
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
      toast.success(response?.message || 'Đã cập nhật danh sách yêu thích.');
      setFeedback(response?.message || 'Đã cập nhật danh sách yêu thích.');
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
      toast.success('Báo cáo đã được gửi để quản trị viên xem xét.');
      setFeedback('Báo cáo đã được gửi để quản trị viên xem xét.');
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
      displayRating: averageRating ? averageRating.toFixed(1) : 'Chưa có',
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
          <p>{error || 'Không tìm thấy sản phẩm.'}</p>
          <Link to="/" className="outline-orange-button">Quay lại chợ</Link>
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
  const isNegotiable = Boolean(product.negotiable);
  const minPrice = product.minPrice != null ? Number(product.minPrice) : null;
  const offerBelowMin = isNegotiable && minPrice != null && selectedOfferPrice < minPrice;

  return (
    <main className="shopee-detail-page">
      <div className="shopee-detail-shell">
        <nav className="detail-breadcrumb" aria-label="Đường dẫn sản phẩm">
          <Link to="/">H-Smart</Link>
          <span>{product.categoryName || 'Sản phẩm'}</span>
          <span>{product.title}</span>
        </nav>

        <section className="shopee-product-main">
          <div className="product-gallery-panel">
            <div className="main-gallery-image">
              <img src={activeImage} alt={product.title} />
            </div>

            <div className="gallery-thumbnail-row" aria-label="Ảnh sản phẩm">
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
              <span>Chia sẻ:</span>
              <button type="button">Zalo</button>
              <button type="button">Facebook</button>
              <button type="button">Link</button>
              <button type="button" onClick={toggleWishlist} className="gallery-like-button">
                <Heart size={16} />
                Đã thích ({product.likeCount || 0})
              </button>
            </div>
          </div>

          <div className="product-buy-panel">
            <div className="product-title-row">
              {isApproved ? (
                <span className="assurance-badge">
                  <BadgeCheck size={15} />
                  H-Smart Bảo Đảm
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
              <span>{reviews.length} đánh giá</span>
              <span>{product.likeCount || 0} đã thích</span>
              <small>Tố cáo</small>
            </div>

            <div className="price-band">
              <span className="original-price">{formatPrice(comparePrice)}</span>
              <strong>{formatPrice(product.price)}</strong>
              {isNegotiable ? (
                <span className="negotiable-hint">
                  <Percent size={13} />
                  Có thể trả giá{minPrice != null ? ` · tối thiểu ${formatPrice(minPrice)}` : ''}
                </span>
              ) : null}
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
                <dt>Phân loại</dt>
                <dd>
                  <button className="variant-chip active" type="button">
                    {product.categoryName || 'Sản phẩm'}
                  </button>
                  <button className="variant-chip" type="button">Còn hàng</button>
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
                  Thêm vào giỏ hàng
                </button>
                <button className="solid-orange-button" onClick={openPurchaseConfirm} disabled={!isApproved} type="button">
                  Mua ngay
                </button>
                {isNegotiable ? (
                  <button className="outline-gray-button" onClick={openOfferConfirm} disabled={!isApproved} type="button">
                    <Percent size={16} />
                    Trả giá
                  </button>
                ) : null}
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
                Sửa tin đăng
              </Link>
            )}
          </div>
        </section>

        <div className="detail-content-layout">
          <div className="detail-content-main">
            <section className="seller-shop-strip">
              <div className="seller-identity">
                <div className="seller-avatar-shop"><Store size={24} /></div>
                <div>
                  <strong>{product.sellerId}</strong>
                  <span>Online gần đây</span>
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
                <div><span>Đánh giá</span><strong>{reviews.length}</strong></div>
                <div><span>Điểm trung bình</span><strong>{sellerStats.displayRating}</strong></div>
              </div>
            </section>

            <section className="detail-info-block">
              <h2>Chi tiết sản phẩm</h2>
              <dl>
                <div><dt>Danh mục</dt><dd>H-Smart / {product.categoryName || 'Sản phẩm'}</dd></div>
                <div><dt>Tình trạng</dt><dd>Đã qua sử dụng, còn hoạt động tốt</dd></div>
                <div><dt>Người bán</dt><dd>{product.sellerId}</dd></div>
              </dl>
            </section>

            <section className="detail-info-block">
              <h2>Mô tả sản phẩm</h2>
              <p className="description-text">{product.description || 'Người bán chưa cung cấp mô tả.'}</p>
            </section>

            <section className="detail-info-block review-block">
              <h2>Đánh giá sản phẩm</h2>
              <div className="review-score-board">
                <strong>{sellerStats.displayRating} <span>trên 5</span></strong>
                <span className="rating-stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={18} fill="currentColor" />
                  ))}
                </span>
                <div className="review-filter-row">
                  <button className="active" type="button">Tất cả</button>
                  <button type="button">5 sao</button>
                  <button type="button">Có bình luận</button>
                  <button type="button">Có hình ảnh</button>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="empty-review-text">Chưa có đánh giá cho người bán này.</p>
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
                        <p>{review.comment || 'Không có nhận xét.'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="detail-sidebar">
            <section className="sidebar-card">
              <h3>Sản phẩm nổi bật</h3>
              {featuredProducts.length ? (
                <div className="sidebar-product-grid">
                  {featuredProducts.map((item) => <ProductCard key={item.id} product={item} variant="compact" />)}
                </div>
              ) : (
                <div className="sidebar-product-fallback">
                  <img src={activeImage} alt={product.title} />
                  <span>{product.categoryName || 'Sản phẩm'} giá tốt</span>
                  <strong>{formatPrice(product.price)}</strong>
                </div>
              )}
            </section>

            {!isOwner ? (
              <section className="sidebar-card report-card">
                <h3>Báo cáo tin đăng</h3>
                <form onSubmit={submitReport}>
                  <textarea
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    required
                    placeholder="Lý do báo cáo"
                  />
                  <button type="submit"><Flag size={14} /> Gửi báo cáo</button>
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
              aria-label="Đóng xác nhận đặt hàng"
            >
              <X size={18} />
            </button>
            <h2 id="purchase-confirm-title">Thanh toán cọc để đặt hàng</h2>
            <p className="purchase-confirm-copy">
              Bạn cần thanh toán <strong>cọc = phí vận chuyển</strong> qua VNPay trước khi đơn hàng được tạo.
              Sau khi trả cọc thành công, đơn sẽ tự được tạo và người bán nhận yêu cầu xác nhận.
            </p>

            <div className="purchase-confirm-product">
              <img src={activeImage} alt={product.title} />
              <div>
                <strong>{product.title}</strong>
                <span>{product.categoryName || 'Sản phẩm'}</span>
                <b>{formatPrice(product.price)}</b>
              </div>
            </div>

            <fieldset className="delivery-method-options">
              <legend>Phương thức giao hàng</legend>
              <label className={deliveryMethod === 'GHTK' ? 'active' : ''}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="GHTK"
                  checked={deliveryMethod === 'GHTK'}
                  onChange={(event) => setDeliveryMethod(event.target.value)}
                />
                <span>
                  <strong>Giao Hàng Tiết Kiệm</strong>
                  <small>Hệ thống tính phí ship từ địa chỉ người mua và người bán. Nếu GHTK lỗi, đơn sẽ không được tạo.</small>
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
                  <small>Hệ thống dùng API demo của Viettel Post để tính phí và tạo vận đơn khi người bán xác nhận.</small>
                </span>
              </label>
            </fieldset>

            <dl className="purchase-confirm-total">
              <div>
                <dt>Giá sản phẩm</dt>
                <dd>{formatPrice(product.price)}</dd>
              </div>
              <div>
                <dt>Phí vận chuyển</dt>
                <dd>{estimatedShippingFee != null ? formatPrice(estimatedShippingFee) : 'Tính khi tạo cọc'}</dd>
              </div>
              <div className="deposit-highlight">
                <dt>Cọc cần thanh toán ngay</dt>
                <dd>{estimatedShippingFee != null ? formatPrice(estimatedShippingFee) : 'Tính khi tạo cọc'}</dd>
              </div>
            </dl>
            <p className="purchase-confirm-note">
              Giá sản phẩm ({formatPrice(product.price)}) được thanh toán cho người bán khi nhận hàng. Cọc sẽ được hoàn/đối trừ theo trạng thái đơn.
            </p>

            <div className="purchase-confirm-actions">
              <button className="outline-gray-button" type="button" onClick={() => setShowPurchaseConfirm(false)}>
                Quay lại
              </button>
              <button className="solid-orange-button" type="button" onClick={buyProduct} disabled={isOrdering}>
                {isOrdering ? 'Đang chuyển tới VNPay...' : 'Thanh toán cọc qua VNPay'}
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
                {minPrice != null ? <span>Giá tối thiểu người bán chấp nhận: {formatPrice(minPrice)}</span> : null}
                <b>Giá đề nghị: {formatPrice(selectedOfferPrice)}</b>
              </div>
            </div>

            <div className="offer-discount-grid" role="group" aria-label="Chọn mức giảm giá">
              {[5, 10, 15].map((percent) => {
                const presetPrice = Math.round(Number(product.price || 0) * (100 - percent) / 100);
                const presetBelowMin = minPrice != null && presetPrice < minPrice;
                return (
                  <button
                    key={percent}
                    type="button"
                    className={selectedDiscountPercent === percent ? 'active' : ''}
                    onClick={() => setSelectedDiscountPercent(percent)}
                  >
                    <span>Giảm {percent}%</span>
                    <strong>{formatPrice(presetPrice)}</strong>
                    {presetBelowMin ? <em className="offer-below-min">Dưới giá sàn</em> : null}
                  </button>
                );
              })}
            </div>

            {offerBelowMin ? (
              <div className="detail-alert detail-alert-error offer-warning">
                <p>Giá đề nghị thấp hơn giá tối thiểu {formatPrice(minPrice)} của người bán. Vui lòng chọn mức cao hơn.</p>
              </div>
            ) : null}

            <div className="purchase-confirm-actions">
              <button className="outline-gray-button" type="button" onClick={() => setShowOfferConfirm(false)}>
                Hủy
              </button>
              <button className="solid-orange-button" type="button" onClick={submitOffer} disabled={isSubmittingOffer || offerBelowMin}>
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
          {isNegotiable ? (
            <button className="mobile-offer-action" onClick={openOfferConfirm} disabled={!isApproved} type="button">
              <Percent size={18} />
              Trả giá
            </button>
          ) : null}
          <button className="mobile-buy-action" onClick={openPurchaseConfirm} disabled={!isApproved} type="button">
            Mua ngay
          </button>
        </div>
      ) : null}
    </main>
  );
};

export default ProductDetail;
