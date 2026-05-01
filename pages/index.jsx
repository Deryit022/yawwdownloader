import { useEffect, useMemo, useState } from 'react';

const DEMO_URL = 'https://www.instagram.com/reel/DW_Yy6kkn2e/?igsh=MWVjZTlmanVpYnhveA==';
const HISTORY_KEY = 'streamlift_history_v2';

const platformPresets = [
  { name: 'Instagram', hint: 'Reels, video, story link', badge: 'Fast' },
  { name: 'TikTok', hint: 'Short video download', badge: 'Popular' },
  { name: 'YouTube', hint: 'Shorts, video link', badge: 'HD' },
  { name: 'Facebook', hint: 'Post video link', badge: 'Classic' },
  { name: 'X / Twitter', hint: 'Media posts', badge: 'Quick' },
  { name: 'Other', hint: 'Direct media URL', badge: 'Auto' },
];

const features = [
  'Multi-format result cards',
  'Copy direct link',
  'Open in new tab',
  'Recent history stored locally',
  'URL validation',
  'Loading / error states',
  'Responsive layout',
  'Nice glassmorphism UI',
];

function cx(...items) {
  return items.filter(Boolean).join(' ');
}

function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleString('id-ID');
  } catch {
    return '';
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Tempel URL lalu tekan Fetch.');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activePreset, setActivePreset] = useState('Instagram');
  const [copyState, setCopyState] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      setHistory(saved);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + 6));
    }, 550);
    return () => clearInterval(id);
  }, [loading]);

  function pushHistory(item) {
    const next = [item, ...history].slice(0, 20);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
    setCopyState('Tersalin');
    setTimeout(() => setCopyState(''), 1400);
  }

  async function handleFetch() {
    setError('');
    setResult(null);

    if (!url.trim()) {
      setMessage('URL masih kosong. Isi dulu biar mesin kerja, bukan menebak.');
      setError('URL kosong');
      return;
    }

    if (!/^https?:\/\//i.test(url.trim())) {
      setMessage('URL harus diawali http atau https.');
      setError('URL tidak valid');
      return;
    }

    setLoading(true);
    setProgress(12);
    setMessage('Mengambil info video...');

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Request gagal');

      setProgress(100);
      setResult(json.data);
      setMessage('Selesai. Pilih link yang kamu mau.');
      pushHistory({ url: url.trim(), title: json.data?.title || 'Video', time: Date.now() });
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan');
      setMessage('Gagal mengambil hasil. Cek URL atau endpoint.');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 600);
    }
  }

  const downloads = useMemo(() => safeArray(result?.downloads), [result]);

  function openHistory(item) {
    setUrl(item.url);
    setMessage('URL riwayat dimuat.');
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setMessage('Clipboard ditempel.');
    } catch {
      setMessage('Browser menolak akses clipboard.');
    }
  }

  function clearAll() {
    setUrl('');
    setResult(null);
    setError('');
    setMessage('Siap. Tempel URL lalu tekan Fetch.');
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }

  function loadDemo() {
    setUrl(DEMO_URL);
    setMessage('Demo URL dimuat.');
  }

  return (
    <main className="min-h-screen bg-[#060816] text-slate-100">
      <style jsx global>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at 10% 10%, rgba(124,58,237,.22), transparent 30%),
            radial-gradient(circle at 90% 20%, rgba(6,182,212,.18), transparent 28%),
            linear-gradient(180deg, #050816 0%, #0b1020 45%, #070b17 100%);
        }
        .glass {
          background: rgba(15, 23, 42, .72);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(148,163,184,.18);
          box-shadow: 0 24px 80px rgba(0,0,0,.35);
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <header className="glass mb-6 flex flex-col gap-4 rounded-[28px] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 font-black text-white shadow-lg shadow-violet-500/20">SL</div>
            <div>
              <h1 className="text-lg font-semibold leading-none">StreamLift</h1>
              <p className="text-sm text-slate-400">Downloader web modern untuk link video</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Auto detect</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Multi-format</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Local history</span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="glass rounded-[30px] p-6 md:p-8">
            <div className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
              Premium downloader UI
            </div>
            <h2 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
              Unduh video dari berbagai platform dengan tampilan yang <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">rapi, cepat, dan mudah dipahami</span>.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
              Web ini dibuat supaya terasa seperti produk jadi, bukan form debug yang kebetulan bisa jalan. Ada preset platform, status loading, hasil multi-link, riwayat, tombol cepat, dan layout yang nyaman dilihat.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3 md:flex-row md:items-center">
                <div className="flex-1 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                    placeholder="Paste URL video di sini"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleFetch} disabled={loading} className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">
                    {loading ? 'Processing...' : 'Fetch video info'}
                  </button>
                  <button onClick={handlePaste} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10">Paste</button>
                  <button onClick={clearAll} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10">Clear</button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {platformPresets.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setActivePreset(p.name)}
                    className={cx(
                      'rounded-full border px-3 py-2 text-left text-xs transition',
                      activePreset === p.name
                        ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    )}
                  >
                    <div className="font-semibold">{p.name} <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">{p.badge}</span></div>
                    <div className="mt-1 text-[11px] text-slate-400">{p.hint}</div>
                  </button>
                ))}
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
              </div>

              <div className={cx('rounded-2xl border px-4 py-3 text-sm', error ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-white/10 bg-white/5 text-slate-300')}>
                {error ? error : message}
                {copyState ? <span className="ml-2 text-cyan-300">• {copyState}</span> : null}
              </div>
            </div>
          </div>

          <aside className="glass rounded-[30px] p-6 md:p-7">
            <h3 className="text-xl font-semibold">Fitur utama</h3>
            <div className="mt-4 grid gap-3">
              {features.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4 text-sm text-cyan-50">
              Catatan: endpoint ini bergantung pada layanan pihak ketiga. Kalau mereka berubah, backend juga harus ikut menari.
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
          <div className="glass rounded-[30px] p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold">Hasil</h3>
                <p className="mt-1 text-sm text-slate-400">Preview, link unduh, dan kontrol cepat.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(result?.source || url)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Copy source</button>
                <button onClick={() => window.open(result?.source || url, '_blank')} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Open source</button>
              </div>
            </div>

            {!result ? (
              <div className="rounded-[24px] border border-dashed border-white/15 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
                Belum ada hasil. Masukkan URL dan jalankan pencarian.
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40">
                  {result.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.thumbnail} alt={result.title || 'thumbnail'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid min-h-[240px] place-items-center p-6 text-sm text-slate-500">No thumbnail</div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-2xl font-bold tracking-tight">{result.title || 'Video'}</h4>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Platform: {result.platform || 'auto'}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Durasi: {result.duration || '-'}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Link: {downloads.length}</span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {downloads.length ? downloads.map((d, i) => (
                      <div key={`${d.url}-${i}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <div className="text-sm font-semibold">{d.quality || 'best'}</div>
                        <div className="mt-1 text-xs text-slate-400">{d.mime || 'video/mp4'}{d.size ? ` • ${d.size}` : ''}</div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button onClick={() => window.open(d.url, '_blank')} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-xs font-semibold text-white">
                            Open
                          </button>
                          <button onClick={() => copyText(d.url)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10">
                            Copy
                          </button>
                          <a href={d.url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10">
                            Direct
                          </a>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">Tidak ada link unduhan yang terdeteksi.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass rounded-[30px] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Riwayat</h3>
                <button onClick={clearHistory} className="text-xs text-slate-400 hover:text-slate-200">Clear</button>
              </div>
              <div className="space-y-3">
                {history.length ? history.map((item, idx) => (
                  <button key={`${item.url}-${idx}`} onClick={() => openHistory(item)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10">
                    <div className="truncate text-sm font-medium">{item.title || item.url}</div>
                    <div className="mt-1 truncate text-xs text-slate-400">{item.url}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{fmtTime(item.time)}</div>
                  </button>
                )) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-4 text-sm text-slate-500">Belum ada riwayat.</div>
                )}
              </div>
            </div>

            <div className="glass rounded-[30px] p-6">
              <h3 className="text-xl font-semibold">Quick actions</h3>
              <div className="mt-4 grid gap-3">
                <button onClick={loadDemo} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm hover:bg-white/10">Load demo URL</button>
                <button onClick={() => setUrl(result?.source || '')} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm hover:bg-white/10">Use result source</button>
                <button onClick={handleFetch} disabled={loading} className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-left text-sm font-semibold text-white disabled:opacity-60">
                  {loading ? 'Processing...' : 'Run again'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-[30px] p-6 md:p-8">
            <h3 className="text-2xl font-semibold">Kenapa tampilannya terasa lebih enak</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Komposisi visual dibuat dengan hierarki yang jelas: hero besar, form padat, aksi cepat, hasil bertingkat, dan panel samping untuk konteks. Jadi mata tidak capek membaca UI yang berisik.
            </p>
          </div>
          <div className="glass rounded-[30px] p-6 md:p-8">
            <h3 className="text-2xl font-semibold">FAQ</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <summary className="cursor-pointer font-medium">Bisa dipasang di Vercel?</summary>
                <div className="mt-2 text-slate-400">Bisa. Struktur ini sudah diarahkan ke Next.js pages router + serverless API route.</div>
              </details>
              <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <summary className="cursor-pointer font-medium">Kenapa hasil kadang lama?</summary>
                <div className="mt-2 text-slate-400">Karena backend menunggu task pihak ketiga selesai. Itu sifat dasarnya, bukan bug UI.</div>
              </details>
              <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <summary className="cursor-pointer font-medium">Bisa ditambah dark/light mode?</summary>
                <div className="mt-2 text-slate-400">Bisa. Sekarang sudah dark premium, dan bisa saya tambah toggle mode kalau kamu mau.</div>
              </details>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}