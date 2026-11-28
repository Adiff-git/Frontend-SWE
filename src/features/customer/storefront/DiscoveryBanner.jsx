import { IconArrowRight, IconSparkles } from "@tabler/icons-react";
import "./DiscoveryBanner.css";

export default function DiscoveryBanner({ discoveryPrompts, onSelectPrompt }) {
  return (
    <section className="discovery" data-node-id="3:9539" aria-labelledby="discovery-title">
      <div className="discovery__intro">
        <span className="discovery__badge"><IconSparkles size={15} fill="currentColor" /> KHÁM PHÁ SẢN PHẨM</span>
        <h2 id="discovery-title">Khám phá nhanh sản phẩm phù hợp với nhu cầu mua hàng của bạn</h2>
      </div>
      <div className="discovery__prompts">
        <p>Khám phá nhanh theo nhu cầu mua hàng:</p>
        {discoveryPrompts.map((prompt) => (
          <button key={prompt} className="discovery__prompt" onClick={() => onSelectPrompt(prompt)}>
            <IconSparkles size={15} /> <span>{prompt}</span><IconArrowRight className="discovery__arrow" size={15} />
          </button>
        ))}
      </div>
    </section>
  );
}
