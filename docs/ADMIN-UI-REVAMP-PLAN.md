# Kế hoạch chỉnh sửa UI trang Admin

Mục tiêu (theo yêu cầu):
1. **Tách mỗi tác vụ thành UI riêng** — mỗi nhóm việc có màn hình/route riêng thay vì gộp trong một component.
2. **Làm đẹp & đồng bộ design** — thống nhất với design system chung của app.
3. **Dễ dùng** — điều hướng rõ ràng, responsive, phản hồi mượt.

Phạm vi: chỉ frontend (`H-smart UI`). Không đổi API/backend; tái dùng toàn bộ endpoint admin hiện có.

---

## 1. Hiện trạng (từ code)

- Toàn bộ trang admin nằm trong **một file** `src/pages/Admin.jsx` (~1350 dòng) + `src/pages/Admin.css`.
- Một component chứa **5 tab** chuyển bằng state `activeQueue`: `products`, `reports`, `users`, `orders`, `reviews`; kèm panel xem nhanh (`aside`), modal xác nhận, phân trang, `BooleanBadge`.
- Route duy nhất: `/admin` trong `App.jsx` (`protectedPage(<Admin/>, true)`).
- API admin đã có đủ: `apiFetchAdminStats`, `apiFetchProductPage`, `apiFetchPendingReports`, `apiFetchAdminUsers`, `apiFetchAdminUserById`, `apiBanUser`, `apiUnbanUser`, `apiFetchAdminOrders`, `apiAdminCancelOrder`, `apiFetchAdminReviews`, `apiHideAdminReview`, `apiRestoreAdminReview`, `apiModerateProduct`, `apiProcessReport`, `apiCreateCategory`, `apiFetchProductById`.

### Điểm cần cải thiện

| # | Vấn đề | Ảnh hưởng |
|---|--------|-----------|
| A | Một component 1350 dòng gánh 5 tác vụ | Khó bảo trì, khó tách việc, state lẫn lộn |
| B | Tab bằng state, không có route | Refresh mất tab, không chia sẻ link tới từng tác vụ |
| C | `Admin.css` dùng bảng màu riêng (accent cam `#ff6825`, nền slate) | Lệch với design system chung (`index.css`: `--primary` xanh `#2563eb`, `--surface`, `--border`, `--radius-*`, `--shadow-*`) |
| D | Bảng nhiều cột (Người dùng/Đơn hàng 7 cột) + panel `aside` co bảng | Chưa tối ưu trên tablet/mobile |
| E | Feedback bằng banner, loading bằng chữ "Đang tải…" | Có sẵn `ToastContext` nhưng chưa dùng; thiếu skeleton |
| F | Hàng người dùng click được nhưng là `<tr onClick>` | Hạn chế truy cập bàn phím / a11y |

---

## 2. Kiến trúc đích

```
src/
  pages/admin/
    AdminLayout.jsx        # khung: sidebar điều hướng + header + <Outlet/>
    OverviewPage.jsx       # /admin            — tổng quan + chỉ số + công cụ nhanh
    ProductsPage.jsx       # /admin/products   — duyệt tin đăng
    ReportsPage.jsx        # /admin/reports    — báo cáo
    UsersPage.jsx          # /admin/users      — quản lý người dùng
    OrdersPage.jsx         # /admin/orders     — đơn hàng toàn sàn
    ReviewsPage.jsx        # /admin/reviews    — kiểm duyệt đánh giá
  components/admin/
    AdminDataTable.jsx     # bảng + trạng thái rỗng/loading dùng chung
    Pagination.jsx         # tách từ Admin.jsx hiện tại
    ConfirmModal.jsx       # tách modal xác nhận
    MetricCard.jsx         # thẻ chỉ số
    BooleanBadge.jsx       # tách sẵn có
    PreviewDrawer.jsx      # panel xem nhanh -> drawer trượt
    AdminToolbar.jsx       # ô tìm kiếm + filter dùng chung
    EmptyState.jsx
  styles/admin.css         # CSS dùng token chung của app
```

Định tuyến (React Router v7) trong `App.jsx`:

```jsx
<Route path="/admin" element={protectedPage(<AdminLayout />, true)}>
  <Route index element={<OverviewPage />} />
  <Route path="products" element={<ProductsPage />} />
  <Route path="reports" element={<ReportsPage />} />
  <Route path="users" element={<UsersPage />} />
  <Route path="orders" element={<OrdersPage />} />
  <Route path="reviews" element={<ReviewsPage />} />
</Route>
```

→ Giải quyết A (tách nhỏ), B (mỗi tác vụ một URL), và mở đường cho việc làm đẹp + responsive.

---

## 3. Kế hoạch theo giai đoạn

