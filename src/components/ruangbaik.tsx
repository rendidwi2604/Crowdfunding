'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { ArrowDown, ArrowRight, ArrowUpRight, Bookmark, Check, CheckCheck, CheckCircle2, ChevronDown, Clock3, Copy, ExternalLink, Heart, Leaf, LoaderCircle, Menu, Plus, Search, ShieldCheck, SlidersHorizontal, Users, Wallet, X } from 'lucide-react';
import { formatEther, parseEther } from 'ethers';
import { type Campaign, type Category, type Donation, categories, demoCampaigns, DEMO_ADDRESS, daysLeft, eth, progress, shortAddress, amountSchema, campaignFormSchema, metadataSchema } from '@/lib/campaigns';
import { connectWallet, CONTRACT_ADDRESS, friendlyError, writeContract } from '@/lib/contract';
import { metadataMessage } from '@/lib/signature';
import { Logo, Flower, Arrow, Reveal, Modal, Photo } from './ui';
import { LandingSections } from './sections';

type WalletState = { address: string; balance: string; demo: boolean };
type View = 'wallet' | 'create' | 'dashboard' | 'guide' | 'about' | 'privacy' | 'terms' | null;
type PendingCampaign = { transactionHash: string; metadata: ReturnType<typeof metadataSchema.parse>; address: string };
const STORAGE = 'ruangbaik-demo-v1';

