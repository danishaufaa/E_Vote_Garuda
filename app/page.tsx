'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [troops, setTroops] = useState<any[]>([]);
  const [nama, setNama] = useState('');
  const [selectedTroop, setSelectedTroop] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Ambil data awal & aktifkan fitur Real-time
  useEffect(() => {
    const fetchAndListen = async () => {
      // Mengambil data nama pasukan dari tabel 'troops' di Supabase
      const { data } = await supabase.from('troops').select('*').order('id');
      if (data) setTroops(data);

      // Subscribe ke perubahan tabel 'troops' di Supabase agar vote update live
      supabase
        .channel('realtime-votes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'troops' }, 
        (payload) => {
          setTroops((current) => 
            current.map(t => t.id === payload.new.id ? payload.new : t)
          );
        })
        .subscribe();
    };

    fetchAndListen();
  }, []);

  // 2. Fungsi untuk proses Bayar & Vote (Mengarahkan ke Midtrans)
  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_voter: nama, troop_id: parseInt(selectedTroop) }),
      });

      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url; // Lempar ke halaman QRIS Midtrans
      } else {
        throw new Error('Gagal mendapatkan URL pembayaran');
      }
    } catch (error) {
      console.error(error);
      alert('Gagal memproses pembayaran. Silakan coba lagi ya!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900">E-Vote Polban Garuda</h1>
          <p className="text-slate-600 mt-2 font-medium">Dukung pasukan favoritmu melalui QRIS otomatis</p>
        </header>

        <div className="grid md:grid-cols-[1fr,1.5fr] gap-8 items-start">
          {/* SISI KIRI: Form Input (Diposisikan di kiri agar sesuai alur baca) */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            {/* Koreksi Warna: Judul kini warna hitam pekat (slate-950) */}
            <h2 className="text-2xl font-bold mb-6 text-slate-950">Kirim Dukungan</h2>
            <form onSubmit={handleVote} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Nama Lengkap</label>
                {/* Koreksi Warna: Input text kini warna hitam (text-slate-900) */}
                <input 
                  type="text" 
                  required 
                  placeholder="Masukkan namamu..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder:text-slate-400"
                  value={nama} 
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Pilih Pasukan</label>
                {/* Menambahkan Pilihan Pasukan: Dropdown mengambil data live dari Supabase */}
                <select 
                  required 
                  className="w-full p-3.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  value={selectedTroop} 
                  onChange={(e) => setSelectedTroop(e.target.value)}
                >
                  <option value="" className="text-slate-500">-- Pilih Salah Satu --</option>
                  {troops.map((t) => (
                    <option key={t.id} value={t.id} className="text-slate-900">
                      {t.nama_pasukan}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-lg shadow-blue-100 shadow-lg"
              >
                {isLoading ? 'Menyiapkan QRIS...' : 'Vote Sekarang (Rp 1.000)'}
              </button>
            </form>
          </div>

          {/* SISI KANAN: Leaderboard Live */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            {/* Koreksi Warna: Judul kini warna hitam pekat (slate-950) */}
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2.5 text-slate-950">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
              </span>
              Hasil Sementara (Live)
            </h2>
            
            {/* Menampilkan Daftar Pasukan: Loop data troops untuk leaderboard */}
            <div className="space-y-6">
              {troops.length === 0 ? (
                <p className="text-center text-slate-500 py-10">Memuat data pasukan...</p>
              ) : (
                troops.map((t) => (
                  <div key={t.id} className="relative pt-1 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex mb-2.5 items-center justify-between gap-4">
                      {/* Nama Pasukan (Warna Hitam) */}
                      <span className="text-lg font-semibold inline-block text-slate-900 truncate">
                        {t.nama_pasukan}
                      </span>
                      {/* Jumlah Vote (Warna Biru) */}
                      <span className="text-lg font-bold inline-block text-blue-600 whitespace-nowrap">
                        {t.jumlah_vote.toLocaleString('id-ID')} Vote
                      </span>
                    </div>
                    {/* Progress Bar Visual */}
                    <div className="overflow-hidden h-3 mb-1 text-xs flex rounded-full bg-slate-100 border border-slate-200">
                      <div 
                        // Kalkulasi lebar bar (asumsi maks 200 vote untuk visual, sesuaikan jika perlu)
                        style={{ width: `${Math.min((t.jumlah_vote / 200) * 100, 100)}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500 rounded-full"
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <footer className="text-center mt-16 text-slate-400 text-sm">
          Powered by Next.js & Supabase | Real-time E-Voting System
        </footer>
      </div>
    </main>
  );
}