'use client';
import { useRef, useState } from 'react';
import { ImagePlus, Link, LoaderCircle, X } from 'lucide-react';
import { IMAGE_UPLOAD_TYPES, isUploadedImage, MAX_IMAGE_BYTES, normalizeImageUrl } from '@/lib/images';
import { useLanguage } from './language-provider';
import styles from './campaign-image-input.module.css';

export function CampaignImageInput() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const version = useRef(0);
  const preview = mode === 'url' ? normalizeImageUrl(url) : image;

  function selectMode(next: 'url' | 'file') {
    if (next === mode) return;
    version.current++;
    setMode(next);
    setError('');
    setLoading(false);
    setPreviewFailed(false);
    setImage('');
  }

  async function selectFile(input: HTMLInputElement) {
    const current = ++version.current;
    setLoading(false);
    setImage('');
    setError('');
    setPreviewFailed(false);
    input.setCustomValidity('');
    const file = input.files?.[0];
    if (!file) return;
    if (!IMAGE_UPLOAD_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
      const message = t('Pilih file JPG, PNG, atau WebP maksimal 1 MB.');
      input.value = '';
      input.setCustomValidity(message);
      setError(message);
      return;
    }
    setLoading(true);
    input.setCustomValidity(t('Tunggu sampai gambar selesai dibaca.'));
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error(t('Gambar gagal dibaca. Coba pilih file lain.')));
        reader.readAsDataURL(file);
      });
      if (current !== version.current) return;
      if (!isUploadedImage(data)) throw new Error(t('Isi file tidak sesuai format gambar.'));
      setImage(data);
      input.setCustomValidity('');
    } catch (e) {
      if (current !== version.current) return;
      const message = e instanceof Error ? e.message : t('Gambar gagal dibaca. Coba pilih file lain.');
      input.value = '';
      input.setCustomValidity(message);
      setError(message);
    } finally {
      if (current === version.current) setLoading(false);
    }
  }

  return <div className={styles.root}>
    <div className={styles.heading}>{t('Foto sampul')} <span>{t('opsional')}</span></div>
    <div className={styles.choices} role="group" aria-label={t('Sumber gambar')}>
      <button type="button" aria-pressed={mode === 'url'} onClick={() => selectMode('url')}><Link size={16}/>{t('URL gambar')}</button>
      <button type="button" aria-pressed={mode === 'file'} onClick={() => selectMode('file')}><ImagePlus size={16}/>{t('Upload gambar')}</button>
    </div>
    <input type="hidden" name="image" value={mode === 'url' ? url : image}/>
    {mode === 'url' ? <label>{t('URL gambar HTTPS')}<input type="url" value={url} maxLength={2000} onChange={e => { setUrl(e.target.value); setPreviewFailed(false); }} placeholder="https://…"/></label>
      : <label>{t('Pilih gambar dari perangkat')}<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => selectFile(e.currentTarget)}/><span className={styles.help}>{t('JPG, PNG, atau WebP. Maksimal 1 MB.')}</span></label>}
    {loading && <p className="busy-message" role="status"><LoaderCircle size={16} className="spin"/>{t('Membaca gambar…')}</p>}
    {error && <p className="error-message" role="alert">{error}</p>}
    {preview && !previewFailed && <div className={styles.preview}><img key={preview} src={preview} alt={t('Pratinjau foto sampul')} onError={() => { setPreviewFailed(true); if (mode === 'file') { fileRef.current?.setCustomValidity(t('Gambar tidak dapat ditampilkan. Pilih file lain.')); setError(t('Gambar tidak dapat ditampilkan. Pilih file lain.')); } }}/><span>{t('Pratinjau foto sampul')}</span></div>}
    {previewFailed && mode === 'url' && <p className="error-message" role="alert">{t('Gambar tidak dapat ditampilkan. Gunakan URL gambar langsung atau upload dari perangkat.')}</p>}
    {mode === 'file' && image && <button type="button" className={styles.remove} onClick={() => { version.current++; setImage(''); setError(''); setPreviewFailed(false); if (fileRef.current) { fileRef.current.value = ''; fileRef.current.setCustomValidity(''); } }}><X size={14}/>{t('Hapus gambar')}</button>}
    {mode === 'url' && !url && <p className={styles.help}>{t('Kosongkan untuk menggunakan foto bawaan.')}</p>}
  </div>;
}
