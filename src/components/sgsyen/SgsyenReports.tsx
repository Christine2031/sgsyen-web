import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, ArrowRight, X, Download, Lock, CheckCircle2, Loader2, Calendar, Tag } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { supabase } from '../../lib/supabase';

interface Report {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category?: string;
  summary?: string;
  cover_url?: string;
  published_at?: string;
  content?: string;
}

const API = import.meta.env.VITE_API_URL || "https://sgsyen-api-ocjwdme54q-de.a.run.app";

const FALLBACK_REPORTS: Report[] = [
  {
    id: "r-01",
    slug: "geopolitics-chip-subsidies",
    title: "地缘博弈与特种半导体的补贴博弈分析",
    subtitle: "关于产业链战略脱钩与深水区政策倾斜的深度剖析报告",
    category: "战略经济与全球治理",
    summary: "本研究深度解构了过去六年间，全球主要大国在深纳特种半导体、超宽带基座制造及光刻链段所实施的近千亿美元财政补贴浪潮。研究表明，强力干预正在剧烈扭曲传统的自由流片分工体系，带来了地缘安全保障层面的高昂防波堤成本。决策者必须重视从【全能自主套娃】向【底座供应链韧性共同体】的范式转换。",
    published_at: "2024-11-20T10:00:00Z",
    content: "# 地缘博弈与特种半导体的补贴博弈分析\n\n## 一、 全球半导体新冷战格局\n当前，半导体产业已经超越纯粹的商品流通逻辑，沉淀为大国重构科技主权的必争之地。围绕台积电(TSMC)、阿斯麦(ASML)等霸权节点的博弈呈指数级升级。\n\n## 二、 二进制权力与补贴政策扭曲\n过去两年来，美国芯片法案推出的520亿美元直接补贴，和欧洲版半导体方案、中国国家大基金三期等宏大投资形成了持久的【防波堤博弈】。这导致：\n\n* **物理建厂产能结构性冗余**：重叠建设12英寸晶圆厂将导致长期折旧沉疴。\n* **人才漏斗效应加深**：特殊工艺制程的工程师短缺，使良率攀升成本高企。\n\n## 三、 结构性建议及结论\n智库课题组认为，依赖补贴来寻求单打独斗的「全能闭环」属于过时的地缘幻想。最理性的决策路线应当是建立在具有技术壁垒的、开放高带宽节点分工之上的「动态韧性联盟」。对特定基础深加工制程进行国家安全级别预存，而非全面流片替代。"
  },
  {
    id: "r-02",
    slug: "ai-governance-digital-sovereignty",
    title: "人工智能大模型安全治理与数字主权博弈",
    subtitle: "长下文突触网络及知识库内容审查框架设计",
    category: "科技政策与数字秩序",
    summary: "在全通道原生多模态生成网络高速挺进产业腹地的当下，数字资产主权、方言文化权重以及数据输入边界正经受史无前例的重置。本报告率先提出了全新的「突触网络层主权审计（Synapse-Level Sovereignty Auditing）」概念框架，在模型底盘侧实现对数据完整与文化信度的自适应校准。",
    published_at: "2025-02-15T09:30:00Z",
    content: "# 人工智能大模型安全治理与数字主权博弈\n\n## 一、 生成式人工智能的主权侵蚀风险\n当全球大型企业普遍采用单一境外旗舰API作为业务中枢时，主权敏感数据（包含地方地基规划、金融流、以及口述历史资产）正通过连续查询的上下文无感知流失。这带来了极其险峻的数据物理领土失守挑战。\n\n## 二、 突触层对齐与方言文化信度\n训练数据集中英语等绝对强势文字的高达70%的高频垄断，正在让大模型逐步稀释甚至吞噬少数群体的文化话语、本真记忆。在AI检索中，这部分宝贵思想的突变衰降速度极快。\n\n## 三、 智库自研对齐框架方案 (Framework)\nSGSYEN科技实验室提出了一个「双层安全审计」：\n\n1. **前置逻辑拦截层**：敏感与主权属性词在流向外部接口前进行深度语义混淆及实体屏蔽。\n2. **本地长上下文检索挂载**：在本地存储历史文献语料库，通过RAG技术优先做文化修正对齐，拒绝对历史资产做西方化语境套娃解释。"
  },
  {
    id: "r-03",
    slug: "temple-street-revitalization-summary",
    title: "庙街老街区复兴与文商旅融合评估红利",
    subtitle: "基于数字孪生与口述智能体的活化范式研究",
    category: "社会治理与制度创新",
    summary: "本课题深度解构了庙街（Temple Street Alley）多维物理空间活化。通过对125家本地核心摊贩的数字化解耦，创建了自适应数字记忆网络。该模式充分释放了传统地缘商业中潜藏的巨大生命活性，并验证了利用时空元数据活化旧城区的实证可行性。",
    published_at: "2025-05-18T14:20:00Z",
    content: "# 庙街老街区复兴与文商旅融合评估红利\n\n## 一、 文物保护与底层商业活化的断裂\n过去的城市改造往往走入两个泥潭：一是推倒重建的野蛮格式化导致市民街区记忆瞬间归零；二是对老摊点做冰冷博物馆化、死板封装，导致其彻底失去造血经营功能，商业死亡。\n\n## 二、 元数据活化体系的提出 (The Framework)\n庙街课题组打破围网，建立了一套「实景数字克隆 + 口述史AI + 物理夜市复原」三元框架。运用大模型为个体摊贩训练数字掌柜，让百年大排档不仅活在街巷，也活在二十四小时全天候的云端沉浸链条中。\n\n## 三、 评估与推论分析指标\n实地验证显示，改造后街区客流同比回暖34%，本地青年归流创业比例明显抬升。这完美阐释了「数字技术不应作为高高在上的科研象牙塔，而应当化作润物无声的生活本底支持」这一最高温情执着。"
  }
];

