import React from "react";

function rarityClass(raw) {
  const key = String(raw || "common")
    .toLowerCase()
    .trim();
  if (["gold", "legendary"].includes(key)) return "stw-rarity-legendary";
  if (["purple", "epic"].includes(key)) return "stw-rarity-epic";
  if (["blue", "rare"].includes(key)) return "stw-rarity-rare";
  if (["green"].includes(key)) return "stw-rarity-green";
  if (["red"].includes(key)) return "stw-rarity-red";
  if (["bronze"].includes(key)) return "stw-rarity-bronze";
  if (["silver"].includes(key)) return "stw-rarity-silver";
  return "stw-rarity-common";
}

/**
 * props:
 * - items: [{id,name,imageUrl,rarity,weight,stock}]
 * - winnerId
 * - spinning
 * - onSpin()
 * - gridCols: { base:5, md:5, sm:3, xs:2 }
 * - loading
 */
export default function SlotMachine({
  items = [],
  winnerId,
  spinning,
  onSpin,
  gridCols = { base: 5, md: 5, sm: 3, xs: 2 },
  loading = false,
}) {
  const grid = `grid-cols-${gridCols.base} md:grid-cols-${gridCols.md} sm:grid-cols-${gridCols.sm} xs:grid-cols-${gridCols.xs}`;

  if (loading) {
    return (
      <div className={`grid ${grid} gap-5 max-w-4xl mx-auto`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="stw-wheel-item animate-pulse h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((it) => (
          <div
            key={it.id}
            className={[
              "stw-wheel-item text-center flex flex-col items-center justify-center p-4",
              rarityClass(it.rarity),
              spinning ? "stw-spinning" : "",
              winnerId === it.id ? "stw-selected" : "",
            ].join(" ")}
          >
            <span className="stw-star">⭐</span>
            <div className="stw-mult">
              {typeof it.stock === "number" ? `x${it.stock}` : "x1"}
            </div>
            <img
              src={it.imageUrl}
              alt={it.name}
              className="w-12 h-12 rounded-lg object-cover mb-2"
            />
            <div className="uppercase text-xs font-semibold tracking-wide">
              {it.name}
            </div>
          </div>
        ))}
      </div>

      {/* (ถ้าต้องการกดที่ตัวเครื่องเพื่อ spin ก็ปล่อย onClick ตรงนี้ได้) */}
      {/* <div className="text-center mt-6">
        <button className="stw-start px-10 py-3" onClick={onSpin}>
          {spinning ? "กำลังหมุน..." : "START"}
        </button>
      </div> */}
    </div>
  );
}
