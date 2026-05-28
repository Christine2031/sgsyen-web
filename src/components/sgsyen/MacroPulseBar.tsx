import React, { useState, useEffect } from 'react';
import { research, MacroPoint } from '../../lib/research';
import { useLocale } from '../../context/LocaleContext';

// ── 15 market indicators ──────────────────────────────────────
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

interface RegimeData {
  zh: string;
  en: string;
  signal: string;
  fed: number;
  inflation: string;
}

export default function MacroPulseBar() {
  const { locale } = useLocale();
  const isZh = locale === 'zh';

  const [macro,      setMacro]      = useState<Record<string, MacroPoint>>({});
  const [macLoading, setMacLoading] = useState(true);
  const [regime,     setRegime]     = useState<RegimeData | null>(null);

  // ── fetch macro from Supabase ─────────────────────────────
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

  // ── fetch regime from GSYEN TERMINAL ─────────────────────
  useEffect(() => {
    fetch('https://terminal.gsyen.com/api/regime')
      .then(r => r.json())
      .then(d => setRegime({
        zh:        d.regime.zh,
        en:        d.regime.en,
        signal:    d.regime.signal,
        fed:       d.inputs.fed_funds_rate,
        inflation: d.inputs.inflation_direction,
      }))
      .catch(() => {});
  }, []);

  // ── build the combined ticker item list ───────────────────
  // Regime items (only when available)
  type TickerItem =
    | { kind: 'regime-label'; label: string; value: string }
    | { kind: 'regime-signal'; label: string; value: string }
    | { kind: 'regime-stat';   label: string; value: string }
    | { kind: 'macro';         label: string; id: string; unit: string };

  const regimeItems: TickerItem[] = regime
    ? [
        { kind: 'regime-label',  label: isZh ? '宏观象限' : 'REGIME',  value: isZh ? regime.zh : regime.en },
        { kind: 'regime-signal', label: isZh ? '配置信号' : 'SIGNAL',  value: regime.signal },
        { kind: 'regime-stat',   label: 'FED',                          value: `${regime.fed}%` },
        {
          kind: 'regime-stat',
          label: 'CPI',
          value: isZh
            ? (regime.inflation === 'rising' ? '↑ 上行' : regime.inflation === 'falling' ? '↓ 下行' : '→ 平稳')
            : (regime.inflation === 'rising' ? '↑ rising' : regime.inflation === 'falling' ? '↓ falling' : '→ flat'),
        },
      ]
    : [];

  const macroItems: TickerItem[] = MACRO_CARDS.map(c => ({
    kind: 'macro',
    label: isZh ? c.zh : c.en,
    id:    c.id,
    unit:  c.unit,
  }));

  // combine + duplicate for seamless infinite loop
  const allItems = [...regimeItems, ...macroItems];
  const doubled  = [...allItems, ...allItems];

  const isReady = !macLoading;

  return (
    <div
      className="w-full overflow-hidden select-none border-b border-white/5"
      style={{ background: '#111110' }}
    >
      <div className="flex items-stretch">
        {/* Label badge */}
        <div
          className="shrink-0 flex items-center px-4 py-2.5 z-10"
          style={{ background: '#C4A35A' }}
        >
          <span className="text-[8px] font-sans font-black uppercase tracking-[0.25em] text-[#111110] whitespace-nowrap">
            MACRO PULSE
          </span>
        </div>

        {/* Divider dot */}
        <div className="shrink-0 w-px self-stretch bg-white/10" />

        {/* Scrolling track */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className="inline-flex gap-0 whitespace-nowrap"
            style={{
              animation: isReady ? 'macro-ticker 55s linear infinite' : 'none',
              willChange: 'transform',
            }}
          >
            {doubled.map((item, i) => {
              if (item.kind === 'macro') {
                const pt = macro[item.id];
                return (
                  <div
                    key={i}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border-r border-white/6"
                  >
                    <span className="text-[8px] font-sans uppercase tracking-widest text-white/35">
                      {item.label}
                    </span>
                    {macLoading || !pt
                      ? <span className="w-10 h-2.5 rounded bg-white/8 animate-pulse inline-block" />
                      : <span className="text-[13px] font-mono font-semibold text-[#C4A35A]">
                          {fmtVal(pt.value, item.unit)}
                        </span>
                    }
                  </div>
                );
              }

              // Regime items
              const isSignal = item.kind === 'regime-signal';
              const isLabel  = item.kind === 'regime-label';
              return (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border-r border-white/6"
                >
                  {isLabel && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  )}
                  <span className="text-[8px] font-sans uppercase tracking-widest text-white/35">
                    {item.label}
                  </span>
                  <span
                    className={
                      isSignal
                        ? 'text-[13px] font-sans font-semibold text-[#C83E3E]'
                        : isLabel
                          ? 'text-[13px] font-serif font-semibold text-white/90'
                          : 'text-[13px] font-mono text-white/70'
                    }
                  >
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
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