export function RuangBaik() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>(null);
  const [walletReturn, setWalletReturn] = useState<{ campaignId?: string; view?: View } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('pilihan');
  const [showFilters, setShowFilters] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [notice, setNotice] = useState('');
  const [dataError, setDataError] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<PendingCampaign | null>(null);
  const selected = campaigns.find(c => c.id === selectedId);
  const toast = useCallback((message: string) => setNotice(message), []);
  const close = useCallback(() => { setView(null); setSelectedId(null); setError(''); }, []);
  const open = (v: View) => { setSelectedId(null); setError(''); setMenu(false); setView(v); };
  const openCampaign = (id: string) => { setView(null); setError(''); setSelectedId(id); };
  const refresh = useCallback(async () => {
    const res = await fetch('/api/campaigns', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    if (data.mode === 'live') { setMode('live'); setCampaigns(data.campaigns); }
    setDataError('');
  }, []);

  useEffect(() => {
    let initial = demoCampaigns();
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) { const saved = JSON.parse(raw); if (Array.isArray(saved.campaigns) && saved.campaigns.length && saved.campaigns.every((c: Campaign) => c.demo && typeof c.id === 'string' && Array.isArray(c.donations))) initial = saved.campaigns; if (saved.wallet?.demo && saved.wallet?.address === DEMO_ADDRESS) setWallet(saved.wallet); }
      const marks = JSON.parse(localStorage.getItem('ruangbaik-bookmarks') || '[]'); if (Array.isArray(marks)) setBookmarks(marks.filter((x: unknown) => typeof x === 'string'));
      const draft = localStorage.getItem('ruangbaik-pending'); if (draft) setPending(JSON.parse(draft));
    } catch { /* Storage may be disabled or from an older version. */ }
    setCampaigns(initial); setReady(true);
    refresh().catch(e => setDataError(friendlyError(e)));
  }, [refresh]);
  useEffect(() => { if (!ready) return; try { if (mode === 'demo') localStorage.setItem(STORAGE, JSON.stringify({ campaigns, wallet: wallet?.demo ? wallet : null })); localStorage.setItem('ruangbaik-bookmarks', JSON.stringify(bookmarks)); } catch { /* Session remains usable without storage. */ } }, [campaigns, wallet, bookmarks, ready, mode]);
  useEffect(() => { if (mode !== 'live') return; const timer = setInterval(() => refresh().catch(e => setDataError(friendlyError(e))), 30000); return () => clearInterval(timer); }, [mode, refresh]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    const provider = window.ethereum;
    const changed = () => { if (wallet && !wallet.demo) { setWallet(null); toast('Akun atau jaringan berubah. Hubungkan kembali dompet Anda.'); } };
    provider?.on?.('accountsChanged', changed); provider?.on?.('chainChanged', changed);
    return () => { provider?.removeListener?.('accountsChanged', changed); provider?.removeListener?.('chainChanged', changed); };
  }, [wallet, toast]);

  async function handleConnect(demo = false) {
    setError('');
    const finish = () => { close(); if (walletReturn?.campaignId) setSelectedId(walletReturn.campaignId); else if (walletReturn?.view) setView(walletReturn.view); setWalletReturn(null); };
    if (demo) { setWallet({ address: DEMO_ADDRESS, balance: '2.5', demo: true }); finish(); toast('Dompet demo terhubung. Anda memiliki 2,5 ETH simulasi.'); return; }
    setBusy('Menghubungkan MetaMask…');
    try { const { provider, address } = await connectWallet(); setWallet({ address, balance: formatEther(await provider.getBalance(address)), demo: false }); finish(); toast('Dompet terhubung ke Ethereum Sepolia.'); } catch (e) { setError(friendlyError(e)); } finally { setBusy(''); }
  }
  async function updateBalance() { if (wallet && !wallet.demo) { const { provider, address } = await connectWallet(); setWallet({ ...wallet, balance: formatEther(await provider.getBalance(address)) }); } }
  function toggleSaved(id: string) { setBookmarks(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]); }
  async function donate(c: Campaign, amount: string) {
    setError('');
    try {
      amountSchema.parse(amount);
      if (!wallet) throw new Error('Hubungkan dompet melalui tombol di header sebelum berdonasi.');
      if (c.demo !== wallet.demo) throw new Error(c.demo ? 'Kampanye ini adalah contoh. Gunakan dompet demo untuk mencoba donasi.' : 'Gunakan MetaMask untuk mendukung kampanye Sepolia.');
      if (c.withdrawn || daysLeft(c.deadline) === 0) throw new Error('Kampanye sudah berakhir.');
      if (parseEther(amount) > parseEther(wallet.balance)) throw new Error('Saldo dompet belum cukup untuk donasi ini.');
      setBusy(c.demo ? 'Memproses simulasi…' : 'Konfirmasi donasi di MetaMask…');
      if (c.demo) {
        setCampaigns(old => old.map(item => item.id === c.id ? { ...item, raised: formatEther(parseEther(item.raised) + parseEther(amount)), donations: [{ address: wallet.address, amount, date: new Date().toISOString() }, ...item.donations] } : item));
        setWallet({ ...wallet, balance: formatEther(parseEther(wallet.balance) - parseEther(amount)) });
        toast('Simulasi donasi berhasil. Terima kasih sudah berbagi kebaikan!');
      } else {
        const { contract } = await writeContract(wallet.address);
        const tx = await contract.donateToCampaign(c.id, { value: parseEther(amount) }); setBusy('Menunggu konfirmasi Sepolia…');
        const receipt = await tx.wait(); if (!receipt?.status) throw new Error('Transaksi belum berhasil.');
        await refresh(); await updateBalance(); toast('Donasi terkonfirmasi di Sepolia. Terima kasih!');
      }
      return true;
    } catch (e) { setError(friendlyError(e)); return false; } finally { setBusy(''); }
  }
  async function withdraw(c: Campaign) {
    if (!wallet) return;
    setError(''); setBusy('Memproses pencairan…');
    try {
      if (wallet.address.toLowerCase() !== c.creator.toLowerCase() || wallet.demo !== c.demo) throw new Error('Hanya pembuat kampanye yang dapat mencairkan dana.');
      if (c.withdrawn || Number(c.raised) <= 0 || (daysLeft(c.deadline) > 0 && Number(c.raised) < Number(c.target))) throw new Error('Dana dapat dicairkan setelah target tercapai atau batas waktu berakhir.');
      if (c.demo) { setCampaigns(old => old.map(item => item.id === c.id ? { ...item, withdrawn: true } : item)); setWallet({ ...wallet, balance: formatEther(parseEther(wallet.balance) + parseEther(c.raised)) }); }
      else { const { contract } = await writeContract(wallet.address); const tx = await contract.withdrawFunds(c.id); setBusy('Menunggu konfirmasi Sepolia…'); await tx.wait(); await refresh(); await updateBalance(); }
      toast(c.demo ? 'Pencairan demo berhasil. Saldo simulasi telah bertambah.' : 'Dana berhasil dicairkan ke dompet pembuat.');
    } catch (e) { setError(friendlyError(e)); } finally { setBusy(''); }
  }
  async function saveMetadata(draft: PendingCampaign) {
    const { signer, address } = await connectWallet();
    if (address.toLowerCase() !== draft.address.toLowerCase()) throw new Error('Gunakan dompet pembuat kampanye untuk menyimpan metadata.');
    setBusy('Tanda tangani metadata di MetaMask…');
    const signature = await signer.signMessage(metadataMessage(draft.transactionHash, draft.metadata, CONTRACT_ADDRESS));
    const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, signature }) });
    const result = await res.json(); if (!res.ok) throw new Error(result.error);
    setPending(null); try { localStorage.removeItem('ruangbaik-pending'); } catch {}
    await refresh(); close(); toast('Kampanye berhasil diterbitkan. Saatnya mengajak lebih banyak orang!');
  }
  async function createCampaign(form: FormData) {
    setError('');
    try {
      if (!wallet) throw new Error('Hubungkan dompet terlebih dahulu.');
      const data = campaignFormSchema.parse({ title: form.get('title'), description: form.get('description'), target: form.get('target'), deadline: new Date(String(form.get('deadline'))).toISOString(), category: form.get('category'), image: form.get('image') || '/images/community.jpg', location: form.get('location'), organizer: form.get('organizer') });
      if ((mode === 'demo') !== wallet.demo) throw new Error(mode === 'demo' ? 'Gunakan dompet demo. Kontrak dan database Sepolia belum dikonfigurasi.' : 'Hubungkan MetaMask untuk membuat kampanye Sepolia.');
      setBusy('Membuat kampanye…');
      if (wallet.demo) {
        const c: Campaign = { ...data, id: `demo-${crypto.randomUUID()}`, creator: wallet.address, raised: '0', donations: [], withdrawn: false, demo: true, deadline: new Date(data.deadline).toISOString() };
        setCampaigns(old => [c, ...old]); close(); setSelectedId(c.id); toast('Kampanye demo berhasil dibuat dan disimpan di browser.');
      } else {
        if (pending) throw new Error('Selesaikan penyimpanan kampanye sebelumnya terlebih dahulu.');
        const { contract } = await writeContract(wallet.address); setBusy('Konfirmasi pembuatan di MetaMask…');
        const tx = await contract.createCampaign(parseEther(data.target), Math.floor(Date.parse(data.deadline) / 1000)); setBusy('Menunggu konfirmasi Sepolia…');
        const receipt = await tx.wait(); if (!receipt?.status) throw new Error('Transaksi pembuatan kampanye gagal.');
        const draft: PendingCampaign = { transactionHash: tx.hash, metadata: metadataSchema.parse(data), address: wallet.address };
        setPending(draft); try { localStorage.setItem('ruangbaik-pending', JSON.stringify(draft)); } catch {}
        await saveMetadata(draft);
      }
    } catch (e) { const z = e as { issues?: { message: string }[] }; setError(z.issues?.[0]?.message || friendlyError(e)); } finally { setBusy(''); }
  }
  const filtered = useMemo(() => campaigns.filter(c => (category === 'Semua' || c.category === category) && (!onlySaved || bookmarks.includes(c.id)) && `${c.title} ${c.organizer} ${c.location}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'deadline' ? Date.parse(a.deadline) - Date.parse(b.deadline) : sort === 'progress' ? progress(b) - progress(a) : 0), [campaigns, category, onlySaved, bookmarks, search, sort]);
  const total = campaigns.reduce((sum, c) => sum + Number(c.raised), 0);

  return <MotionConfig reducedMotion="user"><a className="skip-link" href="#kampanye">Lewati ke kampanye</a>
    <header className="header"><div className="container nav"><a href="#" aria-label="RuangBaik beranda"><Logo /></a><nav className="desktop-nav" aria-label="Navigasi utama"><a href="#kampanye" className="active">Jelajahi kampanye</a><a href="#cara-kerja">Cara kerja</a><a href="#tentang">Tentang kami</a></nav><div className="nav-actions"><span className="network"><i /> Sepolia <span>Testnet</span></span><button className={`button wallet-button ${wallet ? 'connected' : ''}`} onClick={() => open('wallet')}><Wallet size={17} />{wallet ? <><span>{shortAddress(wallet.address)}</span><small>{eth(wallet.balance)} ETH</small></> : 'Hubungkan wallet'}</button><button className="icon-button mobile-menu" aria-label={menu ? 'Tutup navigasi' : 'Buka navigasi'} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></div></div>{menu && <nav className="mobile-nav" aria-label="Navigasi seluler"><a href="#kampanye" onClick={() => setMenu(false)}>Jelajahi kampanye</a><a href="#cara-kerja" onClick={() => setMenu(false)}>Cara kerja</a><a href="#tentang" onClick={() => setMenu(false)}>Tentang kami</a><button onClick={() => open('dashboard')}>Aktivitas saya</button><button onClick={() => open('wallet')}>{wallet ? 'Dompet saya' : 'Hubungkan wallet'}</button></nav>}</header>
    <main>
      <section className="hero grid-paper"><div className="container hero-inner"><Reveal className="hero-copy"><span className="pill"><span className="tiny-star">✳</span> Kebaikan dimulai dari kita</span><h1>Langkah kecil.<br /><span>Dampak</span><br /><span className="hero-last">yang besar.<svg viewBox="0 0 330 20" aria-hidden="true"><path d="M3 14C90 1 238 0 325 9M32 18c77-9 177-8 251-5" /></svg></span></h1><p>Ide baik layak jadi nyata. Bersama, kita wujudkan perubahan lewat donasi yang terbuka dan bermakna.</p><div className="hero-buttons"><a className="button primary" href="#kampanye">Jelajahi kampanye <ArrowUpRight size={18} /></a><button className="text-button" onClick={() => open('create')}>Mulai galang dana <ArrowUpRight size={17} /></button></div><div className="hero-proof"><div className="avatar-stack"><span>RA</span><span>DN</span><span>AL</span><span><Heart size={15} fill="currentColor" /></span></div><div><strong>Bergerak bersama, berdampak nyata.</strong><span>Setiap kebaikan punya tempat di sini.</span></div></div></Reveal>
      <Reveal className="hero-art" delay={.15}><div className="art-orbit" /><Flower className="hero-flower" /><div className="hero-photo-card"><div className="hero-photo"><img src="/images/hero.jpg" alt="Relawan bekerja bersama untuk membantu komunitas" fetchPriority="high" /><span className="photo-label"><span /> AKSI KECIL, ARTI BESAR</span></div><div className="hero-photo-caption"><span>Untuk hari esok<br /><strong>yang lebih baik.</strong></span><div className="circle-arrow"><Arrow size={27} /></div></div></div><div className="kindness-sticker"><Heart size={19} /><span>Berbagi itu berarti.</span><Arrow size={17} /></div><div className="impact-float"><div className="impact-float-icon"><Leaf size={23} /></div><div><span>SETIAP DUKUNGAN BERARTI</span><strong>Dari kita, untuk sesama.</strong><div className="mini-progress"><i /></div></div><Flower /></div><div className="verified-float"><ShieldCheck size={19} /><div><strong>Terbuka & transparan</strong><span>Didukung teknologi blockchain</span></div><Check size={16} /></div><span className="handwritten">a little kindness goes a long way ↗</span></Reveal></div><div className="container hero-bottom"><span><ShieldCheck size={15} /> Transparan di setiap langkah</span><span><Heart size={15} /> Langsung dari hati, ke tujuan</span><a href="#kampanye">Gulir untuk temukan kebaikan <ArrowDown size={14} /></a></div></section>
      <section id="kampanye" className="section campaigns-section"><div className="container"><Reveal className="section-heading"><div><span className="eyebrow"><span className="little-line" /> TEMUKAN TUJUANMU</span><h2>Banyak cara untuk<br />membuat <span className="serif">perubahan.</span></h2></div><div className="section-heading-right"><p>Temukan cerita yang dekat dengan hatimu.<br />Satu dukunganmu bisa membuka banyak harapan.</p><button className="text-button" onClick={() => { setCategory('Semua'); setSearch(''); setOnlySaved(false); setShowFilters(!showFilters); }}>Jelajahi semua kampanye <Arrow size={17} /></button></div></Reveal>
        <div className="campaign-toolbar"><div className="category-tabs" aria-label="Kategori kampanye">{categories.map(cat => <button key={cat} className={category === cat ? 'selected' : ''} onClick={() => setCategory(cat)}>{cat === 'Semua' && <span className="tab-grid">⊞</span>}{cat}</button>)}</div><div className="filter-actions"><button className={`icon-button ${onlySaved ? 'is-saved' : ''}`} aria-label="Tampilkan kampanye tersimpan" aria-pressed={onlySaved} onClick={() => setOnlySaved(!onlySaved)}><Bookmark size={18} fill={onlySaved ? 'currentColor' : 'none'} /></button><button className={`filter-button ${showFilters ? 'selected' : ''}`} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}><SlidersHorizontal size={16} /> Filter</button></div></div>
        {showFilters && <div className="search-row"><label className="search-field"><Search size={18} /><input type="search" placeholder="Cari judul, komunitas, atau lokasi…" aria-label="Cari kampanye" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="sort-field">Urutkan<select value={sort} onChange={e => setSort(e.target.value)}><option value="pilihan">Pilihan untukmu</option><option value="deadline">Segera berakhir</option><option value="progress">Paling banyak didanai</option></select><ChevronDown size={15} /></label></div>}
        <div className="demo-line"><span className="status-dot" />{mode === 'demo' ? 'Ruang eksplorasi · Kampanye dan angka di bawah adalah data demo.' : 'Ethereum Sepolia · Donasi menggunakan ETH testnet.'}<button onClick={() => open('guide')}>Apa itu? <ArrowUpRight size={12} /></button></div>
        {dataError && <div className="error-message">{dataError}<button onClick={() => refresh().catch(e => setDataError(friendlyError(e)))}>Muat ulang</button></div>}
        <div className="campaign-grid">{filtered.map((c, i) => <CampaignCard key={c.id} campaign={c} saved={bookmarks.includes(c.id)} onSave={() => toggleSaved(c.id)} onOpen={() => openCampaign(c.id)} index={i} />)}</div>
        {ready && !filtered.length && <div className="empty-state"><Search size={32} /><h3>Belum ada kampanye di sini.</h3><p>{onlySaved ? 'Simpan kampanye dengan menekan ikon bookmark.' : 'Coba kategori lain atau mulai cerita kebaikanmu sendiri.'}</p><button className="button secondary" onClick={() => { setCategory('Semua'); setSearch(''); setOnlySaved(false); }}>Lihat semua kampanye <Arrow /></button></div>}
        <div className="campaigns-bottom"><span>Tak harus besar untuk membuat perbedaan.</span><button className="text-button" onClick={() => open('create')}>Punya ide baik? Mulai di sini <Arrow size={17} /></button></div>
      </div></section>
      <LandingSections total={total} count={campaigns.length} demo={mode === 'demo'} onCreate={() => open('create')} onGuide={() => open('guide')} />
    </main>
    <footer className="footer grid-paper"><div className="container"><div className="footer-top"><div><span className="eyebrow">SATU LANGKAHMU BERARTI</span><h2>Jadi bagian dari<br /><span className="serif">perubahan</span> baik.</h2></div><button className="round-cta" onClick={() => open('create')}>Mulai<br />kebaikan <ArrowUpRight size={28} /><Flower /></button></div><div className="footer-main"><div className="footer-brand"><a href="#" aria-label="Kembali ke atas"><Logo /></a><p>Ruang bertemunya niat baik<br />dan perubahan yang berarti.</p><span className="network"><i /> Built for good. Powered by Web3.</span></div><div><h4>Jelajahi</h4><a href="#kampanye">Semua kampanye</a><button onClick={() => open('create')}>Mulai galang dana</button><button onClick={() => open('dashboard')}>Aktivitas saya</button></div><div><h4>Kenali RuangBaik</h4><a href="#tentang">Tentang kami</a><a href="#cara-kerja">Cara kerja</a><button onClick={() => open('guide')}>Panduan & FAQ</button></div><div className="footer-note"><h4>Teknologi untuk kebaikan.</h4><p>Setiap dukungan tercatat.<br />Setiap langkah bisa ditelusuri.</p><span className="footer-badge"><ShieldCheck size={15} /> Ethereum Sepolia Testnet</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} RuangBaik. Dibuat untuk perubahan.</span><div><button onClick={() => open('privacy')}>Privasi</button><button onClick={() => open('terms')}>Ketentuan</button><span>Made with a little <Heart size={12} /></span></div></div></div></footer>
    <AnimatePresence>{view && <Modal title={view === 'wallet' ? wallet ? 'Dompet kamu' : 'Mulai dengan dompetmu.' : view === 'create' ? 'Mulai cerita kebaikanmu.' : view === 'dashboard' ? 'Aktivitas saya' : view === 'privacy' ? 'Privasi di RuangBaik' : view === 'terms' ? 'Ketentuan penggunaan' : 'Kebaikan, tanpa tanda tanya.'} onClose={close} wide={view === 'create' || view === 'dashboard'}>
      {view === 'wallet' && <div className="wallet-content">{wallet ? <><div className="wallet-avatar"><Wallet size={30} /></div><span className="pill">{wallet.demo ? 'DOMPET DEMO' : 'ETHEREUM SEPOLIA'}</span><h3 className="wallet-balance">{eth(wallet.balance)} <small>ETH</small></h3><button className="address-copy" onClick={() => navigator.clipboard.writeText(wallet.address).then(() => toast('Alamat dompet disalin.')).catch(() => setError('Alamat: ' + wallet.address))}>{shortAddress(wallet.address)} <Copy size={15} /></button><button className="button primary full" onClick={() => open('dashboard')}>Lihat aktivitas saya <Arrow /></button><button className="button secondary full" onClick={() => { setWallet(null); close(); toast('Dompet diputuskan dari website.'); }}>Putuskan koneksi</button></> : <><div className="wallet-illustration"><Wallet size={40} /><Flower /></div><p>Dompet adalah identitasmu. Hubungkan MetaMask untuk mendukung kampanye dan melihat perjalanan donasimu.</p><button className="button primary full" disabled={!!busy} onClick={() => handleConnect()}><Wallet size={18} /> Hubungkan MetaMask <Arrow /></button><div className="divider-label"><span>atau kenali RuangBaik dulu</span></div><button className="button secondary full" disabled={!!busy || mode === 'live'} onClick={() => handleConnect(true)}>Coba dengan dompet demo <Arrow /></button><p className="fine-print">Mode demo memakai saldo simulasi dan tidak mengirim transaksi blockchain. MetaMask menggunakan jaringan Sepolia.</p><a className="small-link" href="https://metamask.io/download/" target="_blank" rel="noreferrer">Belum punya MetaMask? <ExternalLink size={12} /></a></>}{busy && <p className="busy-message"><LoaderCircle className="spin" size={16} />{busy}</p>}{error && <p className="error-message" role="alert">{error}</p>}</div>}
      {view === 'create' && <>{!wallet ? <div className="empty-state"><Wallet size={36} /><h3>Setiap cerita dimulai dari satu koneksi.</h3><p>Hubungkan dompet untuk membuat kampanye pertamamu.</p><button className="button primary" onClick={() => open('wallet')}>Hubungkan wallet <Arrow /></button></div> : <CampaignForm demo={mode === 'demo'} onSubmit={createCampaign} busy={busy} error={error} pending={pending} onRetry={async () => { if (!pending) return; setError(''); try { await saveMetadata(pending); } catch (e) { setError(friendlyError(e)); } finally { setBusy(''); } }} />}</>}
      {view === 'dashboard' && <Dashboard wallet={wallet} campaigns={campaigns} bookmarks={bookmarks} onOpen={openCampaign} onConnect={() => open('wallet')} onCreate={() => open('create')} />}
      {(view === 'guide' || view === 'privacy' || view === 'terms' || view === 'about') && <InfoContent type={view} />}
    </Modal>}</AnimatePresence>
    <AnimatePresence>{selected && <Modal title="Sebuah cerita. Sebuah harapan." onClose={close} wide><CampaignDetail key={selected.id} c={selected} wallet={wallet} busy={busy} error={error} donate={donate} withdraw={withdraw} onConnect={() => { setWalletReturn({ campaignId: selected.id }); open('wallet'); }} toast={toast} /></Modal>}</AnimatePresence>
    <AnimatePresence>{notice && <div className="toast" role="status"><CheckCircle2 size={20} /><span>{notice}</span><button className="icon-button" onClick={() => setNotice('')} aria-label="Tutup pemberitahuan"><X size={16} /></button></div>}</AnimatePresence>
  </MotionConfig>;
}

function CampaignCard({ campaign: c, saved, onSave, onOpen, index }: { campaign: Campaign; saved: boolean; onSave: () => void; onOpen: () => void; index: number }) {
  return <Reveal className="campaign-card" delay={index < 3 ? index * .08 : 0}><div className="campaign-image"><button className="image-link" onClick={onOpen} aria-label={`Lihat ${c.title}`}><Photo src={c.image} alt={c.title} /></button><span className={`category-badge cat-${c.category.toLowerCase()}`}>{c.category === 'Lingkungan' ? <Leaf size={12} /> : c.category === 'Pendidikan' ? <span>✧</span> : <Heart size={12} />}{c.category}</span><button className={`bookmark ${saved ? 'saved' : ''}`} aria-label={saved ? 'Hapus dari tersimpan' : 'Simpan kampanye'} aria-pressed={saved} onClick={onSave}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button><span className="campaign-duration"><Clock3 size={11} />{c.withdrawn ? 'Dana dicairkan' : daysLeft(c.deadline) ? `${daysLeft(c.deadline)} hari lagi` : 'Berakhir'}</span></div><div className="campaign-body"><div className="organizer"><span className="organizer-icon">{c.organizer.charAt(0)}</span>{c.organizer}<CheckCircle2 size={13} /><span>{c.demo ? 'Demo' : 'Sepolia'}</span></div><button className="campaign-title" onClick={onOpen}><h3>{c.title}</h3></button><div className="funding-line"><span><strong>{eth(c.raised)}</strong> ETH terkumpul</span><b>{progress(c)}%</b></div><div className="progress-track" role="progressbar" aria-label={`Pendanaan ${c.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress(c)}><span style={{ width: `${progress(c)}%` }} /></div><div className="card-bottom"><span>dari target <b>{eth(c.target)} ETH</b></span><button onClick={onOpen}>Beri dukungan <ArrowUpRight size={15} /></button></div></div></Reveal>;
}

function CampaignForm({ demo, onSubmit, busy, error, pending, onRetry }: { demo: boolean; onSubmit: (data: FormData) => Promise<void>; busy: string; error: string; pending: PendingCampaign | null; onRetry: () => void }) {
  return <form className="campaign-form" onSubmit={e => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }}><p className="form-intro">Ceritakan idemu dan ajak orang lain menjadi bagian dari perubahan. {demo && <strong>Ini adalah kampanye demo yang tersimpan di browser.</strong>}</p>{pending && <div className="pending-message"><strong>Transaksi kampanye sudah berhasil.</strong><p>Metadata belum tersimpan. Lanjutkan penyimpanan tanpa membuat transaksi baru.</p><a href={`https://sepolia.etherscan.io/tx/${pending.transactionHash}`} target="_blank" rel="noreferrer">Lihat transaksi <ExternalLink size={13} /></a><button type="button" className="button secondary" disabled={!!busy} onClick={onRetry}>Simpan metadata</button></div>}<fieldset disabled={!!busy || !!pending}><label>Judul kampanye <input name="title" required minLength={8} maxLength={120} placeholder="Sebuah ide baik untuk perubahan…" /></label><div className="form-grid"><label>Nama komunitas / penggalang <input name="organizer" required minLength={2} maxLength={100} placeholder="Nama kamu atau komunitas" /></label><label>Lokasi <input name="location" required minLength={2} maxLength={100} placeholder="Kota, Indonesia" /></label></div><div className="form-grid"><label>Kategori<select name="category">{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label>Target dana (ETH)<input name="target" type="text" inputMode="decimal" required placeholder="Contoh: 2.5" /></label></div><label>Batas waktu<input name="deadline" type="datetime-local" required min={new Date(Date.now() + 120000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} /></label><label>Cerita di balik kampanye<textarea name="description" required minLength={40} maxLength={10000} rows={5} placeholder="Ceritakan tujuan, penerima manfaat, dan rencana penggunaan dana. Minimal 40 karakter." /></label><label>URL foto sampul <span className="optional">opsional</span><input name="image" type="url" placeholder="https://… (kosongkan untuk foto bawaan)" /></label><div className="policy-note"><ShieldCheck size={19} /><span>Pembuat dapat mencairkan dana saat target tercapai atau waktu berakhir. Dana tetap bisa dicairkan bila target belum tercapai; donasi tidak dapat dikembalikan.</span></div><button className="button primary full" type="submit" disabled={!!busy || !!pending}>{busy ? <LoaderCircle className="spin" size={17} /> : <Plus size={18} />}{busy || (demo ? 'Terbitkan kampanye demo' : 'Terbitkan kampanye di Sepolia')}<Arrow /></button></fieldset>{error && <p role="alert" className="error-message">{error}</p>}</form>;
}

function CampaignDetail({ c, wallet, busy, error, donate, withdraw, onConnect, toast }: { c: Campaign; wallet: WalletState | null; busy: string; error: string; donate: (c: Campaign, amount: string) => Promise<boolean>; withdraw: (c: Campaign) => Promise<void>; onConnect: () => void; toast: (s: string) => void }) {
  const [tab, setTab] = useState('cerita');
  const [amount, setAmount] = useState('0.01');
  const [history, setHistory] = useState<Donation[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const owner = wallet?.address.toLowerCase() === c.creator.toLowerCase() && wallet?.demo === c.demo;
  const canWithdraw = owner && !c.withdrawn && Number(c.raised) > 0 && (Number(c.raised) >= Number(c.target) || daysLeft(c.deadline) === 0);
  const loadHistory = useCallback(async (page?: number) => {
    if (c.demo) return;
    setHistoryLoading(true); setHistoryError('');
    try { const r = await fetch(`/api/campaigns/${c.id}/donations${page !== undefined ? `?cursor=${page}` : ''}`); const data = await r.json(); if (!r.ok) throw new Error(data.error); setHistory(old => page !== undefined ? [...old, ...data.donations] : data.donations); setCursor(data.nextCursor); } catch (e) { setHistoryError(friendlyError(e)); } finally { setHistoryLoading(false); }
  }, [c.demo, c.id]);
  useEffect(() => { if (tab === 'transaksi') loadHistory(); }, [tab, loadHistory, c.raised]);
  const donations = c.demo ? c.donations : history;
  return <div className="detail"><div className="detail-cover"><Photo src={c.image} alt={c.title} /><span className="pill">{c.category} · {c.demo ? 'Kampanye demo' : 'Sepolia'}</span></div><div className="detail-layout"><div className="detail-story"><span className="eyebrow">{c.location}</span><h2>{c.title}</h2><div className="detail-organizer"><span className="organizer-icon">{c.organizer.charAt(0)}</span><div><strong>{c.organizer}</strong><span>{shortAddress(c.creator)}</span></div><ShieldCheck size={18} /></div><div className="detail-tabs"><button className={tab === 'cerita' ? 'selected' : ''} onClick={() => setTab('cerita')}>Cerita kampanye</button><button className={tab === 'transaksi' ? 'selected' : ''} onClick={() => setTab('transaksi')}>Riwayat dukungan</button></div>{tab === 'cerita' ? <div className="story-text">{c.description.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}<div className="policy-note"><ShieldCheck size={18} /><span>{c.demo ? 'Data dan dukungan kampanye ini merupakan simulasi. Tidak ada transaksi ke blockchain.' : 'Transaksi donasi tercatat di Ethereum Sepolia dan dapat ditelusuri melalui Etherscan.'}</span></div></div> : <div className="donation-history">{c.demo && <p className="fine-print">Contoh riwayat dukungan. Transaksi demo tidak memiliki TxHash.</p>}{donations.map((d, i) => <div className="donation-row" key={`${d.hash || d.date}-${i}`}><span className="donor-icon"><Heart size={16} /></span><div><strong>{shortAddress(d.address)}</strong><small>{new Date(d.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</small></div><div><strong>{eth(d.amount)} ETH</strong>{d.hash ? <a href={`https://sepolia.etherscan.io/tx/${d.hash}`} target="_blank" rel="noreferrer">Lihat TxHash <ExternalLink size={11} /></a> : <small>Simulasi</small>}</div></div>)}{!donations.length && !historyLoading && <p className="empty-copy">Belum ada dukungan pada rentang blok ini. Jadilah yang pertama berbagi.</p>}{historyLoading && <p className="busy-message"><LoaderCircle size={16} className="spin" />Memuat transaksi…</p>}{historyError && <div className="error-message">{historyError}<button onClick={() => loadHistory()}>Coba lagi</button></div>}{cursor !== null && <button className="button secondary full" onClick={() => loadHistory(cursor)} disabled={historyLoading}>Telusuri transaksi lebih lama</button>}</div>}</div><aside className="donate-panel"><span className="eyebrow">KEBAIKAN YANG TERKUMPUL</span><div className="detail-raised">{eth(c.raised)} <span>ETH</span></div><p>dari target <strong>{eth(c.target)} ETH</strong></p><div className="progress-track"><span style={{ width: `${progress(c)}%` }} /></div><div className="detail-stats"><span>{progress(c)}% tercapai</span><span><Clock3 size={13} />{daysLeft(c.deadline)} hari lagi</span></div>{c.withdrawn || daysLeft(c.deadline) === 0 ? <div className="success-message"><CheckCheck size={20} /><strong>{c.withdrawn ? 'Dana telah dicairkan' : 'Kampanye telah berakhir'}</strong></div> : <form onSubmit={async e => { e.preventDefault(); const ok = await donate(c, amount); if (ok) { setSuccess(true); setTab('transaksi'); } }}><label className="donate-label">Dukunganmu berarti<input aria-label="Jumlah donasi ETH" type="text" inputMode="decimal" value={amount} onChange={e => { setAmount(e.target.value); setSuccess(false); }} required /></label><div className="preset-amounts">{['0.01', '0.05', '0.1'].map(a => <button type="button" key={a} onClick={() => { setAmount(a); setSuccess(false); }} className={amount === a ? 'selected' : ''}>{a} ETH</button>)}</div>{wallet ? <button className="button primary full" disabled={!!busy} type="submit">{busy ? <LoaderCircle size={17} className="spin" /> : <Heart size={17} />}{busy || (c.demo ? 'Simulasikan donasi' : 'Donasi sekarang')}</button> : <button type="button" className="button primary full" onClick={onConnect}><Wallet size={17} /> Hubungkan wallet</button>}<p className="fine-print center">{c.demo ? 'Saldo simulasi · Tanpa biaya gas' : 'Sepolia ETH · Biaya gas berlaku'}<br />Donasi tidak dapat dikembalikan.</p>{success && <div className="success-message" role="status"><CheckCircle2 size={18} />Dukunganmu berhasil dicatat.</div>}</form>}{owner && <div className="withdraw-section"><strong>Kelola kampanyemu</strong><p>Dana dapat dicairkan saat target tercapai atau batas waktu berakhir.</p><button className="button secondary full" disabled={!canWithdraw || !!busy} onClick={() => withdraw(c)}>Cairkan {eth(c.raised)} ETH <Arrow /></button></div>}{error && <p role="alert" className="error-message">{error}</p>}<div className="trust-note"><ShieldCheck size={16} />{c.demo ? 'Mode demonstrasi RuangBaik' : 'Dicatat langsung di blockchain'}</div></aside></div></div>;
}

function Dashboard({ wallet, campaigns, bookmarks, onOpen, onConnect, onCreate }: { wallet: WalletState | null; campaigns: Campaign[]; bookmarks: string[]; onOpen: (id: string) => void; onConnect: () => void; onCreate: () => void }) {
  const [tab, setTab] = useState('mine');
  if (!wallet) return <div className="empty-state"><Wallet size={36} /><h3>Kebaikanmu, dalam satu tempat.</h3><p>Hubungkan dompet untuk melihat kampanye yang kamu kelola.</p><button className="button primary" onClick={onConnect}>Hubungkan wallet <Arrow /></button></div>;
  const list = campaigns.filter(c => tab === 'saved' ? bookmarks.includes(c.id) : c.creator.toLowerCase() === wallet.address.toLowerCase() && c.demo === wallet.demo);
  return <div className="dashboard"><div className="dashboard-banner"><Wallet size={26} /><div><span>{wallet.demo ? 'Dompet demo' : 'Ethereum Sepolia'}</span><strong>{shortAddress(wallet.address)}</strong></div><b>{eth(wallet.balance)} ETH</b></div><div className="detail-tabs"><button className={tab === 'mine' ? 'selected' : ''} onClick={() => setTab('mine')}>Kampanye saya</button><button className={tab === 'saved' ? 'selected' : ''} onClick={() => setTab('saved')}>Tersimpan</button></div>{list.map(c => <button className="dashboard-row" key={c.id} onClick={() => onOpen(c.id)}><Photo src={c.image} alt="" /><div><strong>{c.title}</strong><span>{eth(c.raised)} / {eth(c.target)} ETH · {c.withdrawn ? 'Dicairkan' : `${daysLeft(c.deadline)} hari lagi`}</span></div><Arrow /></button>)}{!list.length && <p className="empty-copy">{tab === 'mine' ? 'Belum ada kampanye milikmu. Mulai dengan satu ide baik.' : 'Belum ada kampanye tersimpan.'}</p>}<button className="button primary full" onClick={onCreate}><Plus size={17} /> Buat kampanye baru</button></div>;
}

function InfoContent({ type }: { type: string }) {
  if (type === 'privacy') return <div className="info-content"><p>RuangBaik tidak meminta email, kata sandi, private key, atau seed phrase. Koneksi dompet menggunakan persetujuan MetaMask.</p><h3>Data di browser</h3><p>Kampanye, saldo, dan donasi demo serta bookmark disimpan di localStorage perangkat ini. Hapus data situs melalui pengaturan browser untuk menghapusnya.</p><h3>Data publik</h3><p>Dalam mode Sepolia, alamat dompet dan transaksi dapat dilihat publik di blockchain. Judul, cerita, foto, dan nama komunitas disimpan sebagai metadata di PostgreSQL. Jangan memasukkan informasi pribadi sensitif.</p><h3>Layanan eksternal</h3><p>MetaMask, penyedia RPC, dan layanan gambar yang Anda masukkan memiliki kebijakan privasi masing-masing. Foto bawaan disajikan dari website ini.</p></div>;
  if (type === 'terms') return <div className="info-content"><p>RuangBaik adalah prototipe crowdfunding di Ethereum Sepolia. ETH testnet digunakan untuk pengujian dan tidak mewakili donasi uang sungguhan.</p><h3>Aturan pendanaan</h3><p>Hanya pembuat kampanye yang dapat menarik dana. Penarikan diperbolehkan setelah target tercapai atau batas waktu berakhir, termasuk ketika target belum tercapai. Penarikan menutup kampanye. Tidak ada mekanisme pengembalian donasi.</p><h3>Tanggung jawab penggalang</h3><p>Penggalang bertanggung jawab atas isi kampanye dan penggunaan dana setelah pencairan. Blockchain membuktikan transaksi, bukan kebenaran klaim kampanye atau penggunaan dana di luar platform.</p><h3>Mode demo</h3><p>Contoh kampanye, komunitas, dan angka ditampilkan untuk demonstrasi. Semua perubahan demo hanya berlaku di browser Anda.</p></div>;
  return <div className="info-content"><p>RuangBaik menghubungkan niat baik dengan tujuan yang berarti melalui crowdfunding yang terbuka.</p>{[
    ['Apa perbedaan mode demo dan Sepolia?', 'Mode demo menggunakan kampanye contoh dan saldo simulasi di browser. Mode Sepolia menggunakan MetaMask dan smart contract pada jaringan uji Ethereum. Status jaringan tidak berarti data demo telah tercatat di blockchain.'],
    ['Bagaimana cara berdonasi?', 'Hubungkan wallet, pilih kampanye, masukkan nominal ETH, lalu konfirmasi. Untuk mencoba tanpa MetaMask, pilih “Coba dengan dompet demo” pada dialog wallet.'],
    ['Bagaimana memulai kampanye?', 'Klik “Mulai galang dana”, isi cerita, target ETH, dan batas waktu. Di mode Sepolia, konfirmasikan transaksi pembuatan lalu tanda tangani metadata agar cerita tersimpan.'],
    ['Kapan dana dapat dicairkan?', 'Hanya pembuat yang dapat mencairkan dana, setelah target tercapai atau waktu berakhir. Dana tetap dapat dicairkan bila target belum tercapai. Donasi tidak dapat dikembalikan.'],
    ['Apakah setiap transaksi bisa dilihat?', 'Ya, transaksi Sepolia menyediakan tautan TxHash ke Etherscan di tab riwayat dukungan. Transaksi demo ditandai sebagai simulasi dan tidak memiliki TxHash.'],
    ['Apa yang membuatnya transparan?', 'Target, tenggat, jumlah donasi, dan pencairan dicatat oleh smart contract. Cerita serta gambar disimpan terpisah. Transparansi transaksi tidak memverifikasi klaim penggalang.'],
  ].map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}<Plus size={16} /></summary><p>{a}</p></details>)}</div>;
}
