import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ArrowLeft, Calendar, Tag, Globe,
  ChevronDown, Loader2, Clock, Star, Search, X, Terminal, Copy, Check, Cpu,
  FileText, Download, Lock, Activity, BookMarked, GitCompare, Landmark, Route, ShieldAlert,
} from 'lucide-react';
import { research, Article, PolicyEvent } from '../lib/research';
import { supabase } from '../lib/supabase';
import { useLocale } from '../context/LocaleContext';
import MacroPulseBar from '../components/sgsyen/MacroPulseBar';
import GlobalDataLayerPanel from '../components/sgsyen/GlobalDataLayerPanel';
import QuantComparisonPanel from '../components/sgsyen/QuantComparisonPanel';
import { getPageFrameMaxClass, getSgsyenViewMode } from '../lib/layoutMode';
import { sgsyenApiUrl } from '../lib/apiConfig';
import ViewModeSwitch from '../components/sgsyen/ViewModeSwitch';

const PAGE_SIZE = 8;

// ── Colour maps ──────────────────────────────────────────────
const EVENT_DOT: Record<string, string> = {
  crisis:       'bg-[#C83E3E]',
  policy:       'bg-blue-500',
  geopolitical: 'bg-zinc-400',
  regulation:   'bg-purple-500',
  market:       'bg-emerald-500',
  fx_breakout:  'bg-zinc-400',
  central_bank: 'bg-zinc-400',
};
const EVENT_TAG: Record<string, string> = {
  crisis:       'text-[#C83E3E] bg-[#C83E3E]/5 border-[#C83E3E]/15',
  policy:       'text-blue-600 bg-blue-50 border-blue-200',
  geopolitical: 'text-zinc-500 bg-zinc-50 border-zinc-200',
  regulation:   'text-purple-600 bg-purple-50 border-purple-200',
  market:       'text-emerald-600 bg-emerald-50 border-emerald-200',
  fx_breakout:  'text-zinc-500 bg-zinc-50 border-zinc-200',
  central_bank: 'text-zinc-500 bg-zinc-50 border-zinc-200',
};

const FEATURED_EVENT_MIRROR = {
  triggerZh: '美元兑日元进入 160 区域',
  triggerEn: 'USD/JPY enters the 160 zone',
  titleZh: '日元 160：不是单点价格，而是政策压力阈值',
  titleEn: 'JPY 160: not one price, but a policy-pressure threshold',
  anchorZh: '1985 年 Plaza Accord 后，日元快速升值；FRED 月度数据在 1986 年 7 月记录 USD/JPY 约 158.6。',
  anchorEn: 'After the 1985 Plaza Accord, the yen strengthened sharply; FRED monthly data shows USD/JPY near 158.6 in July 1986.',
  pathZh: ['利差交易拥挤', '进口通胀与央行压力', '外资回流与亚洲资产重定价'],
  pathEn: ['Crowded carry trades', 'Import inflation and central-bank pressure', 'Capital repatriation and Asian asset repricing'],
  modelZh: '进入事件层后，模型提高 FX / 利率 / 风险偏好权重，并下调高波动阶段的风险预算。',
  modelEn: 'Once promoted into the event layer, the model raises FX, rates, and risk-appetite weights while cutting risk budget under volatility stress.',
  sourceZh: '参考：Plaza Accord 签署日 1985-09-22；FRED EXJPUS 月度历史序列。',
  sourceEn: 'Reference: Plaza Accord signed on 1985-09-22; FRED EXJPUS monthly history.',
};

const WEEKLY_FRAMEWORK = [
  {
    labelZh: '主事件',
    labelEn: 'Lead Event',
    textZh: '只选一件最能改变全球资金路径的事件。',
    textEn: 'Pick the one event most likely to alter global capital paths.',
  },
  {
    labelZh: '历史镜像',
    labelEn: 'Historical Mirror',
    textZh: '找上一次相似阈值、政策转向或资产重定价。',
    textEn: 'Locate the last similar threshold, policy turn, or repricing.',
  },
  {
    labelZh: '传导链',
    labelEn: 'Transmission',
    textZh: '写清楚它如何穿过汇率、利率、商品、股票与流动性。',
    textEn: 'Map how it moves through FX, rates, commodities, equities, and liquidity.',
  },
  {
    labelZh: '模型动作',
    labelEn: 'Model Action',
    textZh: '说明哪些因子加权、哪些风险预算收缩。',
    textEn: 'State which factors get reweighted and which risk budgets shrink.',
  },
];

const LATEST_WEEKLY_MEMO = {
  date: '2026-06-21',
  titleZh: '全球事件进入模型：从日元 160 到世界风险权重重估',
  titleEn: 'Global Events Enter the Model: From JPY 160 to Risk-Weight Repricing',
  thesisZh: '新闻只有在改变市场状态时才成为事件。日元 160、政策干预、流动性压力与拥挤平仓，应被压缩成 regime、情景先验和风险预算，而不是简单写成涨跌判断。',
  thesisEn: 'News becomes an event only when it changes market state. JPY 160, policy intervention, liquidity stress, and crowded unwind should become regime, scenario-prior, and risk-budget inputs, not simple directional calls.',
  pathZh: ['全球信息', '事件识别', '地域与来源覆盖', '压力维度', '风险预算'],
  pathEn: ['Global information', 'Event detection', 'Region and source coverage', 'Pressure dimensions', 'Risk budget'],
};

const WEEKLY_MEMO_NO = 8;
const WEEKLY_MEMO_CATEGORY = '全球格局';
const WEEKLY_MEMO_TAGS = ['全球事件', '量化研究', '日元160', '风险预算', '世界模型'];
const QUANT_MODEL_CATEGORY = 'GSYEN-Quant';
const QUANT_MODEL_TAGS = ['GSYEN-Quant', '模型日志', 'Pre-Chaos', 'CUDA', 'Adaptive Rank'];
const QUANT_MODEL_RELEASE = {
  version: 'v0.7.2',
  date: '2026-06-18',
  titleZh: 'GSYEN-Quant 模型日志 001：从未来混沌到真实交易日 validation',
  titleEn: 'GSYEN-Quant Model Log 001: From Pre-Chaos to Real Trading-Day Validation',
  subtitleZh: '记录 GSYEN-Quant v0.7.2 的模型版本、核心功能与本轮量化验证口径',
  subtitleEn: 'A versioned note on GSYEN-Quant v0.7.2, core model upgrades, and the latest validation scope',
  features: ['Pre-Chaos', 'Adaptive Rank', 'Robust Control', 'PyTorch CUDA/TF32', 'Post-reference Validation'],
};

