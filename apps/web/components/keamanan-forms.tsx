"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export function MfaBox() {
  const [factors, setFactors] = useState<{ id: string; status: string }[]>([]);
  const [qr, setQr] = useState("");
  const [factorId, setFactorId] = useState("");
  const [kode, setKode] = useState("");
  const [pesan, setPesan] = useState("");

  async function muat() {
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
  }

  useEffect(() => {
    void muat();
  }, []);

  async function mulai() {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error || !data) {
      setPesan("Gagal memulai: " + (error?.message ?? "unknown"));
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
  }

  async function verifikasi() {
    const supabase = supabaseBrowser();
    const ch = await supabase.auth.mfa.challenge({ factorId });
    if (ch.error) {
      setPesan("Gagal tantangan: " + ch.error.message);
      return;
    }
    const ver = await supabase.auth.mfa.verify({ factorId, challengeId: ch.data.id, code: kode });
    if (ver.error) {
      setPesan("Kode salah: " + ver.error.message);
      return;
    }
    setQr("");
    setKode("");
    setPesan("2FA aktif.");
    await muat();
  }

  async function lepas(id: string) {
    const supabase = supabaseBrowser();
    await supabase.auth.mfa.unenroll({ factorId: id });
    await muat();
  }

  return (
    <div className="mt-2">
      {factors.some((f) => f.status === "verified") ? (
        <p role="status" className="text-sm">2FA aktif di akun ini.</p>
      ) : (
        <p className="text-sm text-stone-600">Belum ada 2FA. Wajib sebelum mencairkan insentif.</p>
      )}
      <ul className="mt-2 space-y-1 text-sm">
        {factors.map((f) => (
          <li key={f.id} className="flex items-center gap-2">
            <span>TOTP · {f.status}</span>
            <button onClick={() => lepas(f.id)} className="min-h-[44px] rounded border px-3">
              Lepas
            </button>
          </li>
        ))}
      </ul>
      {!qr ? (
        <button onClick={mulai} className="mt-3 min-h-[44px] rounded-md bg-stone-900 px-4 text-sm text-white">
          Pasang 2FA
        </button>
      ) : (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Kode QR aplikasi authenticator" width={180} height={180} />
          <div className="mt-2 flex gap-2">
            <input
              aria-label="Kode 6 digit"
              inputMode="numeric"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              className="min-h-[44px] w-40 rounded-md border border-stone-300 px-3"
            />
            <button onClick={verifikasi} className="min-h-[44px] rounded-md bg-stone-900 px-4 text-sm text-white">
              Verifikasi
            </button>
          </div>
        </div>
      )}
      {pesan && (
        <p role="status" className="mt-2 text-sm">
          {pesan}
        </p>
      )}
    </div>
  );
}

export function RekeningForm() {
  const [form, setForm] = useState({ provider: "BCA", accountNumber: "", accountName: "" });
  const [pesan, setPesan] = useState("");

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!API) {
      setPesan("API backend belum dikonfigurasi.");
      return;
    }
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const res = await fetch(`${API}/payout-accounts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${data.session?.access_token ?? ""}`
      },
      body: JSON.stringify(form)
    });
    setPesan(res.ok ? "Tersimpan terenkripsi. Verifikasi ulang oleh admin sebelum dipakai payout." : `Gagal (${res.status}).`);
  }

  const field = "mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3";

  return (
    <form onSubmit={kirim} className="mt-2 space-y-3">
      <div>
        <label htmlFor="bank" className="block text-sm font-medium">Bank atau e-wallet</label>
        <input id="bank" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className={field} />
      </div>
      <div>
        <label htmlFor="norek" className="block text-sm font-medium">Nomor rekening</label>
        <input id="norek" inputMode="numeric" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className={field} />
      </div>
      <div>
        <label htmlFor="nama" className="block text-sm font-medium">Nama pemilik</label>
        <input id="nama" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} className={field} />
      </div>
      <button className="min-h-[44px] rounded-md bg-stone-900 px-4 text-sm text-white">
        Simpan rekening
      </button>
      {pesan && (
        <p role="status" className="text-sm">
          {pesan}
        </p>
      )}
    </form>
  );
}
