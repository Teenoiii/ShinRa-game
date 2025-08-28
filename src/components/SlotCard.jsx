import React from "react";

export default function SlotCard({ item, highlight }) {
  const rarityClass = `rarity-${item.rarity?.toLowerCase?.() || "blue"}`;
  return (
    <div
      className={`gold-frame rounded-xl p-2 ${
        highlight ? "ring-4 ring-gold" : ""
      }`}
    >
      <div className={`rounded-xl p-2 ${rarityClass}`}>
        <img
          src={item.imageUrl}
          alt={item.name}
          className="rounded-lg w-28 h-28 object-cover"
        />
      </div>
      <div className="text-center mt-2 text-sm font-semibold">{item.name}</div>
    </div>
  );
}
