import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatMoney } from '../../pages/admin/format';

const ProductPreview = ({ product, report }) => {
  if (!product) return null;

  const images = (product.imageUrls?.length ? product.imageUrls : [product.imageUrl]).filter(Boolean);

  return (
    <div className="adm-preview">
      {images.length ? (
        <div className="adm-preview-gallery">
          {images.map((imageUrl, index) => (
            <figure className="adm-preview-image" key={`${imageUrl}-${index}`}>
              <img src={imageUrl} alt={product.title} loading="lazy" />
            </figure>
          ))}
        </div>
      ) : null}

      <div className="adm-preview-actions">
        <Link
          to={`/products/${product.id}`}
          target="_blank"
          rel="noreferrer"
          className="adm-btn adm-btn-soft"
        >
          Mở trang chi tiết
          <ExternalLink size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="adm-meta-grid">
        <div>
          <span>Mã tin</span>
          <strong translate="no">#{product.id}</strong>
        </div>
        <div>
          <span>Trạng thái</span>
          <StatusBadge status={product.status} />
        </div>
        <div>
          <span>Người bán</span>
          <strong translate="no">{product.sellerId || '—'}</strong>
        </div>
        <div>
          <span>Danh mục</span>
          <strong>{product.categoryName || 'Chưa rõ'}</strong>
        </div>
        <div>
          <span>Giá bán</span>
          <strong>{formatMoney(product.price)}</strong>
        </div>
        <div>
          <span>Khu vực</span>
          <strong>{[product.sellerDistrict, product.sellerProvince].filter(Boolean).join(', ') || 'Chưa rõ'}</strong>
        </div>
      </div>

      <section className="adm-preview-section">
        <h3>Mô tả tin đăng</h3>
        <p>{product.description || 'Người bán chưa thêm mô tả.'}</p>
      </section>

      <section className="adm-preview-section">
        <h3>Gợi ý AI</h3>
        {Array.isArray(product.aiMetadata) && product.aiMetadata.length > 0 ? (
          <div className="adm-ai-list">
            {product.aiMetadata.map((item, index) => (
              <div className="adm-ai-chip" key={`${item.label || 'ai'}-${index}`}>
                <strong>{item.label || 'Không rõ'}</strong>
                <span>{Math.round(Number(item.confidence ?? item.score ?? 0) * 100)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p>Chưa có dữ liệu phân tích AI cho tin đăng này.</p>
        )}
      </section>

      {report ? (
        <section className="adm-preview-section adm-report-context">
          <h3>Báo cáo liên quan</h3>
          <div className="adm-meta-grid">
            <div>
              <span>Mã báo cáo</span>
              <strong translate="no">#{report.id}</strong>
            </div>
            <div>
              <span>Người báo cáo</span>
              <strong translate="no">{report.reporterId || '—'}</strong>
            </div>
            <div className="adm-meta-wide">
              <span>Lý do</span>
              <strong>{report.reason || 'Không có lý do báo cáo.'}</strong>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default ProductPreview;