const FALLBACK_REPORTS_EN: Report[] = [
  {
    id: "r-01",
    slug: "geopolitics-chip-subsidies",
    title: "Geopolitical Contestation & Strategic Subsidies in Special Semiconductors",
    subtitle: "In-depth Analysis of Supplychain Relocations and Deep Policy Inflection",
    category: "Strategic Economy & Global Governance",
    summary: "This study deconstructs the multi-billion-dollar subsidy wave rollouts across core lithography ecosystems and advanced packaging labs. Our research suggests that brute fiscal interventions distort standard semiconductor division flows, introducing high national safety premiums. Leaders must pivot from 'closed self-reliance clusters' toward 'dynamic supply chain trust frameworks'.",
    published_at: "2024-11-20T10:00:00Z",
    content: "# Geopolitical Contestation & Semi Subsidies\n\n## 1. The New Tech Cold War\nSemiconductor fabrication is no longer just a commodity; it represents the primary battleground of state sovereignty over raw computing power.\n\n## 2. Fiscal Triggers & Supply Distortions\nOver $52 billion in US CHIPS Act grants, alongside EU and Chinese state capital infusions, trigger persistent policy overlaps. This leads to:\n\n* **Structural Overcapacity**: Redundant duplication of 300mm wafer fabs yields long-term amortization drag.\n* **Engineering Deficits**: Elite process engineers remain scarce under rapid geo-fencing.\n\n## 3. Policy Recommendation\nTrue robustness emerges from shared alliances based on high-barrier technology specialization rather than total unilateral self-reliance."
  },
  {
    id: "r-02",
    slug: "ai-governance-digital-sovereignty",
    title: "AI Safety Governance & the Dynamics of Digital Sovereignty",
    subtitle: "Synapse-Level Sovereignty Auditing & Framework Design on Long-Context Models",
    category: "Tech Policy & Digital Sovereignty",
    summary: "As native multimodal networks embed into regional public sectors, issues of sovereignty over digital artifacts and text alignment standards face unprecedented pressure. This report outlines a novel token-level auditing framework that self-calibrates language weight and data governance directly within the model structure.",
    published_at: "2025-02-15T09:30:00Z",
    content: "# AI Safety Governance & Digital Sovereignty\n\n## 1. Sovereignty Erosion Risks\nWhen public services depend entirely on unilateral offshore model APIs, critical operational metadata silently leak. This challenges traditional data territory boundaries.\n\n## 2. Synaptic Alignment & Linguistic Balance\nEnglish accounts for over 70% of leading datasets, creating a linguistic monopoly that risks eroding local language nuances and collective memory in real-time search outputs.\n\n## 3. The SGSYEN Sovereignty Alignment Matrix\nWe present a double-isolated auditing protocol:\n\n1. **Pre-Logical Intercept Layer**: Obfuscates sensitive entities and identifiers before forwarding queries.\n2. **Local Adaptive Retrieval-Augmented Generation (RAG)**: Employs specialized local historical corpora to correct foreign cultural bias."
  },
  {
    id: "r-03",
    slug: "temple-street-revitalization-summary",
    title: "Temple Street Revitalization & Cultural-Tourism Integration Dividend",
    subtitle: "An Architectural Exploration of Digital Twins & Living Oral History Agents",
    category: "Social Governance & Institutional Innovation",
    summary: "This case study examines spatial revitalization across Temple Street. By digitally mapping 125 local street merchants and deploying custom conversational archives, we created an active community network that transforms latent historic memory into tangible local economic energy.",
    published_at: "2025-05-18T14:20:00Z",
    content: "# Temple Street Revitalization Case Study\n\n## 1. The Heritage Renewal Dilemma\nMost urban interventions fail either by bulldozing communities into corporate sterile towers, or by freezing them under rigid museum rules that suffocate retail life.\n\n## 2. The Living Metadata Framework\nWe deployed a three-part model: physical street recovery, precise digital replicas, and localized heritage oral-history AI agents, enabling historic stalls to maintain active digital existences 24/7.\n\n## 3. Empirical Social Outcomes\nData shows a 34% increase in merchant foot traffic and a marked return of younger entrepreneurs to local street commerce."
  }
];

