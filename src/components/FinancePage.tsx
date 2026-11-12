import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  MinusCircle,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FinanceTransaction {
  id: string;
  transaction_date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note?: string;
}

interface FinancePageProps {
  currentUsername: string;
  onBack: () => void;
}

const EXPENSE_CATEGORIES = [
  'Booking lapangan tennis',
  'Beli bola tennis',
  'Bayar jasa ballboy',
  'Kegiatan entertainment',
  'Maintenance sistem',
];

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);
};

export default function FinancePage({ currentUsername, onBack }: FinancePageProps) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Modal Input Transaksi
  const [modalType, setModalType] = useState<'income' | 'expense' | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState(EXPENSE_CATEGORIES[0]);
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Rekonsiliasi Saldo Awal
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [editOpeningInput, setEditOpeningInput] = useState('');

  // Notifikasi
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentMonthKey = new Date().toISOString().slice(0, 7); // '2026-11'
  const currentMonthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());

  // 1. Tarik Data Transaksi & Saldo Awal
  const loadFinanceData = async () => {
    try {
      setLoading(true);

      // Ambil transaksi
      const { data: trxData, error: trxErr } = await supabase
        .from('club_finances')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (trxErr) throw trxErr;
      setTransactions((trxData as any) || []);

      // Ambil opening balance bulan ini
      const { data: balData } = await supabase
        .from('club_monthly_balances')
        .select('opening_balance')
        .eq('month_key', currentMonthKey)
        .maybeSingle();

      if (balData) {
        setOpeningBalance(Number(balData.opening_balance));
      } else {
        // Jika belum diset, otomatis hitung dari akumulasi sebelum bulan ini
        const prevTrx = (trxData || []).filter((t: any) => t.transaction_date.slice(0, 7) < currentMonthKey);
        const autoPrevBalance = prevTrx.reduce((acc: number, cur: any) => {
          return cur.type === 'income' ? acc + Number(cur.amount) : acc - Number(cur.amount);
        }, 0);
        setOpeningBalance(autoPrevBalance);
      }
    } catch (err: any) {
      console.error('Gagal memuat keuangan:', err);
      setErrorMsg(err.message || 'Gagal memuat data kas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFinanceData();
  }, []);

  // 2. Kalkulasi Realtime
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.transaction_date.slice(0, 7) === currentMonthKey);
  }, [transactions, currentMonthKey]);

  const incomeThisMonth = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [monthTransactions]);

  const expenseThisMonth = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [monthTransactions]);

  const totalCurrentCash = useMemo(() => {
    return openingBalance + incomeThisMonth - expenseThisMonth;
  }, [openingBalance, incomeThisMonth, expenseThisMonth]);

  const netDifference = incomeThisMonth - expenseThisMonth;
  const percentageChange = openingBalance > 0 ? (netDifference / openingBalance) * 100 : 0;

  // 3. Simpan Transaksi Baru
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(amountInput.replace(/\D/g, ''));
    if (!cleanAmount || cleanAmount <= 0) {
      setErrorMsg('Nominal harus lebih dari 0.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        transaction_date: dateInput,
        type: modalType,
        category: modalType === 'income' ? 'Iuran mabar' : categoryInput,
        amount: cleanAmount,
        note: noteInput.trim() || null,
        created_by: currentUsername,
      };

      const { data, error } = await supabase.from('club_finances').insert(payload).select().single();
      if (error) throw error;

      setTransactions((prev) => [data as any, ...prev]);
      setStatusMsg(`Berhasil mencatat ${modalType === 'income' ? 'Uang Masuk' : 'Uang Keluar'} sebesar ${formatRupiah(cleanAmount)}!`);
      setModalType(null);
      setAmountInput('');
      setNoteInput('');
    } catch (err: any) {
      setErrorMsg(`Gagal menyimpan transaksi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Simpan Rekonsiliasi Saldo Awal
  const handleSaveOpeningBalance = async () => {
    const cleanAmount = Number(editOpeningInput.replace(/\D/g, ''));

    try {
      setErrorMsg(null);
      const { error } = await supabase.from('club_monthly_balances').upsert(
        {
          month_key: currentMonthKey,
          opening_balance: cleanAmount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'month_key' }
      );

      if (error) throw error;

      setOpeningBalance(cleanAmount);
      setStatusMsg(`Saldo awal bulan ${currentMonthLabel} berhasil disesuaikan!`);
      setIsReconcileOpen(false);
    } catch (err: any) {
      setErrorMsg(`Gagal menyimpan rekonsiliasi: ${err.message}`);
    }
  };

  // 5. Hapus Transaksi
  const handleDeleteTransaction = async (id: string, amount: number) => {
    if (!window.confirm(`Hapus catatan transaksi ${formatRupiah(amount)} ini?`)) return;

    try {
      const { error } = await supabase.from('club_finances').delete().eq('id', id);
      if (error) throw error;

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setStatusMsg('Catatan transaksi berhasil dihapus.');
    } catch (err: any) {
      setErrorMsg(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#B84013] via-[#4A1504] to-[#0F0402] text-[#FDF8F5] px-4 py-8 md:py-12 overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5500]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* TOP BAR: KEMBALI & USER */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <button
            type="button"
            onClick={onBack}
            style={{ color: '#FFFFFF', backgroundColor: 'rgba(255, 122, 69, 0.15)', borderColor: 'rgba(255, 122, 69, 0.4)' }}
            className="flex items-center gap-2 border px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-[#FF7A45]/30 active:scale-95 shadow"
          >
            <ArrowLeft className="h-4 w-4 text-[#FF7A45]" />
            <span>Kembali ke Halaman Utama</span>
          </button>

          <span style={{ color: '#FF7A45', backgroundColor: 'rgba(255, 122, 69, 0.15)', borderColor: 'rgba(255, 122, 69, 0.4)' }} className="text-[10px] font-mono border px-3 py-1 rounded-full uppercase font-bold">
            MASTER ADMIN KAS 👑
          </span>
        </div>

        {/* HEADER JUDUL */}
        <div className="text-center space-y-2">
          <h1 style={{ color: '#FFFFFF' }} className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            KEUANGAN & KAS <span style={{ color: '#FF7A45' }}>KLUB PATC</span>
          </h1>
          <p style={{ color: 'rgba(253, 248, 245, 0.75)' }} className="text-xs sm:text-sm max-w-md mx-auto">
            Pencatatan uang kas mabar, operasional lapangan, dan rekonsiliasi bulanan.
          </p>
        </div>

        {/* NOTIFIKASI */}
        {statusMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-green-500/50 bg-green-500/15 px-4 py-3 text-xs font-semibold text-green-300">
            <Check className="h-4 w-4 shrink-0 text-green-400" />
            <span>{statusMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/50 bg-red-500/15 px-4 py-3 text-xs font-semibold text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* DASHBOARD KAS REAL-TIME */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* CARD 1: TOTAL KAS SAAT INI */}
          <div className="sm:col-span-3 rounded-3xl border border-[#FF7A45]/40 bg-black/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <span style={{ color: '#FF7A45' }} className="text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center sm:justify-start gap-1.5">
                <Wallet className="h-4 w-4" /> TOTAL KAS SAAT INI (REAL-TIME)
              </span>
              <h2 style={{ color: '#FFFFFF' }} className="font-serif text-3xl sm:text-5xl font-black tracking-tight">
                {formatRupiah(totalCurrentCash)}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs font-semibold">
                <span style={{ color: 'rgba(253, 248, 245, 0.7)' }}>Perubahan bulan ini:</span>
                <span style={{ color: netDifference >= 0 ? '#4ADE80' : '#F87171' }} className="font-mono font-bold">
                  {netDifference >= 0 ? '+' : ''}{formatRupiah(netDifference)} ({percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* BOX SALDO AWAL (OPENING BALANCE) */}
            <div className="flex items-center gap-3 bg-[#1A0603] border border-white/15 px-5 py-3 rounded-2xl shadow-inner">
              <div className="text-right">
                <span style={{ color: 'rgba(253, 248, 245, 0.65)' }} className="block text-[10px] font-bold uppercase tracking-wider">
                  Saldo Awal ({currentMonthLabel})
                </span>
                <span style={{ color: '#FFFFFF' }} className="font-mono text-sm sm:text-base font-extrabold">
                  {formatRupiah(openingBalance)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditOpeningInput(String(openingBalance));
                  setIsReconcileOpen(true);
                }}
                style={{ backgroundColor: 'rgba(255, 122, 69, 0.2)', borderColor: '#FF7A45', color: '#FF7A45' }}
                className="p-2 rounded-xl border hover:scale-105 active:scale-95 transition"
                title="Sesuaikan / Rekonsiliasi Saldo Awal"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* CARD 2: UANG MASUK BULAN INI */}
          <div className="rounded-3xl border border-white/15 bg-[#140502]/80 backdrop-blur-md p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span style={{ color: '#4ADE80' }} className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> Uang Masuk Bulan Ini
              </span>
              <span className="text-[10px] font-mono text-white/50">{currentMonthKey}</span>
            </div>
            <p style={{ color: '#4ADE80' }} className="font-serif text-2xl sm:text-3xl font-black">
              +{formatRupiah(incomeThisMonth)}
            </p>
          </div>

          {/* CARD 3: UANG KELUAR BULAN INI */}
          <div className="rounded-3xl border border-white/15 bg-[#140502]/80 backdrop-blur-md p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span style={{ color: '#F87171' }} className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4" /> Uang Keluar Bulan Ini
              </span>
              <span className="text-[10px] font-mono text-white/50">{currentMonthKey}</span>
            </div>
            <p style={{ color: '#F87171' }} className="font-serif text-2xl sm:text-3xl font-black">
              -{formatRupiah(expenseThisMonth)}
            </p>
          </div>

          {/* TOMBOL AKSI CEPAT */}
          <div className="flex items-center gap-2 sm:col-span-1">
            <button
              type="button"
              onClick={() => {
                setModalType('income');
                setDateInput(new Date().toISOString().slice(0, 10));
              }}
              style={{ background: 'linear-gradient(to right, #15803d, #22c55e)', color: '#FFFFFF' }}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-3xl font-bold uppercase tracking-wider text-xs shadow-lg hover:brightness-110 active:scale-95 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Uang Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalType('expense');
                setDateInput(new Date().toISOString().slice(0, 10));
              }}
              style={{ background: 'linear-gradient(to right, #B84013, #FF7A45)', color: '#FFFFFF' }}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-3xl font-bold uppercase tracking-wider text-xs shadow-lg hover:brightness-110 active:scale-95 transition"
            >
              <MinusCircle className="h-4 w-4" />
              <span>- Uang Keluar</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIWAYAT MUTASI KAS */}
        {/* ======================================================== */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 style={{ color: '#FFFFFF' }} className="font-serif text-xl font-bold uppercase tracking-wide">
              Riwayat Transaksi Kas ({transactions.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs uppercase tracking-widest text-[#FF7A45] animate-pulse">
              Memuat data kas...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center rounded-3xl border border-white/10 bg-white/5 text-xs text-white/50">
              Belum ada pencatatan kas. Klik tombol di atas untuk mulai mencatat.
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/50 backdrop-blur-md shadow-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-[#FF7A45]">
                    <th className="py-3.5 pl-5 pr-2">Tanggal</th>
                    <th className="py-3.5 px-3">Kategori</th>
                    <th className="py-3.5 px-3">Catatan</th>
                    <th className="py-3.5 pr-5 text-right">Nominal</th>
                    <th className="py-3.5 pr-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((t) => {
                    const isIncome = t.type === 'income';
                    return (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td style={{ color: 'rgba(253, 248, 245, 0.75)' }} className="py-3.5 pl-5 pr-2 font-mono text-xs">
                          {t.transaction_date}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            style={
                              isIncome
                                ? { color: '#4ADE80', backgroundColor: 'rgba(74, 222, 128, 0.15)', borderColor: 'rgba(74, 222, 128, 0.4)' }
                                : { color: '#FF7A45', backgroundColor: 'rgba(255, 122, 69, 0.15)', borderColor: 'rgba(255, 122, 69, 0.4)' }
                            }
                            className="inline-block border px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          >
                            {t.category}
                          </span>
                        </td>
                        <td style={{ color: '#FFFFFF' }} className="py-3.5 px-3 font-medium text-xs">
                          {t.note || '-'}
                        </td>
                        <td
                          style={{ color: isIncome ? '#4ADE80' : '#F87171' }}
                          className="py-3.5 pr-5 text-right font-mono font-black text-sm"
                        >
                          {isIncome ? '+' : '-'}{formatRupiah(t.amount)}
                        </td>
                        <td className="py-3.5 pr-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(t.id, t.amount)}
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/25 transition"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL INPUT TRANSAKSI (UANG MASUK / KELUAR) */}
      {/* ======================================================== */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setModalType(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-[#FF7A45]/40 bg-[#160603] p-6 shadow-2xl shadow-black overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 style={{ color: '#FFFFFF' }} className="font-serif text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                <span>{modalType === 'income' ? '💰' : '💸'}</span>
                <span>{modalType === 'income' ? 'Catat Uang Masuk' : 'Catat Uang Keluar'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                style={{ color: '#FFFFFF' }}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* KATEGORI */}
              <div>
                <label style={{ color: '#FF7A45' }} className="block text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  Kategori
                </label>
                {modalType === 'income' ? (
                  <input
                    type="text"
                    disabled
                    value="Iuran mabar"
                    style={{ backgroundColor: '#0F0402', color: '#4ADE80', borderColor: 'rgba(74, 222, 128, 0.4)' }}
                    className="w-full rounded-xl border px-3 py-2.5 text-xs font-bold outline-none cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    style={{ backgroundColor: '#0F0402', color: '#FFFFFF', borderColor: 'rgba(255, 122, 69, 0.4)' }}
                    className="w-full rounded-xl border px-3 py-2.5 text-xs font-semibold outline-none"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} style={{ backgroundColor: '#1F0803', color: '#FFFFFF' }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* NOMINAL (RUPIAH) */}
              <div>
                <label style={{ color: '#FF7A45' }} className="block text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  Nominal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 150000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  style={{ backgroundColor: '#0F0402', color: '#FFFFFF', borderColor: '#FF7A45' }}
                  className="w-full rounded-xl border-2 px-3 py-2.5 text-base font-mono font-bold outline-none"
                  required
                />
              </div>

              {/* TANGGAL */}
              <div>
                <label style={{ color: '#FF7A45' }} className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  style={{ colorScheme: 'dark', backgroundColor: '#0F0402', color: '#FFFFFF', borderColor: 'rgba(255, 122, 69, 0.4)' }}
                  className="w-full rounded-xl border px-3 py-2 text-xs font-medium outline-none"
                  required
                />
              </div>

              {/* CATATAN (OPSIONAL) */}
              <div>
                <label style={{ color: '#FF7A45' }} className="block text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mabar 8 orang / Beli 2 slop bola"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  style={{ backgroundColor: '#0F0402', color: '#FFFFFF', borderColor: 'rgba(255, 122, 69, 0.4)' }}
                  className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
                />
              </div>

              {/* TOMBOL SUBMIT */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  style={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  className="border px-4 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={
                    modalType === 'income'
                      ? { background: 'linear-gradient(to right, #15803d, #22c55e)', color: '#FFFFFF' }
                      : { background: 'linear-gradient(to right, #B84013, #FF7A45)', color: '#FFFFFF' }
                  }
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase shadow-lg hover:brightness-110 active:scale-95 transition"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL REKONSILIASI SALDO AWAL (OPENING BALANCE) */}
      {/* ======================================================== */}
      {isReconcileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setIsReconcileOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-[#FF7A45]/40 bg-[#160603] p-6 shadow-2xl shadow-black overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 style={{ color: '#FFFFFF' }} className="font-serif text-lg font-bold uppercase tracking-wide">
                Rekonsiliasi Saldo Awal
              </h3>
              <button
                type="button"
                onClick={() => setIsReconcileOpen(false)}
                style={{ color: '#FFFFFF' }}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p style={{ color: 'rgba(253, 248, 245, 0.75)' }} className="text-xs leading-relaxed">
                Sesuaikan saldo awal untuk periode <strong>{currentMonthLabel}</strong> jika ada penyesuaian biaya admin bank atau selisih pencatatan.
              </p>

              <div>
                <label style={{ color: '#FF7A45' }} className="block text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  Saldo Awal Baru (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editOpeningInput}
                  onChange={(e) => setEditOpeningInput(e.target.value)}
                  style={{ backgroundColor: '#0F0402', color: '#FFFFFF', borderColor: '#FF7A45' }}
                  className="w-full rounded-xl border-2 px-3 py-2.5 text-base font-mono font-bold outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReconcileOpen(false)}
                  style={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  className="border px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveOpeningBalance}
                  style={{ background: 'linear-gradient(to right, #B84013, #FF7A45)', color: '#FFFFFF' }}
                  className="px-6 py-2 rounded-xl text-xs font-bold uppercase shadow-lg hover:brightness-110 active:scale-95 transition"
                >
                  Simpan Saldo Awal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
