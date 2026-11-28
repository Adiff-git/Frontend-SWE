import "./BrandPartners.css";

const partnerTypes = ["Authorised Reseller", "Flagship Partner", "Gaming Official", "Pro Partner", "Audio & Cinema", "Premium Sound"];

export default function BrandPartners({brands}) {
  return (
    <section className="partners" data-node-id="3:9581" aria-label="Đối tác thương hiệu">
      <p className="partners__heading">ĐỐI TÁC THƯƠNG HIỆU HÀNG ĐẦU</p>
      <div className="partners__list">
        {brands.map((brand, index) => (
          <div className="partner" key={brand}><strong>{brand}</strong><span>{partnerTypes[index]}</span></div>
        ))}
      </div>
    </section>
  );
}
