import { apiCreateDeposit, apiCreatePlatformFeePayment } from './api';

// Lưu tạm cọc đang chờ thanh toán để trang /payment-result có thể poll trạng
// thái theo id (VNPay chỉ trả về txnRef/orderId trên query khi điều hướng về).
const PENDING_KEY = 'hsmart_pending_deposit';
// Phí nền tảng dùng chung trang kết quả với cọc — lưu riêng để phân biệt luồng.
const PENDING_FEE_KEY = 'hsmart_pending_platform_fee';

export const rememberPendingDeposit = (deposit) => {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({
      id: deposit?.id,
      txnRef: deposit?.txnRef,
      productId: deposit?.productId,
      amount: deposit?.amount,
    }));
  } catch {
    /* sessionStorage có thể bị chặn — bỏ qua, vẫn dùng query từ VNPay */
  }
};

export const readPendingDeposit = (txnRef) => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (txnRef && data?.txnRef && String(data.txnRef) !== String(txnRef)) return null;
    return data;
  } catch {
    return null;
  }
};

export const clearPendingDeposit = () => {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* bỏ qua */
  }
};

// Tạo cọc qua VNPay rồi chuyển trình duyệt sang cổng thanh toán sandbox.
// Khi thành công hàm này KHÔNG trả về (trang bị điều hướng đi); lỗi sẽ throw.
export const startDepositCheckout = async (
  productId,
  deliveryMethod = 'VIETTEL_POST',
  offerId = null,
) => {
  const deposit = await apiCreateDeposit(productId, deliveryMethod, offerId);
  if (!deposit?.paymentUrl) {
    throw new Error('Không nhận được liên kết thanh toán từ hệ thống.');
  }
  rememberPendingDeposit(deposit);
  window.location.assign(deposit.paymentUrl);
  return deposit;
};

export const rememberPendingPlatformFee = (payment) => {
  try {
    sessionStorage.setItem(PENDING_FEE_KEY, JSON.stringify({
      id: payment?.id,
      txnRef: payment?.txnRef,
      orderId: payment?.orderId,
      amount: payment?.amount,
    }));
  } catch {
    /* sessionStorage có thể bị chặn — bỏ qua, vẫn dùng query từ VNPay */
  }
};

export const readPendingPlatformFee = (txnRef) => {
  try {
    const raw = sessionStorage.getItem(PENDING_FEE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (txnRef && data?.txnRef && String(data.txnRef) !== String(txnRef)) return null;
    return data;
  } catch {
    return null;
  }
};

export const clearPendingPlatformFee = () => {
  try {
    sessionStorage.removeItem(PENDING_FEE_KEY);
  } catch {
    /* bỏ qua */
  }
};

// Seller thanh toán phí nền tảng của 1 đơn qua VNPay (mục 3.1 bàn giao BE).
// Khi thành công hàm KHÔNG trả về (trang bị điều hướng sang VNPay); lỗi sẽ throw.
export const startPlatformFeeCheckout = async (orderId) => {
  const payment = await apiCreatePlatformFeePayment(orderId);
  if (!payment?.paymentUrl) {
    throw new Error('Không nhận được liên kết thanh toán phí nền tảng từ hệ thống.');
  }
  rememberPendingPlatformFee(payment);
  window.location.assign(payment.paymentUrl);
  return payment;
};
