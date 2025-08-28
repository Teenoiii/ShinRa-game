import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import Swal from "sweetalert2";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [items, setItems] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [users, setUsers] = useState([]);
  const [grants, setGrants] = useState([]);
  const nav = useNavigate();
  const [spins, setSpins] = useState({
    spins: [],
    total: 0,
    page: 1,
    size: 50,
  });
  const [rates, setRates] = useState({ totalWeight: 0, rates: [] });
  const [loading, setLoading] = useState(true);
  const userPointsMap = useMemo(() => {
    const m = new Map();
    users.forEach((u) => m.set(u.id, u.points));
    return m;
  }, [users]);

  const load = async (page = 1) => {
    setLoading(true);
    const [{ data: A }, { data: B }, { data: C }, { data: D }, { data: E }] =
      await Promise.all([
        api.get("/admin/config"),
        api.get("/admin/items"),
        api.get("/admin/users"),
        api.get("/admin/grants"),
        api.get("/admin/rates"),
      ]);
    setCfg(A.config);
    setItems(B.items);
    setUsers(C.users);
    setGrants(D.grants);
    setRates(E);
    await loadSpins(page);
    setLoading(false);
  };

  const loadSpins = async (page = 1) => {
    const { data } = await api.get(`/admin/spins?page=${page}&size=50`);
    setSpins(data);
  };

  useEffect(() => {
    load();
  }, []);

  // ====== CONFIG ======
  const saveConfig = async () => {
    const { value: val } = await Swal.fire({
      title: "ตั้งค่า แต้มต่อการหมุน",
      input: "number",
      inputValue: cfg?.spinCost ?? 50,
      inputLabel: "แต้มต่อการหมุน 1 ครั้ง",
      confirmButtonText: "บันทึก",
      showCancelButton: true,
      customClass: { popup: "rounded-2xl" },
    });
    if (val === undefined) return;
    const { data } = await api.post("/admin/config", {
      ...cfg,
      spinCost: Number(val) || 0,
    });
    setCfg(data.config);
    Swal.fire({
      icon: "success",
      title: "บันทึกแล้ว",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    nav("/login");
  };
  // ====== ITEM CRUD (อัปโหลดไฟล์หรือใส่ลิงก์ + พรีวิว + validate) ======
  const openItemForm = async (editing) => {
    // ---- map ค่าที่เคยใช้ให้ตรงกับ CSS ปัจจุบัน ----
    const normalizeRarity = (val = "purple") => {
      const k = String(val).toLowerCase().trim();
      if (k === "legendary") return "gold";
      if (k === "epic") return "purple";
      if (k === "rare") return "blue";
      // ที่เหลือใช้ตามเดิม
      return [
        "gold",
        "purple",
        "blue",
        "green",
        "red",
        "bronze",
        "silver",
        "common",
      ].includes(k)
        ? k
        : "purple";
    };

    const defaults = {
      name: editing?.name || "",
      imageUrl: editing?.imageUrl || "",
      rarity: normalizeRarity(editing?.rarity || "purple"),
      weight: editing?.weight ?? 10,
      stock: editing?.stock ?? "",
      isEnabled: editing?.isEnabled ?? true,
    };

    const rarities = [
      "gold",
      "purple",
      "blue",
      "green",
      "red",
      "bronze",
      "silver",
      "common",
    ];
    const defRarity = defaults.rarity; // หลัง normalize แล้ว

    const { value: form } = await Swal.fire({
      title: editing ? "แก้ไขไอเท็ม" : "เพิ่มไอเท็ม",
      html: `
      <div style="text-align:left">
        <label class="swal2-label" for="f-name" style="display:block;margin:4px 0">ชื่อไอเท็ม</label>
        <input id="f-name" class="swal2-input" placeholder="เช่น DIAMOND x80" value="${
          defaults.name
        }">

        <label class="swal2-label" style="display:block;margin:4px 0">อัปโหลดรูป (หรือวางลิงก์ด้านล่าง)</label>
        <input id="f-file" type="file" accept="image/*" class="swal2-file" style="width:100%">

        <label class="swal2-label" for="f-img" style="display:block;margin:4px 0">ลิงก์รูป (ใช้ได้ทั้งสองวิธี)</label>
        <input id="f-img" class="swal2-input" placeholder="https://..." value="${
          defaults.imageUrl
        }">

        <div style="margin:6px 0 12px">
          <img id="f-preview" src="${
            defaults.imageUrl || ""
          }" alt="" style="max-width:100%;max-height:180px;border-radius:10px;display:${
        defaults.imageUrl ? "block" : "none"
      };border:1px solid #444"/>
        </div>

        <label class="swal2-label" for="f-rarity" style="display:block;margin:4px 0">Rarity</label>
        <select id="f-rarity" class="swal2-input">
          ${rarities
            .map((r) => {
              const sel = r === defRarity ? " selected" : "";
              const label = {
                gold: "gold (legendary)",
                purple: "purple (epic)",
                blue: "blue (rare)",
                green: "green",
                red: "red",
                bronze: "bronze",
                silver: "silver",
                common: "common",
              }[r];
              return `<option value="${r}"${sel}>${label}</option>`;
            })
            .join("")}
        </select>

        <label class="swal2-label" for="f-weight" style="display:block;margin:4px 0">Weight (ยิ่งมากยิ่งออกบ่อย)</label>
        <input id="f-weight" type="number" class="swal2-input" placeholder="เช่น 10" value="${
          defaults.weight
        }">

        <label class="swal2-label" for="f-stock" style="display:block;margin:4px 0">Stock (เว้นว่าง = ไม่จำกัด)</label>
        <input id="f-stock" type="number" class="swal2-input" placeholder="" value="${
          defaults.stock === null ? "" : defaults.stock
        }">
      </div>
    `,
      didOpen: () => {
        const fileInput = document.getElementById("f-file");
        const urlInput = document.getElementById("f-img");
        const preview = document.getElementById("f-preview");
        const sel = document.getElementById("f-rarity");

        // บังคับค่าเริ่มต้น (กัน browser บางตัวไม่ set selected)
        if (sel) sel.value = defRarity;

        // พรีวิวเมื่อพิมพ์ URL
        urlInput.addEventListener("input", () => {
          const v = urlInput.value.trim();
          preview.style.display = v ? "block" : "none";
          preview.src = v || "";
        });

        // อัปโหลดไฟล์ -> ได้ URL กลับ -> เติม + พรีวิว
        fileInput.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            Swal.showLoading();
            const fd = new FormData();
            fd.append("image", file);
            const res = await api.post("/admin/upload", fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            urlInput.value = res.data.url;
            preview.src = res.data.url;
            preview.style.display = "block";
            Swal.hideLoading();

            // แสดงข้อความสถานะสั้น ๆ
            let msg = document.getElementById("upload-msg");
            if (!msg) {
              msg = document.createElement("div");
              msg.id = "upload-msg";
              msg.style.marginTop = "6px";
              msg.style.color = "lime";
              fileInput.parentNode.appendChild(msg);
            }
            msg.textContent = "✅ อัปโหลดรูปแล้ว";
          } catch (err) {
            Swal.hideLoading();
            Swal.showValidationMessage(
              "อัปโหลดไม่สำเร็จ: " + (err.response?.data?.error || "")
            );
            fileInput.value = "";
          }
        };
      },
      preConfirm: () => {
        const v = (id) => document.getElementById(id).value;
        const payload = {
          name: v("f-name").trim(),
          imageUrl: v("f-img").trim(),
          rarity: normalizeRarity(v("f-rarity")), // 👈 เก็บแบบ lower-case ตรงกับ CSS
          weight: Number(v("f-weight") || 0),
          stock: v("f-stock") === "" ? "" : Number(v("f-stock")),
        };

        // Validate
        if (!payload.name)
          return Swal.showValidationMessage("กรุณากรอกชื่อไอเท็ม");
        if (!payload.imageUrl)
          return Swal.showValidationMessage("กรุณาอัปโหลดรูปหรือใส่ลิงก์รูป");
        if (isNaN(payload.weight) || payload.weight < 0)
          return Swal.showValidationMessage("Weight ต้องเป็นตัวเลข ≥ 0");
        if (payload.stock !== "" && (isNaN(payload.stock) || payload.stock < 0))
          return Swal.showValidationMessage(
            "Stock ต้องเป็นตัวเลข ≥ 0 หรือเว้นว่าง"
          );

        return payload;
      },
      showCancelButton: true,
      confirmButtonText: editing ? "บันทึก" : "เพิ่ม",
      customClass: { popup: "rounded-2xl" },
    });

    if (!form) return;

    // ส่งไปสร้าง/แก้ไข
    const body = { ...form, stock: form.stock === "" ? null : form.stock };
    if (editing) {
      await api.put(`/admin/items/${editing.id}`, body);
    } else {
      await api.post(`/admin/items`, body);
    }
    await load();
    Swal.fire({
      icon: "success",
      title: "สำเร็จ",
      timer: 900,
      showConfirmButton: false,
    });
  };

  const toggleEnable = async (it) => {
    await api.put(`/admin/items/${it.id}`, { isEnabled: !it.isEnabled });
    load();
  };

  const removeItem = async (it) => {
    const ok = await Swal.fire({
      title: `ลบ "${it.name}" ?`,
      text: "ยืนยันการลบรายการนี้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
    });
    if (!ok.isConfirmed) return;
    await api.delete(`/admin/items/${it.id}`);
    load();
  };

  // ====== RATES (client-side view) ======
  const totalWeight = useMemo(
    () =>
      rates.totalWeight ||
      items.reduce((s, i) => s + (Number(i.weight) || 0), 0),
    [rates, items]
  );

  // ====== GRANTS ======
  // ลบทิ้งโดยการย้อนรายการ (ทำเป็นโพสต์จำนวนติดลบเท่ารายการเดิม)
  const revertGrant = async (g) => {
    const ok = await Swal.fire({
      title: `ย้อนรายการของ ${g.user.username}?`,
      text: `จะทำการ -${g.amount} คะแนน (คืนกลับ)`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
    });
    if (!ok.isConfirmed) return;

    await api.post("/admin/grant-points", {
      userId: g.user.id,
      amount: -Number(g.amount),
      // reason: `ยกเลิกรายการ grant#${g.id}`
    });
    await load();
    Swal.fire({
      icon: "success",
      title: "ย้อนรายการแล้ว",
      timer: 900,
      showConfirmButton: false,
    });
  };
  // ตั้งยอดคงเหลือของผู้ใช้ให้เป็นจำนวนที่กำหนด (คำนวณส่วนต่างจากแต้มปัจจุบัน)
  const setBalance = async (g) => {
    try {
      // แต้มปัจจุบันของผู้ใช้ (จากรายการ users ที่โหลดมา)
      const u = users.find((x) => x.id === g.user.id);
      const current = Number(u?.points || 0);

      const { value: target } = await Swal.fire({
        title: `ตั้งยอดคงเหลือของ ${g.user.username}`,
        input: "number",
        inputValue: current,
        inputLabel: "ยอดคงเหลือที่ต้องการ (Point)",
        confirmButtonText: "ตั้งยอด",
        showCancelButton: true,
      });
      if (target === undefined) return;

      const want = Number(target || 0);
      const delta = want - current; // ส่วนต่างที่ต้องเพิ่ม(+)/ลด(-)

      if (!delta) {
        return Swal.fire({ icon: "info", title: "ยอดคงเหลือเท่าเดิม" });
      }

      await api.post("/admin/grant-points", {
        userId: g.user.id,
        amount: delta,
        // reason: `Set balance to ${want} (was ${current})` // ถ้า backend รองรับเหตุผล
      });

      await load(); // รีโหลดข้อมูลให้คอลัมน์ "คงเหลือ(ตอนนี้)" อัปเดต
      Swal.fire({
        icon: "success",
        title: `ตั้งยอดเป็น ${want} แล้ว`,
        timer: 1000,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "ตั้งยอดไม่สำเร็จ",
        text: e?.response?.data?.error || e.message,
      });
    }
  };

  // ====== GRANT POINTS ======
  const grantPoints = async () => {
    const options = users.map((u) => ({
      value: u.id,
      label: `${u.username} (id:${u.id}, ${u.points}p)`,
    }));
    let chosen = null,
      amount = 0;

    await Swal.fire({
      title: "เสกเครดิตให้ผู้ใช้",
      html: `<div id="react-select-host"></div>`,
      didOpen: () => {
        const host = document.getElementById("react-select-host");
        // ฝัง react-select ลงใน modal
        const root = document.createElement("div");
        host.appendChild(root);
        // สร้าง select ด้วยการแนบลง window เพื่อให้ใช้งานง่าย
        window.__setGrantSelect = (el) => {
          chosen = el?.value;
        };
        window.__setGrantAmount = (n) => {
          amount = Number(n || 0);
        };
        host.innerHTML = `
          <div style="margin:8px 0">
            <input id="grant-search" class="swal2-input" placeholder="พิมพ์ชื่อผู้ใช้เพื่อค้นหา...">
          </div>
          <input id="grant-amount" type="number" class="swal2-input" placeholder="จำนวนแต้ม (+/-)">
        `;
        // แทน react-select ด้วย input ค้นหาอย่างง่าย (ลดโค้ด)
        const search = document.getElementById("grant-search");
        const renderList = (q = "") => {
          const list = options
            .filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 50);
          let html = `<div style="max-height:200px;overflow:auto;border:1px solid #444;border-radius:8px;padding:6px">`;
          html += list
            .map(
              (o) =>
                `<div class="opt" data-id="${o.value}" style="padding:6px;border-radius:6px;cursor:pointer">${o.label}</div>`
            )
            .join("");
          html += `</div>`;
          host.insertAdjacentHTML("beforeend", html);
          host.querySelectorAll(".opt").forEach((el) => {
            el.onclick = () => {
              chosen = Number(el.dataset.id);
              host
                .querySelectorAll(".opt")
                .forEach((x) => (x.style.background = ""));
              el.style.background = "#333";
            };
          });
        };
        renderList();
        search.oninput = (e) => {
          host
            .querySelectorAll(".opt")
            .forEach((n) => n.parentElement.remove()); // clear list
          renderList(e.target.value);
        };
        document.getElementById("grant-amount").oninput = (e) =>
          window.__setGrantAmount(e.target.value);
      },
      preConfirm: () => {
        if (!chosen) return Swal.showValidationMessage("กรุณาเลือกผู้ใช้");
        if (!amount) return Swal.showValidationMessage("กรุณากรอกจำนวนแต้ม");
        return { userId: chosen, amount };
      },
      showCancelButton: true,
      confirmButtonText: "เสกเลย",
    }).then(async (ret) => {
      if (!ret.isConfirmed) return;
      const { userId, amount } = ret.value;
      await api.post("/admin/grant-points", { userId, amount });
      await Promise.all([
        load(),
        Swal.fire({
          icon: "success",
          title: "เสร็จแล้ว",
          timer: 1000,
          showConfirmButton: false,
        }),
      ]);
    });
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-black via-slate-900 to-darkbg text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={saveConfig}
              className="rounded bg-gold px-4 py-2 font-bold text-black"
            >
              แต้มต่อการหมุน : {cfg?.spinCost ?? 50}
            </button>
            <button
              onClick={() => openItemForm(null)}
              className="rounded bg-emerald-500 px-4 py-2 font-bold"
            >
              + เพิ่มไอเท็ม
            </button>
            <button
              onClick={grantPoints}
              className="rounded bg-sky-500 px-4 py-2 font-bold"
            >
              เสกเครดิต
            </button>
            <button
              onClick={logout}
              className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        {/* 1) จัดการกาชา */}
        <section>
          <h2 className="mb-2 text-xl font-semibold">รายการกาชา</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="rounded-xl border border-gray-700 bg-black/40 p-3"
              >
                <div className="flex gap-3">
                  <img
                    src={it.imageUrl}
                    alt={it.name}
                    className="h-20 w-20 rounded object-cover"
                  />
                  <div>
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-xs text-gray-400">
                      rarity: {it.rarity} • weight: {it.weight} • stock:{" "}
                      {it.stock ?? "∞"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openItemForm(it)}
                    className="rounded bg-gold px-3 py-1 text-black"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => toggleEnable(it)}
                    className="rounded bg-gray-700 px-3 py-1"
                  >
                    {it.isEnabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => removeItem(it)}
                    className="rounded bg-red-600 px-3 py-1"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2) แสดงเรท */}
        <section>
          <h2 className="mb-2 text-xl font-semibold">
            อัตราการออก (ตาม Weight)
          </h2>
          <div className="rounded-xl border border-gray-700 bg-black/40 p-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-300">
                <tr>
                  <th className="text-left p-2">ไอเท็ม</th>
                  <th className="text-right p-2">Weight</th>
                  <th className="text-right p-2">%</th>
                </tr>
              </thead>
              <tbody>
                {(rates.rates?.length
                  ? rates.rates
                  : items.map((it) => ({
                      id: it.id,
                      name: it.name,
                      weight: it.weight,
                      percent:
                        Math.round(
                          ((Number(it.weight) || 0) / (totalWeight || 1)) *
                            10000
                        ) / 100,
                    }))
                ).map((r) => (
                  <tr key={r.id} className="border-t border-white/10">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-right">{r.weight}</td>
                    <td className="p-2 text-right">{r.percent.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right text-xs text-gray-400 mt-2">
              Total weight: {totalWeight}
            </div>
          </div>
        </section>

        {/* 3) เสกเครดิต + ประวัติการเสก */}
        <section>
          <h2 className="mb-2 text-xl font-semibold">ประวัติการเสกเครดิต</h2>
          <div className="rounded-xl border border-gray-700 bg-black/40 p-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-300">
                <tr>
                  <th className="text-left p-2">เวลา</th>
                  <th className="text-left p-2">ผู้ใช้</th>
                  <th className="text-right p-2">จำนวน</th>
                  <th className="text-right p-2">คงเหลือ (ตอนนี้)</th>
                  <th className="text-left p-2">โดย</th>
                  <th className="text-left p-2">การกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {grants.map((g) => (
                  <tr key={g.id} className="border-t border-white/10">
                    <td className="p-2">
                      {new Date(g.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2">
                      {g.user.username} (id:{g.user.id})
                    </td>
                    <td className="p-2 text-right">{g.amount}</td>
                    <td className="p-2 text-right">
                      {userPointsMap.get(g.user.id) ?? "-"}{" "}
                    </td>
                    <td className="p-2">{g.admin.username}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBalance(g)}
                          className="px-2 py-1 text-xs rounded bg-sky-500"
                          title="ตั้งยอดคงเหลือ"
                        >
                          แก้ไขแต้ม
                        </button>
                        <button
                          onClick={() => revertGrant(g)}
                          className="px-2 py-1 text-xs rounded bg-red-600"
                          title="ลบ/ย้อนรายการ"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4) ประวัติการหมุนทั้งหมด */}
        <section>
          <h2 className="mb-2 text-xl font-semibold">ประวัติการหมุนทั้งหมด</h2>
          <div className="rounded-xl border border-gray-700 bg-black/40 p-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-300">
                <tr>
                  <th className="text-left p-2">เวลา</th>
                  <th className="text-left p-2">ผู้ใช้</th>
                  <th className="text-left p-2">ของที่ได้</th>
                  <th className="text-right p-2">หักแต้ม</th>
                </tr>
              </thead>
              <tbody>
                {spins.spins.map((s) => (
                  <tr key={s.id} className="border-t border-white/10">
                    <td className="p-2">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2">
                      {s.user.username} (id:{s.user.id})
                    </td>
                    <td className="p-2">{s.item.name}</td>
                    <td className="p-2 text-right">{s.spent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-end gap-2 mt-2 text-sm">
              <button
                disabled={spins.page <= 1}
                onClick={() => loadSpins(spins.page - 1)}
                className="px-2 py-1 bg-white/10 rounded disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              <span>หน้า {spins.page}</span>
              <button
                disabled={spins.page * spins.size >= spins.total}
                onClick={() => loadSpins(spins.page + 1)}
                className="px-2 py-1 bg-white/10 rounded disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </section>
      </div>

      {loading && (
        <div className="fixed inset-0 grid place-items-center bg-black/40">
          กำลังโหลด…
        </div>
      )}
    </div>
  );
}
