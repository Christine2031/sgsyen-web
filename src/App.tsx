import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import ModelPricingTable from './components/ModelPricingTable';
import CostCalculator from './components/CostCalculator';
import InsightArticles from './components/InsightArticles';
import SgsyenPortal from './components/sgsyen/SgsyenPortal';
import { Calculator, FileText, Layers, RefreshCw } from 'lucide-react';
import { LocaleProvider, useLocale } from './context/LocaleContext';

function InnerApp() {
  const { locale, setLocale, t, authorizedEmail, authenticate, logout, showLoginModal, setShowLoginModal } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Derive active state from URL path
  const path = location.pathname;
  const activeApp = path.startsWith('/gemini') ? 'gemini' : 'sgsyen';
  let activeTab: 'calculator' | 'articles' | 'tariffs' = 'calculator';
  if (path.includes('/pricing')) activeTab = 'tariffs';
  else if (path.includes('/analysis')) activeTab = 'articles';
  
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-1.5-pro');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  // Dynamic page title based on active app/tab
  useEffect(() => {
    const baseTitle = locale === 'zh' ? '雍彻智库' : '雍彻智库 · SGSYEN';
    if (activeApp === 'sgsyen') {
      document.title = locale === 'zh'
        ? `SGSYEN 智库研究中心 | ${baseTitle}`
        : `SGSYEN Research Center | ${baseTitle}`;
    } else {
      const tabNames = {
        calculator: locale === 'zh' ? '算力成本估算' : 'Cost Calculator',
        articles: locale === 'zh' ? '算力逻辑解析' : 'Compute Analysis',
        tariffs: locale === 'zh' ? '官方资费对照' : 'Tariff Reference',
      };
      const geminiPrefix = locale === 'zh' ? 'Gemini 算力实验室' : 'Gemini Compute Lab';
      document.title = `${tabNames[activeTab]} | ${geminiPrefix} | ${baseTitle}`;
    }
  }, [path, locale]);

  return (
    <div className="w-full bg-[#FDFCF9] text-[#1D1D1B] font-serif min-h-screen flex flex-col overflow-x-hidden antialiased">
      {/* Top Margin Editorial Board */}
      <div className="bg-[#1D1D1B] text-[#FDFCF9] py-2 px-6 text-center select-none text-[9px] tracking-[0.25em] font-sans font-bold uppercase">
        {activeApp === 'sgsyen' 
          ? '🏛️ SGSYEN 独立研判系统研究终端 • 中国顶尖数字活化智库 • 双流合一云原生环境'
          : t('topAlert')
        }
      </div>

      {/* Structural Central Switcher for SGSYEN and Gemini Analyzer */}
      <div className="w-full max-w-[1300px] mx-auto border-x border-[#1D1D1B]/10 grid grid-cols-2 text-center text-xs font-sans font-bold uppercase select-none border-b border-[#1D1D1B]/10 bg-white">
        <button
          id="toggle-sgsyen-portal-btn"
          onClick={() => navigate('/')}
          className={`py-4 transition-all flex items-center justify-center gap-2 cursor-pointer outline-none ${
            activeApp === 'sgsyen'
              ? 'bg-[#1D1D1B] text-[#FDFCF9]'
              : 'text-[#1D1D1B] hover:bg-stone-50'
          }`}
        >
          <span>🏛️ {locale === 'zh' ? 'SGSYEN 智库研究中心' : 'SGSYEN Research Center (sgsyen.com)'}</span>
        </button>
        <button
          id="toggle-gemini-pricing-btn"
          onClick={() => navigate('/gemini/calculator/')}
          className={`py-4 transition-all flex items-center justify-center gap-2 cursor-pointer outline-none ${
            activeApp === 'gemini'
              ? 'bg-[#1D1D1B] text-[#FDFCF9]'
              : 'text-[#1D1D1B] hover:bg-stone-50'
          }`}
        >
          <span>⚡ {locale === 'zh' ? 'Gemini 算力价格实验室' : 'Gemini Compute Explainer Studio'}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeApp === 'sgsyen' ? (
          <motion.div
            key="sgsyen-portal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="flex-1 w-full max-w-[1300px] mx-auto border-x border-[#1D1D1B]/10 flex flex-col bg-[#FDFCF9]"
          >
            {/* Top mini-bar for lang switcher to keep it accessible everywhere */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 md:px-12 py-3 bg-[#FAF9F5] border-b border-[#1D1D1B]/10 select-none gap-3">
              {/* Left Side: Domain Identity Network Status */}
              <div className="flex items-center gap-2 text-left">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-[9px] uppercase font-sans tracking-[0.2em] font-bold text-stone-500">
                  {locale === 'zh' ? 'SGSYEN 智库研究专网' : 'SGSYEN SECURE PORTAL'}
                </span>
              </div>

              {/* Right Side: Language Switcher and Top-Right Login */}
              <div className="flex items-center gap-4 text-[10px] uppercase font-sans tracking-widest text-[#1D1D1B]">
                {/* Top-Right Unified Login */}
                <div className="flex items-center gap-2 border-r border-[#1D1D1B]/10 pr-4">
                  {authorizedEmail ? (
                    <div className="text-[10px] uppercase font-sans tracking-widest text-stone-600 flex items-center gap-2">
                      <span className="font-bold text-[#A58261]">● {authorizedEmail}</span>
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
                      className="text-[10px] uppercase font-sans tracking-widest text-[#A58261] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>🔑 {locale === 'zh' ? '专属登录' : 'Sign In'}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setLocale('zh')}
                  className={`px-2 py-0.5 cursor-pointer underline-offset-4 ${locale === 'zh' ? 'font-bold underline text-[#A58261]' : 'opacity-50 hover:opacity-100'}`}
                >
                  中文
                </button>
                <span className="text-stone-300">|</span>
                <button
                  onClick={() => setLocale('en')}
                  className={`px-2 py-0.5 cursor-pointer underline-offset-4 ${locale === 'en' ? 'font-bold underline text-[#A58261]' : 'opacity-50 hover:opacity-100'}`}
                >
                  English
                </button>
              </div>
            </div>

            <SgsyenPortal />

            {/* Custom footer indicator */}
            <footer className="px-6 md:px-12 py-8 border-t border-[#1D1D1B]/10 flex flex-col sm:flex-row justify-between items-center bg-[#FAF9F5] gap-4 select-none">
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
          </motion.div>
        ) : (
          <motion.div
            key="gemini-cost-explainer"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="flex-1 w-full max-w-[1300px] mx-auto border-x border-[#1D1D1B]/10 flex flex-col bg-[#FDFCF9]"
          >
            {/* Header Navigation */}
            <header className="flex flex-col sm:flex-row justify-between items-center px-6 md:px-12 py-8 border-b border-[#1D1D1B]/10 gap-4 select-none">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="text-xs tracking-[0.3em] uppercase font-sans font-bold text-[#A58261]">
                  {t('appSubtitle')}
                </div>
                <div className="text-stone-400 font-sans text-[10px] uppercase mt-1">
                  {t('analystName')}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 text-[10px] tracking-widest uppercase font-sans font-medium text-stone-600">
                <span>{t('memoNo')}</span>
                <span>{t('memoMonth')}</span>
                <span>{t('memoTitle')}</span>
                
                {/* Elegant Language Switcher Button */}
                <div className="flex items-center border border-[#1D1D1B]/20 rounded overflow-hidden divide-x divide-[#1D1D1B]/20 bg-white font-sans text-[9px] font-bold">
                  <button
                    onClick={() => setLocale('zh')}
                    className={`px-2.5 py-1.5 transition-colors uppercase cursor-pointer outline-none ${
                      locale === 'zh' ? 'bg-[#1D1D1B] text-[#FDFCF9]' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    中文 (ZH)
                  </button>
                  <button
                    onClick={() => setLocale('en')}
                    className={`px-2.5 py-1.5 transition-colors uppercase cursor-pointer outline-none ${
                      locale === 'en' ? 'bg-[#1D1D1B] text-[#FDFCF9]' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </header>

            {/* Main Content Layout Grid */}
            <main className="flex-1 grid grid-cols-12 gap-0 relative">
              
              {/* Left Vertical Rail */}
              <div className="hidden lg:col-span-1 border-r border-[#1D1D1B]/10 flex flex-col items-center py-12 select-none">
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
                <div className="flex flex-col sm:flex-row border border-[#1D1D1B]/20 bg-[#FAF9F5] p-1.5 rounded items-stretch sm:items-center justify-between gap-4 select-none">
                  <div className="flex flex-wrap gap-1 font-sans text-xs">
                    <button
                      onClick={() => navigate('/gemini/calculator/')}
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
                      onClick={() => navigate('/gemini/analysis/')}
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
                      onClick={() => navigate('/gemini/pricing/')}
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

      {/* Unified Security Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[700] flex items-center justify-center p-4 select-none"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#FDFCF9] border border-[#1D1D1B]/10 max-w-md w-full shadow-2xl p-8 md:p-10 relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-[#A58261] font-sans font-bold block">SGSYEN Secure Credentials</span>
                  <h3 className="text-xl md:text-2xl font-serif font-black text-[#1D1D1B]">智库契约专员登录</h3>
                  <p className="text-stone-500 font-sans text-xs leading-relaxed">
                    请输入您的認購受托邮箱以确权全站研究报告学术 PDF 离线印本的 GCS 安全下载通道。统一入口，全账户一站式贯通。
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setLoginError('');
                    if (!loginEmail || !loginEmail.includes('@')) {
                      setLoginError(locale === 'zh' ? '请输入有效的电子邮件信箱。' : 'Please provide a valid client email address.');
                      return;
                    }
                    authenticate(loginEmail);
                    setShowLoginModal(false);
                    setLoginEmail('');
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] uppercase font-sans tracking-widest text-[#1D1D1B] font-bold block">認購人受托邮箱 (Partner subscriber email)</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. Ethan7586@gsyen.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#1D1D1B]/15 px-4 py-3 text-sm rounded outline-none text-[#1D1D1B] font-sans focus:border-[#C4A35A] transition-colors placeholder-stone-400"
                    />
                  </div>

                  {loginError && (
                    <p className="text-xs text-[#C83E3E] font-sans italic">{loginError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#1D1D1B] text-[#FDFCF9] hover:bg-[#A58261] transition-colors py-3 text-xs tracking-widest font-sans font-bold uppercase cursor-pointer rounded"
                  >
                    校验契约，立即验证 (Verify Account)
                  </button>
                </form>

                <div className="border-t border-[#1D1D1B]/5 pt-4 text-center">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-stone-400">
                    *Fully aligned with Google Cloud Run KMS Secret credentials.
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

