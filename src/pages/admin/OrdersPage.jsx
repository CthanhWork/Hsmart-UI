import { useEffect, useState } from 'react';
import { Download, ReceiptText } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminDataTable from '../../components/admin/AdminDataTable';
import Pagination from '../../components/admin/Pagination';
import ConfirmModal from '../../components/admin/ConfirmModal';
import {
  apiAdminApproveReturn,
  apiAdminCancelOrder,
  apiAdminRejectReturn,
  apiFetchAdminOrders,
} from '../../services/api';
import { deliveryLabel, emptyPage, formatDateTime, formatMoney } from './format';
import { downloadCsv } from './analytics';

const OrdersPage = () => {
  const toast = useToast();
  const [ordersPage, setOrdersPage] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageNo, setPageNo] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [pending, setPending] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const nextPage = await apiFetchAdminOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: pageNo,
        size: ordersPage.pageSize || 10,
      });
      setOrdersPage(nextPage);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, pageNo]);

  const handleConfirm = async () => {
    if (!confirm) return;
    const { order, kind } = confirm;
    setPending(true);
    try {
      if (kind === 'return-approve') {
        await apiAdminApproveReturn(order.id);
        toast.success(`Đã duyệt yêu cầu trả hàng cho đơn #${order.id}.`);
      } else if (kind === 'return-reject') {
        await apiAdminRejectReturn(order.id);
        toast.success(`Đã từ chối trả hàng cho đơn #${order.id}.`);
      } else {
        await apiAdminCancelOrder(order.id);
        toast.success(`Đã hủy đơn hàng #${order.id}.`);
      }
      setConfirm(null);
      await loadOrders();
    } catch (requestError) {
      toast.error(requestError.message || 'Thao tác không thành công.');
    } finally {
      setPending(false);
    }
  };

  const exportCsv = () => {
    const rows = (ordersPage.content || []).map((order) => [
      order.id,
      order.productId,
      order.buyerId,
      order.sellerId,
      order.amount,
      deliveryLabel(order.deliveryMethod),
      order.status,
      formatDateTime(order.updatedAt),
    ]);
    downloadCsv(
      'don-hang.csv',
      ['Mã đơn', 'Sản phẩm', 'Người mua', 'Người bán', 'Tiền hàng', 'Vận chuyển', 'Trạng thái', 'Cập nhật'],
      rows,
    );
  };

  const columns = [
    {
      key: 'order',
      header: 'Đơn hàng',
      render: (order) => (
        <div className="adm-stack-cell">
          <strong translate="no">Đơn #{order.id}</strong>
          <small translate="no">Sản phẩm #{order.productId}</small>
        </div>
      ),
    },
    {
      key: 'parties',
      header: 'Hai bên',
      render: (order) => (
        <div className="adm-stack-cell">
          <strong>{order.buyerId || '—'}</strong>
          <small>{order.sellerId || '—'}</small>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Tiền hàng',
      render: (order) => formatMoney(order.amount),
    },
    {
      key: 'delivery',
      header: 'Vận chuyển',
      render: (order) => deliveryLabel(order.deliveryMethod),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'updated',
      header: 'Cập nhật',
      render: (order) => formatDateTime(order.updatedAt),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (order) => {
        const status = String(order.status);
        if (status === 'RETURN_REQUESTED') {
          return (
            <div className="adm-row-actions">
              <button
                type="button"
                className="adm-text-action approve"
                onClick={() => setConfirm({
                  order,
                  kind: 'return-approve',
                  title: 'Duyệt yêu cầu trả hàng?',
                  message: `Đơn #${order.id} sẽ được duyệt trả hàng và chuyển sang RETURNED.`,
                  confirmLabel: 'Duyệt trả hàng',
                })}
              >
                Duyệt trả
              </button>
              <button
                type="button"
                className="adm-text-action reject"
                onClick={() => setConfirm({
                  order,
                  kind: 'return-reject',
                  title: 'Từ chối yêu cầu trả hàng?',
                  message: `Yêu cầu trả hàng của đơn #${order.id} sẽ bị từ chối.`,
                  confirmLabel: 'Từ chối trả',
                })}
              >
                Từ chối trả
              </button>
            </div>
          );
        }

        const canCancel = !['COMPLETED', 'CANCELLED', 'RETURNED'].includes(status);
        if (!canCancel) return <span className="adm-muted">Không thể hủy</span>;
        return (
          <button
            type="button"
            className="adm-text-action reject"
            onClick={() => setConfirm({
              order,
              kind: 'cancel',
              title: 'Hủy đơn hàng này?',
              message: `Đơn #${order.id} sẽ bị chuyển sang trạng thái CANCELLED.`,
              confirmLabel: 'Hủy đơn',
            })}
          >
            Hủy đơn
          </button>
        );
      },
    },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Giao dịch toàn sàn"
        title="Đơn hàng cần theo dõi"
        description="Theo dõi đơn theo trạng thái và chỉ cho phép hủy những đơn backend còn chấp nhận."
        onRefresh={loadOrders}
        refreshing={loading}
      >
        <button
          type="button"
          className="adm-export-btn"
          onClick={exportCsv}
          disabled={!ordersPage.content?.length}
        >
          <Download size={16} aria-hidden="true" /> CSV
        </button>
        <select
          className="adm-select"
          name="adminOrderStatusFilter"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPageNo(0);
          }}
        >
          <option value="all">Mọi trạng thái</option>
          <option value="PENDING">PENDING</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="RETURN_REQUESTED">RETURN_REQUESTED</option>
          <option value="RETURNED">RETURNED</option>
        </select>
      </AdminPageHeader>

      <AdminDataTable
        columns={columns}
        rows={ordersPage.content}
        loading={loading}
        error={error}
        emptyIcon={ReceiptText}
        emptyTitle="Không có đơn hàng phù hợp với bộ lọc hiện tại."
        footer={<Pagination page={ordersPage} onChange={setPageNo} />}
      />

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

export default OrdersPage;