export default function SgsyenReports() {
  const { t, locale, authorizedEmail, authenticate, setShowLoginModal } = useLocale();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string>('');

  const isMemberLoggedIn = !!authorizedEmail;
  const currentFallback = locale === 'zh' ? FALLBACK_REPORTS : FALLBACK_REPORTS_EN;

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();

    fetch(`${API}/reports`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Report[]) => {
        if (data && data.length > 0) {
          setReports(data);
        } else {
          setReports(locale === 'zh' ? FALLBACK_REPORTS : FALLBACK_REPORTS_EN);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          // API 不可用时静默降级到 fallback 数据
          setReports(locale === 'zh' ? FALLBACK_REPORTS : FALLBACK_REPORTS_EN);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [locale]);

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (locale === 'en') {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, "0")}月`;
  };

  const handleOpenReport = (report: Report) => {
    const list = locale === 'zh' ? FALLBACK_REPORTS : FALLBACK_REPORTS_EN;
    const staticMatch = list.find(r => r.slug === report.slug);
    setSelectedReport(staticMatch || report);
  };

  const handleDownloadPDF = async (slug: string) => {
    if (!isMemberLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setDownloading(true);
    setDownloadSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setShowLoginModal(true);
        setDownloading(false);
        return;
      }
      const res = await fetch(`${API}/reports/${slug}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const { url } = await res.json();
      // 触发真实文件下载
      const a = document.createElement('a');
      a.href = url;
      a.download = `SGSYEN_${slug}.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess(locale === 'zh'
        ? `🎉 [会员专享下载就绪] 《SGSYEN_${slug}.pdf》 已通过 GCS 安全通道完成交付。`
        : `🎉 [Authorized Access Ready] "SGSYEN_${slug}.pdf" delivered via secure GCS channel.`
      );
    } catch (err: any) {
      setDownloadSuccess(locale === 'zh'
        ? `⚠️ 下载失败：${err.message}`
        : `⚠️ Download failed: ${err.message}`
      );
    } finally {
      setDownloading(false);
    }
  };

  // 解析行内 **bold** 和 *italic* 标记
  function renderInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2] !== undefined) {
        parts.push(<strong key={match.index} className="font-bold text-[#1D1D1B]">{match[2]}</strong>);
      } else if (match[3] !== undefined) {
        parts.push(<em key={match.index} className="italic">{match[3]}</em>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  }

  function renderMarkdownContent(md: string) {
    return md.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return <h1 key={i} className="text-2xl md:text-3xl font-serif font-black text-[#1D1D1B] mt-10 mb-6 border-b pb-4">{renderInline(trimmed.slice(2))}</h1>;
      }
      if (trimmed.startsWith("## ")) {
        return <h2 key={i} className="text-xl font-serif font-bold text-[#1D1D1B] mt-10 mb-4">{renderInline(trimmed.slice(3))}</h2>;
      }
      if (trimmed.startsWith("### ")) {
        return <h3 key={i} className="text-sm md:text-base font-serif font-semibold text-[#1D1D1B] mt-8 mb-3">{renderInline(trimmed.slice(4))}</h3>;
      }
      if (trimmed.startsWith("* ")) {
        return <li key={i} className="text-xs md:text-sm font-sans text-stone-700 leading-relaxed ml-6 list-disc mb-2">{renderInline(trimmed.slice(2))}</li>;
      }
      if (/^\d+\. /.test(trimmed)) {
        return <li key={i} className="text-xs md:text-sm font-sans text-stone-700 leading-relaxed ml-6 list-decimal mb-2">{renderInline(trimmed.replace(/^\d+\. /, ''))}</li>;
      }
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={i} className="my-6 pl-5 py-2 border-l-4 border-[#C4A35A] bg-[#FAF9F5] italic text-stone-600 font-serif leading-relaxed text-xs md:text-sm">
            {renderInline(trimmed.slice(2))}
          </blockquote>
        );
      }
      if (trimmed === "") {
        return <div key={i} className="h-4" />;
      }
      return <p key={i} className="text-xs md:text-sm font-sans leading-[1.8] text-stone-700 mb-4 select-text">{renderInline(line)}</p>;
    });
  }

  return (
    <section id="sgsyen-viewpoints-reports-container" className="py-24 px-6 md:px-12 lg:px-20 bg-[#FDFCF9] text-[#1D1D1B]">
      
      {/* Dynamic Header */}
      <div id="reports-header-row" className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6 select-none">
        <div id="reports-header-title-pack">
          <span id="reports-sub-lbl" className="block text-[10px] uppercase tracking-[0.25em] mb-4 text-[#A58261] font-sans font-bold">
            {t('sgsyenReportsSub')}
          </span>
          <h2 id="reports-main-title" className="text-3xl lg:text-5xl font-serif font-semibold text-[#1D1D1B]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {t('sgsyenReportsTitle')}
          </h2>
        </div>
        <div id="reports-badge-line-right" className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
          {locale === 'zh' 
            ? '*与 GCP Cloud Run、GCS 离线持久层以及 Hono API 路由无缝互联'
            : '*Directly integrated with Google Cloud Run & Secure GCS asset vaults'
          }
        </div>
      </div>

      {/* Reports Grid container with dynamic loader */}
      {loading ? (
        <div id="reports-loader-box" className="py-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-[#C4A35A] animate-spin" />
          <p id="reports-loading-tip" className="text-xs text-stone-400 font-sans tracking-widest uppercase">
            {locale === 'zh' ? '正在从 SGSYEN 智库学术数据库调阅安全通道...' : 'Opening secure credentials with SGSYEN central directory...'}
          </p>
        </div>
      ) : (
        <div id="reports-rows-stack" className="border-t border-[#1D1D1B]/10 select-none">
          {reports.length === 0 ? (
            <div id="reports-empty-box" className="py-24 text-center border-b border-[#1D1D1B]/10">
              <p id="reports-empty-desc" className="text-stone-400 text-sm mb-4">
                {locale === 'zh' ? '智库最新一季研究报告编修汇总中。' : 'No new publications registered for this quarter.'}
              </p>
            </div>
          ) : (
            reports.map((report, index) => (
              <div
                key={report.id}
                id={`report-row-${report.slug}`}
                onClick={() => handleOpenReport(report)}
                className="group flex flex-col md:flex-row gap-8 py-10 border-b border-[#1D1D1B]/10 hover:bg-[#FAF9F5] transition-all duration-300 px-4 cursor-pointer"
              >
                {/* Visual Serial index column */}
                <div id={`report-row-num-${report.slug}`} className="w-32 shrink-0 flex flex-col justify-start">
                  <span className="text-[10px] font-mono font-bold text-[#C83E3E] tracking-widest">
                    NO. {String(reports.length - index).padStart(3, '0')}
                  </span>
                  <span className="text-[11px] text-stone-400 font-sans mt-2 flex items-center gap-1.5 focus:outline-none">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(report.published_at)}
                  </span>
                </div>

                {/* Main Text Content */}
                <div id={`report-row-body-${report.slug}`} className="flex-1 min-w-0">
                  {report.category && (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase font-sans font-bold text-[#C83E3E] bg-[#C83E3E]/5 border border-[#C83E3E]/10 px-2 py-0.5 rounded mb-3">
                      <Tag className="w-3 h-3" />
                      {report.category}
                    </span>
                  )}
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-[#1D1D1B] group-hover:text-[#C4A35A] transition-colors leading-[1.3] mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                    {report.title}
                  </h3>
                  {report.summary && (
                    <p className="text-stone-500 font-sans text-xs md:text-xs leading-[1.8] line-clamp-3 font-light">
                      {report.summary}
                    </p>
                  )}
                </div>

                {/* Right Arrow CTA */}
                <div id={`report-row-cta-${report.slug}`} className="flex items-center justify-end">
                  <span className="w-10 h-10 rounded-full border border-[#1D1D1B]/15 flex items-center justify-center text-stone-400 group-hover:bg-[#1D1D1B] group-hover:text-white group-hover:border-transparent transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. Deep-reading sliding drawer */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            id="report-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-md z-[600] flex justify-end"
          >
            <motion.div
              id="report-drawer-body"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.45, ease: 'easeOut' }}
              className="w-full max-w-[850px] bg-[#FDFCF9] h-screen shadow-2xl flex flex-col justify-between relative overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Header inside drawer */}
              <div id="drawer-header" className="px-6 md:px-10 py-6 border-b border-[#1D1D1B]/10 flex justify-between items-center bg-[#FAF9F5] select-none">
                <div className="flex items-center gap-2 text-left">
                  <FileText className="w-4 h-4 text-[#C4A35A]" />
                  <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-stone-500">
                    {locale === 'zh' ? 'SGSYEN 核心学术报告调阅柜' : 'SGSYEN Secure Academic Docket Vault'}
                  </span>
                </div>
                <button
                  id="drawer-close-btn"
                  onClick={() => {
                    setSelectedReport(null);
                    setDownloadSuccess(null);
                  }}
                  className="p-1.5 hover:bg-stone-200/50 rounded-full text-stone-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Document area */}
              <div id="drawer-scroll-pane" className="flex-1 overflow-y-auto px-6 md:px-12 py-10 scrollbar-thin text-left">
                <div className="max-w-[700px] mx-auto text-left">
                  
                  {/* Category & Date */}
                  <div className="flex items-center gap-3 mb-6 select-none justify-start text-left">
                    {selectedReport.category && (
                      <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-[#C83E3E] bg-[#C83E3E]/5 border border-[#C83E3E]/10 px-2.5 py-0.5 rounded">
                        {selectedReport.category}
                      </span>
                    )}
                    <span className="text-stone-400 text-xs font-sans font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(selectedReport.published_at)}
                    </span>
                  </div>

                  {/* Complete Title */}
                  <h1 className="text-2xl md:text-3xl font-serif font-black leading-[1.3] text-[#1D1D1B] mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {selectedReport.title}
                  </h1>
                  {selectedReport.subtitle && (
                    <p className="text-md text-[#A58261] font-sans font-light leading-relaxed mb-6">{selectedReport.subtitle}</p>
                  )}

                  <hr className="w-full h-px bg-[#1D1D1B]/10 border-0 my-8" />

                  {/* Summary Callout banner */}
                  {selectedReport.summary && (
                    <div className="p-6 border-l-3 border-[#C4A35A] bg-[#FAF9F5] mb-8 select-text text-left">
                      <p className="text-[10px] font-sans tracking-widest font-bold text-[#A58261] uppercase mb-2">
                        {locale === 'zh' ? '研究提要 (Executive Summary)' : 'EXECUTIVE SUMMARY'}
                      </p>
                      <p className="text-xs font-sans leading-relaxed text-stone-600 italic font-light">{selectedReport.summary}</p>
                    </div>
                  )}

                  {/* Complete rich MD styled content render */}
                  <div className="prose prose-stone max-w-none pt-2 text-left">
                    {selectedReport.content ? (
                      renderMarkdownContent(selectedReport.content)
                    ) : (
                      <p className="text-stone-400 italic text-sm py-8 text-center bg-[#FAF9F5]">
                        {locale === 'zh' ? '正在从 API 数据链路挂载并确权正文，请稍等...' : 'Establishing secure content tokens, please hold...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lower Section drawer - Secure PDF download console */}
              <div id="drawer-download-console" className="border-t border-[#1D1D1B]/10 p-6 md:p-8 bg-[#FAF9F5] select-none text-left">
                <div className="max-w-[700px] mx-auto space-y-4">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                    <div className="space-y-1">
                      <h4 className="text-xs md:text-sm font-serif font-bold text-[#1D1D1B] flex items-center gap-1.5 leading-tight">
                        <Lock className="w-4 h-4 text-[#C4A35A]" />
                        {locale === 'zh' ? '认购人专属完整 PDF 报告文件下载 (GCS 安全通道)' : 'Request Certified PDF Copy (Secure GCS Hub)'}
                      </h4>
                      <p className="text-stone-500 font-sans text-[10px] leading-relaxed">
                        {locale === 'zh' 
                          ? '本出版物具备国家机密性及专属权属性，仅供認購人做非公开案头备置。' 
                          : 'SGSYEN briefs are highly confidential. Strictly prepared for authorized subscribers case placement.'
                        }
                      </p>
                    </div>

                    {!isMemberLoggedIn ? (
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="bg-[#A58261]/10 text-[#A58261] border border-[#A58261]/20 px-4 py-2 text-[10px] font-bold font-sans tracking-widest uppercase cursor-pointer rounded hover:bg-[#A58261] hover:text-[#FDFCF9] transition-all shrink-0"
                      >
                        🔑 {locale === 'zh' ? '契约验证登录' : 'Sign In'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold font-sans text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3.8 h-3.8" />
                        {locale === 'zh' ? `受托人授权就绪: ${authorizedEmail}` : `Authorized: ${authorizedEmail}`}
                      </div>
                    )}
                  </div>

                  {loginError && (
                    <p className="text-xs text-[#C83E3E] font-sans italic">{loginError}</p>
                  )}

                  {/* Action button trigger mapping state */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-2">
                    <button
                      onClick={() => handleDownloadPDF(selectedReport.slug)}
                      disabled={downloading}
                      className={`flex items-center justify-center gap-2 py-3 px-6 text-[10px] font-bold font-sans tracking-[0.15em] uppercase rounded transition-all cursor-pointer ${
                        isMemberLoggedIn 
                          ? 'bg-[#1D1D1B] text-white hover:bg-emerald-800' 
                          : 'bg-[#FAF9F5] border border-[#1D1D1B]/20 text-[#1D1D1B] hover:bg-[#1D1D1B] hover:text-[#FDFCF9]'
                      }`}
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {locale === 'zh' ? '安全对齐证书生成中...' : 'Generating security certificates...'}
                        </>
                      ) : (
                        <>
                          <Download className="w-3.8 h-3.8" />
                          {locale === 'zh' ? '获取学术报告 PDF 原件印本 (Download)' : 'Download Original Academic Print'}
                        </>
                      )}
                    </button>
                    <span className="text-[9px] text-[#A58261] uppercase tracking-wider font-mono text-right leading-relaxed block max-w-xs">
                      {locale === 'zh' 
                        ? '*已经对齐 GCP Cloud Run 密钥库 & 令牌机制，杜绝任何外部未授权漏流风险。'
                        : '*Aligned with Cloud Run Secret Manager tokens. Protection guaranteed.'
                      }
                    </span>
                  </div>

                  {downloadSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs font-sans font-medium text-left">
                      {downloadSuccess}
                    </div>
                  )}

                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </section>
  );
}
