import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username || !password) return setErr("กรอกชื่อผู้ใช้และรหัสผ่านก่อน");
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      nav(data.user.role === "admin" ? "/admin" : "/home");
    } catch (e2) {
      setErr(e2?.response?.data?.error || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-slate-950 p-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-black/40 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-extrabold text-center mb-1">ShinRa</h1>
        <p className="text-center text-sm text-gray-400 mb-6">เข้าสู่ระบบ</p>

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
              placeholder="Username"
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-white/10"
              >
                {showPw ? "ซ่อน" : "แสดง"}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full py-3 bg-gold text-black font-bold rounded-lg hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/60 border-t-transparent" />
            )}
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="mt-6 text-sm text-center text-gray-300">
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="text-gold hover:underline">
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  );
}
