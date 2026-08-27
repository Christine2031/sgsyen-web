import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import ModelPricingTable from './components/ModelPricingTable';
import CostCalculator from './components/CostCalculator';
import InsightArticles from './components/InsightArticles';
import SystemPerformancePanel from './components/SystemPerformancePanel';
import SgsyenPortal from './components/sgsyen/SgsyenPortal';
import MiaojiePortal from './components/miaojie/MiaojiePortal';
import ResearchPage from './pages/ResearchPage';
import GsyenQuantBlogPage from './pages/GsyenQuantBlogPage';
import ToolsPage from './pages/ToolsPage';
import TemporaFlipPreviewPage from './pages/TemporaFlipPreviewPage';
import RegimeReviewDeskPage from './pages/RegimeReviewDeskPage';
import MemberCenterPage from './pages/MemberCenterPage';
import { ArrowLeft, BookOpen, Calculator, Download, FileText, Layers } from 'lucide-react';
import { LocaleProvider, useLocale } from './context/LocaleContext';
import { getPageFrameMaxClass, getSgsyenViewMode } from './lib/layoutMode';
import ViewModeSwitch from './components/sgsyen/ViewModeSwitch';
import LanguageSwitch from './components/sgsyen/LanguageSwitch';

type ActiveApp = 'sgsyen' | 'research' | 'workspace' | 'member' | 'gemini' | 'miaojie';

