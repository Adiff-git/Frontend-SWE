import "./FilterToggleGroup.css";

export default function FilterToggleGroup({ title, filterKey, items, selected, onChange, layout, values, selectedValue, icon }) {
  function toggle(value) {
    const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
    onChange(filterKey, next);
  }

  function selectValue(value) {
    onChange(filterKey, value);
  }

  return (
    <fieldset className={`category-toggle-group category-toggle-group--${layout}`}>
      <legend>{title}</legend>
      <div className="category-toggle-group__options">
        {items.map((item, index) => {
          const value = values ? values[index] : item;
          const active = values ? selectedValue === value : selected.includes(value);
          return (
            <button
              className={`category-toggle-group__option${active ? " category-toggle-group__option--active" : ""}`}
              key={item}
              onClick={() => values ? selectValue(value) : toggle(value)}
              aria-pressed={active}
              type="button"
            >
              {icon && <span className="category-toggle-group__icon">{icon}</span>}
              {item}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
