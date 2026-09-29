/* Reusable labelled range row: name · slider · value (+ optional trailing).
   Replaces the five near-identical slider blocks in the original markup. */
export default function Slider({ name, min, max, step = 1, value, display, onChange, trailing, style }) {
  return (
    <div className="slider-row" style={style}>
      <span className="slider-name">{name}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider-val">{display}</span>
      {trailing}
    </div>
  )
}
