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
import { useLanguage } from './language-provider';
import { languageTag, localizedCampaign } from '@/lib/i18n';
type WalletState = {
    address: string;
    balance: string;
    demo: boolean;
};
type View = 'wallet' | 'create' | 'dashboard' | 'guide' | 'about' | 'privacy' | 'terms' | null;
type PendingCampaign = {
    transactionHash: string;
    metadata: ReturnType<typeof metadataSchema.parse>;
    address: string;
};
const STORAGE = 'ruangbaik-demo-v1';
export function RuangBaik() {
    const { language, setLanguage, t } = useLanguage();
    const formatEth = (value: string | number) => eth(value, language);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [mode, setMode] = useState<'demo' | 'live'>('demo');
    const [wallet, setWallet] = useState<WalletState | null>(null);
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [ready, setReady] = useState(false);
    const [view, setView] = useState<View>(null);
    const [walletReturn, setWalletReturn] = useState<{
        campaignId?: string;
        view?: View;
    } | null>(null);
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
        if (!res.ok)
            throw new Error(data.error);
        if (data.mode === 'live') {
            setMode('live');
            setCampaigns(data.campaigns);
        }
        setDataError('');
    }, []);
    useEffect(() => {
        let initial = demoCampaigns();
        try {
            const raw = localStorage.getItem(STORAGE);
            if (raw) {
                const saved = JSON.parse(raw);
                if (Array.isArray(saved.campaigns) && saved.campaigns.length && saved.campaigns.every((c: Campaign) => c.demo && typeof c.id === 'string' && Array.isArray(c.donations)))
                    initial = saved.campaigns;
                if (saved.wallet?.demo && saved.wallet?.address === DEMO_ADDRESS)
                    setWallet(saved.wallet);
            }
            const marks = JSON.parse(localStorage.getItem('ruangbaik-bookmarks') || '[]');
            if (Array.isArray(marks))
                setBookmarks(marks.filter((x: unknown) => typeof x === 'string'));
            const draft = localStorage.getItem('ruangbaik-pending');
            if (draft)
                setPending(JSON.parse(draft));
        }
        catch { /* Storage may be disabled or from an older version. */ }
        setCampaigns(initial);
        setReady(true);
        refresh().catch(e => setDataError(friendlyError(e)));
    }, [refresh]);
    useEffect(() => {
        if (!ready)
            return;
        try {
            if (mode === 'demo')
                localStorage.setItem(STORAGE, JSON.stringify({ campaigns, wallet: wallet?.demo ? wallet : null }));
            localStorage.setItem('ruangbaik-bookmarks', JSON.stringify(bookmarks));
        }
        catch { /* Session remains usable without storage. */ }
    }, [campaigns, wallet, bookmarks, ready, mode]);
    useEffect(() => {
        if (mode !== 'live')
            return;
        const timer = setInterval(() => refresh().catch(e => setDataError(friendlyError(e))), 30000);
        return () => clearInterval(timer);
    }, [mode, refresh]);
    useEffect(() => {
        if (!notice)
            return;
        const timer = setTimeout(() => setNotice(''), 5000);
        return () => clearTimeout(timer);
    }, [notice]);
    useEffect(() => {
        const provider = window.ethereum;
        const changed = () => {
            if (wallet && !wallet.demo) {
                setWallet(null);
                toast('Akun atau jaringan berubah. Hubungkan kembali dompet Anda.');
            }
        };
        provider?.on?.('accountsChanged', changed);
        provider?.on?.('chainChanged', changed);
        return () => { provider?.removeListener?.('accountsChanged', changed); provider?.removeListener?.('chainChanged', changed); };
    }, [wallet, toast]);
    async function handleConnect(demo = false) {
        setError('');
        const finish = () => {
            close();
            if (walletReturn?.campaignId)
                setSelectedId(walletReturn.campaignId);
            else if (walletReturn?.view)
                setView(walletReturn.view);
            setWalletReturn(null);
        };
        if (demo) {
            setWallet({ address: DEMO_ADDRESS, balance: '2.5', demo: true });
            finish();
            toast('Dompet demo terhubung. Anda memiliki 2,5 ETH simulasi.');
            return;
        }
        setBusy('Menghubungkan MetaMask…');
        try {
            const { provider, address } = await connectWallet();
            setWallet({ address, balance: formatEther(await provider.getBalance(address)), demo: false });
            finish();
            toast('Dompet terhubung ke Ethereum Sepolia.');
        }
        catch (e) {
            setError(friendlyError(e));
        }
        finally {
            setBusy('');
        }
    }
    async function updateBalance() {
        if (wallet && !wallet.demo) {
            const { provider, address } = await connectWallet();
            setWallet({ ...wallet, balance: formatEther(await provider.getBalance(address)) });
        }
    }
    function toggleSaved(id: string) { setBookmarks(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]); }
    async function donate(c: Campaign, amount: string) {
        setError('');
        try {
            amountSchema.parse(amount);
            if (!wallet)
                throw new Error('Hubungkan dompet melalui tombol di header sebelum berdonasi.');
            if (c.demo !== wallet.demo)
                throw new Error(c.demo ? t('Kampanye ini adalah contoh. Gunakan dompet demo untuk mencoba donasi.') : t('Gunakan MetaMask untuk mendukung kampanye Sepolia.'));
            if (c.withdrawn || daysLeft(c.deadline) === 0)
                throw new Error('Kampanye sudah berakhir.');
            if (parseEther(amount) > parseEther(wallet.balance))
                throw new Error('Saldo dompet belum cukup untuk donasi ini.');
            setBusy(c.demo ? t('Memproses simulasi…') : t('Konfirmasi donasi di MetaMask…'));
            if (c.demo) {
                setCampaigns(old => old.map(item => item.id === c.id ? { ...item, raised: formatEther(parseEther(item.raised) + parseEther(amount)), donations: [{ address: wallet.address, amount, date: new Date().toISOString() }, ...item.donations] } : item));
                setWallet({ ...wallet, balance: formatEther(parseEther(wallet.balance) - parseEther(amount)) });
                toast('Simulasi donasi berhasil. Terima kasih sudah berbagi kebaikan!');
            }
            else {
                const { contract } = await writeContract(wallet.address);
                const tx = await contract.donateToCampaign(c.id, { value: parseEther(amount) });
                setBusy('Menunggu konfirmasi Sepolia…');
                const receipt = await tx.wait();
                if (!receipt?.status)
                    throw new Error('Transaksi belum berhasil.');
                await refresh();
                await updateBalance();
                toast('Donasi terkonfirmasi di Sepolia. Terima kasih!');
            }
            return true;
        }
        catch (e) {
            setError(friendlyError(e));
            return false;
        }
        finally {
            setBusy('');
        }
    }
    async function withdraw(c: Campaign) {
        if (!wallet)
            return;
        setError('');
        setBusy('Memproses pencairan…');
        try {
            if (wallet.address.toLowerCase() !== c.creator.toLowerCase() || wallet.demo !== c.demo)
                throw new Error('Hanya pembuat kampanye yang dapat mencairkan dana.');
            if (c.withdrawn || Number(c.raised) <= 0 || (daysLeft(c.deadline) > 0 && Number(c.raised) < Number(c.target)))
                throw new Error('Dana dapat dicairkan setelah target tercapai atau batas waktu berakhir.');
            if (c.demo) {
                setCampaigns(old => old.map(item => item.id === c.id ? { ...item, withdrawn: true } : item));
                setWallet({ ...wallet, balance: formatEther(parseEther(wallet.balance) + parseEther(c.raised)) });
            }
            else {
                const { contract } = await writeContract(wallet.address);
                const tx = await contract.withdrawFunds(c.id);
                setBusy('Menunggu konfirmasi Sepolia…');
                await tx.wait();
                await refresh();
                await updateBalance();
            }
            toast(c.demo ? t('Pencairan demo berhasil. Saldo simulasi telah bertambah.') : t('Dana berhasil dicairkan ke dompet pembuat.'));
        }
        catch (e) {
            setError(friendlyError(e));
        }
        finally {
            setBusy('');
        }
    }
    async function saveMetadata(draft: PendingCampaign) {
        const { signer, address } = await connectWallet();
        if (address.toLowerCase() !== draft.address.toLowerCase())
            throw new Error('Gunakan dompet pembuat kampanye untuk menyimpan metadata.');
        setBusy('Tanda tangani metadata di MetaMask…');
        const signature = await signer.signMessage(metadataMessage(draft.transactionHash, draft.metadata, CONTRACT_ADDRESS));
        const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, signature }) });
        const result = await res.json();
        if (!res.ok)
            throw new Error(result.error);
        setPending(null);
        try {
            localStorage.removeItem('ruangbaik-pending');
        }
        catch { }
        await refresh();
        close();
        toast('Kampanye berhasil diterbitkan. Saatnya mengajak lebih banyak orang!');
    }
    async function createCampaign(form: FormData) {
        setError('');
        try {
            if (!wallet)
                throw new Error('Hubungkan dompet terlebih dahulu.');
            const data = campaignFormSchema.parse({ title: form.get('title'), description: form.get('description'), target: form.get('target'), deadline: new Date(String(form.get('deadline'))).toISOString(), category: form.get('category'), image: form.get('image') || '/images/community.jpg', location: form.get('location'), organizer: form.get('organizer') });
            if ((mode === 'demo') !== wallet.demo)
                throw new Error(mode === 'demo' ? t('Gunakan dompet demo. Kontrak dan database Sepolia belum dikonfigurasi.') : t('Hubungkan MetaMask untuk membuat kampanye Sepolia.'));
            setBusy('Membuat kampanye…');
            if (wallet.demo) {
                const c: Campaign = { ...data, id: `demo-${crypto.randomUUID()}`, creator: wallet.address, raised: '0', donations: [], withdrawn: false, demo: true, deadline: new Date(data.deadline).toISOString() };
                setCampaigns(old => [c, ...old]);
                close();
                setSelectedId(c.id);
                toast('Kampanye demo berhasil dibuat dan disimpan di browser.');
            }
            else {
                if (pending)
                    throw new Error('Selesaikan penyimpanan kampanye sebelumnya terlebih dahulu.');
                const { contract } = await writeContract(wallet.address);
                setBusy('Konfirmasi pembuatan di MetaMask…');
                const tx = await contract.createCampaign(parseEther(data.target), Math.floor(Date.parse(data.deadline) / 1000));
                setBusy('Menunggu konfirmasi Sepolia…');
                const receipt = await tx.wait();
                if (!receipt?.status)
                    throw new Error('Transaksi pembuatan kampanye gagal.');
                const draft: PendingCampaign = { transactionHash: tx.hash, metadata: metadataSchema.parse(data), address: wallet.address };
                setPending(draft);
                try {
                    localStorage.setItem('ruangbaik-pending', JSON.stringify(draft));
                }
                catch { }
                await saveMetadata(draft);
            }
        }
        catch (e) {
            const z = e as {
                issues?: {
                    message: string;
                }[];
            };
            setError(z.issues?.[0]?.message || friendlyError(e));
        }
        finally {
            setBusy('');
        }
    }
    const filtered = useMemo(() => campaigns.filter(c => (category === 'Semua' || c.category === category) && (!onlySaved || bookmarks.includes(c.id)) && `${localizedCampaign(c, language).title} ${c.title} ${c.organizer} ${c.location}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'deadline' ? Date.parse(a.deadline) - Date.parse(b.deadline) : sort === 'progress' ? progress(b) - progress(a) : 0), [campaigns, category, onlySaved, bookmarks, search, sort, language]);
    const total = campaigns.reduce((sum, c) => sum + Number(c.raised), 0);
    return <MotionConfig reducedMotion="user"><a className="skip-link" href="#kampanye">{t("Lewati ke kampanye")}</a>
    <header className="header"><div className="container nav"><a href="#" aria-label={t("RuangBaik beranda")}><Logo /></a><nav className="desktop-nav" aria-label={t("Navigasi utama")}><a href="#kampanye" className="active">{t("Jelajahi kampanye")}</a><a href="#cara-kerja">{t("Cara kerja")}</a><a href="#tentang">{t("Tentang kami")}</a></nav><div className="nav-actions"><span className="network"><i /> Sepolia <span>Testnet</span></span><div className="language-switch" role="group" aria-label={t("Pilih bahasa")}><button type="button" lang="id" aria-label="Bahasa Indonesia" aria-pressed={language === "id"} className={language === "id" ? "selected" : ""} onClick={() => setLanguage("id")}>ID</button><button type="button" lang="en" aria-label="English" aria-pressed={language === "en"} className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")}>EN</button></div><button className={`button wallet-button ${wallet ? 'connected' : ''}`} aria-label={wallet ? t("Dompet saya") : t("Hubungkan wallet")} onClick={() => open('wallet')}><Wallet size={17}/>{wallet ? <><span>{shortAddress(wallet.address)}</span><small>{formatEth(wallet.balance)} ETH</small></> : <span className="wallet-label">{t('Hubungkan wallet')}</span>}</button><button className="icon-button mobile-menu" aria-label={menu ? t('Tutup navigasi') : t('Buka navigasi')} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></div></div>{menu && <nav className="mobile-nav" aria-label={t("Navigasi seluler")}><a href="#kampanye" onClick={() => setMenu(false)}>{t("Jelajahi kampanye")}</a><a href="#cara-kerja" onClick={() => setMenu(false)}>{t("Cara kerja")}</a><a href="#tentang" onClick={() => setMenu(false)}>{t("Tentang kami")}</a><button onClick={() => open('dashboard')}>{t("Aktivitas saya")}</button><button onClick={() => open('wallet')}>{wallet ? t('Dompet saya') : t('Hubungkan wallet')}</button></nav>}</header>
    <main>
      <section className="hero grid-paper"><div className="container hero-inner"><Reveal className="hero-copy"><span className="pill"><span className="tiny-star">✳</span>{" " + t("Kebaikan dimulai dari kita")}</span><h1>{t("Langkah kecil.")}<br /><span>{t("Dampak")}</span><br /><span className="hero-last">{t("yang besar.")}<svg viewBox="0 0 330 20" aria-hidden="true"><path d="M3 14C90 1 238 0 325 9M32 18c77-9 177-8 251-5"/></svg></span></h1><p>{t("Ide baik layak jadi nyata. Bersama, kita wujudkan perubahan lewat donasi yang terbuka dan bermakna.")}</p><div className="hero-buttons"><a className="button primary" href="#kampanye">{t("Jelajahi kampanye") + " "}<ArrowUpRight size={18}/></a><button className="text-button" onClick={() => open('create')}>{t("Mulai galang dana") + " "}<ArrowUpRight size={17}/></button></div><div className="hero-proof"><div className="avatar-stack"><span>RA<img src="/images/avatar-1.svg" alt="" onError={e => e.currentTarget.remove()}/></span><span>DN<img src="/images/avatar-2.svg" alt="" onError={e => e.currentTarget.remove()}/></span><span>AL<img src="/images/avatar-3.svg" alt="" onError={e => e.currentTarget.remove()}/></span><span><Heart size={15} fill="currentColor"/></span></div><div><strong>{t("Bergerak bersama, berdampak nyata.")}</strong><span>{t("Setiap kebaikan punya tempat di sini.")}</span></div></div></Reveal>
      <Reveal className="hero-art" delay={.15}><div className="art-orbit"/><Flower className="hero-flower"/><div className="hero-photo-card"><div className="hero-photo"><img src="/images/hero.jpg" alt={t("Relawan bekerja bersama untuk membantu komunitas")} fetchPriority="high"/><span className="photo-label"><span />{" " + t("AKSI KECIL, ARTI BESAR")}</span></div><div className="hero-photo-caption"><span>{t("Untuk hari esok")}<br /><strong>{t("yang lebih baik.")}</strong></span><div className="circle-arrow"><Arrow size={27}/></div></div></div><div className="kindness-sticker"><Heart size={19}/><span>{t("Berbagi itu berarti.")}</span><Arrow size={17}/></div><div className="impact-float"><div className="impact-float-icon"><Leaf size={23}/></div><div><span>{t("SETIAP DUKUNGAN BERARTI")}</span><strong>{t("Dari kita, untuk sesama.")}</strong><div className="mini-progress"><i /></div></div><Flower /></div><div className="verified-float"><ShieldCheck size={19}/><div><strong>{t("Terbuka & transparan")}</strong><span>{t("Didukung teknologi blockchain")}</span></div><Check size={16}/></div><span className="handwritten">{t("Sedikit kebaikan membawa perubahan besar ↗")}</span></Reveal></div><div className="container hero-bottom"><span><ShieldCheck size={15}/>{" " + t("Transparan di setiap langkah")}</span><span><Heart size={15}/>{" " + t("Langsung dari hati, ke tujuan")}</span><a href="#kampanye">{t("Gulir untuk temukan kebaikan") + " "}<ArrowDown size={14}/></a></div></section>
      <section id="kampanye" className="section campaigns-section"><div className="container"><Reveal className="section-heading"><div><span className="eyebrow"><span className="little-line"/>{" " + t("TEMUKAN TUJUANMU")}</span><h2>{t("Banyak cara untuk")}<br />{t("membuat") + " "}<span className="serif">{t("perubahan.")}</span></h2></div><div className="section-heading-right"><p>{t("Temukan cerita yang dekat dengan hatimu.")}<br />{t("Satu dukunganmu bisa membuka banyak harapan.")}</p><button className="text-button" onClick={() => { setCategory('Semua'); setSearch(''); setOnlySaved(false); setShowFilters(!showFilters); }}>{t("Jelajahi semua kampanye") + " "}<Arrow size={17}/></button></div></Reveal>
        <div className="campaign-toolbar"><div className="category-tabs" aria-label={t("Kategori kampanye")}>{categories.map(cat => <button key={cat} className={category === cat ? 'selected' : ''} onClick={() => setCategory(cat)}>{cat === 'Semua' && <span className="tab-grid">⊞</span>}{t(cat)}</button>)}</div><div className="filter-actions"><button className={`icon-button ${onlySaved ? 'is-saved' : ''}`} aria-label={t("Tampilkan kampanye tersimpan")} aria-pressed={onlySaved} onClick={() => setOnlySaved(!onlySaved)}><Bookmark size={18} fill={onlySaved ? 'currentColor' : 'none'}/></button><button className={`filter-button ${showFilters ? 'selected' : ''}`} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}><SlidersHorizontal size={16}/>{" " + t("Filter")}</button></div></div>
        {showFilters && <div className="search-row"><label className="search-field"><Search size={18}/><input type="search" placeholder={t("Cari judul, komunitas, atau lokasi\u2026")} aria-label={t("Cari kampanye")} value={search} onChange={e => setSearch(e.target.value)}/></label><label className="sort-field">{t("Urutkan")}<select value={sort} onChange={e => setSort(e.target.value)}><option value="pilihan">{t("Pilihan untukmu")}</option><option value="deadline">{t("Segera berakhir")}</option><option value="progress">{t("Paling banyak didanai")}</option></select><ChevronDown size={15}/></label></div>}
        <div className="demo-line"><span className="status-dot"/>{mode === 'demo' ? t('Ruang eksplorasi · Kampanye dan angka di bawah adalah data demo.') : t('Ethereum Sepolia · Donasi menggunakan ETH testnet.')}<button onClick={() => open('guide')}>{t("Apa itu?") + " "}<ArrowUpRight size={12}/></button></div>
        {dataError && <div className="error-message">{t(dataError)}<button onClick={() => refresh().catch(e => setDataError(friendlyError(e)))}>{t("Muat ulang")}</button></div>}
        <div className="campaign-grid">{filtered.map((c, i) => <CampaignCard key={c.id} campaign={c} saved={bookmarks.includes(c.id)} onSave={() => toggleSaved(c.id)} onOpen={() => openCampaign(c.id)} index={i}/>)}</div>
        {ready && !filtered.length && <div className="empty-state"><Search size={32}/><h3>{t("Belum ada kampanye di sini.")}</h3><p>{onlySaved ? t('Simpan kampanye dengan menekan ikon bookmark.') : t('Coba kategori lain atau mulai cerita kebaikanmu sendiri.')}</p><button className="button secondary" onClick={() => { setCategory('Semua'); setSearch(''); setOnlySaved(false); }}>{t("Lihat semua kampanye") + " "}<Arrow /></button></div>}
        <div className="campaigns-bottom"><span>{t("Tak harus besar untuk membuat perbedaan.")}</span><button className="text-button" onClick={() => open('create')}>{t("Punya ide baik? Mulai di sini") + " "}<Arrow size={17}/></button></div>
      </div></section>
      <LandingSections total={total} count={campaigns.length} demo={mode === 'demo'} onCreate={() => open('create')} onGuide={() => open('guide')}/>
    </main>
    <footer className="footer grid-paper"><div className="container"><div className="footer-top"><div><span className="eyebrow">{t("SATU LANGKAHMU BERARTI")}</span><h2>{t("Jadi bagian dari")}<br /><span className="serif">{t("perubahan")}</span>{" " + t("baik.")}</h2></div><button className="round-cta" onClick={() => open('create')}>{t("Mulai")}<br />{t("kebaikan") + " "}<ArrowUpRight size={28}/><Flower /></button></div><div className="footer-main"><div className="footer-brand"><a href="#" aria-label={t("Kembali ke atas")}><Logo /></a><p>{t("Ruang bertemunya niat baik")}<br />{t("dan perubahan yang berarti.")}</p><span className="network"><i /> {t("Dibuat untuk kebaikan. Didukung Web3.")}</span></div><div><h4>{t("Jelajahi")}</h4><a href="#kampanye">{t("Semua kampanye")}</a><button onClick={() => open('create')}>{t("Mulai galang dana")}</button><button onClick={() => open('dashboard')}>{t("Aktivitas saya")}</button></div><div><h4>{t("Kenali RuangBaik")}</h4><a href="#tentang">{t("Tentang kami")}</a><a href="#cara-kerja">{t("Cara kerja")}</a><button onClick={() => open('guide')}>{t("Panduan & FAQ")}</button></div><div className="footer-note"><h4>{t("Teknologi untuk kebaikan.")}</h4><p>{t("Setiap dukungan tercatat.")}<br />{t("Setiap langkah bisa ditelusuri.")}</p><span className="footer-badge"><ShieldCheck size={15}/> Ethereum Sepolia Testnet</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {t('RuangBaik. Dibuat untuk perubahan.')}</span><div><button onClick={() => open('privacy')}>{t("Privasi")}</button><button onClick={() => open('terms')}>{t("Ketentuan")}</button><span>{t("Dibuat dengan sepenuh hati") + " "}<Heart size={12}/></span></div></div></div></footer>
    <AnimatePresence>{view && <Modal title={view === 'wallet' ? wallet ? t('Dompet kamu') : t('Mulai dengan dompetmu.') : view === 'create' ? t('Mulai cerita kebaikanmu.') : view === 'dashboard' ? t('Aktivitas saya') : view === 'privacy' ? t('Privasi di RuangBaik') : view === 'terms' ? t('Ketentuan penggunaan') : t('Kebaikan, tanpa tanda tanya.')} onClose={close} wide={view === 'create' || view === 'dashboard'}>
      {view === 'wallet' && <div className="wallet-content">{wallet ? <><div className="wallet-avatar"><Wallet size={30}/></div><span className="pill">{wallet.demo ? t('DOMPET DEMO') : 'ETHEREUM SEPOLIA'}</span><h3 className="wallet-balance">{formatEth(wallet.balance)} <small>ETH</small></h3><button className="address-copy" onClick={() => navigator.clipboard.writeText(wallet.address).then(() => toast('Alamat dompet disalin.')).catch(() => setError(t('Alamat: ') + wallet.address))}>{shortAddress(wallet.address)} <Copy size={15}/></button><button className="button primary full" onClick={() => open('dashboard')}>{t("Lihat aktivitas saya") + " "}<Arrow /></button><button className="button secondary full" onClick={() => { setWallet(null); close(); toast('Dompet diputuskan dari website.'); }}>{t("Putuskan koneksi")}</button></> : <><div className="wallet-illustration"><Wallet size={40}/><Flower /></div><p>{t("Dompet adalah identitasmu. Hubungkan MetaMask untuk mendukung kampanye dan melihat perjalanan donasimu.")}</p><button className="button primary full" disabled={!!busy} onClick={() => handleConnect()}><Wallet size={18}/>{" " + t("Hubungkan MetaMask") + " "}<Arrow /></button><div className="divider-label"><span>{t("atau kenali RuangBaik dulu")}</span></div><button className="button secondary full" disabled={!!busy || mode === 'live'} onClick={() => handleConnect(true)}>{t("Coba dengan dompet demo") + " "}<Arrow /></button><p className="fine-print">{t("Mode demo memakai saldo simulasi dan tidak mengirim transaksi blockchain. MetaMask menggunakan jaringan Sepolia.")}</p><a className="small-link" href="https://metamask.io/download/" target="_blank" rel="noreferrer">{t("Belum punya MetaMask?") + " "}<ExternalLink size={12}/></a></>}{busy && <p className="busy-message"><LoaderCircle className="spin" size={16}/>{t(busy)}</p>}{error && <p className="error-message" role="alert">{t(error)}</p>}</div>}
      {view === 'create' && <>{!wallet ? <div className="empty-state"><Wallet size={36}/><h3>{t("Setiap cerita dimulai dari satu koneksi.")}</h3><p>{t("Hubungkan dompet untuk membuat kampanye pertamamu.")}</p><button className="button primary" onClick={() => open('wallet')}>{t("Hubungkan wallet") + " "}<Arrow /></button></div> : <CampaignForm demo={mode === 'demo'} onSubmit={createCampaign} busy={busy} error={error} pending={pending} onRetry={async () => {
                        if (!pending)
                            return;
                        setError('');
                        try {
                            await saveMetadata(pending);
                        }
                        catch (e) {
                            setError(friendlyError(e));
                        }
                        finally {
                            setBusy('');
                        }
                    }}/>}</>}
      {view === 'dashboard' && <Dashboard wallet={wallet} campaigns={campaigns} bookmarks={bookmarks} onOpen={openCampaign} onConnect={() => open('wallet')} onCreate={() => open('create')}/>}
      {(view === 'guide' || view === 'privacy' || view === 'terms' || view === 'about') && <InfoContent type={view}/>}
    </Modal>}</AnimatePresence>
    <AnimatePresence>{selected && <Modal title={t("Sebuah cerita. Sebuah harapan.")} onClose={close} wide><CampaignDetail key={selected.id} c={selected} wallet={wallet} busy={busy} error={error} donate={donate} withdraw={withdraw} onConnect={() => { setWalletReturn({ campaignId: selected.id }); open('wallet'); }} toast={toast}/></Modal>}</AnimatePresence>
    <AnimatePresence>{notice && <div className="toast" role="status"><CheckCircle2 size={20}/><span>{t(notice)}</span><button className="icon-button" onClick={() => setNotice('')} aria-label={t("Tutup pemberitahuan")}><X size={16}/></button></div>}</AnimatePresence>
  </MotionConfig>;
}
function CampaignCard({ campaign: c, saved, onSave, onOpen, index }: {
    campaign: Campaign;
    saved: boolean;
    onSave: () => void;
    onOpen: () => void;
    index: number;
}) {
    const { language, t } = useLanguage();
    const formatEth = (value: string | number) => eth(value, language);
    c = localizedCampaign(c, language);
    return <Reveal className="campaign-card" delay={index < 3 ? index * .08 : 0}><div className="campaign-image"><button className="image-link" onClick={onOpen} aria-label={`${t('Lihat')} ${c.title}`}><Photo src={c.image} alt={c.title}/></button><span className={`category-badge cat-${c.category.toLowerCase()}`}>{c.category === 'Lingkungan' ? <Leaf size={12}/> : c.category === 'Pendidikan' ? <span>✧</span> : <Heart size={12}/>}{t(c.category)}</span><button className={`bookmark ${saved ? 'saved' : ''}`} aria-label={saved ? t('Hapus dari tersimpan') : t('Simpan kampanye')} aria-pressed={saved} onClick={onSave}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'}/></button><span className="campaign-duration"><Clock3 size={11}/>{c.withdrawn ? t('Dana dicairkan') : daysLeft(c.deadline) ? `${daysLeft(c.deadline)} ${t('hari lagi')}` : t('Berakhir')}</span></div><div className="campaign-body"><div className="organizer"><span className="organizer-icon">{c.organizer.charAt(0)}</span>{c.organizer}<CheckCircle2 size={13}/><span>{c.demo ? 'Demo' : 'Sepolia'}</span></div><button className="campaign-title" onClick={onOpen}><h3>{c.title}</h3></button><div className="funding-line"><span><strong>{formatEth(c.raised)}</strong>{" " + t("ETH terkumpul")}</span><b>{progress(c)}%</b></div><div className="progress-track" role="progressbar" aria-label={`${t('Pendanaan')} ${c.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress(c)}><span style={{ width: `${progress(c)}%` }}/></div><div className="card-bottom"><span>{t("dari target") + " "}<b>{formatEth(c.target)} ETH</b></span><button onClick={onOpen}>{t("Beri dukungan") + " "}<ArrowUpRight size={15}/></button></div></div></Reveal>;
}
function CampaignForm({ demo, onSubmit, busy, error, pending, onRetry }: {
    demo: boolean;
    onSubmit: (data: FormData) => Promise<void>;
    busy: string;
    error: string;
    pending: PendingCampaign | null;
    onRetry: () => void;
}) {
    const { t } = useLanguage();
    return <form className="campaign-form" onSubmit={e => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }}><p className="form-intro">{t("Ceritakan idemu dan ajak orang lain menjadi bagian dari perubahan.") + " "}{demo && <strong>{t("Ini adalah kampanye demo yang tersimpan di browser.")}</strong>}</p>{pending && <div className="pending-message"><strong>{t("Transaksi kampanye sudah berhasil.")}</strong><p>{t("Metadata belum tersimpan. Lanjutkan penyimpanan tanpa membuat transaksi baru.")}</p><a href={`https://sepolia.etherscan.io/tx/${pending.transactionHash}`} target="_blank" rel="noreferrer">{t("Lihat transaksi") + " "}<ExternalLink size={13}/></a><button type="button" className="button secondary" disabled={!!busy} onClick={onRetry}>{t("Simpan metadata")}</button></div>}<fieldset disabled={!!busy || !!pending}><label>{t("Judul kampanye") + " "}<input name="title" required minLength={8} maxLength={120} placeholder={t("Sebuah ide baik untuk perubahan\u2026")}/></label><div className="form-grid"><label>{t("Nama komunitas / penggalang") + " "}<input name="organizer" required minLength={2} maxLength={100} placeholder={t("Nama kamu atau komunitas")}/></label><label>{t("Lokasi") + " "}<input name="location" required minLength={2} maxLength={100} placeholder={t("Kota, Indonesia")}/></label></div><div className="form-grid"><label>{t("Kategori")}<select name="category">{categories.slice(1).map(c => <option key={c}>{t(c)}</option>)}</select></label><label>{t("Target dana (ETH)")}<input name="target" type="text" inputMode="decimal" required placeholder={t("Contoh: 2.5")}/></label></div><label>{t("Batas waktu")}<input name="deadline" type="datetime-local" required min={new Date(Date.now() + 120000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}/></label><label>{t("Cerita di balik kampanye")}<textarea name="description" required minLength={40} maxLength={10000} rows={5} placeholder={t("Ceritakan tujuan, penerima manfaat, dan rencana penggunaan dana. Minimal 40 karakter.")}/></label><label>{t("URL foto sampul") + " "}<span className="optional">{t("opsional")}</span><input name="image" type="url" placeholder={t("https://\u2026 (kosongkan untuk foto bawaan)")}/></label><div className="policy-note"><ShieldCheck size={19}/><span>{t("Pembuat dapat mencairkan dana saat target tercapai atau waktu berakhir. Dana tetap bisa dicairkan bila target belum tercapai; donasi tidak dapat dikembalikan.")}</span></div><button className="button primary full" type="submit" disabled={!!busy || !!pending}>{busy ? <LoaderCircle className="spin" size={17}/> : <Plus size={18}/>}{busy ? t(busy) : (demo ? t('Terbitkan kampanye demo') : t('Terbitkan kampanye di Sepolia'))}<Arrow /></button></fieldset>{error && <p role="alert" className="error-message">{t(error)}</p>}</form>;
}
function CampaignDetail({ c, wallet, busy, error, donate, withdraw, onConnect, toast }: {
    c: Campaign;
    wallet: WalletState | null;
    busy: string;
    error: string;
    donate: (c: Campaign, amount: string) => Promise<boolean>;
    withdraw: (c: Campaign) => Promise<void>;
    onConnect: () => void;
    toast: (s: string) => void;
}) {
    const { language, t } = useLanguage();
    const formatEth = (value: string | number) => eth(value, language);
    c = localizedCampaign(c, language);
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
        if (c.demo)
            return;
        setHistoryLoading(true);
        setHistoryError('');
        try {
            const r = await fetch(`/api/campaigns/${c.id}/donations${page !== undefined ? `?cursor=${page}` : ''}`);
            const data = await r.json();
            if (!r.ok)
                throw new Error(data.error);
            setHistory(old => page !== undefined ? [...old, ...data.donations] : data.donations);
            setCursor(data.nextCursor);
        }
        catch (e) {
            setHistoryError(friendlyError(e));
        }
        finally {
            setHistoryLoading(false);
        }
    }, [c.demo, c.id]);
    useEffect(() => {
        if (tab === 'transaksi')
            loadHistory();
    }, [tab, loadHistory, c.raised]);
    const donations = c.demo ? c.donations : history;
    return <div className="detail"><div className="detail-cover"><Photo src={c.image} alt={c.title}/><span className="pill">{t(c.category)} · {c.demo ? t('Kampanye demo') : 'Sepolia'}</span></div><div className="detail-layout"><div className="detail-story"><span className="eyebrow">{c.location}</span><h2>{c.title}</h2><div className="detail-organizer"><span className="organizer-icon">{c.organizer.charAt(0)}</span><div><strong>{c.organizer}</strong><span>{shortAddress(c.creator)}</span></div><ShieldCheck size={18}/></div><div className="detail-tabs"><button className={tab === 'cerita' ? 'selected' : ''} onClick={() => setTab('cerita')}>{t("Cerita kampanye")}</button><button className={tab === 'transaksi' ? 'selected' : ''} onClick={() => setTab('transaksi')}>{t("Riwayat dukungan")}</button></div>{tab === 'cerita' ? <div className="story-text">{c.description.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}<div className="policy-note"><ShieldCheck size={18}/><span>{c.demo ? t('Data dan dukungan kampanye ini merupakan simulasi. Tidak ada transaksi ke blockchain.') : t('Transaksi donasi tercatat di Ethereum Sepolia dan dapat ditelusuri melalui Etherscan.')}</span></div></div> : <div className="donation-history">{c.demo && <p className="fine-print">{t("Contoh riwayat dukungan. Transaksi demo tidak memiliki TxHash.")}</p>}{donations.map((d, i) => <div className="donation-row" key={`${d.hash || d.date}-${i}`}><span className="donor-icon"><Heart size={16}/></span><div><strong>{shortAddress(d.address)}</strong><small>{new Date(d.date).toLocaleString(languageTag(language), { dateStyle: 'medium', timeStyle: 'short' })}</small></div><div><strong>{formatEth(d.amount)} ETH</strong>{d.hash ? <a href={`https://sepolia.etherscan.io/tx/${d.hash}`} target="_blank" rel="noreferrer">{t("Lihat TxHash") + " "}<ExternalLink size={11}/></a> : <small>{t("Simulasi")}</small>}</div></div>)}{!donations.length && !historyLoading && <p className="empty-copy">{t("Belum ada dukungan pada rentang blok ini. Jadilah yang pertama berbagi.")}</p>}{historyLoading && <p className="busy-message"><LoaderCircle size={16} className="spin"/>{t("Memuat transaksi\u2026")}</p>}{historyError && <div className="error-message">{t(historyError)}<button onClick={() => loadHistory()}>{t("Coba lagi")}</button></div>}{cursor !== null && <button className="button secondary full" onClick={() => loadHistory(cursor)} disabled={historyLoading}>{t("Telusuri transaksi lebih lama")}</button>}</div>}</div><aside className="donate-panel"><span className="eyebrow">{t("KEBAIKAN YANG TERKUMPUL")}</span><div className="detail-raised">{formatEth(c.raised)} <span>ETH</span></div><p>{t("dari target") + " "}<strong>{formatEth(c.target)} ETH</strong></p><div className="progress-track"><span style={{ width: `${progress(c)}%` }}/></div><div className="detail-stats"><span>{progress(c)}{t("% tercapai")}</span><span><Clock3 size={13}/>{daysLeft(c.deadline)}{" " + t("hari lagi")}</span></div>{c.withdrawn || daysLeft(c.deadline) === 0 ? <div className="success-message"><CheckCheck size={20}/><strong>{c.withdrawn ? t('Dana telah dicairkan') : t('Kampanye telah berakhir')}</strong></div> : <form onSubmit={async (e) => {
                e.preventDefault();
                const ok = await donate(c, amount);
                if (ok) {
                    setSuccess(true);
                    setTab('transaksi');
                }
            }}><label className="donate-label">{t("Dukunganmu berarti")}<input aria-label={t("Jumlah donasi ETH")} type="text" inputMode="decimal" value={amount} onChange={e => { setAmount(e.target.value); setSuccess(false); }} required/></label><div className="preset-amounts">{['0.01', '0.05', '0.1'].map(a => <button type="button" key={a} onClick={() => { setAmount(a); setSuccess(false); }} className={amount === a ? 'selected' : ''}>{a} ETH</button>)}</div>{wallet ? <button className="button primary full" disabled={!!busy} type="submit">{busy ? <LoaderCircle size={17} className="spin"/> : <Heart size={17}/>}{busy ? t(busy) : (c.demo ? t('Simulasikan donasi') : t('Donasi sekarang'))}</button> : <button type="button" className="button primary full" onClick={onConnect}><Wallet size={17}/>{" " + t("Hubungkan wallet")}</button>}<p className="fine-print center">{c.demo ? t('Saldo simulasi · Tanpa biaya gas') : t('Sepolia ETH · Biaya gas berlaku')}<br />{t("Donasi tidak dapat dikembalikan.")}</p>{success && <div className="success-message" role="status"><CheckCircle2 size={18}/>{t("Dukunganmu berhasil dicatat.")}</div>}</form>}{owner && <div className="withdraw-section"><strong>{t("Kelola kampanyemu")}</strong><p>{t("Dana dapat dicairkan saat target tercapai atau batas waktu berakhir.")}</p><button className="button secondary full" disabled={!canWithdraw || !!busy} onClick={() => withdraw(c)}>{t("Cairkan") + " "}{formatEth(c.raised)} ETH <Arrow /></button></div>}{error && <p role="alert" className="error-message">{t(error)}</p>}<div className="trust-note"><ShieldCheck size={16}/>{c.demo ? t('Mode demonstrasi RuangBaik') : t('Dicatat langsung di blockchain')}</div></aside></div></div>;
}
function Dashboard({ wallet, campaigns, bookmarks, onOpen, onConnect, onCreate }: {
    wallet: WalletState | null;
    campaigns: Campaign[];
    bookmarks: string[];
    onOpen: (id: string) => void;
    onConnect: () => void;
    onCreate: () => void;
}) {
    const { language, t } = useLanguage();
    const formatEth = (value: string | number) => eth(value, language);
    const [tab, setTab] = useState('mine');
    if (!wallet)
        return <div className="empty-state"><Wallet size={36}/><h3>{t("Kebaikanmu, dalam satu tempat.")}</h3><p>{t("Hubungkan dompet untuk melihat kampanye yang kamu kelola.")}</p><button className="button primary" onClick={onConnect}>{t("Hubungkan wallet") + " "}<Arrow /></button></div>;
    const list = campaigns.filter(c => tab === 'saved' ? bookmarks.includes(c.id) : c.creator.toLowerCase() === wallet.address.toLowerCase() && c.demo === wallet.demo);
    return <div className="dashboard"><div className="dashboard-banner"><Wallet size={26}/><div><span>{wallet.demo ? t('Dompet demo') : 'Ethereum Sepolia'}</span><strong>{shortAddress(wallet.address)}</strong></div><b>{formatEth(wallet.balance)} ETH</b></div><div className="detail-tabs"><button className={tab === 'mine' ? 'selected' : ''} onClick={() => setTab('mine')}>{t("Kampanye saya")}</button><button className={tab === 'saved' ? 'selected' : ''} onClick={() => setTab('saved')}>{t("Tersimpan")}</button></div>{list.map(c => <button className="dashboard-row" key={c.id} onClick={() => onOpen(c.id)}><Photo src={c.image} alt=""/><div><strong>{localizedCampaign(c, language).title}</strong><span>{formatEth(c.raised)} / {formatEth(c.target)} ETH · {c.withdrawn ? t('Dicairkan') : `${daysLeft(c.deadline)} ${t('hari lagi')}`}</span></div><Arrow /></button>)}{!list.length && <p className="empty-copy">{tab === 'mine' ? t('Belum ada kampanye milikmu. Mulai dengan satu ide baik.') : t('Belum ada kampanye tersimpan.')}</p>}<button className="button primary full" onClick={onCreate}><Plus size={17}/>{" " + t("Buat kampanye baru")}</button></div>;
}
function InfoContent({ type }: {
    type: string;
}) {
    const { t } = useLanguage();
    if (type === 'privacy')
        return <div className="info-content"><p>{t("RuangBaik tidak meminta email, kata sandi, private key, atau seed phrase. Koneksi dompet menggunakan persetujuan MetaMask.")}</p><h3>{t("Data di browser")}</h3><p>{t("Kampanye, saldo, dan donasi demo serta bookmark disimpan di localStorage perangkat ini. Hapus data situs melalui pengaturan browser untuk menghapusnya.")}</p><h3>{t("Data publik")}</h3><p>{t("Dalam mode Sepolia, alamat dompet dan transaksi dapat dilihat publik di blockchain. Judul, cerita, foto, dan nama komunitas disimpan sebagai metadata di PostgreSQL. Jangan memasukkan informasi pribadi sensitif.")}</p><h3>{t("Layanan eksternal")}</h3><p>{t("MetaMask, penyedia RPC, dan layanan gambar yang Anda masukkan memiliki kebijakan privasi masing-masing. Foto bawaan disajikan dari website ini.")}</p></div>;
    if (type === 'terms')
        return <div className="info-content"><p>{t("RuangBaik adalah prototipe crowdfunding di Ethereum Sepolia. ETH testnet digunakan untuk pengujian dan tidak mewakili donasi uang sungguhan.")}</p><h3>{t("Aturan pendanaan")}</h3><p>{t("Hanya pembuat kampanye yang dapat menarik dana. Penarikan diperbolehkan setelah target tercapai atau batas waktu berakhir, termasuk ketika target belum tercapai. Penarikan menutup kampanye. Tidak ada mekanisme pengembalian donasi.")}</p><h3>{t("Tanggung jawab penggalang")}</h3><p>{t("Penggalang bertanggung jawab atas isi kampanye dan penggunaan dana setelah pencairan. Blockchain membuktikan transaksi, bukan kebenaran klaim kampanye atau penggunaan dana di luar platform.")}</p><h3>{t("Mode demo")}</h3><p>{t("Contoh kampanye, komunitas, dan angka ditampilkan untuk demonstrasi. Semua perubahan demo hanya berlaku di browser Anda.")}</p></div>;
    return <div className="info-content"><p>{t("RuangBaik menghubungkan niat baik dengan tujuan yang berarti melalui crowdfunding yang terbuka.")}</p>{[
            ['Apa perbedaan mode demo dan Sepolia?', 'Mode demo menggunakan kampanye contoh dan saldo simulasi di browser. Mode Sepolia menggunakan MetaMask dan smart contract pada jaringan uji Ethereum. Status jaringan tidak berarti data demo telah tercatat di blockchain.'],
            ['Bagaimana cara berdonasi?', 'Hubungkan wallet, pilih kampanye, masukkan nominal ETH, lalu konfirmasi. Untuk mencoba tanpa MetaMask, pilih “Coba dengan dompet demo” pada dialog wallet.'],
            ['Bagaimana memulai kampanye?', 'Klik “Mulai galang dana”, isi cerita, target ETH, dan batas waktu. Di mode Sepolia, konfirmasikan transaksi pembuatan lalu tanda tangani metadata agar cerita tersimpan.'],
            ['Kapan dana dapat dicairkan?', 'Hanya pembuat yang dapat mencairkan dana, setelah target tercapai atau waktu berakhir. Dana tetap dapat dicairkan bila target belum tercapai. Donasi tidak dapat dikembalikan.'],
            ['Apakah setiap transaksi bisa dilihat?', 'Ya, transaksi Sepolia menyediakan tautan TxHash ke Etherscan di tab riwayat dukungan. Transaksi demo ditandai sebagai simulasi dan tidak memiliki TxHash.'],
            ['Apa yang membuatnya transparan?', 'Target, tenggat, jumlah donasi, dan pencairan dicatat oleh smart contract. Cerita serta gambar disimpan terpisah. Transparansi transaksi tidak memverifikasi klaim penggalang.'],
        ].map(([q, a], i) => <details key={q} open={i === 0}><summary>{t(q)}<Plus size={16}/></summary><p>{t(a)}</p></details>)}</div>;
}
