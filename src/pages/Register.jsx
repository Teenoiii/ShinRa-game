import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const passStrength = (p) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s; // 0..5
};

export default function Register() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [accept, setAccept] = useState(false);

  const strength = useMemo(() => passStrength(password), [password]);
  const strengthLabel = ["อ่อนมาก", "อ่อน", "พอใช้", "ดี", "แข็งแรง"][
    Math.max(0, strength - 1)
  ];

  const submit = async (e) => {
    e.preventDefault();
    // validate แบบชัดๆ ก่อนยิง
    if (!username.trim()) return setErr("กรอกชื่อผู้ใช้");
    if (username.length < 3) return setErr("ชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร");
    if (!password) return setErr("กรอกรหัสผ่าน");
    if (password.length < 8) return setErr("รหัสผ่านอย่างน้อย 8 ตัวอักษร");
    if (strength < 3)
      return setErr("ควรมี ตัวพิมพ์ใหญ่/เล็ก ตัวเลข และ/หรือสัญลักษณ์");
    if (confirm !== password) return setErr("ยืนยันรหัสผ่านไม่ตรงกัน");
    if (!accept) return setErr("กรุณายอมรับเงื่อนไขการใช้งาน");

    setErr("");
    setLoading(true);
    try {
      await api.post("/auth/register", { username, password });
      nav("/login");
    } catch (e2) {
      setErr(e2?.response?.data?.error || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-slate-950 p-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-black/40 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-extrabold text-center mb-1">สร้างบัญชี</h1>
        <p className="text-center text-sm text-gray-400 mb-6">
          กรอกข้อมูลให้ครบถ้วนเพื่อเริ่มใช้งาน
        </p>

        {err && (
          <div className="mb-3 text-red-300 text-sm bg-red-900/20 border border-red-700/40 p-2 rounded">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">ชื่อผู้ใช้</label>
            <input
              className="mt-1 w-full p-3 bg-black/40 rounded-lg border border-gray-700 focus:outline-none focus:border-gold"
              placeholder="ตั้งชื่อผู้ใช้ (≥ 3 ตัวอักษร)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">รหัสผ่าน</label>
            <div className="mt-1 relative">
              <input
                type={showPw ? "text" : "password"}
                className="w-full p-3 pr-12 bg-black/40 rounded-lg border border-gray-700 focus:outline-none focus:border-gold"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-white/10"
              >
                {showPw ? "ซ่อน" : "แสดง"}
              </button>
            </div>

            {/* ความแข็งแรงรหัสผ่าน */}
            <div className="mt-2">
              <div className="h-2 rounded bg-white/10 overflow-hidden">
                <div
                  className="h-2 transition-all"
                  style={{
                    width: `${(strength / 5) * 100}%`,
                    background:
                      strength >= 4
                        ? "#22c55e"
                        : strength >= 3
                        ? "#eab308"
                        : "#ef4444",
                  }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                ความแข็งแรง: {strengthLabel}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300">ยืนยันรหัสผ่าน</label>
            <div className="mt-1 relative">
              <input
                type={showCf ? "text" : "password"}
                className="w-full p-3 pr-12 bg-black/40 rounded-lg border border-gray-700 focus:outline-none focus:border-gold"
                placeholder="พิมพ์ซ้ำอีกครั้ง"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowCf((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-white/10"
              >
                {showCf ? "ซ่อน" : "แสดง"}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              className="accent-gold"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
            />
            ยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว
          </label>

          <button
            disabled={loading}
            className="w-full py-3 bg-gold text-black font-bold rounded-lg hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/60 border-t-transparent" />
            )}
            สมัครสมาชิก
          </button>
        </form>

        <div className="mt-6 text-sm text-center text-gray-300">
          มีบัญชีแล้ว?{" "}
          <Link to="/login" className="text-gold hover:underline">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
