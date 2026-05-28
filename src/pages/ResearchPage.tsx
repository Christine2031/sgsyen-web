import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ArrowLeft, Calendar, Tag, Globe,
  ChevronDown, Loader2, Clock, Star, Search, X, Terminal, Copy, Check,
  FileText, Download, Lock,
} from 'lucide-react';
import { research, Article, PolicyEvent, MacroPoint } from '../lib/research';
import { supabase } from '../lib/supabase';
import { useLocale } from '../context/LocaleContext';

const PAGE_SIZE = 8;

// ── Colour maps ──────────────────────────────────────────────
const EVENT_DOT: Record<string, string> = {
  crisis:       'bg-[#C83E3E]',
  policy:       'bg-blue-500',
  geopolitical: 'bg-[#C4A35A]',
  regulation:   'bg-purple-500',
  market:       'bg-emerald-500',
};
const EVENT_TAG: Record<string, string> = {
  crisis:       'text-[#C83E3E] bg-[#C83E3E]/5 border-[#C83E3E]/15',
  policy:       'text-blue-600 bg-blue-50 border-blue-200',
  geopolitical: 'text-[#C4A35A] bg-[#C4A35A]/5 border-[#C4A35A]/20',
  regulation:   'text-purple-600 bg-purple-50 border-purple-200',
  market:       'text-emerald-600 bg-emerald-50 border-emerald-200',
};

const MACRO_CARDS = [
  { id: 'SP500',     zh: '标普 500',   en: 'S&P 500',    unit: 'pts' },
  { id: 'GOLD_USD',  zh: '黄  金',     en: 'Gold',       unit: 'USD' },
  { id: 'DXY',       zh: '美元指数',   en: 'DXY',        unit: 'pts' },
  { id: 'CN_LPR_1Y', zh: 'LPR 1Y',    en: 'CN LPR 1Y',  unit: '%'   },
];

function fmtVal(v: number, unit: string) {
  if (unit === '%') return v.toFixed(2) + '%';
  if (v >= 1000)    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return v.toFixed(2);
}

