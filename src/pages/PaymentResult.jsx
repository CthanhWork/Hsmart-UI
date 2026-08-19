import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetchPayment, apiFetchPlatformFeePayment } from '../services/api';
import {
  clearPendingDeposit,
  clearPendingPlatformFee,
  readPendingDeposit,
  readPendingPlatformFee,
} from '../services/payment';
import { rememberOrderId } from '../services/orderHistory';
import './PaymentResult.css';

const TERMINAL_STATUSES = ['PAID', 'FAILED', 'EXPIRED', 'REFUNDED', 'SETTLED'];
const MAX_POLLS = 5;
const POLL_INTERVAL_MS = 1500;

const formatPrice = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const PaymentResult = () => {
  const [params] = useSearchParams();
  const queryStatus = (params.get('status') || '').toLowerCase();
  const txnRef = params.get('txnRef') || '';
  const orderIdParam = params.get('orderId') || '';

  const [payment, setPayment] = useState(null);
  const [checking, setChecking] = useState(true);
  // Trang kết quả VNPay dùng CHUNG cho cọc của người mua và phí nền tảng của
  // người bán. Phân biệt theo giao dịch đang chờ lưu trong sessionStorage.
  const [isFee] = useState(() => Boolean(readPendingPlatformFee(txnRef)));

  useEffect(() => {
    const pending = isFee ? readPendingPlatformFee(txnRef) : readPendingDeposit(txnRef);
    const fetchPayment = isFee ? apiFetchPlatformFeePayment : apiFetchPayment;
    const clearPending = isFee ? clearPendingPlatformFee : clearPendingDeposit;
    let cancelled = false;
    let attempts = 0;
    let timer = null;

    // IPN (server→server) là nguồn chốt chính nhưng có thể tới sau Return URL,
    // nên poll trạng thái giao dịch vài lần cho tới khi đạt trạng thái cuối cùng.
    const poll = async () => {
      if (!pending?.id) {
        setChecking(false);
        return;
      }
      try {
        const result = await fetchPayment(pending.id);
        if (cancelled) return;
        setPayment(result);

        if (TERMINAL_STATUSES.includes(result?.status) || attempts >= MAX_POLLS) {
          if (result?.status === 'PAID' && result?.orderId) {
            rememberOrderId(result.orderId);
          }
          if (TERMINAL_STATUSES.includes(result?.status)) {
            clearPending();
          }
          setChecking(false);
          return;
        }
      } catch {
        if (cancelled) return;
        if (attempts >= MAX_POLLS) {
          setChecking(false);
          return;
        }
      }
      attempts += 1;
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    // Nếu có orderId trên query (Return URL đã chốt) thì ghi nhớ luôn.
    if (queryStatus === 'success' && orderIdParam) {
      rememberOrderId(orderIdParam);
    }

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [txnRef, orderIdParam, queryStatus, isFee]);

  const { isSuccess, isPending, orderId, amount } = useMemo(() => {
    const status = payment?.status;
    if (status) {
      return {
        isSuccess: status === 'PAID' || status === 'SETTLED',
        isPending: status === 'PENDING',
        orderId: payment?.orderId || orderIdParam || '',
        amount: payment?.amount,
      };
    }
    return {
      isSuccess: queryStatus === 'success',
      isPending: false,
      orderId: orderIdParam,
      amount: null,
    };
  }, [payment, queryStatus, orderIdParam]);

  if (checking) {
    return (
      <main className="payment-result-page">
        <section className="payment-result-card">
          <Loader2 size={48} className="payment-result-spin" />
          <h1>{isFee ? 'Đang xác nhận thanh toán phí nền tảng…' : 'Đang xác nhận thanh toán…'}</h1>
          <p>
            Vui lòng đợi trong giây lát, hệ thống đang đối chiếu giao dịch
            {isFee ? ' phí nền tảng' : ' cọc'} với VNPay.
          </p>
        </section>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main className="payment-result-page">
        <section className="payment-result-card payment-result-card--success">
          <CheckCircle2 size={56} />
          <h1>{isFee ? 'Thanh toán phí nền tảng thành công' : 'Thanh toán cọc thành công'}</h1>
          <p>
            {isFee ? (
              <>
                Phí nền tảng{amount != null ? ` ${formatPrice(amount)}` : ''} đã được ghi nhận.
                Bạn có thể quay lại đơn hàng để bấm “Xác nhận đơn”.
              </>
            ) : (
              <>
                Cọc{amount != null ? ` ${formatPrice(amount)}` : ''} đã được ghi nhận và đơn hàng của bạn đã được tạo.
                Người bán sẽ nhận yêu cầu xác nhận.
              </>
            )}
          </p>
          {txnRef ? <p className="payment-result-meta">Mã giao dịch: <strong>{txnRef}</strong></p> : null}
          <div className="payment-result-actions">
            <Link className="solid-orange-button" to={orderId ? `/orders?orderId=${orderId}` : '/orders'}>
              {isFee ? 'Về đơn hàng để xác nhận' : 'Xem đơn hàng của tôi'}
            </Link>
            <Link className="outline-gray-button" to="/">{isFee ? 'Về trang chủ' : 'Tiếp tục mua sắm'}</Link>
          </div>
        </section>
      </main>
    );
  }

  if (isPending) {
    return (
      <main className="payment-result-page">
        <section className="payment-result-card payment-result-card--pending">
          <Loader2 size={48} className="payment-result-spin" />
          <h1>Giao dịch đang được xử lý</h1>
          <p>
            Chúng tôi chưa nhận được xác nhận cuối cùng từ VNPay. Nếu bạn đã thanh toán,
            {isFee
              ? ' phí nền tảng sẽ được ghi nhận trong ít phút và đơn sẽ mở khoá xác nhận.'
              : ' đơn hàng sẽ xuất hiện trong ít phút.'}
            {' '}Bạn có thể kiểm tra lại tại trang đơn hàng.
          </p>
          {txnRef ? <p className="payment-result-meta">Mã giao dịch: <strong>{txnRef}</strong></p> : null}
          <div className="payment-result-actions">
            <Link className="solid-orange-button" to={orderId ? `/orders?orderId=${orderId}` : '/orders'}>
              Tới đơn hàng của tôi
            </Link>
            <Link className="outline-gray-button" to="/">Về trang chủ</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-result-page">
      <section className="payment-result-card payment-result-card--failed">
        <XCircle size={56} />
        <h1>{isFee ? 'Thanh toán phí nền tảng không thành công' : 'Thanh toán cọc không thành công'}</h1>
        <p>
          {isFee
            ? 'Giao dịch đã bị hủy hoặc thất bại nên phí nền tảng chưa được thu. Bạn có thể thử thanh toán lại từ trang đơn hàng.'
            : 'Giao dịch đã bị hủy hoặc thất bại nên đơn hàng chưa được tạo. Bạn có thể thử đặt lại sản phẩm bất kỳ lúc nào.'}
        </p>
        {txnRef ? <p className="payment-result-meta">Mã giao dịch: <strong>{txnRef}</strong></p> : null}
        <div className="payment-result-actions">
          {isFee ? (
            <Link className="solid-orange-button" to={orderId ? `/orders?orderId=${orderId}` : '/orders'}>
              Về đơn hàng của tôi
            </Link>
          ) : (
            <>
              <Link className="solid-orange-button" to="/">Quay lại chợ</Link>
              <Link className="outline-gray-button" to="/orders">Xem đơn hàng của tôi</Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default PaymentResult;
