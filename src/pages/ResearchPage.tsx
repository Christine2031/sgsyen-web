import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight, ArrowLeft, Calendar, Tag, Globe,
  ChevronDown, Loader2, Clock, Star,
} from 'lucide-react';
import { research, Article, PolicyEvent, MacroPoint } from '../lib/research';
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
  const loadArticles = useCallback(async (page: number, cat: string) => {
    setArtLoading(true);
    let q = research
      .from('articles')
      .select('id,no,slug,title,title_en,subtitle,subtitle_en,author,author_en,category,tags,reading_time,published_at,is_published,star_count', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (cat !== 'all') q = q.or(`category.eq.${cat},tags.cs.{"${cat}"}`);
    const { data, count } = await q;
    if (data) setArticles(prev => page === 0 ? data : [...prev, ...data]);
    if (count != null) setArtTotal(count);
    setArtLoading(false);
  }, []);

  useEffect(() => { setArticles([]); setArtPage(0); loadArticles(0, category); }, [category, loadArticles]);

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
          <span className="text-[10px] font-mono text-[#A58261] tracking-widest uppercase font-bold">
            {isZh ? '观点与研究 · 全库' : 'Research Hub · Full Archive'}
          </span>
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 select-none">
            <div>
              <span className="block text-[10px] uppercase tracking-[0.25em] mb-3 text-[#A58261] font-sans font-bold">
                {isZh ? '雍彻智库 · SGSYEN INSTITUTE' : 'SGSYEN INSTITUTE'}
              </span>
              <h2 className="text-3xl lg:text-5xl font-serif font-semibold text-[#1D1D1B]"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {isZh ? '雍彻评论' : 'SGSYEN REVIEW'}
              </h2>
            </div>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
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
                  onClick={() => navigate(`/research/${art.slug}`)}
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
                    onClick={() => { const next = artPage + 1; setArtPage(next); loadArticles(next, category); }}
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
    </div>
  );
}
