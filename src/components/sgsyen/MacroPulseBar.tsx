import React, { useState, useEffect } from 'react';
import { Solar } from 'lunar-typescript';
import { research, MacroPoint } from '../../lib/research';
import { useLocale } from '../../context/LocaleContext';

// ── 15 market indicators ─────────────────────────────────────
const MACRO_CARDS = [
  { id: 'SP500',        zh: '标普 500',  en: 'S&P 500',    unit: 'pts' },
  { id: 'NASDAQ100',    zh: '纳指 100',  en: 'Nasdaq 100', unit: 'pts' },
  { id: 'CSI300',       zh: '沪深 300',  en: 'CSI 300',    unit: 'pts' },
  { id: 'HSI',          zh: '恒生指数',  en: 'Hang Seng',  unit: 'pts' },
  { id: 'NIKKEI225',    zh: '日经 225',  en: 'Nikkei 225', unit: 'pts' },
  { id: 'GOLD_USD',     zh: '黄金',      en: 'Gold',       unit: 'USD' },
  { id: 'WTI_OIL',      zh: 'WTI 原油',  en: 'WTI Oil',    unit: 'USD' },
  { id: 'COPPER',       zh: '铜',        en: 'Copper',     unit: 'USD' },
  { id: 'DXY',          zh: '美元指数',  en: 'DXY',        unit: 'pts' },
  { id: 'VIX',          zh: 'VIX 恐慌',  en: 'VIX',        unit: 'pts' },
  { id: 'US10Y',        zh: '美债 10Y',  en: 'US 10Y',     unit: '%'   },
  { id: 'US3M',         zh: '美债 3M',   en: 'US 3M',      unit: '%'   },
  { id: 'FEDFUNDS',     zh: '联邦基金',  en: 'Fed Funds',  unit: '%'   },
  { id: 'CN_LPR_1Y',    zh: 'LPR 1Y',   en: 'CN LPR 1Y',  unit: '%'   },
  { id: 'BAMLH0A0HYM2', zh: 'HY 利差',   en: 'HY Spread',  unit: 'bp'  },
];

function fmtVal(v: number, unit: string) {
  if (unit === '%') return v.toFixed(2) + '%';
  if (v >= 1000)    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return v.toFixed(2);
}

// ── Lunar / calendar helpers ─────────────────────────────────

/**
 * Returns the calendar label for a given date with this priority:
 *   1. Solar term name (节气) if today IS one  — e.g. 小满
 *   2. Festival name (节日)                     — e.g. 端午节
 *   3. Current solar term period (look back ≤15d) — e.g. 小满
 *   4. Lunar date fallback                      — e.g. 四月十三
 */
function getCalendarLabel(date: Date): string {
  try {
    const solar = Solar.fromDate(date);
    const lunar  = solar.getLunar();

    // 1. Festival (节日) — highest priority
    const fests = [
      ...(lunar.getFestivals()      || []),
      ...(lunar.getOtherFestivals() || []),
      ...(solar.getFestivals()      || []),
      ...(solar.getOtherFestivals() || []),
    ];
    if (fests.length > 0) return fests[0];

    // 2. Solar term (节气) — exact day only
    const jieqi = lunar.getJieQi();
    if (jieqi) return jieqi;

    // 3. Lunar day — 初几
    return lunar.getDayInChinese();
  } catch {
    return '';
  }
}

/** Formats like macOS menu bar:  Fri  May 29  3:47 PM */
function fmtClock(date: Date) {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(date);
  return { weekday, monthDay, time };
}

// ── Component ────────────────────────────────────────────────
export default function MacroPulseBar() {
  const { locale } = useLocale();
  const isZh = locale === 'zh';

  const [macro,      setMacro]      = useState<Record<string, MacroPoint>>({});
  const [macLoading, setMacLoading] = useState(true);
  const [now,        setNow]        = useState(new Date());
  const [calendar,   setCalendar]   = useState('');

  // ── live clock — updates every minute ───────────────────
  useEffect(() => {
    setCalendar(getCalendarLabel(new Date()));
    const tick = setInterval(() => {
      const d = new Date();
      setNow(d);
      // Recalculate calendar label only once a day is fine, but cheap enough per minute
      setCalendar(getCalendarLabel(d));
    }, 60_000);
    return () => clearInterval(tick);
  }, []);

  // ── fetch latest macro values ────────────────────────────
  useEffect(() => {
    Promise.all(
      MACRO_CARDS.map(c =>
        research
          .from('macro_timeseries')
          .select('series_id,series_name,date,value,unit')
          .eq('series_id', c.id)
          .order('date', { ascending: false })
          .limit(1)
      )
    ).then(results => {
      const map: Record<string, MacroPoint> = {};
      results.forEach((r, i) => { if (r.data?.[0]) map[MACRO_CARDS[i].id] = r.data[0]; });
      setMacro(map);
      setMacLoading(false);
    });
  }, []);

  const doubled = [...MACRO_CARDS, ...MACRO_CARDS];
  const { weekday, monthDay, time } = fmtClock(now);

  return (
    <div
      className="w-full overflow-hidden select-none"
      style={{ background: '#111110' }}
    >
      {/* ── Row 1: Scrolling price ticker ───────────────── */}
      <div className="flex items-stretch border-b border-white/5">

        {/* Gold label */}
        <div
          className="shrink-0 flex items-center px-4 py-2.5 z-10"
          style={{ background: '#C4A35A' }}
        >
          <span className="text-[8px] font-sans font-black uppercase tracking-[0.25em] text-[#111110] whitespace-nowrap">
            MACRO PULSE
          </span>
        </div>

        <div className="shrink-0 w-px self-stretch bg-white/10" />

        {/* Scrolling track */}
        <div className="flex-1 overflow-hidden">
          <div
            className="inline-flex whitespace-nowrap"
            style={{
              animation: macLoading ? 'none' : 'macro-ticker 55s linear infinite',
              willChange: 'transform',
            }}
          >
            {doubled.map((card, i) => {
              const pt = macro[card.id];
              return (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border-r border-white/6"
                >
                  <span className="text-[8px] font-sans uppercase tracking-widest text-white/35">
                    {isZh ? card.zh : card.en}
                  </span>
                  {macLoading || !pt
                    ? <span className="w-10 h-2.5 rounded bg-white/8 animate-pulse inline-block" />
                    : <span className="text-[13px] font-mono font-semibold text-[#C4A35A]">
                        {fmtVal(pt.value, card.unit)}
                      </span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 2: Clock + calendar strip ───────────────── */}
      <div
        className="flex items-center px-4 py-1.5 gap-3 border-b border-white/5"
        style={{ background: '#0e0e0c' }}
      >
        {/* macOS-style clock */}
        <span className="text-[11px] font-mono text-white/50 tracking-wide">
          {weekday}
        </span>
        <span className="text-[11px] font-mono text-white/70 tracking-wide">
          {monthDay}
        </span>
        <span className="text-[11px] font-mono text-white/50 tracking-wide">
          {time}
        </span>

        {/* Divider */}
        {calendar && (
          <>
            <span className="text-white/15 text-[10px]">·</span>
            {/* Calendar label: solar term / festival / lunar date */}
            <span className="text-[11px] font-sans text-[#C4A35A]/80 tracking-widest">
              {calendar}
            </span>
          </>
        )}
      </div>

      <style>{`
        @keyframes macro-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
