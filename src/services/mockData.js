const hqProductsTemplate = [
  { name: 'iPhone 13 Pro Max 256GB', img: 'iphone.jpg' },
  { name: 'MacBook Air M1 2020', img: 'macbook.jpg' },
  { name: 'Tai nghe Bluetooth Sony WH-1000XM4', img: 'headphones.jpg' },
  { name: 'Máy ảnh Mirrorless Sony A7 III', img: 'camera.jpg' },
  { name: 'Đồng hồ Apple Watch Series 7', img: 'watch.jpg' },
  { name: 'Chuột không dây Logitech Master 3', img: 'mouse.jpg' },
  { name: 'Bàn phím cơ Keychron K8 Pro', img: 'keyboard.jpg' },
  { name: 'Laptop Desk Setup Cao Cấp', img: 'laptop_desk.jpg' },
  { name: 'Giày thể thao Nike Air Force 1', img: 'shoes.jpg' },
  { name: 'Nước hoa Chanel Bleu 100ml', img: 'perfume.jpg' },
  { name: 'Loa Bluetooth JBL Charge 5', img: 'speaker.jpg' },
  { name: 'iPad Pro 11 inch M2', img: 'ipad.jpg' },
  { name: 'Flycam DJI Mini 3 Pro', img: 'drone.jpg' },
  { name: 'Tay cầm PS5 DualSense', img: 'gamepad.jpg' },
  { name: 'Kính thực tế ảo Meta Quest 3', img: 'vr.jpg' },
  { name: 'Kính râm Ray-Ban Aviator', img: 'sunglasses.jpg' },
  { name: 'Balo chống nước NorthFace', img: 'backpack.jpg' },
  { name: 'Áo thun Cotton Basic', img: 'tshirt.jpg' },
  { name: 'Mũ lưỡi trai MLB', img: 'hat.jpg' },
  { name: 'Bộ Skincare La Roche-Posay', img: 'skincare.jpg' },
  { name: 'Máy pha cà phê Delonghi', img: 'coffee_maker.jpg' },
  { name: 'Robot hút bụi Xiaomi', img: 'vacuum.jpg' },
  { name: 'Smart TV Samsung 4K 55 inch', img: 'tv.jpg' },
  { name: 'Màn hình máy tính Dell 27 inch', img: 'monitor.jpg' },
  { name: 'Máy in Canon Pixma', img: 'printer.jpg' },
  { name: 'Router Wifi 6 TP-Link', img: 'router.jpg' },
  { name: 'Bộ Smart Home Starter Kit', img: 'smart_home.jpg' },
  { name: 'Đèn bàn học chống cận', img: 'desk_lamp.jpg' },
  { name: 'Ghế công thái học Ergonomic', img: 'office_chair.jpg' },
  { name: 'Kệ sách gỗ 5 tầng', img: 'bookshelf.jpg' },
  { name: 'Cây Monstera trang trí', img: 'plant.jpg' },
  { name: 'Bình giữ nhiệt Yeti 900ml', img: 'water_bottle.jpg' },
  { name: 'Thảm Yoga Liforme', img: 'yoga_mat.jpg' },
  { name: 'Tạ tay Dumbbell 10kg', img: 'dumbbell.jpg' },
  { name: 'Xe đạp thể thao Giant', img: 'bicycle.jpg' }
];

const locations = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

