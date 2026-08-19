import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminDataTable from '../../components/admin/AdminDataTable';
import Pagination from '../../components/admin/Pagination';
import BooleanBadge from '../../components/admin/BooleanBadge';
import ConfirmModal from '../../components/admin/ConfirmModal';
import PreviewDrawer from '../../components/admin/PreviewDrawer';
import ReviewPreview from '../../components/admin/ReviewPreview';
import {
  apiFetchAdminReviews,
  apiFetchProductById,
  apiHideAdminReview,
  apiRestoreAdminReview,
} from '../../services/api';
import { emptyPage, formatDateTime } from './format';

const ReviewsPage = () => {
  const toast = useToast();
  const [reviewsPage, setReviewsPage] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageNo, setPageNo] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [pending, setPending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewReview, setPreviewReview] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [previewProductLoading, setPreviewProductLoading] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const nextPage = await apiFetchAdminReviews({
        page: pageNo,
        size: reviewsPage.pageSize || 10,
      });
      setReviewsPage(nextPage);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo]);

  const openPreview = async (review) => {
    setPreviewReview(review);
    setPreviewProduct(null);
    setDrawerOpen(true);
    if (review?.productId) {
      setPreviewProductLoading(true);
      try {
        setPreviewProduct(await apiFetchProductById(review.productId));
      } catch {
        setPreviewProduct(null);
      } finally {
        setPreviewProductLoading(false);
      }
    }
  };

  // Đóng cửa sổ chi tiết rồi mở hộp xác nhận ẩn/khôi phục.
  const askModerate = (review) => {
    setDrawerOpen(false);
    setConfirm({
      review,
      title: review.hidden ? 'Khôi phục review này?' : 'Ẩn review này?',
      message: review.hidden
        ? `Review #${review.id} sẽ hiển thị lại ở public seller reviews.`
        : `Review #${review.id} sẽ bị ẩn khỏi public seller reviews.`,
      confirmLabel: review.hidden ? 'Khôi phục' : 'Ẩn review',
    });
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { review } = confirm;
    setPending(true);
    try {
      await (review.hidden ? apiRestoreAdminReview(review.id) : apiHideAdminReview(review.id));
      toast.success(review.hidden
        ? `Đã khôi phục review #${review.id}.`
        : `Đã ẩn review #${review.id}.`);
      setConfirm(null);
      await loadReviews();
    } catch (requestError) {
      toast.error(requestError.message || 'Thao tác không thành công.');
    } finally {
      setPending(false);
    }
  };

  const columns = [
    {
      key: 'review',
      header: 'Review',
      cellClassName: 'adm-reason-cell',
      render: (review) => (
        <div className="adm-stack-cell">
          <strong translate="no">Review #{review.id}</strong>
          <small translate="no">Order #{review.orderId}</small>
          <p className="adm-review-comment">{review.comment || 'Không có nội dung đánh giá.'}</p>
        </div>
      ),
    },
    {
      key: 'parties',
      header: 'Buyer → Seller',
      render: (review) => (
        <div className="adm-stack-cell">
          <strong>{review.buyerId || '—'}</strong>
          <small>{review.sellerId || '—'}</small>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Đánh giá',
      render: (review) => `${review.rating || 0}/5`,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (review) => (
        <BooleanBadge value={!review.hidden} trueLabel="Visible" falseLabel="Hidden" />
      ),
    },
    {
      key: 'created',
      header: 'Ngày tạo',
      render: (review) => formatDateTime(review.createdAt),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (review) => (
        <div className="adm-row-actions">
          <button
            type="button"
            className="adm-text-action view"
            onClick={(event) => {
              event.stopPropagation();
              openPreview(review);
            }}
          >
            Xem chi tiết
          </button>
          <button
            type="button"
            className={review.hidden ? 'adm-text-action approve' : 'adm-text-action reject'}
            onClick={(event) => {
              event.stopPropagation();
              askModerate(review);
            }}
          >
            {review.hidden ? 'Khôi phục' : 'Ẩn'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Kiểm duyệt đánh giá"
        title="Đánh giá người dùng"
        description="Ẩn hoặc khôi phục review để ảnh hưởng ngay tới phần public seller reviews."
        onRefresh={loadReviews}
        refreshing={loading}
      />

      <AdminDataTable
        columns={columns}
        rows={reviewsPage.content}
        loading={loading}
        error={error}
        emptyIcon={Star}
        emptyTitle="Chưa có review nào trong trang hiện tại."
        onRowClick={openPreview}
        rowAriaLabel={(review) => `Xem chi tiết review ${review.id}`}
        footer={<Pagination page={reviewsPage} onChange={setPageNo} />}
      />

      <PreviewDrawer
        open={drawerOpen}
        kicker="Chi tiết đánh giá"
        title={previewReview ? `Review #${previewReview.id}` : 'Chi tiết đánh giá'}
        onClose={() => setDrawerOpen(false)}
      >
        {previewReview ? (
          <>
            <ReviewPreview
              review={previewReview}
              product={previewProduct}
              productLoading={previewProductLoading}
            />
            <div className="adm-modal-actions">
              <button
                type="button"
                className="adm-btn adm-btn-ghost"
                onClick={() => setDrawerOpen(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className={`adm-btn ${previewReview.hidden ? 'adm-btn-soft' : 'adm-btn-primary'}`}
                onClick={() => askModerate(previewReview)}
              >
                {previewReview.hidden ? 'Khôi phục review' : 'Ẩn review'}
              </button>
            </div>
          </>
        ) : null}
      </PreviewDrawer>

      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        pending={pending}
        onConfirm={handleConfirm}
        onClose={() => !pending && setConfirm(null)}
      />
    </>
  );
};

export default ReviewsPage;
