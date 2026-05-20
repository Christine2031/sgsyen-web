import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, BookOpen, Clock, Globe, Presentation } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import SgsyenSlidesModal from './SgsyenSlidesModal';

export default function SgsyenCaseStudy() {
  const { t, locale } = useLocale();
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isSlidesOpen, setIsSlidesOpen] = useState<boolean>(false);

  const slidesZH = [
    {
      title: '庙街小巷：神圣城市规划、数字复苏与人文活化',
      subtitle: 'Temple Street Alley • 商业与人文重组白皮书',
      description: '庙街数字孪生与商业规划，运用高精度空间计算与原生大语言模型，深度活化传统风物空间。课题组提出「文化数字主权营修」理念，在保留老香港九龙街区空间本底前提下，构建高维度的智能沉浸式商业场景，将老商铺生态无缝拼接全球AI社群。',
      imageUrl: '/temple-street-alley/uploads/pasted-1777259383775-0.png',
      fallbackColor: 'bg-stone-800',
      badge: '数字融合规划案例',
      meta: {
        date: '2024.12',
        sector: '文化数字资产 & 城市更新',
        leadAuthor: 'SGSYEN 多模态计算实验室',
        deliverable: '庙街商业技术蓝皮书 (White Paper) ── 点击放映幻灯片'
      }
    },
    {
      title: '数字孪生：风物资产的空间多维解耦',
      subtitle: '数字化资产确权与实景深度克隆',
      description: '运用高精激光扫描与数字图像合成网络，建立庙街上百家中小摊位的三维数字孪生矩阵。不仅是一份不可篡改的关键历史文献克隆档案，更是元宇宙沉浸式消费场景 and AR商铺交互网络不可动摇的黄金数字空间基础。',
      imageUrl: '/temple-street-alley/uploads/pasted-1777259383775-0.png',
      fallbackColor: 'bg-[#1a3450]',
      badge: '实景数字克隆',
      meta: {
        date: '2025.02',
        sector: '空间激光复原 / Web3.0',
        leadAuthor: '时空孪生计算课题组',
        deliverable: '三维实网重构数字标本库'
      }
    },
    {
      title: 'AI赋能：让历史会面当下',
      subtitle: '对话街区与数字数字风物智理',
      description: '通过将街区口述历史、非物质文化遗产方言声纹、食肆菜谱谱图以及经典小说剧情，灌入统一的大语言长上下文底盘，课题组训练出专属的「庙街风物智能体」。游客在此不仅可以一览原汁夜市，更可通过混合现实装备和数字终端，与特定摊位穿越时空，跨代对话。',
      imageUrl: '/temple-street-alley/uploads/pasted-1777259383775-0.png',
      fallbackColor: 'bg-zinc-800',
      badge: '智慧口述历史 AI',
      meta: {
        date: '2025.04',
        sector: '多重AI model对齐 / NLP',
        leadAuthor: '数字记忆保护委员会',
        deliverable: '口述历史智能体框架 V1'
      }
    }
  ];

  const slidesEN = [
    {
      title: 'Temple Street Alley: Sacred Urbanism, Spatial Re-engineering & Heritage',
      subtitle: 'Temple Street Alley • Structural & Societal Re-organization Whitepaper',
      description: 'Temple Street digital twin architecture and spatial design strategies leveraging high-fidelity geospatial computing and modern deep LLMs. Preserving native Kowloon urban fabrics, our council constructs adaptive immersive scenarios, seamlessly interconnecting local heritage with global AI networks.',
      imageUrl: '/temple-street-alley/uploads/pasted-1777259383775-0.png',
      fallbackColor: 'bg-stone-800',
      badge: 'Spatial-Digital Integration Case',
      meta: {
        date: '2024.12',
        sector: 'Digital Cultural Assets & Urban Renewal',
        leadAuthor: 'SGSYEN Multimodal Computing Lab',
        deliverable: 'Temple Street Tech Bluebook (White Paper) ── Click to play Slides'
      }
    },
    {
      title: 'Digital Twins: Multi-Dimensional Asset Decoupling',
      subtitle: 'Immutable Ledger Registration & Environmental Clones',
      description: 'Utilizing premium LiDAR scanner nodes and neural rendering networks, we compiled high-resolution 3D digital clones for over 100 historical vendors on Temple Street. This forms a cryptographic archive protecting collective memory and anchors future AR transactional assets.',
      imageUrl: '/temple-street-alley/uploads/pasted-1777259383775-0.png',
      fallbackColor: 'bg-[#1a3450]',
      badge: 'LiDAR Environmental Clone',
      meta: {
        date: '2025.02',
        sector: 'Geospatial Extraction & Web3.0',
        leadAuthor: 'Spatiotemporal Project Research Team',
        deliverable: '3D Heritage Asset Object Library'
      }
    },
    {
      title: 'AI Activation: Making History Converge with the Present',
      subtitle: 'Conversational Heritage Spaces & Living Archives',
      description: 'By compiling oral memories, community vernacular assets, traditional recipes, and localized literary archives into a unified fine-tuned agent, we deployed the "Temple Street Living Replica". Visitors can interact in real-time, cross-generational dialogues via smart web interfaces.',
      imageUrl: '/temple-street-alley/uploads/pasted-1777259383775-0.png',
      fallbackColor: 'bg-zinc-800',
      badge: 'Conversational Oral History AI',
      meta: {
        date: '2025.04',
        sector: 'Synaptic Realignment & NLP',
        leadAuthor: 'Digital Heritage Protection Comm',
        deliverable: 'Conversational Heritage Agent Core v1'
      }
    }
  ];

  const slides = locale === 'zh' ? slidesZH : slidesEN;

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const current = slides[activeSlide];

  return (
    <section id="sgsyen-casestudy-section" className="py-24 px-6 md:px-12 lg:px-20 bg-[#F5F4F0] text-[#1D1D1B] border-t border-[#1D1D1B]/10">
      
      {/* Editorial Header Row */}
      <div id="casestudy-editorial-header" className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div id="casestudy-header-title-pack">
          <span id="casestudy-sub-lbl" className="block text-[10px] uppercase tracking-[0.25em] mb-4 text-[#A58261] font-sans font-bold">
            {t('sgsyenCaseSub')}
          </span>
          <h2 id="casestudy-main-title" className="text-3xl lg:text-5xl font-serif font-semibold text-[#1D1D1B]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {t('sgsyenCaseTitle')}
          </h2>
        </div>

        {/* Custom Slide control numbers + Launch Slide Deck action button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            onClick={() => window.open('https://www.sgsyen.com/temple-street-alley/slides.html', '_blank')}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1D1D1B] hover:bg-[#A58261] text-[#FAF9F5] rounded text-xs tracking-widest font-sans font-bold uppercase transition-all shadow-md cursor-pointer border border-transparent hover:border-[#FAF9F5]/20"
          >
            <Presentation className="w-4 h-4 text-[#C4A35A] animate-pulse" />
            <span>📽️ {locale === 'zh' ? '放映 庙街小巷 演示幻灯片' : 'Play Slide Deck (16:9)'}</span>
          </button>

          <div id="casestudy-slide-indicators" className="flex items-center justify-center gap-4 font-mono text-xs">
            <button 
              id="casestudy-prev-btn" 
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-[#1D1D1B]/10 flex items-center justify-center bg-white hover:bg-[#1D1D1B] hover:text-[#FDFCF9] transition-all duration-300 cursor-pointer"
            >
              &larr;
            </button>
            <span id="casestudy-current-lbl" className="text-sm font-bold text-[#1D1D1B]">
              {String(activeSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
            <button 
              id="casestudy-next-btn" 
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-[#1D1D1B]/10 flex items-center justify-center bg-white hover:bg-[#1D1D1B] hover:text-[#FDFCF9] transition-all duration-300 cursor-pointer"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Case content showcase */}
      <div id="casestudy-main-container" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* Left column - details text inside warm card */}
        <div id="casestudy-text-card" className="lg:col-span-5 bg-white border border-[#1D1D1B]/10 p-8 md:p-12 rounded flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-500 text-left">
          
          <div id="casestudy-top-decor-line" className="absolute top-0 left-0 w-full h-[3px] bg-[#C4A35A]"/>

          <div id="casestudy-card-upper-flow">
            <span id="casestudy-badge" className="inline-block px-3 py-1 font-sans text-[10px] font-bold tracking-wider text-[#A58261] bg-[#A58261]/10 rounded mb-6 uppercase">
              {current.badge}
            </span>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <h3 id="casestudy-slide-title" className="text-2xl md:text-3xl font-serif font-bold leading-tight select-text text-[#1D1D1B]" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {current.title}
                </h3>
                <p id="casestudy-slide-sub" className="text-xs text-[#A58261] font-sans font-semibold tracking-wider uppercase">
                  {current.subtitle}
                </p>
                <p id="casestudy-slide-description" className="text-sm leading-[1.8] text-stone-600 font-light font-sans pt-2">
                  {current.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div id="casestudy-card-lower-metadata" className="mt-10 pt-8 border-t border-dashed border-stone-200 grid grid-cols-2 gap-4 text-xs font-sans text-left">
            <div id="casestudy-meta-col-date">
              <div id="casestudy-meta-col-date-lbl" className="text-stone-400 text-[10px] uppercase font-semibold">
                {locale === 'zh' ? '发布周期' : 'Timeline'}
              </div>
              <div id="casestudy-meta-col-date-val" className="font-bold text-stone-700 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C4A35A]" />
                {current.meta.date}
              </div>
            </div>
            <div id="casestudy-meta-col-sector">
              <div id="casestudy-meta-col-sector-lbl" className="text-stone-400 text-[10px] uppercase font-semibold">
                {locale === 'zh' ? '板块类型' : 'Classification'}
              </div>
              <div id="casestudy-meta-col-sector-val" className="font-bold text-stone-700 mt-1 flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-[#C4A35A]" />
                {current.meta.sector}
              </div>
            </div>
            <div id="casestudy-meta-col-author" className="col-span-2 border-t border-stone-100 pt-3">
              <div id="casestudy-meta-col-author-lbl" className="text-stone-400 text-[10px] uppercase font-semibold">
                {locale === 'zh' ? '课题总协调组' : 'Scientific Oversight'}
              </div>
              <div id="casestudy-meta-col-author-val" className="font-semibold text-stone-800 mt-1 flex items-center gap-1.5 font-sans">
                <Layers className="w-3.5 h-3.5 text-[#C4A35A]" />
                {current.meta.leadAuthor}
              </div>
            </div>
            <div 
              id="casestudy-meta-col-deliverable" 
              className={`col-span-2 cursor-pointer hover:opacity-85 transition-opacity bg-[#A58261]/5 p-3.5 border border-dashed border-[#A58261]/25 rounded-md mt-1`}
              onClick={() => window.open('/temple-street-alley/plan.html', '_blank')}
              title={locale === 'zh' ? '点击阅读庙街商业技术蓝皮书' : 'Click to read Temple Street Business Bluebook'}
            >
              <div id="casestudy-meta-col-deliverable-lbl" className="text-[#A58261] text-[9px] uppercase font-bold tracking-wider mb-1">
                {locale === 'zh' ? '蓝皮书' : 'Bluebook'}
              </div>
              <div id="casestudy-meta-col-deliverable-val" className="font-extrabold text-[#1D1D1B] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C4A35A] shrink-0" />
                <span className="underline decoration-dashed hover:text-[#A58261] transition-colors">{locale === 'zh' ? '庙街商业技术蓝皮书 (White Paper)' : 'Temple Street Business Bluebook (White Paper)'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right column - image preview */}
        <div id="casestudy-image-panel" className="lg:col-span-7 rounded overflow-hidden shadow-md flex bg-gradient-to-br from-stone-900 to-stone-950 min-h-[400px] border border-[#1D1D1B]/10 xl:min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full relative"
            >
              <img 
                id="casestudy-rendering-image"
                src={current.imageUrl}
                alt={current.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback nicely with class dynamically
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.classList.add(current.fallbackColor, 'flex', 'items-center', 'justify-center');
                    parent.innerHTML = `
                      <div class="text-[#FDFCF9] p-12 text-center max-w-sm">
                        <span class="text-4xl block mb-4 font-serif italic opacity-60">
                          ${locale === 'zh' ? '庙街风物重建模型馆' : 'Temple Street Reconstruction Model Hall'}
                        </span>
                        <p class="text-[10px] font-mono text-stone-400 uppercase tracking-widest leading-relaxed">
                          SGSYEN SPATIAL RECONSTRUCTION MAP ENGINE LIVE
                        </p>
                      </div>
                    `;
                  }
                }}
                className="w-full h-full object-cover select-none min-h-[400px]"
              />
              <div id="casestudy-image-shadow-overlay" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Floating Presentation Modal layer */}
      <AnimatePresence>
        {isSlidesOpen && (
          <SgsyenSlidesModal onClose={() => setIsSlidesOpen(false)} />
        )}
      </AnimatePresence>

    </section>
  );
}