export const mockCategories = [
  { id: '1', name: 'Thời Trang Nam', img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=150&q=80' },
  { id: '2', name: 'Điện Thoại', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=150&q=80' },
  { id: '3', name: 'Thiết Bị Điện Tử', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=150&q=80' },
  { id: '4', name: 'Máy Tính & Laptop', img: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=150&q=80' },
  { id: '5', name: 'Máy Ảnh', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=150&q=80' },
  { id: '6', name: 'Đồng Hồ', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80' },
  { id: '7', name: 'Giày Dép', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80' },
  { id: '8', name: 'Gia Dụng', img: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=150&q=80' },
  { id: '9', name: 'Mỹ Phẩm', img: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=150&q=80' },
  { id: '10', name: 'Mẹ & Bé', img: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=150&q=80' },
  { id: '11', name: 'Thể Thao', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=150&q=80' },
  { id: '12', name: 'Nhà Cửa', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80' }
];

// Sinh ra 40 sản phẩm
export const mockProducts = Array.from({ length: 40 }).map((_, index) => {
  const template = hqProductsTemplate[index % hqProductsTemplate.length];
  const isPremium = index % 5 === 0;
  return {
    // Backend API exact properties (ProductResponseDTO)
    id: index + 1,
    title: `${template.name} ${isPremium ? '(Bản Cao Cấp)' : '(Chính Hãng)'}`,
    description: 'Sản phẩm chính hãng chất lượng cao. Hình ảnh được tải trực tiếp từ Unsplash để tối ưu trải nghiệm thị giác cho báo cáo.',
    price: Math.floor(Math.random() * 900) + 150,
    status: index % 6 === 0 ? 'SOLD' : (index % 5 === 0 ? 'PENDING_REVIEW' : 'APPROVED'),
    sellerId: index % 3 === 0 ? '3' : '2', // seller01 or buyer01
    categoryId: (index % 12) + 1,
    categoryName: mockCategories[index % mockCategories.length].name,
    imageUrl: `/products_hq/${template.img}`,
    aiMetadata: [
      { label: template.name.split(' ')[0], confidence: 0.98 },
      { label: 'condition_A_plus', confidence: 0.95 }
    ],
    numDetections: 2,

    // Frontend-only extra properties (to avoid breaking UI)
    location: locations[index % locations.length],
    isVerified: index % 4 === 0,
    tags: index % 3 === 0 ? ['Freeship', 'Sale'] : (index % 2 === 0 ? ['Freeship'] : []),
    image: `/products_hq/${template.img}`,
    sold: Math.floor(Math.random() * 500) + 10,
    createdAt: new Date().toISOString()
  };
});


export const mockProfiles = {
  admin: {
    id: 1,
    username: 'admin',
    role: 'ADMIN',
    email: 'admin@hsmart.vn',
    fullName: 'Mắt Thần Quản Trị (Admin)',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
    phoneNumber: '0909000000',
    address: 'Trụ sở H-Smart, TP. Hồ Chí Minh',
    trustScore: 5.0,
    reviewCount: 999,
    membership: 'System Admin',
    hCoin: 999999,
    ordersCount: 0,
    followingCount: 0
  },
  seller: {
    id: 2,
    username: 'seller01',
    role: 'USER',
    email: 'seller@gmail.com',
    fullName: 'Người Bán Uy Tín',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    phoneNumber: '0901234567',
    address: 'Quận Cầu Giấy, Hà Nội',
    trustScore: 4.8,
    reviewCount: 156,
    membership: 'Gold',
    hCoin: 15400,
    ordersCount: 24,
    followingCount: 15
  },
  buyer: {
    id: 3,
    username: 'buyer01',
    role: 'USER',
    email: 'buyer@gmail.com',
    fullName: 'Khách Hàng Mua Sắm',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    phoneNumber: '0987654321',
    address: 'Khu công nghệ cao, Quận 9, TP. Hồ Chí Minh',
    trustScore: 0,
    reviewCount: 0,
    membership: 'Silver',
    hCoin: 5000,
    ordersCount: 12,
    followingCount: 5
  }
};

// Default profile fallback
export const mockProfile = mockProfiles.buyer;

export const mockNotifications = [
  { id: '1', type: 'ORDER', title: 'Giao hàng thành công', message: 'Đơn hàng #HS9982 của bạn đã được giao thành công. Vui lòng đánh giá sản phẩm để nhận 200 H-Coin!', read: false, createdAt: new Date().toISOString() },
  { id: '2', type: 'PROMO', title: 'Voucher Độc Quyền', message: 'Tặng bạn mã giảm giá 20% (tối đa 500k) cho các sản phẩm Apple. Nhập: APPLE20. HSD: 24h.', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'SYSTEM', title: 'Hệ thống AI Verification', message: 'Báo cáo kiểm định AI cho sản phẩm "MacBook Air M1" bạn đang theo dõi đã có. Độ tin cậy: 99%.', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', type: 'WALLET', title: 'Hoàn tiền H-Pay', message: 'Bạn vừa được hoàn 50.000đ từ chương trình Flash Sale vào ví H-Pay.', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: '5', type: 'ORDER', title: 'Đơn hàng đang giao', message: 'Shipper (098xxxxxx) đang giao đơn hàng #HS9981 đến bạn. Vui lòng chú ý điện thoại.', read: true, createdAt: new Date(Date.now() - 259200000).toISOString() }
];

export const mockMessages = [
  { id: '1', senderId: 'user', text: 'Cho mình hỏi MacBook Air M1 này pin còn bao nhiêu % vậy?', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', senderId: 'assistant', text: 'Chào bạn, theo hệ thống AI Verification quét được, tình trạng pin của máy hiện tại là 94%, số lần sạc là 125 lần. Đạt chuẩn loại A+ nhé!', createdAt: new Date(Date.now() - 86300000).toISOString() },
  { id: '3', senderId: 'user', text: 'Máy có trầy xước góc nào không bạn?', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '4', senderId: 'assistant', text: 'Hệ thống Computer Vision của chúng tôi không phát hiện vết xước móp nào ở khung viền. Có 1 vết xước dăm siêu nhỏ (0.2mm) ở mặt đáy, hoàn toàn không ảnh hưởng đến thẩm mỹ ạ.', createdAt: new Date(Date.now() - 3550000).toISOString() },
  { id: '5', senderId: 'assistant', text: 'Bạn có muốn xem trực tiếp báo cáo 3D scan của sản phẩm này không?', createdAt: new Date(Date.now() - 3500000).toISOString() }
];
