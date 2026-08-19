# Frontend production runbook

Cập nhật lần cuối: 2026-06-20  
Áp dụng cho repo: `D:\H-smart UI`

## 1. Production hiện tại là gì

Frontend production của H-Smart hiện tại:

- không deploy public bằng Vercel
- đang chạy trên VPS qua nginx
- domain public:
  - `https://hsmart.thatcherdev.id.vn`

Từ góc nhìn browser:

- trang frontend mở từ `https://hsmart.thatcherdev.id.vn`
- API phải gọi same-origin:
  - `https://hsmart.thatcherdev.id.vn/api/v1/...`

## 2. Quy tắc quan trọng nhất

Khi build production, luôn dùng:

```env
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK=false
```

Không được để browser bundle chứa:

```env
VITE_API_BASE_URL=https://instance-20260601-031713.tail0e1958.ts.net/api/v1
```

Lý do:

- hostname đó là đường cũ qua Tailscale/Funnel
- đã từng gây lỗi `ERR_CERT_COMMON_NAME_INVALID`
- production hiện tại phải đi qua domain VPS public

## 3. Máy production cần vào

Thông tin production host hiện đang dùng:

- Tailscale hostname: `instance-20260601-031713.tail0e1958.ts.net`
- Tailscale IP: `100.66.247.41`
- Public IP: `34.126.116.93`
- frontend static root trên VPS:
  - `/var/www/h-smart-ui`

Thông tin này lấy từ note vận hành nội bộ và dùng để thao tác production hiện tại.

## 4. Cách SSH vào VPS

### Cách nên dùng

Ưu tiên dùng Tailscale SSH:

```bash
ssh root@100.66.247.41
```

Hoặc:

```bash
ssh root@instance-20260601-031713.tail0e1958.ts.net
```

### Điều kiện trước khi SSH

- máy local phải đang online trong Tailscale
- node production phải hiện trong `tailscale status`
- đôi khi Tailscale sẽ yêu cầu xác thực lại qua browser

### Kiểm tra nhanh trước khi SSH

```bash
tailscale status
tailscale ping instance-20260601-031713.tail0e1958.ts.net
```

### Nếu Tailscale yêu cầu xác thực thêm

Có thể gặp thông báo đại loại:

```text
Tailscale SSH requires an additional check.
To authenticate, visit: https://login.tailscale.com/...
```

Khi đó:

1. mở link được trả về
2. xác nhận đăng nhập trong browser
3. chạy lại:

```bash
ssh root@100.66.247.41
```

## 5. Frontend deploy lên production như thế nào

Production frontend hiện tại là static files + nginx.

Luồng chuẩn:

1. kiểm tra `.env.local`
2. build frontend
3. copy nội dung build lên VPS
4. đảm bảo nginx đang serve bundle mới
5. verify public domain thật sự đổi

## 6. Pre-deploy checklist ở máy local

### 6.1 Kiểm tra env

File:

- [.env.local](D:/H-smart UI/.env.local)

Mong đợi:

```env
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK=false
```

### 6.2 Build

```bash
npm run build
```

Nếu `dist` bị lock trên Windows và Vite không dọn được thư mục cũ, có thể build ra thư mục tạm:

```bash
npx vite build --outDir dist-deploy
```

Khi đó dùng `dist-deploy` để upload thay cho `dist`.

## 7. Lệnh deploy frontend lên VPS

### Trường hợp build bình thường ra `dist`

Copy toàn bộ static files:

```bash
scp -r dist/* root@100.66.247.41:/var/www/h-smart-ui/
```

### Trường hợp build ra `dist-deploy`

```bash
scp -r dist-deploy/* root@100.66.247.41:/var/www/h-smart-ui/
```

## 8. Dọn asset cũ nếu cần

Thông thường chỉ cần upload đè là đủ.

Nhưng nếu muốn chắc chắn nginx không còn serve nhầm bundle hash cũ, có thể vào VPS và kiểm tra:

```bash
ssh root@100.66.247.41
ls -1 /var/www/h-smart-ui/assets
cat /var/www/h-smart-ui/index.html
```

Nếu `index.html` đã trỏ sang bundle mới nhưng thư mục `assets` vẫn còn bundle hash cũ, có thể xóa đúng các file hash cũ không còn được tham chiếu nữa.

Chỉ xóa khi đã xác nhận:

- `index.html` không còn tham chiếu file đó
- file đó là asset build cũ

## 9. Verify sau deploy

### Verify trên VPS

SSH vào máy:

```bash
ssh root@100.66.247.41
```

Kiểm tra file HTML đang serve:

```bash
cat /var/www/h-smart-ui/index.html
```

Kiểm tra asset hiện có:

```bash
ls -1 /var/www/h-smart-ui/assets
```

### Verify từ máy local qua domain public

Mở:

- `https://hsmart.thatcherdev.id.vn`
- `https://hsmart.thatcherdev.id.vn/search`
- `https://hsmart.thatcherdev.id.vn/verify-email`
- `https://hsmart.thatcherdev.id.vn/reset-password`

### Verify kỹ hơn

Ít nhất phải đúng các điều sau:

- HTML public trỏ tới hash JS/CSS mới
- bundle JS public không chứa:
  - `tail0e1958.ts.net`
  - `instance-20260601-031713`
- request API từ browser đi tới same-origin `/api/v1/...`

## 10. Kiểm tra nhanh backend routing phía production

Frontend production đang dựa vào nginx để proxy API.

Kỳ vọng:

- `/` -> static frontend
- `/api/` -> `http://127.0.0.1:8000`
- mọi SPA route -> `index.html`

Nếu frontend lên nhưng API không chạy:

- kiểm tra lại nginx config
- kiểm tra gateway trên VPS

Ví dụ kiểm tra từ trong VPS:

```bash
curl --fail http://127.0.0.1:8000/health
```

## 11. Khi nào được dùng Vercel

Vercel chỉ còn là lịch sử cấu hình cũ hoặc môi trường tạm nếu ai đó chủ động yêu cầu.

Mặc định hiện tại:

- deploy production = deploy VPS
- không assume Vercel là active production

## 12. Những điều không được assume

Không được assume các điều sau:

- `npm run build` pass nghĩa là production đã lên
- domain đang trỏ Vercel
- bundle hash cũ trong log vẫn còn đúng
- browser nên gọi trực tiếp `tail0e1958.ts.net`

## 13. Nếu bị chặn ở bước deploy

Điểm kẹt thường gặp nhất là không vào được VPS.

Nếu bị chặn:

1. kiểm tra Tailscale đã online chưa
2. thử lại:

```bash
ssh root@100.66.247.41
```

3. nếu có link xác thực Tailscale thì xác thực xong SSH lại
4. chỉ sau khi SSH được mới kết luận được bước upload có làm tiếp được hay không

## 14. Câu trả lời ngắn cho context sau

Nếu cần một câu rất ngắn để handoff:

> Frontend production của H-Smart hiện deploy lên VPS/nginx ở `hsmart.thatcherdev.id.vn`. SSH vào bằng `ssh root@100.66.247.41`, build với `VITE_API_BASE_URL=/api/v1`, rồi copy `dist/*` hoặc `dist-deploy/*` lên `/var/www/h-smart-ui/` và verify lại `index.html` + bundle public.
