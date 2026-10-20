'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';

export function Logo() { return <span className="brand"><span className="brand-symbol"><i /><i /><b /></span>ruang<span>baik</span><small>®</small></span>; }
export function Flower({ className = '' }: { className?: string }) { return <svg className={`flower ${className}`} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M42 0h16v29L79 8l13 13-21 21h29v16H71l21 21-13 13-21-21v29H42V71L21 92 8 79l21-21H0V42h29L8 21 21 8l21 21z" /></svg>; }
export function Arrow({ size = 18 }: { size?: number }) { return <ArrowUpRight size={size} strokeWidth={1.8} />; }
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) { const reduced = useReducedMotion(); return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }} transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>; }
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const nodes = Array.from(ref.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]') || []).filter(el => el.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><motion.div role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} initial={{ opacity: 0, y: 25, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: .22 }}><div className="modal-heading"><div><span className="eyebrow">RUANG UNTUK KEBAIKAN</span><h2>{title}</h2></div><button onClick={onClose} className="icon-button" aria-label="Tutup dialog"><X size={21} /></button></div>{children}</motion.div></motion.div>;
}
export function Photo({ src, alt, className = '' }: { src: string; alt: string; className?: string }) { return <img src={src} alt={alt} className={className} loading="lazy" onError={e => { if (!e.currentTarget.src.endsWith('/images/forest.jpg')) e.currentTarget.src = '/images/forest.jpg'; }} />; }