function fmtDate(iso?: string) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
export default function ResearchPage() {
  const navigate   = useNavigate();
  const { locale } = useLocale();
  const isZh       = locale === 'zh';

  // articles
  const [articles,    setArticles]    = useState<Article[]>([]);
  const [artPage,     setArtPage]     = useState(0);
  const [artTotal,    setArtTotal]    = useState(0);
  const [artLoading,  setArtLoading]  = useState(true);
  const [category,    setCategory]    = useState('all');
  const [categories,  setCategories]  = useState<string[]>([]);

  // events
  const [upcoming,    setUpcoming]    = useState<PolicyEvent[]>([]);
  const [recent,      setRecent]      = useState<PolicyEvent[]>([]);
  const [evLoading,   setEvLoading]   = useState(true);

  // macro
  const [macro,       setMacro]       = useState<Record<string, MacroPoint>>({});
  const [macLoading,  setMacLoading]  = useState(true);

  // search
  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');
  const [showApi,      setShowApi]      = useState(false);
  const [copied,       setCopied]       = useState<string | null>(null);

  // article drawer
  const [selectedArt,  setSelectedArt]  = useState<Article | null>(null);
  const [downloading,  setDownloading]  = useState(false);
  const [dlMsg,        setDlMsg]        = useState<string | null>(null);
  const { authorizedEmail, setShowLoginModal } = useLocale();
  const isMember = !!authorizedEmail;

  const handleDownload = async (slug: string) => {
    if (!isMember) { setShowLoginModal(true); return; }
    setDownloading(true); setDlMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setShowLoginModal(true); setDownloading(false); return; }
      const res = await fetch(
        `https://sgsyen-api-ocjwdme54q-de.a.run.app/reports/${slug}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      const a = document.createElement('a'); a.href = url;
      a.download = `SGSYEN_${slug}.pdf`; a.target = '_blank';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setDlMsg(isZh ? '🎉 PDF 已通过 GCS 安全通道送达。' : '🎉 PDF delivered via secure GCS channel.');
    } catch (err: any) {
      setDlMsg(isZh ? `⚠️ 下载失败：${err.message}` : `⚠️ Failed: ${err.message}`);
    } finally { setDownloading(false); }
  };

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setArticles([]); setArtPage(0); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  // stars (localStorage dedup)
  const [starred, setStarred] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sgsyen_starred') || '[]');
      setStarred(new Set(stored));
    } catch { /* ignore */ }
  }, []);

  const handleStar = useCallback(async (e: React.MouseEvent, artId: string) => {
    e.stopPropagation();
    if (starred.has(artId)) return;
    // optimistic UI
    setArticles(prev => prev.map(a =>
      a.id === artId ? { ...a, star_count: (a.star_count ?? 0) + 1 } : a
    ));
    const next = new Set(starred);
    next.add(artId);
    setStarred(next);
    localStorage.setItem('sgsyen_starred', JSON.stringify([...next]));
    // atomic increment via RPC
    await research.rpc('increment_article_star', { article_id: artId });
  }, [starred]);

  // ── fetch articles ────────────────────────────────────────
  const loadArticles = useCallback(async (page: number, cat: string, kw = '') => {
    setArtLoading(true);
    let q = research
      .from('articles')
      .select('id,no,slug,title,title_en,subtitle,subtitle_en,author,author_en,category,tags,reading_time,published_at,is_published,star_count', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (cat !== 'all') q = q.or(`category.eq.${cat},tags.cs.{"${cat}"}`);
    if (kw) q = q.or(`title.ilike.%${kw}%,title_en.ilike.%${kw}%,tags.cs.{"${kw}"}`);
    const { data, count } = await q;
    if (data) setArticles(prev => page === 0 ? data : [...prev, ...data]);
    if (count != null) setArtTotal(count);
    setArtLoading(false);
  }, []);

  useEffect(() => { setArticles([]); setArtPage(0); loadArticles(0, category, search); }, [category, search, loadArticles]);

  // ── fetch events ─────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      research.from('policy_events').select('*').gte('date', today).order('date', { ascending: true }).limit(5),
      research.from('policy_events').select('*').lt('date', today).order('date', { ascending: false }).limit(4),
    ]).then(([up, re]) => {
      if (up.data) setUpcoming(up.data);
      if (re.data) setRecent(re.data);
      setEvLoading(false);
    });
  }, []);

  // ── fetch macro ───────────────────────────────────────────
  useEffect(() => {
    Promise.all(
      MACRO_CARDS.map(c =>
        research.from('macro_timeseries').select('series_id,series_name,date,value,unit')
          .eq('series_id', c.id).order('date', { ascending: false }).limit(1)
      )
    ).then(results => {
      const map: Record<string, MacroPoint> = {};
      results.forEach((r, i) => { if (r.data?.[0]) map[MACRO_CARDS[i].id] = r.data[0]; });
      setMacro(map);
      setMacLoading(false);
    });
  }, []);

  // ── fetch categories only (筛选条只放分类，tags 在行内) ──
  useEffect(() => {
    research.from('articles').select('category').eq('is_published', true)
      .then(({ data }) => {
        if (data) setCategories([...new Set(data.map(d => d.category).filter(Boolean))]);
      });
  }, []);

  const hasMore = articles.length < artTotal;

  // ─────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-[#FDFCF9] text-[#1D1D1B] min-h-screen font-serif antialiased">

      {/* Top ticker */}
      <div className="bg-[#1D1D1B] text-[#FDFCF9] py-2 px-6 text-center text-[9px] tracking-[0.25em] font-sans font-bold uppercase select-none">
        🏛️ SGSYEN 独立研判系统研究终端 · 全球宏观情报 · 事件驱动分析
      </div>

      <div className="w-full max-w-[1300px] mx-auto border-x border-[#1D1D1B]/10">

        {/* ── Breadcrumb ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-4 border-b border-[#1D1D1B]/10 bg-[#FAF9F5] select-none">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-stone-400 hover:text-[#1D1D1B] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> SGSYEN 首页
          </button>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-[#A58261] tracking-widest uppercase font-bold hidden sm:block">
              {isZh ? '观点与研究 · 全库' : 'Research Hub · Full Archive'}
            </span>
            <button
              onClick={() => setShowApi(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#A58261]/30 text-[9px] font-sans font-bold uppercase tracking-widest text-[#A58261] hover:bg-[#A58261] hover:text-white transition-colors cursor-pointer rounded"
            >
              <Terminal className="w-3 h-3" />
              {isZh ? '研究员 API 接入' : 'Researcher API'}
            </button>
          </div>
        </div>

        {/* ── Hero ─────────────────────────────────────────── */}
        <section
          className="px-6 md:px-12 lg:px-20 py-20 relative overflow-hidden"
          style={{ background: 'linear-gradient(165deg, #111110 0%, #151520 100%)' }}
        >
          {/* ambient */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 75% 25%, rgba(165,130,97,.07) 0%, transparent 55%), radial-gradient(circle at 20% 75%, rgba(200,62,62,.05) 0%, transparent 55%)' }} />

          <div className="relative z-10 max-w-3xl">
            <span className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-[#A58261] mb-4 block">
              SECTION · 04 — {isZh ? '最新出版物 / 观点聚焦' : 'Latest Publications / Viewpoints'}
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-semibold text-[#FDFCF9] leading-[0.95] tracking-tight"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {isZh ? '观点与研究' : 'Viewpoints & Research'}
            </h1>
            <p className="mt-6 font-sans text-sm text-[#FDFCF9]/50 leading-relaxed max-w-xl">
              {isZh
                ? '基于全球20年宏观时序数据、重大政策事件标注与量化情景预测的独立研判体系。数据驱动，事件锚定，叙事穿透。'
                : 'Independent analysis built on 20 years of global macro data, annotated policy events, and scenario-based forecasting.'}
            </p>
            <div className="flex items-center gap-8 mt-8 text-[9px] font-sans font-bold uppercase tracking-widest text-[#FDFCF9]/30">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />46,000+ 宏观数据点</span>
              <span>43 重大事件</span>
              <span>{artTotal > 0 ? artTotal : '—'} 篇深度报告</span>
            </div>
          </div>
        </section>

        {/* ── Macro Snapshot ───────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-20 py-10 border-b border-[#1D1D1B]/10">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#A58261] mb-6 block">
            {isZh ? '宏观快照 · MACRO PULSE' : 'MACRO PULSE'}
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#1D1D1B]/10">
            {MACRO_CARDS.map((card, i) => {
              const pt = macro[card.id];
              return (
                <div key={card.id} className={`p-6 ${i < MACRO_CARDS.length - 1 ? 'border-r border-[#1D1D1B]/10' : ''}`}>
                  <div className="text-[9px] font-sans uppercase tracking-widest text-stone-400 mb-2">
                    {isZh ? card.zh : card.en}
                  </div>
                  {macLoading || !pt
                    ? <div className="h-8 bg-stone-100 animate-pulse rounded w-20" />
                    : <div className="text-2xl md:text-3xl font-serif font-semibold">{fmtVal(pt.value, card.unit)}</div>
                  }
                  {pt && <div className="text-[9px] font-mono text-stone-400 mt-1">{pt.date}</div>}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Event Timeline ───────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-20 py-10 border-b border-[#1D1D1B]/10">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#A58261] mb-6 block">
            {isZh ? '全球事件时间轴 · EVENT CALENDAR' : 'GLOBAL EVENT CALENDAR'}
          </span>

          {evLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#C4A35A] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-[#1D1D1B]/10">

              {/* Upcoming */}
              <div className="border-r border-[#1D1D1B]/10">
                <div className="px-6 py-3 border-b border-[#1D1D1B]/10 bg-[#FAF9F5]">
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> {isZh ? '未来催化剂' : 'Upcoming Catalysts'}
                  </span>
                </div>
                {upcoming.map((ev, i) => (
                  <div key={ev.id}
                    className={`flex gap-4 px-6 py-5 ${i < upcoming.length - 1 ? 'border-b border-[#1D1D1B]/8' : ''} hover:bg-[#FAF9F5] transition-colors`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${EVENT_DOT[ev.event_type] ?? 'bg-stone-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] font-mono text-stone-400">{ev.date}</span>
                        <span className={`text-[8px] font-sans font-bold uppercase px-1.5 py-0.5 border rounded ${EVENT_TAG[ev.event_type] ?? 'text-stone-500 bg-stone-50 border-stone-200'}`}>
                          {ev.event_type}
                        </span>
                        {ev.status === 'predicted' && (
                          <span className="text-[8px] font-mono text-stone-300">{ev.certainty}/5</span>
                        )}
                      </div>
                      <div className="text-sm font-serif font-medium leading-snug">{ev.title}</div>
                      <div className="text-[9px] font-sans text-stone-400 mt-0.5 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />{ev.region} · 影响 {ev.impact_level}/5
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent */}
              <div>
                <div className="px-6 py-3 border-b border-[#1D1D1B]/10 bg-[#FAF9F5]">
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-stone-400">
                    {isZh ? '近期历史节点' : 'Recent History'}
                  </span>
                </div>
                {recent.map((ev, i) => (
                  <div key={ev.id}
                    className={`flex gap-4 px-6 py-5 ${i < recent.length - 1 ? 'border-b border-[#1D1D1B]/8' : ''} hover:bg-[#FAF9F5] transition-colors`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${EVENT_DOT[ev.event_type] ?? 'bg-stone-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] font-mono text-stone-400">{ev.date}</span>
                        <span className={`text-[8px] font-sans font-bold uppercase px-1.5 py-0.5 border rounded ${EVENT_TAG[ev.event_type] ?? 'text-stone-500 bg-stone-50 border-stone-200'}`}>
                          {ev.event_type}
                        </span>
                      </div>
                      <div className="text-sm font-serif font-medium leading-snug">{ev.title}</div>
                      {ev.description && (
                        <div className="text-[10px] font-sans text-stone-400 mt-0.5 leading-relaxed line-clamp-1">
                          {ev.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </section>

        {/* ── Articles ─────────────────────────────────────── */}
        <section className="py-16 px-6 md:px-12 lg:px-20">

          {/* Section header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 select-none">
            <div>
              <span className="block text-[10px] uppercase tracking-[0.25em] mb-3 text-[#A58261] font-sans font-bold">
                {isZh ? '雍彻智库 · SGSYEN INSTITUTE' : 'SGSYEN INSTITUTE'}
              </span>
              <h2 className="text-3xl lg:text-5xl font-serif font-semibold text-[#1D1D1B]"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {isZh ? '雍彻评论' : 'SGSYEN REVIEW'}
              </h2>
            </div>
            {/* Search + Category Filter */}
            <div className="flex flex-col gap-3 items-end">
              {/* Search box */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder={isZh ? '搜索标题 · 标签...' : 'Search title, tags...'}
                  className="w-full pl-8 pr-8 py-2 text-[11px] font-sans border border-[#1D1D1B]/15 bg-white text-[#1D1D1B] placeholder:text-stone-300 focus:outline-none focus:border-[#A58261] transition-colors"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-300 hover:text-[#1D1D1B] cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 justify-end">
                {['all', ...categories].map(cat => (
                  <button key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-[9px] font-sans font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors cursor-pointer ${
                      category === cat
                        ? 'bg-[#1D1D1B] text-[#FDFCF9] border-[#1D1D1B]'
                        : 'border-[#1D1D1B]/15 text-stone-500 hover:border-stone-400 hover:text-[#1D1D1B]'
                    }`}
                  >
                    {cat === 'all' ? (isZh ? '全部' : 'All') : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Search hint */}
          {search && (
            <div className="mb-6 text-[10px] font-sans text-stone-400">
              {isZh ? `关键词「${search}」共找到 ${artTotal} 篇` : `"${search}" — ${artTotal} result${artTotal !== 1 ? 's' : ''}`}
            </div>
          )}

          {/* Article rows — matches SgsyenReports layout */}
          {artLoading && articles.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <Loader2 className="w-7 h-7 text-[#C4A35A] animate-spin" />
              <p className="text-xs text-stone-400 font-sans tracking-widest uppercase">
                {isZh ? '正在调阅研究档案...' : 'Loading research archive...'}
              </p>
            </div>
          ) : (
            <div className="border-t border-[#1D1D1B]/10">
              {articles.length === 0 && !artLoading && (
                <div className="py-24 text-center border-b border-[#1D1D1B]/10">
                  <p className="text-stone-400 text-sm font-sans">
                    {isZh ? '该分类暂无出版物。' : 'No publications in this category yet.'}
                  </p>
                </div>
              )}

              {articles.map((art, index) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => { setSelectedArt(art); setDlMsg(null); }}
                  className="group flex flex-col md:flex-row gap-6 md:gap-8 py-10 border-b border-[#1D1D1B]/10 hover:bg-[#FAF9F5] transition-all duration-300 px-4 cursor-pointer"
                >
                  {/* Serial number column */}
                  <div className="w-32 shrink-0 flex flex-col justify-start">
                    <span className="text-[10px] font-mono font-bold text-[#C83E3E] tracking-widest">
                      NO. {String(art.no ?? index + 1).padStart(3, '0')}
                    </span>
                    <span className="text-[11px] text-stone-400 font-sans mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {fmtDate(art.published_at)}
                    </span>
                    {art.reading_time && (
                      <span className="text-[10px] text-stone-400 font-sans mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{art.reading_time} min
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    {/* Category + all tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {art.category && (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase font-sans font-bold text-[#C83E3E] bg-[#C83E3E]/5 border border-[#C83E3E]/10 px-2 py-0.5 rounded">
                          <Tag className="w-3 h-3" />{art.category}
                        </span>
                      )}
                      {art.tags?.map(tag => (
                        <button
                          key={tag}
                          onClick={e => { e.stopPropagation(); setCategory(tag); setArticles([]); setArtPage(0); loadArticles(0, tag); }}
                          className="text-[9px] font-sans text-[#A58261] bg-[#A58261]/5 border border-[#A58261]/15 px-2 py-0.5 rounded hover:bg-[#A58261]/15 transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-[#1D1D1B] group-hover:text-[#C4A35A] transition-colors leading-[1.3] mb-3"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {isZh ? art.title : (art.title_en || art.title)}
                    </h3>
                    {(art.subtitle || art.subtitle_en) && (
                      <p className="text-stone-500 font-sans text-xs leading-[1.8] line-clamp-2 font-light">
                        {isZh ? art.subtitle : (art.subtitle_en || art.subtitle)}
                      </p>
                    )}
                    {art.author && (
                      <div className="mt-3 text-[10px] font-sans text-stone-400 uppercase tracking-wider">
                        {isZh ? art.author : (art.author_en || art.author)}
                      </div>
                    )}
                  </div>

                  {/* Star + Arrow CTA */}
                  <div className="flex items-center gap-3 justify-end md:justify-center shrink-0">
                    <button
                      onClick={(e) => handleStar(e, art.id)}
                      title={isZh ? '标星收藏' : 'Star this'}
                      className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                        starred.has(art.id)
                          ? 'text-[#C4A35A]'
                          : 'text-stone-300 hover:text-[#C4A35A]'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${starred.has(art.id) ? 'fill-[#C4A35A]' : ''}`} />
                      <span className="text-[9px] font-mono">{art.star_count ?? 0}</span>
                    </button>
                    <span className="w-10 h-10 rounded-full border border-[#1D1D1B]/15 flex items-center justify-center text-stone-400 group-hover:bg-[#1D1D1B] group-hover:text-white group-hover:border-transparent transition-all duration-300">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="py-10 text-center">
                  <button
                    onClick={() => { const next = artPage + 1; setArtPage(next); loadArticles(next, category, search); }}
                    disabled={artLoading}
                    className="inline-flex items-center gap-2 px-8 py-3 border border-[#1D1D1B] text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-[#1D1D1B] hover:text-[#FDFCF9] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {artLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <ChevronDown className="w-3.5 h-3.5" />
                    }
                    {isZh ? `加载更多 · 还有 ${artTotal - articles.length} 篇` : `Load More · ${artTotal - articles.length} remaining`}
                  </button>
                </div>
              )}

              {!hasMore && articles.length > 0 && (
                <div className="py-10 text-center text-[9px] font-sans uppercase tracking-widest text-stone-300">
                  ── {isZh ? `已加载全部 ${artTotal} 篇报告` : `All ${artTotal} reports loaded`} ──
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer className="px-6 md:px-12 lg:px-20 py-8 border-t border-[#1D1D1B]/10 flex flex-col sm:flex-row justify-between items-center bg-[#FAF9F5] gap-4 select-none">
          <div className="text-[10px] font-sans tracking-widest uppercase text-stone-500">
            © 2020 – 2026 SGSYEN 智库研究中心 · 庙街数字重建委员会
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-stone-400">
              gsyen-research · LIVE
            </span>
          </div>
        </footer>
      </div>

      {/* ── 文章阅读抽屉 ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedArt && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-md z-[600] flex justify-end"
            onClick={() => setSelectedArt(null)}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.45, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[850px] bg-[#FDFCF9] h-screen shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer header */}
              <div className="px-8 md:px-10 py-5 border-b border-[#1D1D1B]/10 flex justify-between items-center bg-[#FAF9F5]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C4A35A]" />
                  <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-stone-500">
                    {isZh ? 'SGSYEN 雍彻评论 · 研究档案' : 'SGSYEN REVIEW · Research Archive'}
                  </span>
                </div>
                <button onClick={() => setSelectedArt(null)} className="p-1.5 hover:bg-stone-200/50 rounded-full text-stone-500 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-8 md:px-12 py-10">
                <div className="max-w-[680px] mx-auto">
                  {/* Category + tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {selectedArt.category && (
                      <span className="text-[9px] uppercase font-sans font-bold text-[#C83E3E] bg-[#C83E3E]/5 border border-[#C83E3E]/10 px-2.5 py-0.5 rounded">
                        {selectedArt.category}
                      </span>
                    )}
                    {selectedArt.tags?.map(t => (
                      <span key={t} className="text-[9px] font-sans text-[#A58261] bg-[#A58261]/5 border border-[#A58261]/15 px-2 py-0.5 rounded">{t}</span>
                    ))}
                    <span className="text-stone-400 text-xs font-sans flex items-center gap-1 ml-1">
                      <Calendar className="w-3.5 h-3.5" />{fmtDate(selectedArt.published_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl font-serif font-black leading-[1.3] text-[#1D1D1B] mb-2"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {isZh ? selectedArt.title : (selectedArt.title_en || selectedArt.title)}
                  </h1>
                  {(selectedArt.subtitle || selectedArt.subtitle_en) && (
                    <p className="text-[#A58261] font-sans font-light leading-relaxed mb-6 text-sm">
                      {isZh ? selectedArt.subtitle : (selectedArt.subtitle_en || selectedArt.subtitle)}
                    </p>
                  )}
                  {selectedArt.author && (
                    <div className="text-[10px] font-sans uppercase tracking-widest text-stone-400 mb-8">
                      {isZh ? selectedArt.author : (selectedArt.author_en || selectedArt.author)}
                    </div>
                  )}

                  <hr className="border-[#1D1D1B]/10 mb-8" />

                  {/* Summary callout */}
                  {(selectedArt as any).summary && (
                    <div className="p-5 border-l-4 border-[#C4A35A] bg-[#FAF9F5] mb-8">
                      <p className="text-[10px] font-sans tracking-widest font-bold text-[#A58261] uppercase mb-2">
                        {isZh ? '研究摘要' : 'EXECUTIVE SUMMARY'}
                      </p>
                      <p className="text-xs font-sans leading-relaxed text-stone-600 italic">{(selectedArt as any).summary}</p>
                    </div>
                  )}

                  {/* Content or placeholder */}
                  {(selectedArt as any).content ? (
                    <div className="text-sm font-sans leading-[1.9] text-stone-700 whitespace-pre-wrap">
                      {(selectedArt as any).content}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-[#FAF9F5] border border-[#1D1D1B]/8 rounded">
                      <Lock className="w-6 h-6 text-stone-300 mx-auto mb-3" />
                      <p className="text-xs text-stone-400 font-sans">
                        {isZh ? '完整正文内容即将上线，敬请期待。' : 'Full report content coming soon.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* PDF download footer */}
              <div className="border-t border-[#1D1D1B]/10 px-8 md:px-12 py-6 bg-[#FAF9F5]">
                <div className="max-w-[680px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-serif font-bold text-[#1D1D1B] flex items-center gap-1.5 mb-1">
                      <Lock className="w-3.5 h-3.5 text-[#C4A35A]" />
                      {isZh ? '会员专属 PDF 完整报告下载' : 'Member PDF Download'}
                    </h4>
                    <p className="text-[10px] text-stone-400 font-sans">
                      {isZh ? '认购会员登录后可获取 GCS 安全通道原件印本。' : 'Sign in as a subscriber to download via secure GCS.'}
                    </p>
                  </div>
                  {!isMember ? (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="px-4 py-2 text-[10px] font-bold font-sans tracking-widest uppercase border border-[#A58261]/30 text-[#A58261] hover:bg-[#A58261] hover:text-white transition-colors rounded cursor-pointer shrink-0"
                    >
                      🔑 {isZh ? '会员登录' : 'Sign In'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownload(selectedArt.slug)}
                      disabled={downloading}
                      className="flex items-center gap-2 px-5 py-2 bg-[#1D1D1B] text-[#FDFCF9] text-[10px] font-bold font-sans tracking-widest uppercase hover:bg-[#C4A35A] transition-colors rounded cursor-pointer disabled:opacity-40 shrink-0"
                    >
                      {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      {isZh ? '下载 PDF' : 'Download PDF'}
                    </button>
                  )}
                </div>
                {dlMsg && (
                  <div className="max-w-[680px] mx-auto mt-3 text-xs font-sans text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                    {dlMsg}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── API 接入文档抽屉 ──────────────────────────────── */}
      <AnimatePresence>
        {showApi && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[700] flex justify-end"
            onClick={() => setShowApi(false)}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[680px] h-screen bg-[#0D0D0C] text-[#E8E4DC] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-[#C4A35A]" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#C4A35A]">
                    GSYEN RESEARCH · API 接入文档
                  </span>
                </div>
                <button onClick={() => setShowApi(false)} className="text-white/40 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 text-sm font-mono">

                {/* Status */}
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold">PUBLIC · 公开读写阶段</span>
                  <span className="text-white/25 ml-2">下月起切换为研究员认证模式</span>
                </div>

                {/* Connection */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#A58261] mb-3 font-sans font-bold">连接信息 · Connection</div>
                  <div className="bg-[#161614] border border-white/8 rounded p-4 space-y-3">
                    {[
                      { label: 'URL', val: 'https://rrwmftbykbwuexietehj.supabase.co' },
                      { label: 'ANON KEY', val: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyd21mdGJ5a2J3dWV4aWV0ZWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzAxNTcsImV4cCI6MjA5NTU0NjE1N30.XWgHIzgPaNXw5ok79XGkUTqAL-Nz4z4VWwzxpFsX25s' },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-start gap-3">
                        <span className="text-[9px] text-[#A58261] w-20 shrink-0 pt-0.5 uppercase">{label}</span>
                        <code className="text-[10px] text-emerald-300 break-all leading-relaxed flex-1">{val}</code>
                        <button onClick={() => copyText(val, label)} className="shrink-0 text-white/30 hover:text-[#C4A35A] transition-colors cursor-pointer mt-0.5">
                          {copied === label ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Python example */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#A58261] mb-3 font-sans font-bold">Python 快速接入</div>
                  <div className="relative bg-[#161614] border border-white/8 rounded p-4">
                    <button onClick={() => copyText(`from supabase import create_client\nimport pandas as pd\n\nURL = "https://rrwmftbykbwuexietehj.supabase.co"\nKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n\nsb = create_client(URL, KEY)\n\n# 宏观时序数据\ndf = pd.DataFrame(\n    sb.table("macro_timeseries")\n      .select("*")\n      .eq("series_id", "SP500")\n      .order("date")\n      .execute().data\n)\n\n# 政策事件\nevents = sb.table("policy_events").select("*").execute()`, 'python')}
                      className="absolute top-3 right-3 text-white/25 hover:text-[#C4A35A] cursor-pointer transition-colors"
                    >
                      {copied === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="text-[11px] leading-relaxed overflow-x-auto text-[#E8E4DC]/80 whitespace-pre">{`from supabase import create_client
import pandas as pd

URL = "https://rrwmftbykbwuexietehj.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

sb = create_client(URL, KEY)

# 宏观时序数据
df = pd.DataFrame(
    sb.table("macro_timeseries")
      .select("*")
      .eq("series_id", "SP500")
      .order("date")
      .execute().data
)

# 政策事件
events = sb.table("policy_events").select("*").execute()`}</pre>
                  </div>
                </div>

                {/* Tables */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#A58261] mb-3 font-sans font-bold">可用数据表 · Tables</div>
                  <div className="bg-[#161614] border border-white/8 rounded overflow-hidden">
                    {[
                      { name: 'macro_timeseries', desc: '46,000+ 宏观时序 · SP500 / 黄金 / LPR / CPI ...', badge: 'READ' },
                      { name: 'policy_events',    desc: '历史 + 预测政策事件，含 certainty 1–5 评分',    badge: 'READ' },
                      { name: 'articles',         desc: '雍彻评论发布文章，含 star_count',               badge: 'READ' },
                      { name: 'predictions',      desc: '量化预测写入通道，供研究员 INSERT 模型结果',     badge: 'WRITE' },
                    ].map(({ name, desc, badge }, i, arr) => (
                      <div key={name} className={`flex items-start gap-4 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-white/6' : ''}`}>
                        <code className="text-emerald-300 text-[11px] w-44 shrink-0">{name}</code>
                        <span className="text-white/40 text-[10px] leading-relaxed flex-1">{desc}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${badge === 'WRITE' ? 'text-blue-300 bg-blue-500/15' : 'text-emerald-300 bg-emerald-500/10'}`}>{badge}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coming soon */}
                <div className="border border-[#A58261]/20 rounded p-5 bg-[#A58261]/5">
                  <div className="text-[10px] uppercase tracking-widest text-[#A58261] mb-2 font-sans font-bold">🔑 研究员认证 · 即将开放</div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    下期将开放「研究员」成员等级。认证后获得专属 API Token，可写入 predictions 表并订阅实时数据推送。
                    如有合作意向，请联系 <span className="text-[#C4A35A]">Ethan7586@gsyen.com</span>
                  </p>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
