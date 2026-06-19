// src/components/Puck.jsx
// The dealer puck — a pure presentational, 3D-styled coin that reflects the
// point state. White "ON" face vs. black "OFF" face on a flipping coin. It is
// NOT interactive (a real puck is dealer-controlled and the point resolves
// automatically here). Positioning and the glide across the felt are handled by
// Table.jsx; this component only renders the coin and flips between faces.

export default function Puck({ on }) {
  return (
    <div
      className={`puck ${on ? "on" : "off"}`}
      role="img"
      aria-label={on ? "point on" : "puck off"}
    >
      <div className="puck-face front">ON</div>
      <div className="puck-face back">OFF</div>
    </div>
  );
}
