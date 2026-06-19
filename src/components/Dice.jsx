// src/components/Dice.jsx
import { useEffect, useState } from "react";
import { useCrapsStore } from "../store/useCrapsStore.js";

// pip positions on a 3x3 grid (cell indices 0..8)
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ face }) {
  const on = new Set(PIPS[face] || []);
  return (
    <div className="die" aria-label={`die showing ${face}`}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={`pip ${on.has(i) ? "" : "blank"}`} />
      ))}
    </div>
  );
}

export default function Dice() {
  const dice = useCrapsStore((s) => s.dice);
  const rolling = useCrapsStore((s) => s.rolling);
  const [shown, setShown] = useState(dice);

  // While rolling, cycle random faces locally for a tumble feel; snap to the
  // committed result the moment the store stops rolling.
  useEffect(() => {
    if (!rolling) { setShown(dice); return; }
    const id = setInterval(() => {
      setShown([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
    }, 80);
    return () => clearInterval(id);
  }, [rolling, dice]);

  return (
    <div className="flex items-center gap-3">
      <div className={rolling ? "rolling" : ""}><Die face={shown[0]} /></div>
      <div className={rolling ? "rolling" : ""}><Die face={shown[1]} /></div>
    </div>
  );
}
