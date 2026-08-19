import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, PackageSearch, Search, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminDataTable from '../../components/admin/AdminDataTable';
import PreviewDrawer from '../../components/admin/PreviewDrawer';
import ProductPreview from '../../components/admin/ProductPreview';
import {
  apiFetchProductPage,
  apiModerateProduct,
} from '../../services/api';

const ProductsPage = () => {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const page = await apiFetchProductPage({ status: 'PENDING_REVIEW', size: 50 });
      setProducts(page.content || []);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách tin đăng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, []);

  const openPreview = async (product) => {
    if (!product?.id) return;
    setDrawerOpen(true);
    setPreviewLoading(true);
    setPreviewProduct(null);
    try {
      setPreviewProduct(product);
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể tải chi tiết tin đăng.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const moderate = async (product, action) => {
    setPendingId(product.id);
    try {
      await apiModerateProduct(product.id, action);
      toast.success(action === 'APPROVE'
        ? `Đã duyệt sản phẩm #${product.id}.`
        : `Đã từ chối sản phẩm #${product.id}.`);
      await loadProducts();
    } catch (requestError) {
      toast.error(requestError.message || 'Thao tác không thành công.');
    } finally {
      setPendingId(null);
    }
  };

  const visibleProducts = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => (
      product.title?.toLowerCase().includes(query)
      || String(product.id).includes(query)
      || String(product.sellerId || '').toLowerCase().includes(query)
    ));
  }, [filter, products]);

  const columns = [
    {
      key: 'product',
      header: 'Tin đăng',
      render: (product) => (
        <button
          type="button"
          className="adm-entity-link"
          onClick={() => openPreview(product)}
        >
          <strong>{product.title}</strong>
          <small translate="no">#{product.id}</small>
        </button>
      ),
    },
    {
      key: 'seller',
      header: 'Người bán',
      render: (product) => product.sellerId || '—',
    },
    {
      key: 'ai',
      header: 'Gợi ý AI',
      render: (product) => {
        const detection = Array.isArray(product.aiMetadata) ? product.aiMetadata[0] : null;
        return (
          <div className="adm-stack-cell">
            <strong>{detection?.label || 'Chưa có'}</strong>
            {detection ? (
              <small>{Math.round(Number(detection.confidence ?? detection.score ?? 0) * 100)}%</small>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (product) => <StatusBadge status={product.status} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (product) => (
        <div className="adm-row-actions">
          <button
            type="button"
            className="adm-icon-action view"
            onClick={() => openPreview(product)}
            aria-label={`Xem chi tiết tin đăng ${product.id}`}
            title="Xem chi tiết"
          >
            <Eye size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="adm-icon-action approve"
            disabled={pendingId === product.id}
            onClick={() => moderate(product, 'APPROVE')}
            aria-label={`Duyệt tin đăng ${product.id}`}
            title="Duyệt"
          >
            <Check size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="adm-icon-action reject"
            disabled={pendingId === product.id}
            onClick={() => moderate(product, 'REJECT')}
            aria-label={`Từ chối tin đăng ${product.id}`}
            title="Từ chối"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Hàng chờ kiểm duyệt"
        title="Duyệt tin đăng"
        description="Kiểm tra nội dung, gợi ý AI và quyết định duyệt hoặc từ chối tin đăng."
        onRefresh={loadProducts}
        refreshing={loading}
      >
        <label className="adm-search-field">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            name="productFilter"
            autoComplete="off"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Lọc theo mã, người bán hoặc tiêu đề…"
          />
        </label>
      </AdminPageHeader>

      <AdminDataTable
        columns={columns}
        rows={visibleProducts}
        loading={loading}
        error={error}
        emptyIcon={PackageSearch}
        emptyTitle="Không có tin đăng phù hợp với bộ lọc hiện tại."
      />

      <PreviewDrawer
        open={drawerOpen}
        kicker="Xem nhanh tin đăng"
        title={previewProduct?.title || 'Chi tiết tin đăng'}
        loading={previewLoading}
        onClose={() => setDrawerOpen(false)}
      >
        {!previewLoading && previewProduct ? <ProductPreview product={previewProduct} /> : null}
      </PreviewDrawer>
    </>
  );
};

export default ProductsPage;
