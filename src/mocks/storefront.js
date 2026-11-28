export const categories = [
  { name: "Điện thoại", count: "48 mẫu", icon: "phone" },
  { name: "Laptop & Mac", count: "128 mẫu", icon: "laptop" },
  { name: "iPad & Tablet", count: "22 mẫu", icon: "tablet" },
  { name: "Đồng hồ thông minh", count: "19 mẫu", icon: "watch" },
  { name: "Tai nghe & Loa", count: "54 mẫu", icon: "headphones" },
  { name: "Màn hình & PC", count: "31 mẫu", icon: "monitor" },
  { name: "Phụ kiện cao cấp", count: "120+ mẫu", icon: "devices" },
];

export const products = [
  {
    id: "iphone",
    name: "iPhone 15 Pro Max 256GB Titan Tự nhiên",
    brand: "Apple",
    category: "Điện thoại",
    price: "29.990.000₫",
    oldPrice: "34.990.000₫",
    badge: "-14%",
    specs: ["A17 Pro", "8GB", "256GB", "5G"],
    colors: ["#9e978e", "#3e4249", "#e5e3dc", "#27262a"],
    colorName: "Titan tự nhiên",
    image: "/storefront/iphone.png",
  },
  {
    id: "macbook",
    name: "MacBook Pro 14 M3 Pro 18GB/512GB Space Black",
    brand: "Apple",
    category: "Laptop & Mac",
    price: "49.990.000₫",
    status: "Sẵn hàng",
    badge: "M3 Pro mới",
    specs: ["M3 Pro 11-core", "18GB", "512GB SSD", "Liquid Retina XDR 120Hz"],
    colors: ["#1e1e20", "#e3e4e6"],
    colorName: "Space Black",
    image: "/storefront/macbook.png",
  },
  {
    id: "galaxy",
    name: "Samsung Galaxy S24 Ultra 5G 512GB Titan Xám",
    brand: "Samsung",
    category: "Điện thoại",
    price: "31.490.000₫",
    oldPrice: "37.490.000₫",
    badge: "-16%",
    specs: ["Snapdragon 8 Gen 3", "12GB", "512GB", "S-Pen"],
    colors: ["#646468", "#232324", "#564966", "#e5dfcc"],
    colorName: "Galaxy AI",
    image: "/storefront/galaxy.png",
  },
  {
    id: "ipad",
    name: "iPad Air M2 11 inch 128GB Wifi Starlight",
    brand: "Apple",
    category: "iPad & Tablet",
    price: "16.990.000₫",
    status: "Còn hàng",
    badge: "Thế hệ mới",
    specs: ["Chip M2", "8GB", "128GB", "Hỗ trợ Apple Pencil Pro"],
    colors: ["#e5dfd5", "#525255", "#d6e0e7", "#ded6df"],
    colorName: "Starlight",
    image: "/storefront/ipad.png",
  },
];

export const heroSlides = [
  {
    productId: "iphone",
    badge: "SẢN PHẨM NỔI BẬT",
    eyebrow: "| Flagship 2024",
    title: "iPhone 15 Pro Max",
    subtitle: "Sức mạnh bứt phá. Thiết kế tương lai.",
    description:
      "Khung viền Titanium chuẩn hàng không vũ trụ siêu nhẹ và bền bỉ. Chip vi xử lý A17 Pro đưa trải nghiệm gaming và đồ họa di động lên chuẩn điện ảnh.",
    price: "29.990.000₫",
    oldPrice: "34.990.000₫",
    discount: "-14%",
    image: "/storefront/iphone-hero.png",
    feature: "Apple A17 Pro (3nm)",
  },
  {
    productId: "macbook",
    badge: "HIỆU NĂNG ĐỈNH CAO",
    eyebrow: "| MacBook Pro M3 Pro",
    title: "MacBook Pro 14",
    subtitle: "Sức mạnh chuyên nghiệp. Tự do sáng tạo.",
    description:
      "Chip M3 Pro mạnh mẽ cho các luồng công việc chuyên sâu, trong thiết kế nhôm nguyên khối bền bỉ và màn hình Liquid Retina XDR rực rỡ.",
    price: "49.990.000₫",
    image: "/storefront/macbook.png",
    feature: "Apple M3 Pro",
  },
  {
    productId: "galaxy",
    badge: "GALAXY AI",
    eyebrow: "| Flagship Samsung",
    title: "Galaxy S24 Ultra",
    subtitle: "Trí tuệ vượt trội. Tầm nhìn không giới hạn.",
    description:
      "Galaxy AI mở ra cách sáng tạo và kết nối mới. Sở hữu camera 200MP, S Pen tích hợp cùng hiệu năng Snapdragon 8 Gen 3.",
    price: "31.490.000₫",
    oldPrice: "37.490.000₫",
    discount: "-16%",
    image: "/storefront/galaxy.png",
    feature: "Snapdragon 8 Gen 3",
  },
];

export const brands = ["Apple", "Samsung", "ASUS ROG", "DELL", "SONY", "Marshall"];

export const discoveryPrompts = [
  "Tìm laptop đồ hoạ dưới 30 triệu",
  "Xem iPhone pin trâu chụp đẹp",
  "Xem iPad Air M2 11 inch",
];
