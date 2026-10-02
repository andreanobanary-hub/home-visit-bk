'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Login from '@/components/Login';
import { Printer, Edit2, Trash2, RotateCcw, Image as ImageIcon, LogOut, User } from 'lucide-react';

interface HomeVisit {
  id?: string;
  tanggal: string;
  petugas: string;
  nama_siswa: string;
  kelas: string;
  alamat: string;
  orang_ditemui: string;
  masalah: string;
  hasil: string;
  tindak_lanjut: string;
  foto_url?: string;
}

export default function HomeVisitApp() {
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [list, setList] = useState<HomeVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [selectedPrint, setSelectedPrint] = useState<HomeVisit | null>(null);

  const initialFormState: HomeVisit = {
    tanggal: '',
    petugas: '',
    nama_siswa: '',
    kelas: '',
    alamat: '',
    orang_ditemui: '',
    masalah: '',
    hasil: '',
    tindak_lanjut: '',
    foto_url: '',
  };

  const [formData, setFormData] = useState<HomeVisit>(initialFormState);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
      if (session) fetchData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from('home_visits')
      .select('*')
      .order('tanggal', { ascending: false });
    if (!error && data) setList(data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let uploadedUrl = formData.foto_url || '';

    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('dokumentasi-hv')
        .upload(fileName, fotoFile);

      if (!uploadErr) {
        const { data: pubData } = supabase.storage
          .from('dokumentasi-hv')
          .getPublicUrl(fileName);
        uploadedUrl = pubData.publicUrl;
      }
    }

    const payload = { ...formData, foto_url: uploadedUrl };

    if (formData.id) {
      await supabase.from('home_visits').update(payload).eq('id', formData.id);
    } else {
      await supabase.from('home_visits').insert([payload]);
    }

    resetForm();
    await fetchData();
    setLoading(false);
  }

  function resetForm() {
    setFormData(initialFormState);
    setFotoFile(null);
  }

  function handleEdit(item: HomeVisit) {
    setFormData(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    await supabase.from('home_visits').delete().eq('id', id);
    fetchData();
  }

  function handlePrint(item: HomeVisit) {
    setSelectedPrint(item);
    setTimeout(() => {
      window.print();
    }, 200);
  }

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Memuat aplikasi...</div>;
  }

  if (!session) {
    return <Login onLoginSuccess={() => fetchData()} />;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6 print:hidden">
        {/* Header dengan Akun & Tombol Logout */}
        <header className="bg-indigo-700 text-white p-6 rounded-2xl shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Layanan Home Visit BK</h1>
            <p className="text-indigo-200 text-sm">Pencatatan Berita Acara & Pelaksanaan Kunjungan</p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-800/60 px-4 py-2 rounded-xl text-sm">
            <User className="w-4 h-4 text-indigo-300" />
            <span className="text-xs text-indigo-100">{session.user.email}</span>
            <button
              onClick={handleLogout}
              className="ml-2 bg-rose-500 hover:bg-rose-600 px-2.5 py-1 rounded text-xs flex items-center gap-1 font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </header>

        {/* Form Input */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-indigo-700 border-b pb-2 mb-4">
            {formData.id ? 'Edit Laporan Home Visit' : 'Input Kunjungan Rumah Baru'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Tanggal Kunjungan</label>
              <input
                type="date"
                required
                className="w-full border rounded-lg p-2 text-sm"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Guru BK / Petugas</label>
              <input
                type="text"
                required
                placeholder="Nama Petugas BK"
                className="w-full border rounded-lg p-2 text-sm"
                value={formData.petugas}
                onChange={(e) => setFormData({ ...formData, petugas: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Nama Siswa</label>
              <input
                type="text"
                required
                className="w-full border rounded-lg p-2 text-sm"
                value={formData.nama_siswa}
                onChange={(e) => setFormData({ ...formData, nama_siswa: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Kelas</label>
              <input
                type="text"
                required
                placeholder="Contoh: VIII B"
                className="w-full border rounded-lg p-2 text-sm"
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Alamat Siswa</label>
              <input
                type="text"
                required
                className="w-full border rounded-lg p-2 text-sm"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Orang Tua / Pihak Ditemui</label>
              <input
                type="text"
                required
                placeholder="Contoh: Bapak & Ibu Kandung"
                className="w-full border rounded-lg p-2 text-sm"
                value={formData.orang_ditemui}
                onChange={(e) => setFormData({ ...formData, orang_ditemui: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Latar Belakang Permasalahan</label>
              <textarea
                rows={2}
                required
                className="w-full border rounded-lg p-2 text-sm"
                value={formData.masalah}
                onChange={(e) => setFormData({ ...formData, masalah: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Hasil Temuan & Kesepakatan</label>
              <textarea
                rows={3}
                required
                className="w-full border rounded-lg p-2 text-sm"
                value={formData.hasil}
                onChange={(e) => setFormData({ ...formData, hasil: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Rencana Tindak Lanjut</label>
              <textarea
                rows={3}
                required
                className="w-full border rounded-lg p-2 text-sm"
                value={formData.tindak_lanjut}
                onChange={(e) => setFormData({ ...formData, tindak_lanjut: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Foto Dokumentasi</label>
              <input
                type="file"
                accept="image/*"
                className="w-full border rounded-lg p-2 text-sm bg-slate-50"
                onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
              />
              {formData.foto_url && (
                <p className="text-xs text-emerald-600 mt-1">Foto sebelumnya sudah tersimpan.</p>
              )}
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : formData.id ? 'Perbarui Data' : 'Simpan Data'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </form>
        </section>

        {/* Tabel Data */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Arsip Kunjungan Rumah</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 border-b">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Siswa</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Orang Tua Ditemui</th>
                  <th className="p-3">Foto</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-slate-400">
                      Belum ada arsip kunjungan.
                    </td>
                  </tr>
                ) : (
                  list.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3">{item.tanggal}</td>
                      <td className="p-3 font-medium">{item.nama_siswa}</td>
                      <td className="p-3">{item.kelas}</td>
                      <td className="p-3">{item.orang_ditemui}</td>
                      <td className="p-3">
                        {item.foto_url ? (
                          <a
                            href={item.foto_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 underline text-xs inline-flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" /> Foto
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-center space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handlePrint(item)}
                          className="bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700 inline-block"
                          title="Cetak Berita Acara"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-amber-500 text-white p-1.5 rounded hover:bg-amber-600 inline-block"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => item.id && handleDelete(item.id)}
                          className="bg-rose-600 text-white p-1.5 rounded hover:bg-rose-700 inline-block"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Dokumen Cetak Berita Acara & Laporan (Otomatis muncul saat Print) */}
      {selectedPrint && (
        <div className="hidden print:block font-serif text-black p-4 leading-relaxed">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wider">BERITA ACARA & LAPORAN HOME VISIT</h2>
            <p className="text-sm font-sans uppercase">LAYANAN BIMBINGAN DAN KONSELING</p>
          </div>

          <p className="mb-4 text-justify text-sm">
            Pada hari ini tanggal <span className="font-bold underline">{selectedPrint.tanggal}</span>, telah dilaksanakan kunjungan rumah (<em>home visit</em>) terhadap peserta didik:
          </p>

          <table className="w-full mb-4 text-sm">
            <tbody>
              <tr><td className="w-48 py-1">Nama Siswa</td><td>: <span className="font-semibold">{selectedPrint.nama_siswa}</span></td></tr>
              <tr><td className="py-1">Kelas</td><td>: {selectedPrint.kelas}</td></tr>
              <tr><td className="py-1">Alamat</td><td>: {selectedPrint.alamat}</td></tr>
              <tr><td className="py-1">Orang Tua/Wali Ditemui</td><td>: {selectedPrint.orang_ditemui}</td></tr>
              <tr><td className="py-1">Guru Kunjung / Konselor</td><td>: {selectedPrint.petugas}</td></tr>
            </tbody>
          </table>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-bold">A. Masalah yang Melatarbelakangi:</p>
              <p className="pl-4 text-justify">{selectedPrint.masalah}</p>
            </div>
            <div>
              <p className="font-bold">B. Hasil Temuan & Komitmen/Kesepakatan:</p>
              <p className="pl-4 text-justify">{selectedPrint.hasil}</p>
            </div>
            <div>
              <p className="font-bold">C. Rencana Tindak Lanjut:</p>
              <p className="pl-4 text-justify">{selectedPrint.tindak_lanjut}</p>
            </div>
          </div>

          <div className="mt-6 mb-6">
            <p className="font-bold text-sm mb-2">D. Dokumentasi Pelaksanaan:</p>
            {selectedPrint.foto_url ? (
              <div className="w-64 h-48 border border-gray-400 p-1 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPrint.foto_url} alt="Dokumentasi Pelaksanaan" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <p className="text-xs italic text-gray-500">Tidak ada lampiran foto.</p>
            )}
          </div>

          <div className="grid grid-cols-2 text-center text-sm pt-8 break-inside-avoid">
            <div>
              <p>Orang Tua / Wali Siswa,</p>
              <div className="h-20"></div>
              <p className="font-bold underline">( {selectedPrint.orang_ditemui} )</p>
            </div>
            <div>
              <p>Guru BK / Petugas Kunjung,</p>
              <div className="h-20"></div>
              <p className="font-bold underline">( {selectedPrint.petugas} )</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