function InnerApp() {
  const { locale, t, authorizedEmail, login, logout, showLoginModal, setShowLoginModal } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const pageFrameMaxClass = getPageFrameMaxClass(location.search);
  const viewMode = getSgsyenViewMode(location.search);

  // Derive active state from URL path
  const path = location.pathname;
  const activeApp: ActiveApp = path.startsWith('/research')
    ? 'research'
    : (path.startsWith('/workspace') || path.startsWith('/tools'))
      ? 'workspace'
      : path.startsWith('/member')
        ? 'member'
        : path.startsWith('/gemini')
          ? 'gemini'
          : path.startsWith('/miaojie')
            ? 'miaojie'
            : 'sgsyen';
  let activeTab: 'calculator' | 'articles' | 'tariffs' = 'calculator';
  if (path.includes('/pricing')) activeTab = 'tariffs';
  else if (path.includes('/analysis')) activeTab = 'articles';

  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-1.5-pro');
  const [regime, setRegime] = useState<{
    zh: string;
    en: string;
    signal: string;
    fed: number;
    inflation: string;
  } | null>({
    zh: '通胀持续',
    en: 'Inflation Persistence',
    signal: '超配大宗，低配长债',
    fed: 3.0,
    inflation: 'rising',
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [macroSignalIndex, setMacroSignalIndex] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
  };

  useEffect(() => {
    fetch('https://terminal.gsyen.com/api/regime')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.regime) return;
        setRegime({
          zh: d.regime.zh,
          en: d.regime.en,
          signal: d.regime.signal,
          fed: Number(d.regime.fed_cut_prob ?? d.inputs?.fed_funds_rate ?? 3.0),
          inflation: d.regime.inflation_trend ?? d.inputs?.inflation_direction ?? 'flat',
        });
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setMacroSignalIndex(index => (index + 1) % 6);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  // Dynamic page title based on active app/tab
  useEffect(() => {
    const baseTitle = locale === 'zh' ? '雍彻智库' : '雍彻智库 · SGSYEN';
    if (activeApp === 'sgsyen') {
      document.title = locale === 'zh'
        ? `SGSYEN 智库研究中心 | ${baseTitle}`
        : `SGSYEN Research Center | ${baseTitle}`;
    } else if (activeApp === 'research') {
      document.title = locale === 'zh'
        ? `Research 观点与研究 | ${baseTitle}`
        : `Research Hub | ${baseTitle}`;
    } else if (activeApp === 'workspace') {
      document.title = locale === 'zh'
        ? `SGSYEN Workspace | ${baseTitle}`
        : `SGSYEN Workspace | ${baseTitle}`;
    } else if (activeApp === 'member') {
      document.title = locale === 'zh'
        ? `会员中心 | ${baseTitle}`
        : `Member Center | ${baseTitle}`;
    } else {
      const tabNames = {
        calculator: locale === 'zh' ? '算力成本估算' : 'Cost Calculator',
        articles: locale === 'zh' ? '算力逻辑解析' : 'Compute Analysis',
        tariffs: locale === 'zh' ? '官方资费对照' : 'Tariff Reference',
      };
      const geminiPrefix = locale === 'zh' ? 'Gemini 算力实验室' : 'Gemini Compute Lab';
      document.title = `${tabNames[activeTab]} | ${geminiPrefix} | ${baseTitle}`;
    }
  }, [activeApp, activeTab, locale]);

  const inflationText = (inflation: string) => locale === 'zh'
    ? (inflation === 'rising' ? '↑ 上行' : inflation === 'falling' ? '↓ 下行' : '→ 平稳')
    : (inflation === 'rising' ? '↑ rising' : inflation === 'falling' ? '↓ falling' : '→ flat');

  const usFedText = Number.isFinite(regime?.fed ?? NaN) ? `${regime!.fed.toFixed(1)}%` : '3.0%';
  const macroSignals = regime ? [
    {
      id: 'CN', shortZh: '中国', shortEn: 'CN', countryZh: '中国', countryEn: 'China',
      regimeZh: '政策托底', regimeEn: 'Policy Support',
      signalZh: '重红利与科技，控长债久期', signalEn: 'Dividends and tech, controlled duration',
      rateZh: 'LPR 观察', rateEn: 'LPR watch', cpiZh: 'CPI → 温和', cpiEn: 'CPI → mild',
    },
    {
      id: 'TW', shortZh: '中国台湾', shortEn: 'TW', countryZh: '中国台湾', countryEn: 'Taiwan, China',
      regimeZh: '科技周期', regimeEn: 'Tech Cycle',
      signalZh: '看半导体与外需订单', signalEn: 'Semis and external orders',
      rateZh: '台币 观察', rateEn: 'TWD watch', cpiZh: 'CPI → 温和', cpiEn: 'CPI → mild',
    },
    {
      id: 'HK', shortZh: '中国香港', shortEn: 'HK', countryZh: '中国香港', countryEn: 'Hong Kong, China',
      regimeZh: '利率联动', regimeEn: 'Rate Linkage',
      signalZh: '看港股估值与南向资金', signalEn: 'HK equity value and southbound flow',
      rateZh: '港息 观察', rateEn: 'HIBOR watch', cpiZh: 'CPI → 稳定', cpiEn: 'CPI → stable',
    },    {
      id: 'US', shortZh: '美国', shortEn: 'US', countryZh: '美国', countryEn: 'United States',
      regimeZh: regime.zh, regimeEn: regime.en,
      signalZh: regime.signal, signalEn: 'Commodities overweight, long bonds underweight',
      rateZh: `FED ${usFedText}`, rateEn: `Fed ${usFedText}`, cpiZh: `CPI ${inflationText(regime.inflation)}`, cpiEn: `CPI ${inflationText(regime.inflation)}`,
    },
    {
      id: 'UK', shortZh: '英国', shortEn: 'UK', countryZh: '英国', countryEn: 'United Kingdom',
      regimeZh: '高息消化', regimeEn: 'Rate Digestion',
      signalZh: '偏现金流，轻久期', signalEn: 'Cash-flow quality, lighter duration',
      rateZh: 'BOE 观察', rateEn: 'BOE watch', cpiZh: 'CPI → 黏性', cpiEn: 'CPI → sticky',
    },
    {
      id: 'DE', shortZh: '德国', shortEn: 'DE', countryZh: '德国', countryEn: 'Germany',
      regimeZh: '工业修复', regimeEn: 'Industrial Repair',
      signalZh: '看订单与欧元区信用', signalEn: 'Orders and euro credit',
      rateZh: 'ECB 观察', rateEn: 'ECB watch', cpiZh: 'CPI → 回落', cpiEn: 'CPI → cooling',
    },
  ] : [];
  const activeMacroSignal = macroSignals[macroSignalIndex % Math.max(macroSignals.length, 1)];

  if (activeApp === 'miaojie') {
    return <MiaojiePortal />;
  }
  return (
    <div className="w-full bg-[#FFFFFF] text-[#1D1D1B] font-serif min-h-screen flex flex-col overflow-x-hidden antialiased pb-12">
      {/* Top Margin Editorial Board */}
      <div className="bg-[#1D1D1B] text-[#FDFCF9] py-2 px-6 text-center select-none text-[9px] tracking-[0.25em] font-sans font-bold uppercase">
        {activeApp === 'gemini'
          ? t('topAlert')
          : '🏛️ SGSYEN 独立研判系统研究终端 • 中国顶尖数字活化智库 • 双流合一云原生环境'
        }
      </div>

      <div>
        <div
          className={`flex-1 w-full ${pageFrameMaxClass} mx-auto border-x border-[#1D1D1B]/10 flex-col bg-[#FFFFFF] ${
            activeApp === 'sgsyen' ? 'flex' : 'hidden'
          }`}
        >
            {/* Top mini-bar for lang switcher to keep it accessible everywhere */}
            <div className="min-h-[36px] md:h-[36px] flex flex-col sm:flex-row justify-between items-center px-3 md:px-5 lg:px-6 py-0 bg-[#FFFFFF] border-b border-[#1D1D1B]/10 select-none gap-3 shrink-0">
              {/* Left Side: Domain Identity Network Status */}
              <div className="flex items-center gap-2 text-left">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-[9px] uppercase font-sans tracking-[0.2em] font-bold text-stone-500">
                  {locale === 'zh' ? 'SGSYEN 智库研究专网' : 'SGSYEN SECURE PORTAL'}
                </span>
              </div>

              {/* Right Side: Language Switcher and Top-Right Login */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-[10px] uppercase font-sans tracking-widest text-[#1D1D1B]">
                <button
                  onClick={() => navigate(`/research?view=${viewMode}`)}
                  className="h-7 inline-flex items-center gap-1.5 px-2.5 border border-[#1D1D1B]/10 text-[9px] font-sans font-bold uppercase tracking-widest text-[#1D1D1B] hover:border-[#1D1D1B] hover:bg-[#1D1D1B] hover:text-[#FDFCF9] transition-colors cursor-pointer rounded shrink-0"
                >
                  <BookOpen className="w-3 h-3" />
                  <span className="hidden sm:inline">{locale === 'zh' ? '观点与研究' : 'Research'}</span>
                  <span className="sm:hidden">Research</span>
                </button>

                <ViewModeSwitch />
                <LanguageSwitch />

                {/* Top-Right Unified Login */}
                <div className="h-7 flex items-center gap-2 border-r border-[#1D1D1B]/10 pr-4">
                  {authorizedEmail ? (
                    <div className="text-[10px] uppercase font-sans tracking-widest text-stone-600 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/member?view=${viewMode}`)}
                        className="font-bold text-[#A58261] hover:underline cursor-pointer"
                      >
                        ● {authorizedEmail}
                      </button>
                      <button 
                        onClick={logout}
                        className="text-[#C83E3E] font-bold hover:underline cursor-pointer ml-1 text-[9px]"
                      >
                        [{locale === 'zh' ? '登出' : 'Log out'}]
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="h-7 text-[10px] uppercase font-sans tracking-widest text-[#A58261] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>🔑 {locale === 'zh' ? '专属登录' : 'Sign In'}</span>
                    </button>
                  )}
                </div>

              </div>
            </div>

            <SgsyenPortal />

            {/* Custom footer indicator */}
            <footer className="px-6 md:px-12 py-8 border-t border-[#1D1D1B]/10 flex flex-col sm:flex-row justify-between items-center bg-[#FFFFFF] gap-4 select-none">
              <div className="text-[10px] font-sans tracking-widest uppercase text-stone-500 text-center sm:text-left">
                © 2020 - 2026 SGSYEN 智库研究中心 • 庙街数字重建委员会
              </div>
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-sans uppercase font-bold tracking-widest text-[#A58261]">
                  疆域 GSYEN ENGINE ACTIVE
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-tight text-stone-700">sgsyen.com</span>
                </div>
              </div>
            </footer>
        </div>

        <div className={activeApp === 'research' ? 'block' : 'hidden'}>
          {path.startsWith('/research/gsyen-quant') ? <GsyenQuantBlogPage /> : <ResearchPage />}
        </div>

        <div className={activeApp === 'workspace' ? 'block' : 'hidden'}>
          {path.startsWith('/workspace/regime-lab') || path.startsWith('/tools/regime-lab') ? (
            <RegimeReviewDeskPage />
          ) : path.startsWith('/workspace/tempora-flip') || path.startsWith('/tools/tempora-flip') ? (
            <TemporaFlipPreviewPage />
          ) : (
            <ToolsPage />
          )}
        </div>
        <div className={activeApp === 'member' ? 'block' : 'hidden'}>
          <MemberCenterPage />
        </div>

        <AnimatePresence mode="wait">
          {activeApp === 'gemini' && (
          <motion.div
            key="gemini-cost-explainer"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className={`flex-1 w-full ${pageFrameMaxClass} mx-auto border-x border-[#1D1D1B]/10 flex flex-col bg-[#FFFFFF]`}
          >
            <div className="relative flex flex-wrap md:flex-nowrap items-center gap-y-3 px-3 md:px-5 lg:px-6 py-0 bg-[#F7F8FA] select-none min-h-[36px] md:h-[36px] overflow-hidden shrink-0">
              <button
                onClick={() => navigate(`/?view=${viewMode}`)}
                className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-400 hover:text-[#1D1D1B] transition-colors cursor-pointer shrink-0 z-10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {locale === 'zh' ? '返回首页' : 'Back Home'}
              </button>
              <div className="ml-auto z-10 flex items-center gap-2">
                <ViewModeSwitch />
                <LanguageSwitch />
              </div>
            </div>

            {/* Header Navigation */}
            <header className="px-6 md:px-12 lg:px-20 pt-7 pb-10 border-b border-[#1D1D1B]/10 bg-[#F7F8FA] select-none">
              <div className="grid lg:grid-cols-[1fr_0.7fr] gap-10 items-end">
                <div>
                  <div className="text-xs tracking-[0.3em] uppercase font-sans font-bold text-[#A58261]">
                    {t('appSubtitle')}
                  </div>
                  <div className="text-stone-400 font-sans text-[10px] uppercase mt-1">
                    {t('analystName')}
                  </div>
                </div>

                <aside className="border border-[#1D1D1B]/10 bg-white p-5">
                  <div className="grid sm:grid-cols-3 gap-5 text-[10px] tracking-widest uppercase font-sans font-medium text-stone-600">
                    <div>
                      <div className="text-[9px] text-zinc-400 font-bold mb-1">{locale === 'zh' ? '编号' : 'Memo'}</div>
                      <div>{t('memoNo')}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-400 font-bold mb-1">{locale === 'zh' ? '日期' : 'Date'}</div>
                      <div>{t('memoMonth')}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-400 font-bold mb-1">{locale === 'zh' ? '备忘' : 'Brief'}</div>
                      <div>{t('memoTitle')}</div>
                    </div>
                  </div>
                </aside>
              </div>
            </header>

            {/* Main Content Layout Grid */}
            <main className="flex-1 grid grid-cols-12 gap-0 relative">
              
              {/* Left Vertical Rail */}
              <div className="hidden lg:flex lg:col-span-1 border-r border-[#1D1D1B]/10 flex-col items-center py-12 select-none">
                <div className="[writing-mode:vertical-rl] rotate-180 text-[10px] tracking-[0.3em] uppercase font-sans text-stone-600 font-bold opacity-45 whitespace-nowrap">
                  {t('verticalRail')}
                </div>
              </div>

              {/* Central Narrative Area: 11 span */}
              <div className="col-span-12 lg:col-span-11 flex flex-col p-6 md:p-12 space-y-10">
                
                {/* Editorial Title Banner */}
                <div className="max-w-4xl space-y-6">
                  <h1 className="text-5xl md:text-8xl font-serif font-medium tracking-tighter leading-[0.9] text-[#1D1D1B]">
                    {t('mainTitle')} <span className="italic font-light opacity-60">{t('mainTitleItalic')}</span>
                  </h1>
                  <p className="font-sans text-lg md:text-xl font-light leading-relaxed max-w-3xl text-stone-600 border-l-2 border-[#1D1D1B]/25 pl-4">
                    {t('heroDescription')}
                  </p>
                </div>

                {/* Quick Summary Highlights / Quick Answers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-y border-[#1D1D1B] py-8 my-4 select-none">
                  <div className="space-y-2">
                    <div className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#A58261]">
                      {t('point1Title')}
                    </div>
                    <h3 className="text-xl font-serif font-medium leading-tight">{t('point1Sub')}</h3>
                    <p className="font-sans text-xs leading-relaxed text-stone-600">
                      {t('point1Desc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#A58261]">
                      {t('point2Title')}
                    </div>
                    <h3 className="text-xl font-serif font-medium leading-tight">{t('point2Sub')}</h3>
                    <p className="font-sans text-xs leading-relaxed text-stone-600">
                      {t('point2Desc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#A58261]">
                      {t('point3Title')}
                    </div>
                    <h3 className="text-xl font-serif font-medium leading-tight">{t('point3Sub')}</h3>
                    <p className="font-sans text-xs leading-relaxed text-stone-600">
                      {t('point3Desc')}
                    </p>
                  </div>
                </div>

                {/* Editorial Tab Controls */}
                <div className="flex flex-col sm:flex-row border border-[#1D1D1B]/20 bg-[#FFFFFF] p-1.5 rounded items-stretch sm:items-center justify-between gap-4 select-none">
                  <div className="flex flex-wrap gap-1 font-sans text-xs">
                    <button
                      onClick={() => navigate(`/gemini/calculator/?view=${viewMode}`)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded font-bold tracking-wider uppercase transition-colors outline-none cursor-pointer ${
                        activeTab === 'calculator' 
                          ? 'bg-[#1D1D1B] text-[#FDFCF9]' 
                          : 'text-stone-600 hover:bg-stone-200/50'
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      {t('tabCalculator')}
                    </button>
                    <button
                      onClick={() => navigate(`/gemini/analysis/?view=${viewMode}`)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded font-bold tracking-wider uppercase transition-colors outline-none cursor-pointer ${
                        activeTab === 'articles' 
                          ? 'bg-[#1D1D1B] text-[#FDFCF9]' 
                          : 'text-stone-600 hover:bg-stone-200/50'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t('tabArticles')}
                    </button>
                    <button
                      onClick={() => navigate(`/gemini/pricing/?view=${viewMode}`)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded font-bold tracking-wider uppercase transition-colors outline-none cursor-pointer ${
                        activeTab === 'tariffs' 
                          ? 'bg-[#1D1D1B] text-[#FDFCF9]' 
                          : 'text-stone-600 hover:bg-stone-200/50'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {t('tabTariffs')}
                    </button>
                  </div>
                  <div className="text-[10px] font-sans text-[#A58261] font-bold px-3 py-1 bg-[#A58261]/10 rounded border border-[#A58261]/20 tracking-wider text-center sm:text-right select-text uppercase">
                    {t('currentView')}{activeTab === 'calculator' ? t('viewCalculator') : activeTab === 'articles' ? t('viewArticles') : t('viewTariffs')}
                  </div>
                </div>

                {/* Dynamic Rendering of Content with smooth Framer Motion Page fade */}
                <motion.div 
                  key={activeTab}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="min-h-[450px]"
                >
                  {activeTab === 'calculator' && (
                    <CostCalculator />
                  )}
                  {activeTab === 'articles' && (
                    <InsightArticles />
                  )}
                  {activeTab === 'tariffs' && (
                    <ModelPricingTable 
                      selectedModelId={selectedModelId} 
                      onSelectModel={(id) => setSelectedModelId(id)} 
                    />
                  )}
                </motion.div>

                {/* Micro-Chart Comparison of Competitors */}
                {activeTab === 'calculator' && <SystemPerformancePanel />}

                <div className="border border-[#1D1D1B] p-6 bg-white space-y-4 rounded shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-1 col-span-1">
                      <span className="text-[9px] font-sans font-bold tracking-widest text-[#A58261] uppercase">{t('chartHeader')}</span>
                      <h4 className="text-xl font-serif font-bold text-[#1D1D1B]">{t('chartSub')}</h4>
                    </div>
                    <div className="text-xs text-stone-500 font-sans italic">
                      {t('chartDetailsLine')}
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {/* Gemini 2.0 Flash */}
                    <div className="space-y-1 font-sans">
                      <div className="flex justify-between text-xs text-stone-700">
                        <span className="font-bold flex items-center gap-1.5">🚀 Gemini 2.0 Flash / 1.5 Flash <span className="text-[10px] text-stone-400 font-normal italic">({t('chartLegendMoE')})</span></span>
                        <span className="font-mono text-[#A58261] font-bold">$0.075 / 1M Tokens</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                        <div className="w-[3%] bg-[#A58261] h-full" />
                      </div>
                    </div>

                    {/* GPT-4o mini */}
                    <div className="space-y-1 font-sans">
                      <div className="flex justify-between text-xs text-stone-600">
                        <span>OpenAI GPT-4o mini</span>
                        <span className="font-mono text-stone-800">$0.150 / 1M Tokens</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div className="w-[6%] bg-stone-400 h-full" />
                      </div>
                    </div>

                    {/* Claude 3.5 Haiku */}
                    <div className="space-y-1 font-sans">
                      <div className="flex justify-between text-xs text-stone-600">
                        <span>Anthropic Claude 3.5 Haiku</span>
                        <span className="font-mono text-stone-800">$0.800 / 1M Tokens</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div className="w-[32%] bg-stone-400 h-full" />
                      </div>
                    </div>

                    {/* Gemini 1.5 Pro */}
                    <div className="space-y-1 font-sans border-t border-dashed border-stone-200 pt-3">
                      <div className="flex justify-between text-xs text-stone-700">
                        <span className="font-bold flex items-center gap-1.5">🌀 Gemini 1.5 Pro <span className="text-[10px] text-[#A58261] font-normal italic">({t('chartLegendReasoning')})</span></span>
                        <span className="font-mono text-[#1D1D1B] font-bold">$1.250 / 1M Tokens</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                        <div className="w-[50%] bg-[#1D1D1B] h-full" />
                      </div>
                    </div>

                    {/* GPT-4o */}
                    <div className="space-y-1 font-sans">
                      <div className="flex justify-between text-xs text-stone-600">
                        <span>OpenAI GPT-4o</span>
                        <span className="font-mono text-stone-800">$2.500 / 1M Tokens</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div className="w-[100%] bg-[#1D1D1B]/50 h-full" />
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-500 font-sans italic pt-2 leading-relaxed">
                    {t('chartFootnote')}
                  </div>
                </div>

              </div>
            </main>

            {/* Footer Details */}
            <footer className="px-6 md:px-12 py-8 border-t border-[#1D1D1B]/10 flex flex-col sm:flex-row justify-between items-center bg-[#F9F7F2] gap-4 select-none">
              <div className="text-[10px] font-sans tracking-widest uppercase text-stone-500 text-center sm:text-left">
                {t('copyright')}
              </div>
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-sans uppercase font-bold tracking-widest text-[#A58261]">
                  疆域 GSYEN ENGINE ACTIVE
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-tight text-stone-700">{t('sandboxStatus')}</span>
                </div>
              </div>
            </footer>
          </motion.div>
          )}
        </AnimatePresence>
      </div>


      <div className="fixed inset-x-0 bottom-0 z-[650] pointer-events-none flex justify-center px-0">
        <div className={`w-full ${pageFrameMaxClass} min-h-9 border-x border-t border-[#C4A35A]/25 bg-[#111110] px-5 md:px-10 py-2`}>
          {regime && activeMacroSignal ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMacroSignal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.36, ease: 'easeOut' }}
                className="flex min-h-5 items-center justify-center md:justify-between gap-4 overflow-hidden text-[10px] font-sans uppercase tracking-[0.14em] text-white/62"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                  <span className="font-bold text-[#C4A35A] shrink-0">{locale === 'zh' ? '宏观象限' : 'Regime'}</span>
                  <span className="rounded-sm border border-[#C4A35A]/25 px-1.5 py-0.5 text-[9px] font-bold text-[#C4A35A] shrink-0">{locale === 'zh' ? activeMacroSignal.shortZh : activeMacroSignal.shortEn}</span>
                  <span className="font-sans font-semibold uppercase tracking-[0.14em] text-[10px] text-white truncate">
                    {locale === 'zh' ? activeMacroSignal.regimeZh : activeMacroSignal.regimeEn}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-3 min-w-0 font-sans uppercase tracking-[0.14em] text-white/55">
                  <span className="min-w-0 truncate">{locale === 'zh' ? '配置信号' : 'Signal'} <b className="text-[#C83E3E] font-semibold">{locale === 'zh' ? activeMacroSignal.signalZh : activeMacroSignal.signalEn}</b></span>
                  <span className="text-white/18 shrink-0">|</span>
                  <span className="shrink-0">{locale === 'zh' ? activeMacroSignal.rateZh : activeMacroSignal.rateEn}</span>
                  <span className="shrink-0">{locale === 'zh' ? activeMacroSignal.cpiZh : activeMacroSignal.cpiEn}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex items-center gap-2 text-[9px] font-sans uppercase tracking-[0.16em] text-white/35">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0 animate-pulse" />
              <span>{locale === 'zh' ? '宏观象限载入中' : 'Loading regime signal'}</span>
            </div>
          )}
        </div>
      </div>
      {/* Unified Security Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[700] flex items-center justify-center p-4 select-none"
            onClick={() => { setShowLoginModal(false); setLoginEmail(''); setLoginPassword(''); setLoginError(''); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#FFFFFF] border border-[#1D1D1B]/10 max-w-md w-full shadow-2xl p-8 md:p-10 relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setShowLoginModal(false); setLoginEmail(''); setLoginPassword(''); setLoginError(''); }}
                className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-[#A58261] font-sans font-bold block">SGSYEN Secure Credentials</span>
                  <h3 className="text-xl md:text-2xl font-serif font-black text-[#1D1D1B]">智库契约专员登录</h3>
                  <p className="text-stone-500 font-sans text-xs leading-relaxed">
                    请输入您的认购受托邮箱，以通过安全对象存储获取研究报告 PDF 原件。统一入口，全账户一站式贯通。
                  </p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoginError('');
                    if (!loginEmail || !loginPassword) {
                      setLoginError(locale === 'zh' ? '请填写邮箱和密码。' : 'Please enter your email and password.');
                      return;
                    }
                    setLoginLoading(true);
                    const { error } = await login(loginEmail, loginPassword);
                    setLoginLoading(false);
                    if (error) {
                      setLoginError(error);
                    } else {
                      setShowLoginModal(false);
                      setLoginEmail('');
                      setLoginPassword('');
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] uppercase font-sans tracking-widest text-[#1D1D1B] font-bold block">认购人邮箱 (Email)</label>
                    <input
                      type="email"
                      required
                      placeholder="member@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-[#1D1D1B]/15 px-4 py-3 text-sm rounded outline-none text-[#1D1D1B] font-sans focus:border-[#C4A35A] transition-colors placeholder-stone-400"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[9px] uppercase font-sans tracking-widest text-[#1D1D1B] font-bold block">密码 (Password)</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-[#1D1D1B]/15 px-4 py-3 text-sm rounded outline-none text-[#1D1D1B] font-sans focus:border-[#C4A35A] transition-colors placeholder-stone-400"
                    />
                  </div>

                  {loginError && (
                    <p className="text-xs text-[#C83E3E] font-sans italic">{loginError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-[#1D1D1B] text-[#FDFCF9] hover:bg-[#A58261] transition-colors py-3 text-xs tracking-widest font-sans font-bold uppercase cursor-pointer rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loginLoading ? (
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
                    ) : null}
                    {loginLoading
                      ? (locale === 'zh' ? '验证中...' : 'Verifying...')
                      : (locale === 'zh' ? '立即登录 (Sign In)' : 'Sign In')}
                  </button>
                </form>

                <div className="border-t border-[#1D1D1B]/5 pt-4 text-center">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-stone-400">
                    *Protected by isolated secret management and token controls.
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <InnerApp />
    </LocaleProvider>
  );
}
