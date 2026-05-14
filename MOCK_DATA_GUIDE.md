# Hướng Dẫn Chạy Giao Diện Không Cần API (Mock Data Mode)

Tài liệu này ghi lại toàn bộ những thiết lập và cấu trúc đã được xây dựng để dự án **H-Smart UI** có thể hoạt động độc lập (standalone) cho mục đích báo cáo và demo giao diện mà không cần khởi động hệ thống Microservices backend phức tạp.

## 1. Cấu hình Bypass API (api.js)
- Tại file `src/services/api.js`, chúng ta đã thiết lập cờ `const USE_MOCK = true;`. 
- Khi cờ này được bật, toàn bộ các hàm gọi API (`apiLogin`, `apiGetProfile`, `apiRegister`, `authFetch`, v.v.) sẽ tự động chặn các request mạng và trả về trực tiếp dữ liệu từ file `mockData.js` ngay lập tức (Zero-latency).
- **Để kết nối lại với backend thực:** Chỉ cần đổi `USE_MOCK = false`.

## 2. Dữ liệu Giả lập (mockData.js)
Toàn bộ dữ liệu giả lập được lưu trữ tập trung tại `src/services/mockData.js` với sự đồng bộ 100% với DTO của Backend Java:

### Hình ảnh HQ (High-Quality)
- Đã tải trực tiếp 35 hình ảnh cực nét từ Unsplash (Tivi, Tủ lạnh, Laptop, Giày dép...) bằng script `download_hq_images.py`.
- Các ảnh này lưu trữ offline trong thư mục `public/products_hq/`.
- Hệ thống tự sinh ra 40 sản phẩm giả lập kết hợp ngẫu nhiên các thông tin thực tế.

### Cấu trúc ProductResponseDTO
Sản phẩm được mock chính xác với cấu trúc trả về từ `ProductService` của Backend:
- Chuyển `id` thành kiểu `Long` (Number).
- Các trạng thái kiểm duyệt thực tế: `APPROVED`, `PENDING_REVIEW`, `SOLD`.
- Bổ sung `categoryId`, `categoryName`.
- Thêm `aiMetadata` giả lập kết quả nhận diện từ AI (Computer Vision).

### Cấu trúc UserProfileResponseDTO & 3 Role Demo
Đã mock 3 tài khoản với kịch bản cụ thể để phục vụ mô hình C2C:
1. **Admin (`username: admin`)**: Có role `ADMIN`, dùng để test luồng kiểm duyệt tự động.
2. **Seller (`username: seller01`)**: Người bán C2C với `trustScore: 4.8` (Điểm uy tín tính từ Review Service).
3. **Buyer (`username: buyer01`)**: Người mua C2C, có 5000 H-Coin.

Lưu ý: Đã đổi `phone` thành `phoneNumber` và `id` thành Number để đồng bộ với Backend.

### Các Mock Phụ Trợ
- **mockCategories**: 12 danh mục sản phẩm thương mại điện tử với ảnh từ Unsplash.
- **mockNotifications**: 5 thông báo mô phỏng luồng Order (giao hàng), Promotion (Flash Sale) và System (AI Verification).
- **mockMessages**: Một kịch bản chat 5 lượt hoàn chỉnh giữa người mua và Trợ lý ảo AI, phô diễn khả năng quét lỗi ngoại hình sản phẩm bằng Computer Vision.

## 3. Tối Ưu Hiệu Năng UI
- Thêm `loading="lazy"` vào hình ảnh.
- Chuyển đổi các hiệu ứng animation của component từ `transition: all` sang `transform` & `box-shadow` có hỗ trợ GPU (`will-change: transform`) để loại bỏ hoàn toàn giật lag khi tương tác ở lưới sản phẩm 40 items.