### Giai đoạn 0 — Chuẩn bị (không đổi giao diện)
- Chốt bảng màu: dùng token `index.css` (`--primary`, `--surface`, `--border`, `--radius-*`, `--shadow-*`, `--font-family`); quyết định giữ hay bỏ accent cam.
- Tạo cây thư mục `pages/admin/` và `components/admin/`.
- Liệt kê state/handler hiện có để biết phần nào thuộc về tab nào.
- **Rủi ro:** không. **Công sức:** ~0.5 ngày.

### Giai đoạn 1 — Khung layout + điều hướng + tách route (mục tiêu 1)
- Tạo `AdminLayout`: sidebar trái (Tổng quan, Sản phẩm, Báo cáo, Người dùng, Đơn hàng, Reviews) dùng `NavLink` (tự active theo route), header hiển thị tiêu đề trang + nút "Làm mới", vùng nội dung `<Outlet/>`.
- Cập nhật `App.jsx` sang nested routes như trên (mỗi route bọc admin-only sẵn có).
- Bê nguyên logic mỗi tab hiện tại sang page tương ứng (giữ nguyên bảng/hành vi, chỉ tách file).
- **Đầu ra:** mỗi tác vụ có URL riêng, refresh không mất chỗ, link chia sẻ được.
- **Rủi ro:** TB (di chuyển state/effect theo từng page). **Công sức:** ~1.5–2 ngày.

### Giai đoạn 2 — Tách component dùng chung (mục tiêu 1 & 3)
- Rút `Pagination`, `ConfirmModal`, `BooleanBadge`, `MetricCard`, `EmptyState`, `AdminToolbar`, `AdminDataTable` thành component riêng trong `components/admin/`.
- Mỗi page dùng lại các component này → giảm lặp, hành vi đồng nhất, dễ chỉnh.
- **Rủi ro:** thấp. **Công sức:** ~1 ngày.

### Giai đoạn 3 — Redesign visual + đồng bộ design system (mục tiêu 2)
- Viết lại CSS admin dựa trên token `index.css`; bỏ palette riêng lệch chuẩn.
- Chuẩn hóa spacing/typography/radius/hover-focus; badge trạng thái dùng `StatusBadge` chung.
- `OverviewPage`: bố cục thẻ chỉ số gọn đẹp; tùy chọn thêm mini chart từ dữ liệu `apiFetchAdminStats`.
- **Đầu ra:** trang admin nhìn cùng "ngôn ngữ" với phần còn lại của app.
- **Rủi ro:** thấp–TB. **Công sức:** ~1.5–2 ngày.

### Giai đoạn 4 — Trải nghiệm dễ dùng (mục tiêu 3)
- Panel xem nhanh → **drawer trượt** (giữ bảng full width); trên mobile là bottom-sheet/full-screen.
- Dùng **toast** (`ToastContext` có sẵn) cho thông báo thành công; giữ banner cho lỗi.
- **Skeleton loading** thay chữ "Đang tải…".
- **Responsive:** sidebar off-canvas trên mobile; bảng nhiều cột chuyển sang dạng thẻ/stacked ở màn nhỏ; ưu tiên cột quan trọng.
- **A11y:** hàng người dùng click được chuyển sang nút/role hợp lệ, focus ring, điều hướng bàn phím, aria cho drawer/modal.
- **Rủi ro:** TB. **Công sức:** ~2 ngày.

### Giai đoạn 5 — Hoàn thiện & kiểm thử
- Rà trạng thái rỗng/lỗi, kiểm tra các breakpoint, `npm run build` + `npm run lint`, chụp ảnh đối chiếu trước–sau từng tác vụ.
- **Rủi ro:** thấp. **Công sức:** ~0.5–1 ngày.

---

## 4. Thứ tự đề xuất

GĐ0 → **GĐ1 (tách route/layout)** → GĐ2 (component dùng chung) → **GĐ3 (đồng bộ design)** → GĐ4 (dễ dùng) → GĐ5.
Lý do: tách cấu trúc trước giúp việc làm đẹp và cải thiện UX ở các giai đoạn sau gọn và ít rủi ro hơn (mỗi page nhỏ, độc lập).

## 6. File sẽ chạm tới

- Mới: `src/pages/admin/*` (Layout + 6 page), `src/components/admin/*`, `src/styles/admin.css`.
- Sửa: `src/App.jsx` (nested routes admin), `src/pages/Admin.jsx` (thay bằng layout hoặc gỡ bỏ sau khi tách xong), `src/pages/Admin.css` (chuyển sang token chung / thay bằng `styles/admin.css`).
- Tái dùng nguyên trạng: `services/api.js` (mọi endpoint admin), `components/common/StatusBadge.jsx`, `context/ToastContext`.

## 7. Lưu ý

- Không đổi hợp đồng API; mọi thay đổi nằm ở tầng trình bày.
- Mỗi giai đoạn nên đi trên nhánh riêng và build/lint trước khi gộp.
- Giữ nguyên các ràng buộc nghiệp vụ hiện có (vd: user detail dùng numeric id, ban/unban dùng username; đơn COMPLETED/CANCELLED không cho hủy).