type LiveMacroEvent = {
  date: string;
  title: string;
  event_type?: string;
  source?: string;
  source_url?: string;
  region?: string;
  confidence?: number;
  severity?: number;
  regime_signal?: string;
  historical_anchor?: string;
  affected_markets?: string[];
};

type LiveMacroDigest = {
  as_of?: string;
  generated_at?: string;
  clusters?: Array<{ events?: LiveMacroEvent[] }>;
};

type DisplayArticle = Article & {
  is_generated_weekly?: boolean;
  content_en?: string;
};

function fmtDate(iso?: string) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function collectLiveEvents(payload: LiveMacroDigest | null): LiveMacroEvent[] {
  const unique = new Map<string, LiveMacroEvent>();
  for (const cluster of payload?.clusters ?? []) {
    for (const event of cluster.events ?? []) {
      if (!event.date || !event.title) continue;
      const key = `${event.date}|${event.title}|${event.source ?? ''}`;
      if (!unique.has(key)) unique.set(key, event);
    }
  }
  return Array.from(unique.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
}

function signalLabel(signal?: string) {
  return (signal || 'macro_state').replaceAll('_', ' ');
}

function buildWeeklyMemoArticle(events: LiveMacroEvent[], asOf?: string | null): DisplayArticle {
  const date = asOf || LATEST_WEEKLY_MEMO.date;
  const lead = events[0];
  const focusZh = lead
    ? `${lead.region ? `${lead.region} · ` : ''}${lead.title}`
    : '日元 160、政策干预与全球风险权重重估';
  const focusEn = lead
    ? `${lead.region ? `${lead.region} · ` : ''}${lead.title}`
    : 'JPY 160, policy intervention, and global risk-weight repricing';
  const eventLinesZh = (events.length ? events : []).slice(0, 4).map((event, index) => {
    const signal = signalLabel(event.regime_signal || event.event_type);
    return `${index + 1}. ${event.date}｜${event.region || 'Global'}｜${event.title}｜状态信号：${signal}`;
  }).join('\n');
  const eventLinesEn = (events.length ? events : []).slice(0, 4).map((event, index) => {
    const signal = signalLabel(event.regime_signal || event.event_type);
    return `${index + 1}. ${event.date} | ${event.region || 'Global'} | ${event.title} | state signal: ${signal}`;
  }).join('\n');
  const articleId = `weekly-memo-${date}`;

  return {
    id: articleId,
    no: WEEKLY_MEMO_NO,
    slug: articleId,
    title: LATEST_WEEKLY_MEMO.titleZh,
    title_en: LATEST_WEEKLY_MEMO.titleEn,
    subtitle: `周度自动更新；重大事件即时更新｜本周主事件：${focusZh}`,
    subtitle_en: `Weekly by default; immediate on major events | Lead event: ${focusEn}`,
    author: '庄屿 SGSYEN',
    author_en: 'SGSYEN Institute',
    category: WEEKLY_MEMO_CATEGORY,
    tags: WEEKLY_MEMO_TAGS,
    reading_time: 12,
    published_at: `${date}T08:00:00+08:00`,
    is_published: true,
    is_featured: true,
    star_count: 0,
    is_generated_weekly: true,
    summary: LATEST_WEEKLY_MEMO.thesisZh,
    content: `本周核心论点

${LATEST_WEEKLY_MEMO.thesisZh}

更新机制：无重大事件时每周自动更新一次；一旦重大政策、战争、汇率、利率或市场冲击触发阈值，就立即更新。

一、为什么这不是一条普通新闻
本周的重点不是“某个价格点会不会带来单日涨跌”，而是它是否改变市场的状态描述。日元进入 160 区域、央行政策沟通、流动性压力与拥挤交易平仓，会共同影响资金的避险偏好、套息交易容量、风险预算和跨区域资产再定价。

二、事件样本
${eventLinesZh || '1. 当前宏观事件流尚未给出新的高可信样本，周评先使用日元 160 与政策压力阈值作为主事件。'}

三、进入模型的方式
这篇周评不把新闻直接翻译成买卖指令，而是先压缩成三类变量：第一是 regime 概率，判断市场处在平稳、转换还是压力尾部；第二是 scenario priors，判断货币干预、carry unwind、流动性缺口等情景权重；第三是 risk budget，决定在波动扩散时是否降低杠杆和单因子暴露。

四、策略动作
当事件可信度升高，模型不应该简单追涨杀跌，而应提高外汇、利率、流动性和拥挤度因子的解释权重；同时对高波动资产设置更强的回撤刹车，避免把一次历史阈值误判成普通噪声。

五、结论
世界模型真正要消化的不是“新闻数量”，而是新闻对状态空间的重写能力。平时每周只选一件主事件，是为了让研究页面保持克制；但当重大事件改变风险权重时，周评会跳过排期即时更新。`,
    content_en: `This Week's Core Thesis

${LATEST_WEEKLY_MEMO.thesisEn}

Cadence: weekly when no major event clears the threshold; immediate when policy, war, FX, rates, or market shocks trigger a regime signal.

1. Why this is not ordinary news
The key question is not whether one price point predicts a one-day move. The question is whether it changes the market-state description. JPY near 160, central-bank communication, liquidity stress, and crowded unwind can jointly reshape risk appetite, carry capacity, risk budgets, and cross-region asset repricing.

2. Event sample
${eventLinesEn || '1. The current macro event stream has not produced a fresh high-confidence sample; this memo uses JPY 160 and policy-pressure thresholds as the lead event.'}

3. How it enters the model
The memo does not translate news directly into a trading command. It compresses news into three variables: regime probability, scenario priors, and risk budget. Those variables decide whether the market is stable, transitioning, or entering tail stress.

4. Strategy action
When confidence rises, the model should raise the explanatory weight of FX, rates, liquidity, and crowding factors. It should also tighten drawdown brakes on high-volatility assets so that a historical threshold is not treated as ordinary noise.

5. Conclusion
The world model should digest not the number of headlines, but the ability of an event to rewrite the state space. In ordinary weeks, one lead event keeps the research page disciplined; when a major event changes risk weights, the memo updates immediately instead of waiting for the next weekly slot.`,
  };
}

function buildQuantModelLogArticle(): DisplayArticle {
  return {
    id: `gsyen-quant-${QUANT_MODEL_RELEASE.version}`,
    no: 9,
    slug: `gsyen-quant-${QUANT_MODEL_RELEASE.version}`,
    title: QUANT_MODEL_RELEASE.titleZh,
    title_en: QUANT_MODEL_RELEASE.titleEn,
    subtitle: QUANT_MODEL_RELEASE.subtitleZh,
    subtitle_en: QUANT_MODEL_RELEASE.subtitleEn,
    author: 'GSYEN-Quant Research',
    author_en: 'GSYEN-Quant Research',
    category: QUANT_MODEL_CATEGORY,
    tags: QUANT_MODEL_TAGS,
    reading_time: 9,
    published_at: `${QUANT_MODEL_RELEASE.date}T21:30:00+08:00`,
    is_published: true,
    is_featured: true,
    star_count: 0,
    summary: `当前模型：GSYEN-Quant ${QUANT_MODEL_RELEASE.version} · ${QUANT_MODEL_RELEASE.features.join(' / ')}`,
    content: `模型版本

GSYEN-Quant ${QUANT_MODEL_RELEASE.version}
结果日期：${QUANT_MODEL_RELEASE.date}
核心能力：${QUANT_MODEL_RELEASE.features.join(' / ')}

一、这次更新解决什么问题
这次版本不把模型日志写成普通新闻，而是把它作为量化系统的可追溯版本记录。每一次模型结构、数据口径、训练方式或算力后端发生变化，都应该留下一个简短但可复盘的说明，避免未来只看到收益曲线，却不知道收益来自哪一次改动。

二、核心改进
第一，Pre-Chaos 未来混沌状态继续作为前置状态层，用来描述未来可能状态的吸引子、不稳定性与场景先验。

第二，Adaptive Rank 保留为当前模型的主干选择机制，让模型在不同市场结构下调整有效秩，而不是固定使用同一套暴露维度。

第三，Robust Control 继续服务于回撤约束。模型不仅追求收益，还会对坏场景下的路径稳定性进行惩罚。

第四，PyTorch CUDA/TF32 后端已经进入验证链路。它不是为了单纯显示 GPU，而是为了把后续 control、transition、reward 等热路径逐步迁移到更高并行度的张量 pipeline。

第五，Post-reference Validation 允许模型在幻方公开净值披露滞后时，继续跑到最新真实交易日，同时保留 reference disclosure window，避免把对方尚未披露的数据伪装成已知结果。

三、为什么模型日志放在 Research
模型日志不是 UI 文案，也不是算力中心指标。它解释“为什么改、改了什么、对结果口径有什么影响”。所以它应该作为 Research 里的 GSYEN-Quant 专题存在；而量化面板只展示当前版本和结果，算力中心只展示本次运行资源。

四、下一步
后续每次模型升级，都只需要新增一条模型日志：版本号、日期、核心改动、验证范围、性能变化和已知风险。这样 GSYEN-Quant 会形成自己的模型演化史，而不是一串不可解释的回测结果。`,
    content_en: `Model Version

GSYEN-Quant ${QUANT_MODEL_RELEASE.version}
Result date: ${QUANT_MODEL_RELEASE.date}
Core capabilities: ${QUANT_MODEL_RELEASE.features.join(' / ')}

1. What this update solves
This note treats the model log as a traceable research record rather than ordinary news. Every structural change, data-scope change, training change, or compute-backend change should leave a short but auditable explanation, so future results can be tied back to model decisions.

2. Core upgrades
Pre-Chaos remains the forward state layer for attractors, instability, and scenario priors.

Adaptive Rank remains the main selection mechanism so the model can adjust effective rank across regimes.

Robust Control continues to constrain drawdown by penalizing adverse path behavior.

The PyTorch CUDA/TF32 backend is now part of the validation chain, preparing control, transition, and reward hot paths for higher tensor residency.

Post-reference Validation allows the model to run through the latest real trading day when public High-Flyer NAV disclosure lags, while preserving the reference disclosure window.

3. Why the model log belongs in Research
The model log explains why the model changed, what changed, and how the validation scope changed. The quant panel should show the current version and result; the compute center should show resources; Research should hold the explanation.

4. Next step
Each future upgrade should add one model log entry: version, date, core changes, validation scope, performance change, and known risk. This turns GSYEN-Quant into an explainable model history rather than a disconnected series of backtests.`,
  };
}

function articleMatches(art: Article, cat: string, kw: string) {
  const categoryOk = cat === 'all' || art.category === cat || (art.tags ?? []).includes(cat);
  if (!categoryOk) return false;
  const query = kw.trim().toLowerCase();
  if (!query) return true;
  const text = [
    art.title,
    art.title_en,
    art.subtitle,
    art.subtitle_en,
    art.category,
    ...(art.tags ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
  return text.includes(query);
}

function eventLens(ev: PolicyEvent, isZh: boolean) {
  const type = (ev.event_type || '').toLowerCase();
  if (type === 'crisis') {
    return isZh
      ? '冲击链：尾部压力 → 波动率抬升 → 降低风险预算与杠杆上限'
      : 'Path: tail stress -> higher volatility -> lower risk budget and leverage cap';
  }
  if (type === 'policy') {
    return isZh
      ? '冲击链：政策预期 → 利率曲线 → 风格轮动与久期暴露'
      : 'Path: policy expectations -> rates curve -> style rotation and duration exposure';
  }
  if (type === 'geopolitical') {
    return isZh
      ? '冲击链：地缘溢价 → 商品/汇率 → 避险资产与区域仓位切换'
      : 'Path: geopolitical premium -> commodities/FX -> haven assets and regional positioning';
  }
  if (type === 'regulation') {
    return isZh
      ? '冲击链：规则变化 → 行业盈利假设 → 估值折价与流动性折扣'
      : 'Path: rule change -> sector earnings assumptions -> valuation and liquidity discount';
  }
  if (type === 'market') {
    return isZh
      ? '冲击链：价格阈值 → 拥挤交易 → 动量、反转与止损踩踏'
      : 'Path: price threshold -> crowded trade -> momentum, reversal, and stop-loss cascade';
  }
  return isZh
    ? '冲击链：事件确认 → 市场状态切换 → 因子权重与回撤约束调整'
    : 'Path: event confirmation -> regime switch -> factor weights and drawdown constraints';
}

function modelAction(ev: PolicyEvent, isZh: boolean) {
  const highImpact = Number(ev.impact_level ?? 0) >= 4;
  if (highImpact) {
    return isZh
      ? '模型动作：进入周评候选，提升尾部情景权重，触发路径稳定检查。'
      : 'Model action: nominate for weekly memo, raise tail-scenario weight, run path-stability checks.';
  }
  return isZh
    ? '模型动作：作为辅助状态变量，参与 regime 概率和行业暴露微调。'
    : 'Model action: use as an auxiliary state variable for regime probability and sector exposure tuning.';
}

function WeeklyEventFrame({ isZh, onOpenWeeklyMemo }: { isZh: boolean; onOpenWeeklyMemo: () => void }) {
  return (
    <section id="weekly-event-frame" className="px-6 md:px-12 lg:px-20 py-10 border-b border-[#1D1D1B]/10 bg-[#FFFFFF]">
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] border border-[#1D1D1B]/10 bg-white">
        <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-[#1D1D1B]/10">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#A58261] flex items-center gap-2">
            <BookMarked className="w-3.5 h-3.5" />
            {isZh ? '每周评论 · WEEKLY MEMO' : 'WEEKLY MEMO'}
          </span>
          <h2 className="mt-4 text-2xl md:text-3xl font-serif font-semibold leading-tight">
            {isZh ? '周更为底线，大事即时更新' : 'Weekly by default, immediate on major events'}
          </h2>
          <p className="mt-4 text-xs md:text-sm font-sans leading-[1.9] text-zinc-500">
            {isZh
              ? '页面上不堆新闻。没有重大事件时，每周自动筛出一个最重要的变量；一旦大事触发阈值，就立即写成“事件-历史镜像-传导链-模型动作”的完整评论。'
              : 'The page does not pile up news. In ordinary weeks it selects one important global variable; when a major event clears the threshold, it immediately becomes an event, mirror, transmission, and model-action note.'}
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WEEKLY_FRAMEWORK.map(item => (
              <div key={item.labelEn} className="border border-[#1D1D1B]/10 bg-white p-4">
                <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#A58261]">
                  {isZh ? item.labelZh : item.labelEn}
                </div>
                <p className="mt-2 text-[11px] font-sans leading-relaxed text-zinc-500">
                  {isZh ? item.textZh : item.textEn}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenWeeklyMemo}
            className="mt-6 w-full border-t border-[#1D1D1B]/10 pt-5 text-left cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A58261]/45"
          >
            <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-zinc-400">
              {isZh ? '本周核心论点' : 'This Week’s Core Thesis'}
            </div>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-base font-serif font-semibold leading-snug">
                  {isZh ? LATEST_WEEKLY_MEMO.titleZh : LATEST_WEEKLY_MEMO.titleEn}
                </div>
                <p className="mt-2 text-[11px] font-sans leading-relaxed text-zinc-500">
                  {isZh ? LATEST_WEEKLY_MEMO.thesisZh : LATEST_WEEKLY_MEMO.thesisEn}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(isZh ? LATEST_WEEKLY_MEMO.pathZh : LATEST_WEEKLY_MEMO.pathEn).map((item) => (
                    <span key={item} className="text-[8px] font-sans font-bold uppercase tracking-wider text-[#A58261] border border-[#A58261]/20 px-2 py-0.5">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-[10px] font-sans text-zinc-400">
                  {LATEST_WEEKLY_MEMO.date} · {isZh ? '更新节奏：周更 + 重大事件即时' : 'Cadence: weekly + immediate on major events'}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A58261] shrink-0 mt-1 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </div>

        <div id="event-mirror-panel" className="p-6 md:p-8">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#A58261] flex items-center gap-2">
            <GitCompare className="w-3.5 h-3.5" />
            {isZh ? '历史镜像样例 · EVENT MIRROR' : 'EVENT MIRROR'}
          </span>
          <h3 className="mt-4 text-2xl md:text-3xl font-serif font-semibold leading-tight">
            {isZh ? FEATURED_EVENT_MIRROR.titleZh : FEATURED_EVENT_MIRROR.titleEn}
          </h3>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <EventMirrorField
              icon={<ShieldAlert className="w-4 h-4" />}
              label={isZh ? '触发阈值' : 'Trigger'}
              value={isZh ? FEATURED_EVENT_MIRROR.triggerZh : FEATURED_EVENT_MIRROR.triggerEn}
            />
            <EventMirrorField
              icon={<Landmark className="w-4 h-4" />}
              label={isZh ? '历史参照' : 'Historical Anchor'}
              value={isZh ? FEATURED_EVENT_MIRROR.anchorZh : FEATURED_EVENT_MIRROR.anchorEn}
            />
            <EventMirrorField
              icon={<Route className="w-4 h-4" />}
              label={isZh ? '影响路径' : 'Impact Path'}
              value={(isZh ? FEATURED_EVENT_MIRROR.pathZh : FEATURED_EVENT_MIRROR.pathEn).join(' / ')}
            />
            <EventMirrorField
              icon={<Activity className="w-4 h-4" />}
              label={isZh ? '模型消化' : 'Model Digestion'}
              value={isZh ? FEATURED_EVENT_MIRROR.modelZh : FEATURED_EVENT_MIRROR.modelEn}
            />
          </div>

          <p className="mt-5 text-[10px] font-sans leading-relaxed text-zinc-400">
            {isZh ? FEATURED_EVENT_MIRROR.sourceZh : FEATURED_EVENT_MIRROR.sourceEn}
          </p>
        </div>
      </div>
    </section>
  );
}

function EventMirrorField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border border-[#1D1D1B]/10 bg-white p-4 min-w-0">
      <div className="flex items-center gap-2 text-[#A58261]">
        {icon}
        <span className="text-[9px] font-sans font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 text-[11px] font-sans leading-relaxed text-zinc-500">{value}</p>
    </div>
  );
}

function EventImpactNote({ event, isZh }: { event: PolicyEvent; isZh: boolean }) {
  return (
    <div className="mt-3 space-y-1 border-l border-[#1D1D1B]/10 pl-3">
      <div className="text-[10px] font-sans text-zinc-500 leading-relaxed">
        {eventLens(event, isZh)}
      </div>
      <div className="text-[10px] font-sans text-zinc-500 leading-relaxed">
        {modelAction(event, isZh)}
      </div>
    </div>
  );
}

function LiveEventImpactNote({ event, isZh }: { event: LiveMacroEvent; isZh: boolean }) {
  const signal = event.regime_signal?.replaceAll('_', ' ') || event.event_type?.replaceAll('_', ' ') || 'macro signal';
  const confidence = typeof event.confidence === 'number' ? `${(event.confidence * 100).toFixed(0)}%` : '-';
  return (
    <div className="mt-3 space-y-1 border-l border-[#1D1D1B]/10 pl-3">
      <div className="text-[10px] font-sans text-zinc-500 leading-relaxed">
        {isZh
          ? `冲击链：最新事件 → ${signal} → regime 概率、风险预算与因子权重重估`
          : `Path: latest event -> ${signal} -> regime probability, risk budget, and factor-weight review`}
      </div>
      <div className="text-[10px] font-sans text-zinc-500 leading-relaxed">
        {isZh
          ? `模型动作：进入全球事件消化层，可信度 ${confidence}，只改变状态解释与权重，不改原始数据。`
          : `Model action: promoted into the global event digestion layer with ${confidence} confidence; state interpretation changes, raw data does not.`}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export default function ResearchPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { locale } = useLocale();
  const isZh       = locale === 'zh';
  const pageFrameMaxClass = getPageFrameMaxClass(location.search);
  const viewMode = getSgsyenViewMode(location.search);

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
  const [liveEvents,  setLiveEvents]  = useState<LiveMacroEvent[]>([]);
  const [liveAsOf, setLiveAsOf] = useState<string | null>(null);
  const [liveGeneratedAt, setLiveGeneratedAt] = useState<string | null>(null);
  const [evLoading,   setEvLoading]   = useState(true);

  // regime signal (for breadcrumb bar)
  const [regime, setRegime] = useState<{
    zh: string; en: string; signal: string; fed: number; inflation: string;
  } | null>(null);

  // total macro data point count (dynamic)
  const [macroCount, setMacroCount] = useState<number | null>(null);

  // search
  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');
  const [showApi,      setShowApi]      = useState(false);
  const [copied,       setCopied]       = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('api') === '1') {
      setShowApi(true);
    }
  }, [location.search]);

  // article drawer
  const [selectedArt,  setSelectedArt]  = useState<DisplayArticle | null>(null);
  const [downloading,  setDownloading]  = useState(false);
  const [dlMsg,        setDlMsg]        = useState<string | null>(null);
  const { authorizedEmail, setShowLoginModal } = useLocale();
  const isMember = !!authorizedEmail;

  useEffect(() => {
    if (!location.hash) return;
    const targetId = location.hash.replace('#', '');
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const handleDownload = async (slug: string) => {
    if (!isMember) { setShowLoginModal(true); return; }
    setDownloading(true); setDlMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setShowLoginModal(true); setDownloading(false); return; }
      const res = await fetch(
        sgsyenApiUrl(`/reports/${encodeURIComponent(slug)}/download`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      const a = document.createElement('a'); a.href = url;
      a.download = `SGSYEN_${slug}.pdf`; a.target = '_blank';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setDlMsg(isZh ? '🎉 PDF 已通过安全对象存储通道送达。' : '🎉 PDF delivered via secure object storage.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown error';
      setDlMsg(isZh ? `⚠️ 下载失败：${message}` : `⚠️ Failed: ${message}`);
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
    if (artId.startsWith('weekly-memo-')) {
      const next = new Set(starred);
      next.add(artId);
      setStarred(next);
      localStorage.setItem('sgsyen_starred', JSON.stringify([...next]));
      return;
    }
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
      fetch(`/quant/macro-events/latest.json?t=${Date.now()}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() as Promise<LiveMacroDigest> : null)
        .catch(() => null),
    ]).then(([up, re, live]) => {
      if (up.data) setUpcoming(up.data);
      if (re.data) setRecent(re.data);
      setLiveEvents(collectLiveEvents(live));
      setLiveAsOf(live?.as_of ?? null);
      setLiveGeneratedAt(live?.generated_at ?? null);
      setEvLoading(false);
    });
  }, []);

  // ── fetch regime signal ──────────────────────────────────
  useEffect(() => {
    fetch('https://terminal.gsyen.com/api/regime')
      .then(r => r.json())
      .then(d => setRegime({
        zh: d.regime.zh, en: d.regime.en, signal: d.regime.signal,
        fed: d.inputs.fed_funds_rate, inflation: d.inputs.inflation_direction,
      }))
      .catch(() => {});
  }, []);

  // ── fetch total macro record count ───────────────────────
  useEffect(() => {
    research
      .from('macro_timeseries')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => { if (count !== null) setMacroCount(count); });
  }, []);

  // ── fetch categories only (筛选条只放分类，tags 在行内) ──
  useEffect(() => {
    research.from('articles').select('category').eq('is_published', true)
      .then(({ data }) => {
        if (data) setCategories([...new Set(data.map(d => d.category).filter(Boolean))]);
      });
  }, []);

  const weeklyArticle = useMemo(
    () => buildWeeklyMemoArticle(liveEvents, liveAsOf),
    [liveEvents, liveAsOf]
  );
  const quantModelArticle = useMemo(() => buildQuantModelLogArticle(), []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('article') !== 'weekly-memo') return;

    setSelectedArt(weeklyArticle);
    params.delete('article');
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
        hash: location.hash || '#weekly-event-frame',
      },
      { replace: true }
    );
  }, [location.hash, location.pathname, location.search, navigate, weeklyArticle]);

  const generatedArticles = useMemo(
    () => [quantModelArticle, weeklyArticle].filter(article => articleMatches(article, category, search)),
    [quantModelArticle, weeklyArticle, category, search]
  );
  const categoryItems = useMemo(
    () => [QUANT_MODEL_CATEGORY, ...categories.filter(cat => cat !== QUANT_MODEL_CATEGORY)],
    [categories]
  );
  const displayArticles = useMemo<DisplayArticle[]>(() => {
    const generatedSlugs = new Set(generatedArticles.map(art => art.slug));
    return [
      ...generatedArticles,
      ...articles.filter(art => !generatedSlugs.has(art.slug)),
    ];
  }, [articles, generatedArticles]);
  const hasMore = articles.length < artTotal;
  const selectedContent = selectedArt
    ? (isZh ? selectedArt.content : (selectedArt.content_en || selectedArt.content))
    : '';

  const scrollToResearchArchive = useCallback(() => {
    window.requestAnimationFrame(() => {
      document
        .getElementById('research-archive')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const openResearchArchive = useCallback(() => {
    setCategory('all');
    setSearchInput('');
    setSearch('');
    scrollToResearchArchive();
  }, [scrollToResearchArchive]);

  // ─────────────────────────────────────────────────────────
  return (
    <div className="research-page w-full bg-[#FFFFFF] text-[#1D1D1B] min-h-screen font-serif antialiased overflow-x-hidden">

      <div className={`w-full ${pageFrameMaxClass} mx-auto border-x border-[#1D1D1B]/10`}>

        {/* ── Breadcrumb ────────────────────────────────────── */}
        <div className="relative flex flex-wrap md:flex-nowrap items-center gap-y-3 px-3 md:px-5 lg:px-6 py-0 border-b border-[#1D1D1B]/10 bg-[#F7F8FA] select-none min-h-[36px] md:h-[36px] overflow-hidden shrink-0">

          {/* Left: back button */}
          <button
            onClick={() => navigate(`/?view=${viewMode}`)}
            className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-400 hover:text-[#1D1D1B] transition-colors cursor-pointer shrink-0 z-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> SGSYEN 首页
          </button>

          {/* Right: archive, tools and API controls */}
          <div className="ml-auto flex flex-wrap md:flex-nowrap items-center justify-end gap-2 md:gap-4 z-10 min-w-0">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-[#A58261] tracking-widest uppercase font-bold">
              <button
                onClick={openResearchArchive}
                className={`cursor-pointer transition-colors ${category === 'all' ? 'text-[#1D1D1B]' : 'hover:text-[#1D1D1B]'}`}
              >
                {isZh ? '观点与研究' : 'Research'}
              </button>
              <span className="text-[#A58261]/60">·</span>
              <button
                onClick={() => navigate(`/research/gsyen-quant?view=${viewMode}`)}
                className="cursor-pointer transition-colors hover:text-[#1D1D1B]"
              >
                GSYEN-Quant
              </button>
              <span className="text-[#A58261]/60">·</span>
              <button
                onClick={openResearchArchive}
                className="cursor-pointer transition-colors hover:text-[#1D1D1B]"
              >
                {isZh ? '全库' : 'Archive'}
              </button>
            </div>
            <ViewModeSwitch />
            <button
              onClick={() => navigate(`/gemini/calculator/?view=${viewMode}`)}
              className="h-7 flex items-center gap-1.5 px-3 border border-[#A58261]/30 text-[9px] font-sans font-bold uppercase tracking-widest text-[#A58261] cursor-pointer rounded shrink-0"
            >
              <Cpu className="w-3 h-3" />
              <span className="hidden sm:inline">{isZh ? '算力中心' : 'Compute Lab'}</span>
              <span className="sm:hidden">{isZh ? '算力' : 'Compute'}</span>
            </button>
            <button
              onClick={() => navigate(`/workspace?view=${viewMode}`)}
              className="h-7 flex items-center gap-1.5 px-3 border border-[#1D1D1B] bg-[#1D1D1B] text-[9px] font-sans font-bold uppercase tracking-widest text-[#FDFCF9] cursor-pointer rounded shadow-sm shrink-0"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">{isZh ? '工作台' : 'Workspace'}</span>
              <span className="sm:hidden">{isZh ? '工作台' : 'Workspace'}</span>
            </button>
          </div>
        </div>

        {/* ── Macro Pulse Bar (regime + 15 indicators, scrolling) ── */}
        <MacroPulseBar />

        {/* ── Hero ─────────────────────────────────────────── */}
        <section
          className="px-6 md:px-12 lg:px-20 py-20 relative overflow-hidden"
          style={{ background: 'linear-gradient(165deg, #111110 0%, #151520 100%)' }}
        >
          {/* ambient */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 75%, rgba(200,62,62,.04) 0%, transparent 55%)' }} />

          <div className="relative z-10 max-w-3xl">
            <span className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-[#A58261] mb-4 block">
              SECTION · 04 — {isZh ? '最新出版物 / 观点聚焦' : 'Latest Publications / Viewpoints'}
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-semibold text-[#FFFFFF] leading-[0.95] tracking-tight"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {isZh ? '观点与研究' : 'Viewpoints & Research'}
            </h1>
            <p className="mt-6 font-sans text-sm text-[#FFFFFF]/50 leading-relaxed max-w-xl break-all [overflow-wrap:anywhere]">
              {isZh
                ? '基于全球20年宏观时序数据、重大政策事件标注与量化情景预测的独立研判体系。数据驱动，事件锚定，叙事穿透。'
                : 'Independent analysis built on 20 years of global macro data, annotated policy events, and scenario-based forecasting.'}
            </p>
            <div className="flex items-center gap-8 mt-8 text-[9px] font-sans font-bold uppercase tracking-widest text-[#FFFFFF]/30">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {macroCount !== null
                  ? `${macroCount.toLocaleString('en-US')}+ ${isZh ? '宏观数据点' : 'macro data pts'}`
                  : (isZh ? '— 宏观数据点' : '— macro data pts')}
              </span>
              <span>43 重大事件</span>
              <span>{isZh ? '周更 · 大事即时' : 'weekly + live trigger'}</span>
              <span>{artTotal > 0 ? artTotal : '—'} 篇深度报告</span>
            </div>
          </div>
        </section>

        <WeeklyEventFrame isZh={isZh} onOpenWeeklyMemo={() => setSelectedArt(weeklyArticle)} />

        <QuantComparisonPanel />

        <GlobalDataLayerPanel />

        {/* ── Event Timeline ───────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-20 py-10 border-b border-[#1D1D1B]/10">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-3">
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#A58261] block">
              {isZh ? '全球事件时间轴 · EVENT CALENDAR' : 'GLOBAL EVENT CALENDAR'}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">
              {liveGeneratedAt
                ? `${isZh ? '全球抓取层更新' : 'Live feed'} ${liveAsOf ?? fmtDate(liveGeneratedAt)}`
                : (isZh ? '静态政策事件表' : 'Static policy-event table')}
            </span>
          </div>

          {evLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#C4A35A] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-[#1D1D1B]/10">

              {/* Upcoming */}
              <div className="border-r border-[#1D1D1B]/10">
                <div className="px-6 py-3 border-b border-[#1D1D1B]/10 bg-[#F7F8FA]">
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> {isZh ? '未来催化剂' : 'Upcoming Catalysts'}
                  </span>
                </div>
                {upcoming.map((ev, i) => (
                  <div key={ev.id}
                    className={`flex gap-4 px-6 py-5 ${i < upcoming.length - 1 ? 'border-b border-[#1D1D1B]/8' : ''} hover:bg-[#F7F8FA] transition-colors`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${EVENT_DOT[ev.event_type] ?? 'bg-zinc-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] font-mono text-zinc-400">{ev.date}</span>
                        <span className={`text-[8px] font-sans font-bold uppercase px-1.5 py-0.5 border rounded ${EVENT_TAG[ev.event_type] ?? 'text-zinc-500 bg-zinc-50 border-zinc-200'}`}>
                          {ev.event_type}
                        </span>
                        {ev.status === 'predicted' && (
                          <span className="text-[8px] font-mono text-zinc-300">{ev.certainty}/5</span>
                        )}
                      </div>
                      <div className="text-sm font-serif font-medium leading-snug">{ev.title}</div>
                      <div className="text-[9px] font-sans text-zinc-400 mt-0.5 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />{ev.region} · 影响 {ev.impact_level}/5
                      </div>
                      <EventImpactNote event={ev} isZh={isZh} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent */}
              <div id="latest-global-events" className="scroll-mt-24">
                <div className="px-6 py-3 border-b border-[#1D1D1B]/10 bg-[#F7F8FA]">
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-zinc-400">
                    {liveEvents.length ? (isZh ? '最新全球事件' : 'Latest Global Events') : (isZh ? '近期历史节点' : 'Recent History')}
                  </span>
                </div>
                {liveEvents.length ? liveEvents.map((ev, i) => (
                  <div key={`${ev.date}-${ev.title}-${ev.source ?? i}`}
                    className={`flex gap-4 px-6 py-5 ${i < liveEvents.length - 1 ? 'border-b border-[#1D1D1B]/8' : ''} hover:bg-[#F7F8FA] transition-colors`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${EVENT_DOT[ev.event_type ?? ''] ?? 'bg-zinc-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] font-mono text-zinc-400">{ev.date}</span>
                        <span className={`text-[8px] font-sans font-bold uppercase px-1.5 py-0.5 border rounded ${EVENT_TAG[ev.event_type ?? ''] ?? 'text-zinc-500 bg-zinc-50 border-zinc-200'}`}>
                          {(ev.event_type ?? 'live').replaceAll('_', ' ')}
                        </span>
                      </div>
                      {ev.source_url ? (
                        <a
                          href={ev.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-serif font-medium leading-snug hover:text-[#A58261] transition-colors"
                        >
                          {ev.title}
                        </a>
                      ) : (
                        <div className="text-sm font-serif font-medium leading-snug">{ev.title}</div>
                      )}
                      <div className="text-[9px] font-sans text-zinc-400 mt-0.5 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        {ev.region || ev.affected_markets?.join(', ') || 'GLOBAL'}
                        {ev.source ? ` · ${ev.source}` : ''}
                      </div>
                      {ev.historical_anchor ? (
                        <div className="text-[10px] font-sans text-zinc-400 mt-1 leading-relaxed">
                          {isZh ? '历史参照：' : 'Anchor: '}{ev.historical_anchor}
                        </div>
                      ) : null}
                      <LiveEventImpactNote event={ev} isZh={isZh} />
                    </div>
                  </div>
                )) : recent.map((ev, i) => (
                  <div key={ev.id}
                    className={`flex gap-4 px-6 py-5 ${i < recent.length - 1 ? 'border-b border-[#1D1D1B]/8' : ''} hover:bg-[#F7F8FA] transition-colors`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${EVENT_DOT[ev.event_type] ?? 'bg-zinc-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] font-mono text-zinc-400">{ev.date}</span>
                        <span className={`text-[8px] font-sans font-bold uppercase px-1.5 py-0.5 border rounded ${EVENT_TAG[ev.event_type] ?? 'text-zinc-500 bg-zinc-50 border-zinc-200'}`}>
                          {ev.event_type}
                        </span>
                      </div>
                      <div className="text-sm font-serif font-medium leading-snug">{ev.title}</div>
                      {ev.description && (
                        <div className="text-[10px] font-sans text-zinc-400 mt-0.5 leading-relaxed line-clamp-1">
                          {ev.description}
                        </div>
                      )}
                      <EventImpactNote event={ev} isZh={isZh} />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </section>

        {/* ── Articles ─────────────────────────────────────── */}
        <section id="research-archive" className="py-16 px-6 md:px-12 lg:px-20">

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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder={isZh ? '搜索标题 · 标签...' : 'Search title, tags...'}
                  className="w-full pl-8 pr-8 py-2 text-[11px] font-sans border border-[#1D1D1B]/15 bg-white text-[#1D1D1B] placeholder:text-zinc-300 focus:outline-none focus:border-[#A58261] transition-colors"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-[#1D1D1B] cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 justify-end">
                {['all', ...categoryItems].map(cat => (
                  <button key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-[9px] font-sans font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors cursor-pointer ${
                      category === cat
                        ? 'bg-[#1D1D1B] text-[#FFFFFF] border-[#1D1D1B]'
                        : 'border-[#1D1D1B]/15 text-zinc-500 hover:border-zinc-400 hover:text-[#1D1D1B]'
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
            <div className="mb-6 text-[10px] font-sans text-zinc-400">
              {isZh ? `关键词「${search}」共找到 ${artTotal} 篇` : `"${search}" — ${artTotal} result${artTotal !== 1 ? 's' : ''}`}
            </div>
          )}

          {/* Article rows — matches SgsyenReports layout */}
          {artLoading && articles.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <Loader2 className="w-7 h-7 text-[#C4A35A] animate-spin" />
              <p className="text-xs text-zinc-400 font-sans tracking-widest uppercase">
                {isZh ? '正在调阅研究档案...' : 'Loading research archive...'}
              </p>
            </div>
          ) : (
            <div className="border-t border-[#1D1D1B]/10">
              {displayArticles.length === 0 && !artLoading && (
                <div className="py-24 text-center border-b border-[#1D1D1B]/10">
                  <p className="text-zinc-400 text-sm font-sans">
                    {isZh ? '该分类暂无出版物。' : 'No publications in this category yet.'}
                  </p>
                </div>
              )}

              {displayArticles.map((art, index) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => { setSelectedArt(art); setDlMsg(null); }}
                  className="group flex flex-col md:flex-row gap-6 md:gap-8 py-10 border-b border-[#1D1D1B]/10 hover:bg-[#F7F8FA] transition-all duration-300 px-4 cursor-pointer"
                >
                  {/* Serial number column */}
                  <div className="w-32 shrink-0 flex flex-col justify-start">
                    <span className="text-[10px] font-mono font-bold text-[#C83E3E] tracking-widest">
                      NO. {String(art.no ?? index + 1).padStart(3, '0')}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-sans mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {fmtDate(art.published_at)}
                    </span>
                    {art.reading_time && (
                      <span className="text-[10px] text-zinc-400 font-sans mt-1.5 flex items-center gap-1">
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
                          className="text-[9px] font-sans text-[#A58261] bg-white border border-[#1D1D1B]/10 px-2 py-0.5 rounded hover:bg-[#F7F8FA] transition-colors cursor-pointer"
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
                      <p className="text-zinc-500 font-sans text-xs leading-[1.8] line-clamp-2 font-light">
                        {isZh ? art.subtitle : (art.subtitle_en || art.subtitle)}
                      </p>
                    )}
                    {art.author && (
                      <div className="mt-3 text-[10px] font-sans text-zinc-400 uppercase tracking-wider">
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
                          : 'text-zinc-300 hover:text-[#C4A35A]'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${starred.has(art.id) ? 'fill-[#C4A35A]' : ''}`} />
                      <span className="text-[9px] font-mono">{art.star_count ?? 0}</span>
                    </button>
                    <span className="w-10 h-10 rounded-full border border-[#1D1D1B]/15 flex items-center justify-center text-zinc-400 group-hover:bg-[#1D1D1B] group-hover:text-white group-hover:border-transparent transition-all duration-300">
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
                    className="inline-flex items-center gap-2 px-8 py-3 border border-[#1D1D1B] text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-[#1D1D1B] hover:text-[#FFFFFF] transition-colors cursor-pointer disabled:opacity-40"
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
                <div className="py-10 text-center text-[9px] font-sans uppercase tracking-widest text-zinc-300">
                  ── {isZh ? `已加载全部 ${artTotal} 篇报告` : `All ${artTotal} reports loaded`} ──
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer className="px-6 md:px-12 lg:px-20 py-8 border-t border-[#1D1D1B]/10 flex flex-col sm:flex-row justify-between items-center bg-[#F7F8FA] gap-4 select-none">
          <div className="text-[10px] font-sans tracking-widest uppercase text-zinc-500">
            © 2020 – 2026 SGSYEN 智库研究中心 · 庙街数字重建委员会
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400">
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
              className="w-full max-w-[850px] bg-[#FFFFFF] h-screen shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer header */}
              <div className="px-8 md:px-10 py-5 border-b border-[#1D1D1B]/10 flex justify-between items-center bg-[#F7F8FA]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C4A35A]" />
                  <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-zinc-500">
                    {isZh ? 'SGSYEN 雍彻评论 · 研究档案' : 'SGSYEN REVIEW · Research Archive'}
                  </span>
                </div>
                <button onClick={() => setSelectedArt(null)} className="p-1.5 hover:bg-zinc-200/50 rounded-full text-zinc-500 cursor-pointer">
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
                      <span key={t} className="text-[9px] font-sans text-[#A58261] bg-white border border-[#1D1D1B]/10 px-2 py-0.5 rounded">{t}</span>
                    ))}
                    <span className="text-zinc-400 text-xs font-sans flex items-center gap-1 ml-1">
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
                    <div className="text-[10px] font-sans uppercase tracking-widest text-zinc-400 mb-8">
                      {isZh ? selectedArt.author : (selectedArt.author_en || selectedArt.author)}
                    </div>
                  )}

                  <hr className="border-[#1D1D1B]/10 mb-8" />

                  {/* Summary callout */}
                  {(selectedArt as any).summary && (
                    <div className="p-5 border-l-4 border-[#C4A35A] bg-[#F7F8FA] mb-8">
                      <p className="text-[10px] font-sans tracking-widest font-bold text-[#A58261] uppercase mb-2">
                        {isZh ? '研究摘要' : 'EXECUTIVE SUMMARY'}
                      </p>
                      <p className="text-xs font-sans leading-relaxed text-zinc-600 italic">{(selectedArt as any).summary}</p>
                    </div>
                  )}

                  {/* Content or placeholder */}
                  {selectedContent ? (
                    <div className="text-sm font-sans leading-[1.9] text-zinc-700 whitespace-pre-wrap">
                      {selectedContent}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-[#F7F8FA] border border-[#1D1D1B]/8 rounded">
                      <Lock className="w-6 h-6 text-zinc-300 mx-auto mb-3" />
                      <p className="text-xs text-zinc-400 font-sans">
                        {isZh ? '完整正文内容即将上线，敬请期待。' : 'Full report content coming soon.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* PDF download footer */}
              <div className="border-t border-[#1D1D1B]/10 px-8 md:px-12 py-6 bg-[#F7F8FA]">
                <div className="max-w-[680px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-serif font-bold text-[#1D1D1B] flex items-center gap-1.5 mb-1">
                      <Lock className="w-3.5 h-3.5 text-[#C4A35A]" />
                      {isZh ? '会员专属 PDF 完整报告下载' : 'Member PDF Download'}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-sans">
                      {isZh ? '认购会员登录后可通过安全对象存储获取原件印本。' : 'Sign in as a subscriber to download from secure object storage.'}
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
                      className="flex items-center gap-2 px-5 py-2 bg-[#1D1D1B] text-[#FFFFFF] text-[10px] font-bold font-sans tracking-widest uppercase hover:bg-[#C4A35A] transition-colors rounded cursor-pointer disabled:opacity-40 shrink-0"
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
                <div className="border border-white/10 rounded p-5 bg-white/5">
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
