import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import SlotMachine from "../components/SlotMachine";
import {
  unlockAudio,
  startSpinSound,
  winSound,
  tickSound,
  errorSound,
} from "../lib/audio";

export default function UserHome() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [busyClear, setBusyClear] = useState(false);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);

  const SPIN_COST = 1;
  const title = "SHINRA";
  const subtitle = "COMEBACK";

  const showToast = (msg, type = "info", ms = 2200) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), ms);
  };

  const load = async () => {
    try {
      setLoading(true);
      const list = await api.get("/items");
      setItems(list.data.items || []);

      const me = await api.get("/auth/me");
      if (me.data.user) {
        localStorage.setItem("user", JSON.stringify(me.data.user));
        setUser(me.data.user);
      }

      const h = await api.get("/items/history");
      setHistory(h.data.spins || []);
    } catch (e) {
      showToast(
        e.response?.data?.error || "โหลดข้อมูลไม่สำเร็จ",
        "error",
        3000
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const spin = async () => {
    await unlockAudio(); // ปลดล็อก audio (ครั้งแรกพอ)

    let tick; // ใช้เคลียร์ interval เสียงติ๊ก
    let step = 0;

    try {
      if ((user?.points ?? 0) < SPIN_COST) {
        errorSound(); // แต้มไม่พอ → ติ้ง error
        showToast("แต้มไม่พอ กรุณาเติมแต้มก่อน", "error");
        return;
      }

      startSpinSound(); // เริ่มหมุน → whoosh สั้น
      setSpinning(true);
      setWinner(null);

      // ออปชัน: ให้มีเสียงติ๊กๆ ระหว่างรอผล (ทุก 120ms)
      tick = setInterval(() => {
        tickSound(step++);
      }, 120);

      const { data } = await api.post("/spin");

      setTimeout(() => {
        if (tick) clearInterval(tick);
        setWinner(data.prize.id);
        winSound(); // ประกาศรางวัล → arpeggio
        setUser((u) => ({ ...u, points: data.points }));
        showToast(`คุณได้: ${data.prize.name}`, "success");
        load();
        setSpinning(false);
      }, 4000); // คุณตั้งไว้ 4 วินาทีอยู่แล้ว
    } catch (e) {
      if (tick) clearInterval(tick);
      errorSound(); // ผิดพลาด → เสียง error
      showToast(e.response?.data?.error || "Spin failed", "error", 3200);
      setSpinning(false);
    }
  };

  const logout = () => {
    setBusy(true);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setTimeout(() => {
      setBusy(false);
      nav("/login");
    }, 150);
  };

  // ✅ ฟังก์ชันล้างประวัติ (ยืนยันก่อน)
  const clearHistory = async () => {
    if (!history.length) return;
    const ok = window.confirm("ยืนยันล้างประวัติการสุ่มทั้งหมดของคุณ?");
    if (!ok) return;

    try {
      setBusyClear(true);
      await api.delete("/items/history");
      setHistory([]);
      showToast("ล้างประวัติแล้ว", "success");
    } catch (e) {
      showToast(e.response?.data?.error || "ล้างประวัติไม่สำเร็จ", "error");
    } finally {
      setBusyClear(false);
    }
  };

  const canSpin =
    !spinning && (user?.points ?? 0) >= SPIN_COST && items.length > 0;

  return (
    <div className="min-h-screen text-white">
      {/* NAVBAR */}
      <nav className="stw-navbar fixed top-0 w-full z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-extrabold stw-logo">⭐ ShinRa ⭐</div>
            <ul className="hidden md:flex gap-6 text-sm text-white/90">
              <li
                onClick={() => nav("/home")}
                className="hover:text-[#ffa500] cursor-pointer"
              >
                หน้าแรก
              </li>
              <li className="hover:text-[#ffa500] cursor-pointer">เร็วๆนี้</li>
              <li className="hover:text-[#ffa500] cursor-pointer">เร็วๆนี้</li>
              <li className="hover:text-[#ffa500] cursor-pointer">เร็วๆนี้</li>
              <li className="hover:text-[#ffa500] cursor-pointer">เร็วๆนี้</li>
              <li className="hover:text-[#ffa500] cursor-pointer">เร็วๆนี้</li>
            </ul>
          </div>

          {/* ====== RIGHT SIDE: POINT + USERNAME + LOGOUT ====== */}
          <div className="flex items-center gap-3">
            {/* POINT badge */}
            <div className="stw-points px-3 py-1 rounded-full font-semibold text-black">
              POINT: {user?.points ?? 0}
            </div>

            {/* USER chip */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20"
              title={user?.username || ""}
            >
              {/* avatar ตัวอักษรแรก */}
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-300 to-orange-600 flex items-center justify-center text-black font-bold">
                {(user?.username?.[0] || "?").toUpperCase()}
              </div>
              <span className="max-w-[160px] truncate">
                {user?.username || "-"}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              disabled={busy}
              className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto px-4" style={{ marginTop: 90 }}>
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-[#ffa500] to-[#ff6b35] bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-sm tracking-widest opacity-90 mb-3">{subtitle}</p>
          <div
            className="inline-block border-2 border-[#ffa500] rounded-full px-6 py-2 font-semibold"
            style={{ background: "rgba(255,165,0,.2)" }}
          >
            {/* ใช้ครั้งละ {SPIN_COST} Point */}
            เรียนเชิญผีพนันทุกท่าน
          </div>
        </div>

        {/* SLOT GRID */}
        <div className="my-8">
          <SlotMachine
            items={items}
            winnerId={winner}
            spinning={spinning}
            onSpin={spin}
            gridCols={{ base: 5, md: 5, sm: 3, xs: 2 }} /* ควบคุมคอลัมน์ */
            loading={loading}
          />
        </div>

        {/* Controls */}
        <div className="text-center my-8">
          <div className="inline-block bg-white/10 rounded-full px-6 py-2 font-semibold mb-4">
            Point คงเหลือ: <span>{user?.points ?? 0}</span> Point
          </div>
          <div className="mt-3">
            <button
              className="stw-start px-10 py-3 text-lg"
              disabled={!canSpin}
              onClick={spin}
            >
              {spinning ? "กำลังหมุน..." : "START"}
            </button>
          </div>
        </div>

        {/* History */}
        <section className="rounded-2xl border border-white/10 bg-black/30 p-5 mb-14">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">ประวัติการสุ่มล่าสุด</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                disabled={loading}
              >
                โหลดใหม่
              </button>
              <button
                onClick={clearHistory}
                className="text-xs px-3 py-1 rounded bg-red-500/80 hover:bg-red-500 disabled:opacity-50"
                disabled={busyClear || loading || history.length === 0}
                title={
                  history.length === 0
                    ? "ยังไม่มีประวัติ"
                    : "ล้างประวัติทั้งหมด"
                }
              >
                ล้างประวัติ
              </button>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-white/10 animate-pulse"
                />
              ))}
            </div>
          ) : history.length ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-black/40 border border-gray-700"
                >
                  <div className="text-xs text-gray-400">
                    {new Date(h.createdAt).toLocaleString()}
                  </div>
                  <div className="font-semibold truncate">{h.item.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-6">
              ยังไม่มีประวัติการสุ่ม
            </div>
          )}
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-white text-black"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
