import { Link } from 'react-router-dom';
import { ExternalLink, Star } from 'lucide-react';
import BooleanBadge from './BooleanBadge';
import StatusBadge from '../common/StatusBadge';
import { formatDateTime, formatMoney } from '../../pages/admin/format';

const ReviewPreview = ({ review, product, productLoading }) => {
  if (!review) return null;

  const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));

  return (
    <div className="adm-preview">
      <div className="adm-meta-grid">
        <div>
          <span>Mã review</span>
          <strong translate="no">#{review.id}</strong>
        </div>
        <div>
          <span>Đơn hàng</span>
          <strong translate="no">#{review.orderId ?? '—'}</strong>
        </div>
        <div>
          <span>Người mua</span>
          <strong translate="no">{review.buyerId || '—'}</strong>
        </div>
        <div>
          <span>Người bán</span>
          <strong translate="no">{review.sellerId || '—'}</strong>
        </div>
        <div>
          <span>Sản phẩm</span>
          <strong translate="no">{review.productId ? `#${review.productId}` : '—'}</strong>
        </div>
        <div>
          <span>Trạng thái</span>
          <BooleanBadge value={!review.hidden} trueLabel="Hiển thị" falseLabel="Đã ẩn" />
        </div>
        <div>
          <span>Điểm đánh giá</span>
          <span className="adm-rating-stars" aria-label={`${rating}/5`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={15}
                fill={index < rating ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
            ))}
            <em>{rating}/5</em>
          </span>
        </div>
        <div>
          <span>Ngày tạo</span>
          <strong>{formatDateTime(review.createdAt)}</strong>
        </div>
      </div>

      <section className="adm-preview-section">
        <h3>Nội dung đánh giá</h3>
        <p>{review.comment || 'Không có nội dung đánh giá.'}</p>
      </section>

      <section className="adm-preview-section">
        <h3>Bài đăng được đánh giá</h3>
        {productLoading ? (
          <p>Đang tải bài đăng…</p>
        ) : product ? (
          <div className="adm-review-product">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="adm-review-product-img"
              loading="lazy"
            />
            <div className="adm-review-product-info">
              <strong>{product.title}</strong>
              <span className="adm-review-product-price">{formatMoney(product.price)}</span>
              <div className="adm-review-product-meta">
                <StatusBadge status={product.status} />
                <span translate="no">Người bán: {product.sellerId || '—'}</span>
              </div>
              <Link
                to={`/products/${product.id}`}
                target="_blank"
                rel="noreferrer"
                className="adm-btn adm-btn-soft"
              >
                Mở bài đăng
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <p>Không tải được bài đăng (có thể đã bị xoá).</p>
        )}
      </section>
    </div>
  );
};

export default ReviewPreview;
