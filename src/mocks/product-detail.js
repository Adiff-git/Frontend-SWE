export const product = {
  name: "iPhone 15 Pro Max",
  sku: "IP15PM-256-NAT",
  color: "Titan Tự nhiên",
  inventory: 18,
  image: "/product-detail/iphone.png",
  options: [
    { storage: "256GB", price: 29990000, originalPrice: 34990000 },
    { storage: "512GB", price: 35990000, originalPrice: 40990000 },
    { storage: "1TB", price: 42490000, originalPrice: 47490000 },
  ],
};

export const highlights = [
  { icon: "chip", eyebrow: "TIẾN TRÌNH 3NM ĐẦU TIÊN", title: "Chip A17 Pro", description: "Chiến mượt mọi tựa game AAA console đỉnh cao với công nghệ dò tia Ray Tracing tăng tốc phần cứng, tiết kiệm pin vượt trội." },
  { icon: "camera", eyebrow: "LĂNG KÍNH TETRAPRISM", title: "Camera Zoom 5x", description: "Zoom quang học tiêu cự 120mm sắc nét đến từng chi tiết, chống rung quang học 3D dịch chuyển cảm biến thế hệ mới." },
  { icon: "phone", eyebrow: "HỢP KIM VŨ TRỤ HẠNG 5", title: "Khung Titanium", description: "Phiên bản Pro Max nhẹ nhất từng được chế tác, viền bo công thái học ôm tay, tản nhiệt tối ưu với cấu trúc nhôm tái chế." },
  { icon: "battery", eyebrow: "USB 3 & PIN CẢ NGÀY", title: "Pin 29 Giờ & Type-C", description: "Thời lượng pin xem video lên đến 29 giờ liên tục. Cổng USB-C tốc độ truyền tệp siêu tốc 10Gbps hỗ trợ xuất video ProRes ngoài." },
];

export const specifications = [
  { title: "Màn hình & Thiết kế", icon: "phone", items: [["Công nghệ hiển thị", "Super Retina XDR OLED 6.7 inch"], ["Độ phân giải & Mật độ", "2796 x 1290 pixel tại 460 ppi"], ["Tần số quét thích ứng", "ProMotion 1Hz – 120Hz mượt mà"], ["Độ sáng tối đa (Peak)", "2.000 nits ngoài trời (1.600 nits HDR)"], ["Vật liệu cấu tạo", "Khung viền Titan & Mặt kính Ceramic Shield"], ["Trọng lượng & Kích thước", "221 gram (159.9 x 76.7 x 8.25 mm)"]] },
  { title: "Hệ thống Camera Chuyên Nghiệp", icon: "camera", items: [["Camera chính", "48MP"], ["Zoom quang học", "5x"]] },
  { title: "Vi xử lý & Hiệu năng", icon: "chip", items: [["Chip", "A17 Pro"], ["Dung lượng", "256GB, 512GB hoặc 1TB"]] },
  { title: "Pin & Cổng kết nối", icon: "battery", items: [["Xem video", "Lên đến 29 giờ"], ["Cổng kết nối", "USB-C, USB 3"]] },
];

export const reviews = [
  { initials: "NT", name: "Nguyễn Tuấn Anh", time: "12 giờ trước", title: "Màn hình đẹp, hiệu năng mượt, zoom 5x rất ấn tượng", text: "Màn hình đẹp, hiệu năng mượt, zoom 5x rất ấn tượng. Chụp ảnh thiếu sáng cải thiện rõ, pin dùng cả ngày thoải mái. Thiết kế Titanium nhẹ tay, cầm rất vừa và sang trọng.", photos: ["/product-detail/review-1.png", "/product-detail/review-2.png", "/product-detail/review-3.png"] },
  { initials: "LH", name: "Lê Hoàng Linh", time: "2 ngày trước", title: "Chất ảnh rất tốt, pin dùng cả ngày, thiết kế đẹp", text: "Chất ảnh rất tốt, pin dùng cả ngày, thiết kế đẹp. Màu Titan tự nhiên sang trọng, cầm rất chắc tay. Chỉ hơi tiếc là bộ sản phẩm không đi kèm củ sạc, nhưng tổng thể rất hài lòng." },
  { initials: "PT", name: "Phạm Thanh Tú", time: "5 ngày trước", title: "Nhanh, mượt, camera chụp đêm tốt hơn hẳn", text: "Nhanh, mượt, camera chụp đêm tốt hơn hẳn. Màn hình sáng, nhìn ngoài trời rất rõ. Cổng USB-C tiện lợi hơn khi chỉ cần mang một dây sạc chung cho cả máy và phụ kiện." },
];
