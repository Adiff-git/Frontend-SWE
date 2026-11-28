import "./FilterCheckGroup.css";

export default function FilterCheckGroup({ title, filterKey, items, selected, onChange }) {
  function toggle(value) {
    const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
    onChange(filterKey, next);
  }

  return (
    <fieldset className="category-check-group">
      <legend>{title}</legend>
      <div className="category-check-group__options">
        {items.map((item) => (
          <label className="category-check-option" key={item.value}>
            <input type="checkbox" checked={selected.includes(item.value)} onChange={() => toggle(item.value)} />
            <span>{item.label}</span>
            {item.count !== undefined && <small>({item.count})</small>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
