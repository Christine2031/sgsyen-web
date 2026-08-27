import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  List, 
  ShieldAlert, 
  X,
  Lightbulb,
  MousePointer
} from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

interface SgsyenSlidesModalProps {
  onClose: () => void;
  initialSlideIndex?: number;
}

export default function SgsyenSlidesModal({ onClose, initialSlideIndex = 0 }: SgsyenSlidesModalProps) {
  const { locale } = useLocale();
  const [currentSlide, setCurrentSlide] = useState<number>(initialSlideIndex);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [laserActive, setLaserActive] = useState<boolean>(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesFrameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  // Full 15 slides of pure rich text from actual Temple Street Alley slides.html
  const slidesData = [
    {
      id: 'cover',
      category: 'MEMORANDUM',
      tag: 'CH.00 • TITLE COVER',
      title: '庙街小巷',
      subtitle: '商业技术书 — 演示版影本',
      desc: '一本写给投资合作人与政府体系的城市活化运营白皮书 —— 关于如何用 AI Agent 实景赋能传统商户的 IP 故事、线上流量与长周期资产自治。',
      style: 'cover',
      notes: '演讲备忘：强调【商业技术书】的核心卖点。要把AI如此玄妙的词，用接地气的“帮阿伯算账”、“帮摊位引流 SOP”来打动投资者和政府官员。封关在即，切入点必须极高。'
    },
    {
      id: 'disclaimer',
      category: 'CONFIDENTIALITY',
      tag: 'IMPORTANT NOTICE',
      title: '声明与流转规程',
      subtitle: '仅限智库战略通达研判使用',
      desc: '本书所列经营预测、估值口径与自贸港封关政策窗口均基于公开资料推演，仅作内部讨论与战略沟通。涉及正式投资决策与法务核准时，以此后正式协议为准。本文件受最高级别商业机密保护。流转或打印需经主导方书面许可并登记，切勿公开发布。',
      style: 'disclaimer',
      notes: '演讲备忘：作为演示的仪式感，强调项目机密性，拉升项目调性。对煤老板们，自贸港的稀缺牌照和黄金窗口需要高度自律性。'
    },
    {
      id: 'toc',
      category: 'ROADMAP',
      tag: 'CH.01 • AGENDA',
      title: '庙街小巷核心目次',
      subtitle: '六大商业逻辑齿轮，构成单项闭环',
      tocItems: [
        { num: '01', title: '时代窗口', desc: '等出来的窗口期，三大政策叠加撬动' },
        { num: '02', title: '选址艺术', desc: '有靠山、有流量、有政策，自贸港实体支点' },
        { num: '03', title: '业态逻辑', desc: '不做虚假文旅，做一个温热生长的“好邻居”' },
        { num: '04', title: '全域 AI 运营', desc: '赋能核心！三层结构、五大工具矩阵重构流量' },
        { num: '05', title: '民生账与正和游戏', desc: '对算盘、给指标，煤老板与政府的三方正和利' },
        { num: '06', title: '全球野心终局', desc: '立足自贸港，复制 IP + AI 操作系统到100城' }
      ],
      style: 'toc',
      notes: '演讲备忘：极快地讲述本书主故事线：时代红利 -> 最优选址 -> 业态温暖 -> 线上AI最厚的核心赋能 -> 真实赚大钱 -> 全球复制的底牌。结构自洽，毫无死角。'
    },
    {
      id: 'target',
      category: 'PHILOSOPHY',
      tag: 'CH.02 • TARGET AUDIENCE',
      title: '这本书，究竟是写给哪两类人？',
      subtitle: '对准煤老板与地方政府，用各自听得懂的语言决策',
      splitCols: [
        {
          role: '手里有资产，但不懂“AI怎么赚钱”的实力资本',
          action: '用真实场景与明细成本账目说话',
          points: [
            '不讲玄学。直接算账：一个海鲜摊引入 AI 内容工厂后能多赚多少。',
            '一杯定制非遗汽水，从自动策划到拍片打卡，AI 各介入几步，回报率几何。',
            '将物理地皮的租金资产，升级为自带高倍流量溢价的数字IP资产。'
          ]
        },
        {
          role: '需要政体声望、创新自闭环与夜经济政绩的执政者',
          action: '用政策语言与顶层数字主权对齐',
          points: [
            '数据本地留存留税：规避美团、抖音跨国巨头的中心化数据抽血。',
            '自贸港首个“数字消费示范区”标杆样板：高度呼应封关后的数据消费潮。',
            '非物质文化遗产的“活态传承”与夜民生民本扶持。'
          ]
        }
      ],
      style: 'split',
      notes: '演讲备忘：通过两种角色的对立与交融，凸显庙街小巷项目是“左手抓产业与政府政策，右手抓变现与商业资本”的奇点设计。'
    },
    {
      id: 'window',
      category: 'TEMPORAL WINDOW',
      tag: 'CH.03 • HISTORICAL OPPORTUNITY',
      title: '“历史上最好的生意，往往是等出来的”',
      subtitle: '多峰重叠：三大红利窗口期的世纪交汇',
      metricGrid: [
        { num: '3年分水岭', label: '海南自贸港封关政策', desc: '关税减免、跨境数据管理，外企与本土超级红利黄金激荡期。' },
        { num: '5年爆发期', label: 'AI Agent 技术奇点', desc: '本地设备算力及多模态长文本井喷，边际内容生产成本雪崩。' },
        { num: '10年周期', label: '大湾区与两江流量红利', desc: '地缘消费阶梯式下沉与文化复归，探索式人文商业形成绝对垄断。' }
      ],
      style: 'metrics',
      comment: '这三大红利在时间尺度和地缘尺度上无缝镶嵌。这不是个别极客的玩具，而是整个物理商业格局颠覆的前奏。',
      notes: '演讲备忘：三大红利叠加。这是对投资者最核心的宏观说服。海南自贸港封关是硬红利；AI Agent技术拐点能降低 95% 内容成本；大湾区、海南两江客流是底座。'
    },
    {
      id: 'location',
      category: 'SPATIAL STRENGTH',
      tag: 'CH.04 • VALUABLE LOCATION',
      title: '“做实业，最厚实的东西就是选址”',
      subtitle: '有硬核靠山、有高倍流量与绿色豁免的黄金阵地',
      listItems: [
        { title: '有历史承载', text: '不建毫无灵魂的小镇钢筋骨架，只在饱含口述历史、非遗根脉的老字号发祥原址营修。' },
        { title: '有硬核靠山', text: '物理连接极佳的核心街区，周边自带庞大的常住人口和极其强烈的烟火熟人信任网。' },
        { title: '有无尽流量入口', text: '处在旅游主动脉、自贸港通关交织核心带。过境游客无需特意寻找，自然落地汇入。' },
        { title: '有政策安全护体', text: '获批数据税收特区方案，以“自贸港智慧夜生活基建”立项，享受前瞻性政府绿色豁免。' }
      ],
      style: 'list',
      notes: '演讲备忘：选址是底牌。对台下的投资者说明，我们手里握着的土地与地段的稀缺资源。这决定了“防守底线极高”，怎么做都不会赔。'
    },
    {
      id: 'concept',
      category: 'PRODUCT CHARACTER',
      tag: 'CH.05 • HUMANITIES & VIBE',
      title: '“它不像一个商业项目，它更像一个好邻居”',
      subtitle: '打造人情味温暖洋溢、具有极强心智粘性的探索场',
      highlightBox: {
        quote: '“庙街小巷不是又一个喧闹而冰冷的仿古网红打卡街区，而是一整套活态生态系统：线下保留真实的古早摊主，让他们在熟悉的生活空间安居乐业；线上则通过 AI 技术，为他们的历史基因‘接骨起搏’，引来源源不断的全球朝圣内容流量。”',
        author: 'SGSYEN 团队 · 空间文化数字主权营修宣言'
      },
      style: 'quote',
      notes: '演讲备忘：切记批评当前国内同质化的“假古镇、真小吃街”。我们的“好邻居”是有故事、有原住民生活痕迹的。这就是庙街小巷的个性！'
    },
    {
      id: 'ai-core',
      category: 'TECHNOLOGY ENGINE',
      tag: 'CH.06 • ONLINE BREAKTHROUGH',
      title: '线上突围：赋能商户的核心 AI 架构',
      subtitle: '将传统摊主，升级为高维持续长出自然流量的超级 IP',
      desc: '我们发现：线下招商、精排已经做到顶峰，过去文旅项目死在“过了开业爆红，后续无以为继，全靠买量度日”。现在，我们利用成熟的 Agent 结构，建立商户身后那个看不见的“金牌店小二”，让每一个小吃阿伯都拥有专业内容公关大厂。',
      threePillars: [
        { name: 'L1：口述历史多语料故事发掘（IP层）', val: '采集街区老人的口述故事、老字号秘方、声纹历史底稿，将“没文化的商贩”提炼为具有文化沉淀深层血肉的IP金矿。' },
        { name: 'L2：智能内容多模矩阵工厂（运营层）', val: '把 L1 沉淀的故事作为大语言底盘。AI 每天采编阿伯当天的鲜活素材，分发小红书、抖音、TikTok 视频，1次日常产生9大矩阵爆款。' },
        { name: 'L3：实时经营分析自治大脑（管理层）', val: '将全网流量、游客数字画像、摊位零售数据和供应链直接做账对齐，智能提示摊主补货、调价、甚至进行高频跨界商圈自动联动。' }
      ],
      style: 'threePillars',
      notes: '演讲备忘：这是全书最厚、最干货的部分。向听众表明，我们的AI不是一个简单的聊天机器人，它是生产力系统！L1、L2、L3层环环相扣，彻底免去传统新商户对于复杂的线上运营的恐惧。'
    },
    {
      id: 'laochen-case',
      category: '落地案例',
      tag: 'CASE STUDY: CHEN THE FISHMONGER',
      title: '一碗鲜鱼汤的 90 天：海鲜阿伯老陈的 AI 化生存',
      subtitle: '如何把一位 65 岁完全不懂手机操作的老摊主，打成小红书本埠必打卡 IP 顶流',
      timelineSteps: [
        { day: 'D-30', title: '口述录音与故事建库', text: '采集老陈从老九龙迁徙至海口、煮了四十年鱼汤的家族故事。AI 生成“海鲜老陈”专属的文风、性格语气和 15 组经典对话模版。' },
        { day: 'D-15', title: '全景孪生与探店预演', text: '运用激光雷达与数字建模把老陈汤里的百年古灶做实景离线克隆，并预注册至高德、百度和多大模型在本地的信息预载层（GEO 筑底）。' },
        { day: 'D-1', title: '店小二一键起搏', text: '老陈每天早起去码头挑墨鱼，只需微信语音跟店小二说一句话：“今日有鲜墨鱼仔20斤，汤底依然煲足5小时。”AI口述历史大脑立刻提取他富有温度的原声调性，自动分发软文推广。' },
        { day: 'D+60', title: '全域到店爆发', text: '全网曝光过百万，线上“庙街店小二”为老陈鱼摊自动沉淀出特定关键词，导航端、大模型问答端深度关联，让食客慕名而来，门庭若市。' }
      ],
      style: 'timeline',
      notes: '这是整个AI落地场景中最有底气的一页！不要讲太多底层代码。就讲“一键起搏”：一个不懂打字的65岁阿伯，只需要录一句语音，身后看不见的店小二就能在9个平台自动排版发布内容，还配上多语种视频和专属原声。这就是最顶级的人情味科技。'
    },
    {
      id: 'implementation-plan',
      category: 'IMPLEMENTATION ROADMAP',
      tag: 'CH.08 • TIMELINE',
      title: '智慧夜生活基建分步实施方案',
      subtitle: '三期工程科学递进，夯实民心科技根基',
      roadmap: [
        { phase: '一期：数字基建筑底 (Months 1-2)', desc: '完成首批 100 家老字号特产、小吃原住民实景三维激光扫描与故事建库. 对齐本地大语言模型与高德/百度等时空服务节点，筑牢空间资产档案。' },
        { phase: '二期：内容工厂起搏 (Months 3-6)', desc: '在庙街主街开通边缘 AI 算力中枢. 正式交付面向商户的“一键语音起搏”店小二系统，并在 5 个大文旅示范区开展多模态内容生产与分发试验。' },
        { phase: '三期：资产自治闭环 (Month 6+)', desc: '引入民生数字记账与本地税收记账本. 打通跨自贸港跨地区商圈联盟，实现分布式大模型数据就地留存结算、流量自治与全域消费自闭环。' }
      ],
      style: 'roadmap',
      notes: '演讲备忘：向政府和投资人传达务实的理性态度，并非追求一步登天，而是小步慢跑，D+30，D+90，长期自治，阶段分明，预算科学。'
    },
    {
      id: 'geo-tactics',
      category: 'FLOW STRATEGY',
      tag: 'CH.09 • DATA SOVEREIGNTY',
      title: '摆脱美团与抖音：重新拿回街区的数字主权',
      subtitle: '将商户的营销渠道从中心化巨头抽血，转移到大模型本地精准推荐',
      comparisons: [
        { type: '传统电商平台竞价抽血 (美团/抖音式)', text: '商户需承担 20%~30% 的重额佣金与高昂的直通车、竞价竞拍广告成本。钱流失到省外大厂，夜市商户由于低利润逐渐丧失生命力，形成空心化。' },
        { type: '自贸港大模型本地注册 (GEO 筑底)', text: '通过前置将商户的空间数字资产和家族人文故事训练灌入本地大模型，游客利用 AI 终端或导航语音提问时，大模型在推荐中保持绝对公平、去中介化。商户扣点归零，税收沉淀本地。' }
      ],
      style: 'geo',
      notes: '演讲备忘：要大胆揭露传统大厂在过度抽取实体商贩血汗利差的现实。我们的算法不是为了淘汰阿伯老陈，而是通过高精度的GEO训练，直接在大模型里让老陈的鱼汤拿到该有的自然和真实流量！'
    },
    {
      id: 'data-sovereignty',
      category: 'ARCHITECTURAL LAYERS',
      tag: 'CH.10 • DIGITAL STRUCTURE',
      title: '分布式主权数据流转三层架构',
      subtitle: '算法、记账、安全环环相扣，建立纯闭合自闭环方案',
      threeLayers: [
        { layer: 'L1：智能风物故事建库 (IP 层)', code: 'GEO-L1-KNOWLEDGE_NODE', text: '采集、清洗街区原住民语音声纹、老照片、家族秘方并做脱敏上链。利用多模态对齐，生成特定街区的独特生活智能体记忆。' },
        { layer: 'L2：本地账目合规层 (运营层)', code: 'GEO-L2-LOCAL_LEDGER', text: '自动处理跨境数字支付及跨境交易。商户产生的流量红利、直接收入和自贸港税收，通过本地节点直接计算、实时合规上账。' },
        { layer: 'L3：主权消费自闭环 (体系层)', code: 'GEO-L3-SOVEREIGN_NODE', text: '分布式大模型跨商圈多方正和自治。通过多模态离线边缘部署，防止本地非遗及地缘人群消费画像泄露，确保核心数安红线。' }
      ],
      style: 'geoArch',
      notes: '演讲备忘：此页针对政务级别或顶配智库。向技术决策权威展示：我们的体系是具有底层标准合规性的，通过极高数据保护方案 and 时空架构闭环。'
    },
    {
      id: 'ledger',
      category: 'GAME THEORY',
      tag: 'CH.11 • POSITIVE-SUM GAME',
      title: '民生账与合伙人账：三方博弈正和游戏',
      subtitle: '没有输家的规划才是唯一能落地的神圣城市更新规划',
      ledgerGrid: [
        { party: '原住民商贩与小老百姓', bullet1: '告别复杂的营销和文字苦活，每天只管熬一锅热气汤，一秒即可全球宣发。', bullet2: '外语、跨境结算被 AI 优雅兼容，营业额在原基础大涨 60%-200%。' },
        { party: '资产合伙人 (手里有资本者)', bullet1: '不做重资产买地打地基的冒险生意，只投资民生数据中台和数字算力底座。', bullet2: '依靠长线 IP 分红，租金与流量强粘连，抗风险性极强，回本周期缩减大半。' },
        { party: '自贸港政府与市民', bullet1: '留住活态人文烟火，解决夜生活劳动就业，挽回古迹被推平搬迁的文化断代。', bullet2: '斩断跨省资本对于本地消费数据的物理和数字窃取，数据留税原地入账。' }
      ],
      style: 'ledger',
      notes: '演讲备忘：让大家看到：这不是一个“剥削”的故事。资本得到了高防守型长线回款、老陈得到了便利与收入、政府得到了文化传承、留税和口碑。正和博弈，完美流转。'
    },
    {
      id: 'financing',
      category: 'CAPITALIZATION SCAPE',
      tag: 'CH.12 • CAPITAL EXPANSION',
      title: '资本规划：单港闭环到百城系统输送',
      subtitle: '估值与资本配置矩阵，描绘系统落地全球历史名城路线图',
      financingSteps: [
        { name: '种子起搏：海南试点营修', milestone: 'SEED STAGE (D+30)', text: '拟入资金：500 万港币。完成首批 100 家摊点 IP 语音起搏、3D 激光数字重建。搭建海南庙街 1.0 的轻量端大模型算力核心并开路。' },
        { name: '天使/A轮：自贸港集群狂飙', milestone: 'SERIES A STAGE (YEAR 1)', text: '计划入股：2500 万港币。拓展至 3-5 个特色商圈集群，在保税区架设私有化边缘推理机柜，形成具有技术护城河的运营壁垒。' },
        { name: 'B轮：全球古街智慧 OS 输出', milestone: 'SERIES B STAGE (YEAR 3)', text: '主导复制。将本白皮书论证的“智慧夜民生 OS”作为一整套轻量标准，成套输出到曼谷唐人街、京都老街和东南亚。估值稳健。' }
      ],
      style: 'financing',
      notes: '演讲备忘：给煤老板资本家最明确 of 离岸退出或分红逻辑：第一步买算力验证、第二步自贸港跑出护城河、第三步以轻资产全球标准去降维征服世界。'
    },
    {
      id: 'conclusion',
      category: 'CONCLUSION WARNING',
      tag: 'CH.13 • CODA EPILOGUE',
      title: '“未来的光，在烟火袅袅和墨鱼汤鲜中”',
      subtitle: '让最硬朗的科技，带有人文最赤诚的温情',
      desc: '庙街小巷的核心立意，从来不是为了在古街边建一排酷炫却无用的霓虹灯、或者放几台高分贝的聊天机器人。我们只想用技术多保护那口四十年大灶冒出的温热白烟，只想让那位完全不会写字的小吃阿伯可以只说一句话，就能把家训和鲜美香气分享给隔海万里的全球食客。科技在向前滚滚而行，而我们将和时代的最底层站在一起。谢谢各位！',
      style: 'cover',
      notes: '演讲备忘：以最高拔的情怀和温情句号一槌定音、让所有听众甚至对手起鸡皮疙瘩。把大屏幕推上最终的SGSYEN时空实验室印章。不要铺垫，优雅致谢即可。'
    }
  ];

  const currentSlideData = slidesData[currentSlide];

  // Aspect ratio resize mechanism to perfectly fit scale within any viewport size elegantly!
  useEffect(() => {
    const handleResize = () => {
      if (!slidesFrameRef.current) return;
      const parent = slidesFrameRef.current.parentElement;
      if (!parent) return;

      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;
      
      // Target Dimensions (Exactly 16:9 box is 1200 x 675px)
      const targetWidth = 1200;
      const targetHeight = 675;

      const scaleX = parentWidth / targetWidth;
      const scaleY = parentHeight / targetHeight;
      
      // We scale uniformly to fit completely inside our container
      const newScale = Math.min(scaleX, scaleY, 1.25); // Cap at 1.25 to avoid blurring
      setScale(newScale);
    };

    handleResize();
    const observer = new ResizeObserver(() => handleResize());
    if (slidesFrameRef.current && slidesFrameRef.current.parentElement) {
      observer.observe(slidesFrameRef.current.parentElement);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [currentSlide, showNotes, showToc, isFullscreen]);

  // Navigate slides
  const nextSlide = () => {
    if (currentSlide < slidesData.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Keyboard navigation & wireless presenter clicker handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ': // Spacebar
        case 'PageDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
        case 'Backspace':
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          if (!document.fullscreenElement) {
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  // Handle native element fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Track Laser pointer movement when enabled
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!laserActive || !slidesFrameRef.current) return;
    const rect = slidesFrameRef.current.getBoundingClientRect();
    
    // Position relative to the scaled 1200x675 frame
    const relativeX = (e.clientX - rect.left) / scale;
    const relativeY = (e.clientY - rect.top) / scale;

    setLaserPos({ x: relativeX, y: relativeY });
  };

  return (
    <div 
      ref={containerRef}
      id="sgsyen-slides-presentation-mode"
      style={{
        backgroundColor: isDarkMode ? '#0A121D' : '#F4F2EB',
        color: isDarkMode ? '#F8F6F0' : '#0E1A2B'
      }}
      className="fixed inset-0 z-[999] flex flex-col transition-colors duration-500 overflow-hidden select-none"
    >
      {/* Load design tokens dynamically for ultimate stability */}
      <link rel="stylesheet" href="/temple-street-alley/styles/system-wide.css" />

      {/* Top Academic Control Header bar */}
      <header 
        style={{ 
          borderBottomColor: '#A07A3533', 
          backgroundColor: isDarkMode ? '#0E1A2B' : '#FFFFFF' 
        }}
        className="flex items-center justify-between px-8 py-3 border-b z-10 select-none temple-slides-font-sans"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#B8351F] rounded-full animate-pulse" />
          <div className="text-left">
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#A07A35] block">
              SGSYEN SPATIAL ARCHITECTURE • PRESENTATION MODE
            </span>
            <h1 className="text-sm font-bold tracking-tight select-text temple-slides-font-serif leading-none mt-1">
              庙街小巷：商业与自然人文活化数字白皮书 ({currentSlide + 1}/{slidesData.length})
            </h1>
          </div>
        </div>

        {/* Presenter controls row */}
        <div className="flex items-center gap-2">
          {/* Laser Toggler button */}
          <button
            onClick={() => setLaserActive(!laserActive)}
            title="激光指示器 (Laser pointer)"
            style={{
              backgroundColor: laserActive ? '#B8351F' : (isDarkMode ? '#17273C' : '#EFECE6'),
              color: laserActive ? '#F8F6F0' : (isDarkMode ? '#FAF9F5' : '#0E1A2B')
            }}
            className="px-3 py-1.5 rounded cursor-pointer flex items-center gap-1.5 text-[11px] font-bold transition-all border border-[#A07A3533]"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">演讲笔激光</span>
          </button>

          {/* Toc Toggler button */}
          <button
            onClick={() => { setShowToc(!showToc); setShowNotes(false); }}
            title="查看幻灯大纲"
            style={{
              backgroundColor: showToc ? '#A07A35' : (isDarkMode ? '#17273C' : '#EFECE6'),
              color: showToc ? '#FFFFFF' : (isDarkMode ? '#FAF9F5' : '#0E1A2B')
            }}
            className="p-1.5 rounded cursor-pointer transition-all border border-[#A07A3533]"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Notes toggle */}
          <button
            onClick={() => { setShowNotes(!showNotes); setShowToc(false); }}
            title="演讲备忘备注"
            style={{
              backgroundColor: showNotes ? '#A07A35' : (isDarkMode ? '#17273C' : '#EFECE6'),
              color: showNotes ? '#FFFFFF' : (isDarkMode ? '#FAF9F5' : '#0E1A2B')
            }}
            className="px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-[#A07A3533]"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>备忘录</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              backgroundColor: isDarkMode ? '#17273C' : '#EFECE6',
              color: isDarkMode ? '#FAF9F5' : '#0E1A2B'
            }}
            className="px-3 py-1.5 text-[11px] font-bold rounded cursor-pointer border border-[#A07A3533]"
          >
            {isDarkMode ? '🕯️ 纸墨日光 (Light)' : '🕶️ 剧场墨蓝 (Dark)'}
          </button>

          {/* Fullscreen shortcut */}
          <button
            onClick={toggleFullscreen}
            style={{
              backgroundColor: isDarkMode ? '#17273C' : '#EFECE6',
              color: isDarkMode ? '#FAF9F5' : '#0E1A2B'
            }}
            title="全屏演示 (F)"
            className="p-1.5 rounded cursor-pointer border border-[#A07A3533]"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close modal */}
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-[#B8351F] hover:bg-[#B8351F]/90 text-white cursor-pointer ml-1"
            title="退出放映 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Slides Stage and Sidebars */}
      <div className="flex-1 w-full flex relative overflow-hidden">
        
        {/* LEFT COMPANION: Outline list (TOC) */}
        <AnimatePresence>
          {showToc && (
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                backgroundColor: '#0E1A2B',
                borderRightColor: '#A07A3533'
              }}
              className="w-72 text-[#F8F6F0] border-r flex flex-col h-full z-20 shadow-2xl relative select-none temple-slides-font-sans"
            >
              <div style={{ borderBottomColor: '#A07A3522' }} className="p-4 border-b flex items-center justify-between">
                <span className="text-[10px] tracking-widest uppercase font-bold text-[#A07A35]">
                  汇报大纲一览
                </span>
                <button onClick={() => setShowToc(false)} className="text-stone-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {slidesData.map((sl, index) => (
                  <button
                    key={sl.id}
                    onClick={() => {
                      setCurrentSlide(index);
                      setShowToc(false);
                    }}
                    style={{
                      backgroundColor: currentSlide === index ? '#A07A35' : 'transparent',
                      color: currentSlide === index ? '#FFFFFF' : '#FAF9F5'
                    }}
                    className="w-full text-left p-3 text-xs rounded transition-all flex gap-3 cursor-pointer hover:bg-[#1A2E4B]"
                  >
                    <span className="font-mono text-[9px] opacity-60 pt-0.5">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="truncate flex-1">
                      <div className="font-medium text-[11px] truncate temple-slides-font-serif">{sl.title}</div>
                      <div className="text-[9px] opacity-50 truncate mt-0.5">{sl.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CENTRAL STAGE: Scaled 1200x675 Box to match exact 16:9 aspect ratio */}
        <div 
          className="flex-1 h-full flex items-center justify-center p-6 relative select-none cursor-crosshair overflow-hidden"
          onMouseMove={handleMouseMove}
        >
          {/* Grid visual lines with Vermilion/Gold feel */}
          <div 
            style={{ backgroundImage: `radial-gradient(${isDarkMode ? '#A07A3515' : '#0E1A2B10'} 1px, transparent 1px)` }}
            className="absolute inset-0 [background-size:24px_24px] pointer-events-none" 
          />

          {/* Aspect-Ratio Outer Wrapper */}
          <div 
            style={{ width: `${1200 * scale}px`, height: `${675 * scale}px` }}
            className="relative flex items-center justify-center transition-all duration-300"
          >
            {/* The scaled 16:9 actual slides viewport with exactly 1200x675px and 72px gutter */}
            <div
              ref={slidesFrameRef}
              style={{ 
                width: '1200px', 
                height: '675px', 
                transform: `scale(${scale})`, 
                transformOrigin: 'center center',
                padding: '72px',
                backgroundColor: isDarkMode ? '#0E1A2B' : '#F8F6F0',
                color: isDarkMode ? '#F8F6F0' : '#0E1A2B',
                borderColor: '#A07A3522'
              }}
              className="absolute top-0 left-0 shadow-2xl rounded-sm border-2 box-border overflow-hidden select-none flex flex-col justify-between transition-colors duration-500"
            >
              
              {/* Dynamic Laser Pointer Layer */}
              {laserActive && (
                <div 
                  className="absolute pointer-events-none z-[100] transition-all duration-75"
                  style={{ 
                    left: `${laserPos.x}px`, 
                    top: `${laserPos.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="w-5 h-5 bg-[#B8351F] rounded-full opacity-40 animate-pulse absolute -inset-1 blur-md" />
                  <div className="w-2.5 h-2.5 bg-[#B8351F] rounded-full border border-white" />
                </div>
              )}

              {/* Slider Heading/Metadata bar */}
              <div 
                style={{ borderBottomColor: isDarkMode ? '#A07A3533' : '#0E1A2B15' }}
                className="flex items-center justify-between border-b pb-4 select-none pointer-events-none temple-slides-font-sans"
              >
                <div className="flex items-center gap-2 text-left">
                  <span 
                    style={{ color: '#B8351F', letterSpacing: '0.25em' }}
                    className="text-[10px] uppercase font-bold"
                  >
                    {currentSlideData.tag}
                  </span>
                </div>
                <div 
                  style={{ color: isDarkMode ? '#A07A35AA' : '#3A4250AA' }}
                  className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-3"
                >
                  <span>SGSYEN SPATIAL DECISION SYSTEM</span>
                  <span>|</span>
                  <span>庙街小巷 Project</span>
                </div>
              </div>

              {/* Slide Body - Render switcher using precise colors and Noto Fonts */}
              <div className="flex-1 w-full py-6 flex flex-col justify-center text-left relative overflow-hidden select-none">
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 0.99, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.99, x: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="w-full h-full flex flex-col justify-center"
                  >
                    {/* STYLE 1: Welcome Word/Cover layout */}
                    {currentSlideData.style === 'cover' && (
                      <div className="space-y-6 max-w-4xl mx-auto text-center py-4">
                        <span 
                          style={{ backgroundColor: '#B8351F', color: '#FFFFFF' }}
                          className="inline-block px-3 py-1 font-bold text-[10px] tracking-[0.2em] rounded uppercase temple-slides-font-sans"
                        >
                          {currentSlideData.category}
                        </span>
                        
                        <h2 
                          style={{ color: isDarkMode ? '#FAF9F5' : '#B8351F', fontWeight: 900 }}
                          className="text-6xl temple-slides-font-serif tracking-tight leading-tight pt-2"
                        >
                          {currentSlideData.title}
                        </h2>
                        
                        <p 
                          style={{ color: '#A07A35' }}
                          className="text-xl temple-slides-font-serif tracking-wider italic font-medium"
                        >
                          — {currentSlideData.subtitle} —
                        </p>
                        
                        <div style={{ borderTopColor: '#A07A3533' }} className="max-w-2xl mx-auto p-4 border-t border-dashed mt-4">
                          <p 
                            style={{ color: isDarkMode ? '#FAF9F5DD' : '#3A4250' }}
                            className="text-xs leading-relaxed temple-slides-font-sans animate-fade-in"
                          >
                            {currentSlideData.desc}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* STYLE 2: Legal Warning/Disclaimer */}
                    {currentSlideData.style === 'disclaimer' && (
                      <div 
                        style={{ 
                          backgroundColor: isDarkMode ? '#B8351F10' : '#B8351F05', 
                          borderColor: '#B8351F33' 
                        }}
                        className="max-w-3xl mx-auto space-y-5 p-8 border rounded relative"
                      >
                        <div className="absolute top-6 right-6">
                          <ShieldAlert className="w-8 h-8 text-[#B8351F] opacity-40 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-bold text-[#B8351F] tracking-[0.2em] uppercase temple-slides-font-sans">
                          {currentSlideData.category}
                        </span>
                        <h3 className="text-2xl font-bold temple-slides-font-serif">
                          {currentSlideData.title}
                        </h3>
                        <p className="text-xs font-bold tracking-wider text-[#A07A35] uppercase temple-slides-font-sans">
                          {currentSlideData.subtitle}
                        </p>
                        <p 
                          style={{ color: isDarkMode ? '#FAF9F5CC' : '#3A4250', borderLeftColor: '#B8351FBB' }}
                          className="text-xs leading-relaxed border-l-2 pl-4 py-1 temple-slides-font-sans"
                        >
                          {currentSlideData.desc}
                        </p>
                      </div>
                    )}

                    {/* STYLE 3: Table of contents (Grid List) */}
                    {currentSlideData.style === 'toc' && (
                      <div className="w-full">
                        <h3 className="text-2xl font-bold mb-1 temple-slides-font-serif">{currentSlideData.title}</h3>
                        <p className="text-xs text-[#A07A35] font-semibold mb-6 uppercase tracking-wider temple-slides-font-sans">{currentSlideData.subtitle}</p>
                        
                        <div className="grid grid-cols-3 gap-4">
                          {currentSlideData.tocItems?.map((it, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                backgroundColor: isDarkMode ? '#132135' : '#FFFFFF', 
                                borderColor: isDarkMode ? '#A07A3522' : '#0E1A2B15' 
                              }}
                              className="p-4 border rounded transition-all shadow-sm text-left"
                            >
                              <span className="font-mono text-xs font-bold text-[#B8351F]">{it.num}</span>
                              <h4 className="font-bold text-xs mt-1 text-stone-800 dark:text-stone-100 temple-slides-font-serif">{it.title}</h4>
                              <p className="text-[10px] text-stone-500 mt-1 leading-relaxed temple-slides-font-sans">{it.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STYLE 4: Two Column Split (煤老板 & 政府) */}
                    {currentSlideData.style === 'split' && (
                      <div className="w-full space-y-4">
                        <h3 className="text-2xl font-bold leading-none temple-slides-font-serif">{currentSlideData.title}</h3>
                        <p className="text-xs text-[#A07A35] font-semibold tracking-wider uppercase mb-3 temple-slides-font-sans">{currentSlideData.subtitle}</p>
                        
                        <div className="grid grid-cols-2 gap-6 items-stretch">
                          {currentSlideData.splitCols?.map((col, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                borderColor: idx === 0 ? '#B8351F33' : '#A07A3533', 
                                backgroundColor: idx === 0 ? '#B8351F08' : '#A07A3508' 
                              }}
                              className="p-6 border rounded flex flex-col justify-between text-left"
                            >
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-1 temple-slides-font-sans">
                                  对象角色 {idx + 1}
                                </span>
                                <h4 style={{ color: idx === 0 ? '#B8351F' : '#A07A35' }} className="text-base font-bold mb-1 temple-slides-font-serif">
                                  {col.role}
                                </h4>
                                <p className="text-xs font-bold tracking-widest uppercase mb-4 temple-slides-font-sans">
                                  👉 核心打法：{col.action}
                                </p>
                                <ul className="space-y-2 text-stone-600 dark:text-stone-300 temple-slides-font-sans text-[11px] leading-relaxed">
                                  {col.points.map((p, pidx) => (
                                    <li key={pidx} className="flex items-start gap-1.5">
                                      <span style={{ color: idx === 0 ? '#B8351F' : '#A07A35' }} className="mt-0.5">•</span>
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STYLE 5: Key Metrics 3-Grids */}
                    {currentSlideData.style === 'metrics' && (
                      <div className="w-full space-y-5">
                        <div className="flex flex-col">
                          <h3 className="text-2xl font-bold temple-slides-font-serif">{currentSlideData.title}</h3>
                          <p className="text-xs text-[#A07A35] font-semibold tracking-wider uppercase mt-1 temple-slides-font-sans">{currentSlideData.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {currentSlideData.metricGrid?.map((it, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                backgroundColor: isDarkMode ? '#132135' : '#FFFFFF', 
                                borderColor: '#A07A3533' 
                              }}
                              className="p-5 border rounded text-left flex flex-col justify-between"
                            >
                              <div>
                                <span style={{ color: '#B8351F' }} className="text-2xl font-bold block leading-none temple-slides-font-serif">
                                  {it.num}
                                </span>
                                <span className="text-[10px] font-bold text-[#A07A35] mt-1.5 block uppercase tracking-widest temple-slides-font-sans">
                                  {it.label}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-stone-500 mt-2 leading-relaxed temple-slides-font-sans">
                                {it.desc}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div 
                          style={{ 
                            borderLeftColor: '#B8351F', 
                            backgroundColor: isDarkMode ? '#101D2D' : '#FFFFFF' 
                          }}
                          className="p-3 border-l-4 text-xs italic text-stone-600 dark:text-stone-300 temple-slides-font-serif text-left"
                        >
                          {currentSlideData.comment}
                        </div>
                      </div>
                    )}

                    {/* STYLE 6: Modular bullets list with left highlight */}
                    {currentSlideData.style === 'list' && (
                      <div className="grid grid-cols-12 gap-8 items-center text-left">
                        <div className="col-span-4 space-y-3">
                          <span className="text-[9px] tracking-widest font-bold text-[#A07A35] uppercase temple-slides-font-sans">
                            {currentSlideData.category}
                          </span>
                          <h3 className="text-2xl font-bold leading-tight temple-slides-font-serif">{currentSlideData.title}</h3>
                          <p className="text-xs text-[#B8351F] font-semibold leading-relaxed uppercase temple-slides-font-sans">{currentSlideData.subtitle}</p>
                        </div>

                        <div className="col-span-8 space-y-3">
                          {currentSlideData.listItems?.map((it, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                borderLeftColor: '#B8351F', 
                                backgroundColor: isDarkMode ? '#132135' : '#FFFFFF',
                                borderColor: isDarkMode ? '#A07A3522' : '#0E1A2B10'
                              }}
                              className="p-3 border rounded-r border-l-2 transition-colors hover:bg-stone-50/5 text-left"
                            >
                              <h4 className="text-xs font-bold text-[#0E1A2B] dark:text-[#FAF9F5] temple-slides-font-serif">
                                0{idx + 1}. {it.title}
                              </h4>
                              <p className="text-[10.5px] text-stone-500 leading-relaxed mt-0.5 temple-slides-font-sans">
                                {it.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STYLE 7: Highly polished Quote view */}
                    {currentSlideData.style === 'quote' && (
                      <div className="max-w-4xl mx-auto text-center space-y-5">
                        <span className="text-[9px] tracking-[0.3em] font-bold text-[#B8351F] uppercase bg-[#B8351F]/10 px-3 py-1 rounded temple-slides-font-sans">
                          {currentSlideData.category}
                        </span>
                        
                        <h3 
                          style={{ 
                            borderColor: '#A07A3533',
                            lineHeight: 1.62
                          }}
                          className="text-2xl font-serif italic max-w-3xl mx-auto border-y py-6"
                        >
                          {currentSlideData.highlightBox?.quote}
                        </h3>

                        <div className="pt-2 text-right max-w-2xl mx-auto">
                          <span className="text-xs font-bold uppercase tracking-widest text-[#A07A35] temple-slides-font-sans">
                            — {currentSlideData.highlightBox?.author}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* STYLE 8: 3-Pillars for technology/structure */}
                    {currentSlideData.style === 'threePillars' && (
                      <div className="w-full space-y-3 text-left">
                        <div className="flex flex-col">
                          <h3 className="text-2xl font-bold temple-slides-font-serif">{currentSlideData.title}</h3>
                          <p className="text-xs text-[#A07A35] font-semibold uppercase mt-0.5 temple-slides-font-sans">{currentSlideData.subtitle}</p>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-relaxed temple-slides-font-sans max-w-3xl">
                          {currentSlideData.desc}
                        </p>

                        <div className="grid grid-cols-3 gap-4 mt-2">
                          {currentSlideData.threePillars?.map((pi, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                backgroundColor: isDarkMode ? '#132135' : '#FFFFFF', 
                                borderColor: '#A07A3533' 
                              }}
                              className="p-4 border rounded text-left flex flex-col justify-between"
                            >
                              <div>
                                <span className="text-[9px] font-mono font-bold text-[#B8351F]">Pillar 0{idx + 1}</span>
                                <h4 className="font-bold text-[12px] mt-1 text-stone-800 dark:text-[#FAF9F5] temple-slides-font-serif">
                                  {pi.name}
                                </h4>
                              </div>
                              <p className="text-[10px] text-stone-500 leading-relaxed mt-2.5 pt-2 border-t border-stone-500/10 temple-slides-font-sans">
                                {pi.val}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STYLE 9: Dynamic Timeline Steps (Horizontal timeline) */}
                    {currentSlideData.style === 'timeline' && (
                      <div className="w-full space-y-4 text-left">
                        <div className="flex flex-col">
                          <h3 className="text-2xl font-bold temple-slides-font-serif">{currentSlideData.title}</h3>
                          <p className="text-xs text-[#B8351F] font-semibold uppercase tracking-wider mt-0.5 temple-slides-font-sans">{currentSlideData.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-4 gap-4 pt-4 relative">
                          {/* Continuous line with Gold accent */}
                          <div style={{ backgroundColor: '#A07A3544' }} className="absolute top-[34px] left-10 right-10 h-[1.5px] pointer-events-none" />

                          {currentSlideData.timelineSteps?.map((st, idx) => (
                            <div key={idx} className="space-y-4 relative z-10 text-left">
                              <div className="flex items-center gap-3">
                                <span style={{ backgroundColor: '#B8351F' }} className="text-[#FFFFFF] font-mono text-[9px] font-bold px-2 py-1 rounded shadow-sm">
                                  {st.day}
                                </span>
                                <div style={{ backgroundColor: '#A07A35' }} className="w-2.5 h-2.5 rounded-full" />
                              </div>

                              <div 
                                style={{ 
                                  backgroundColor: isDarkMode ? '#132135' : '#FFFFFF', 
                                  borderColor: isDarkMode ? '#A07A3522' : '#0E1A2B15' 
                                }}
                                className="p-4 border rounded-sm h-[135px] flex flex-col justify-between text-left shadow-sm"
                              >
                                <h4 className="font-bold text-xs leading-snug tracking-tight text-[#0E1A2B] dark:text-stone-100 temple-slides-font-serif">
                                  {st.title}
                                </h4>
                                <p className="text-[9.5px] text-stone-500 leading-relaxed line-clamp-4 mt-1.5 temple-slides-font-sans">
                                  {st.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STYLE 10: Horizontal large milestones block */}
                    {currentSlideData.style === 'roadmap' && (
                      <div className="w-full space-y-5 text-left">
                        <div className="flex flex-col">
                          <h3 className="text-2xl font-bold temple-slides-font-serif">{currentSlideData.title}</h3>
                          <p className="text-xs text-[#B8351F] font-semibold uppercase tracking-wider mt-1 temple-slides-font-sans">{currentSlideData.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-5">
                          {currentSlideData.roadmap?.map((rd, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                backgroundColor: isDarkMode ? '#132135' : '#FFFFFF', 
                                borderTopColor: '#B8351F',
                                borderColor: isDarkMode ? '#A07A3522' : '#0E1A2B15' 
                              }}
                              className="p-5 rounded-sm border border-t-4 flex flex-col justify-between h-[155px] text-left"
                            >
                              <h4 className="font-bold text-xs text-stone-700 dark:text-[#FAF9F5] temple-slides-font-serif">
                                {rd.phase}
                              </h4>
                              <p className="text-[10.5px] text-stone-500 leading-relaxed mt-2 temple-slides-font-sans">
                                {rd.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STYLE 11: GEO Tactic detailed rows */}
                    {currentSlideData.style === 'geo' && (
                      <div className="w-full space-y-4 text-left">
                        <h3 className="text-2xl font-bold temple-slides-font-serif">{currentSlideData.title}</h3>
                        <p className="text-xs text-[#A07A35] font-semibold tracking-wider uppercase mb-2 temple-slides-font-sans">{currentSlideData.subtitle}</p>

                        <div className="grid grid-cols-2 gap-6 pt-1">
                          {currentSlideData.comparisons?.map((cp, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                borderColor: idx === 0 ? '#B8351F33' : '#A07A3533', 
                                backgroundColor: idx === 0 ? '#B8351F08' : '#A07A3508' 
                              }}
                              className="p-6 border rounded flex flex-col justify-between text-left"
                            >
                              <div className="space-y-2.5">
                                <span 
                                  style={{ 
                                    backgroundColor: idx === 0 ? '#B8351F15' : '#A07A3515', 
                                    color: idx === 0 ? '#B8351F' : '#A07A35' 
                                  }}
                                  className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded inline-block temple-slides-font-sans"
                                >
                                  {idx === 0 ? '❌ 传统竞价广告已废弃' : '🚀 本地大模型注入战略'}
                                </span>
                                <h4 style={{ color: idx === 0 ? '#B8351F' : '#A07A35' }} className="text-base font-bold pt-1 temple-slides-font-serif">
                                  {cp.type}
                                </h4>
                                <p className="text-[11px] text-stone-500 leading-relaxed temple-slides-font-sans">
                                  {cp.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STYLE 12: Technical GEO data architecture */}
                    {currentSlideData.style === 'geoArch' && (
                      <div className="w-full space-y-3 text-left">
                        <h3 className="text-2xl font-bold temple-slides-font-serif">{currentSlideData.title}</h3>
                        <p className="text-xs text-[#A07A35] font-semibold tracking-wider uppercase mb-3 temple-slides-font-sans">{currentSlideData.subtitle}</p>

                        <div className="space-y-2.5">
                          {currentSlideData.threeLayers?.map((la, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                backgroundColor: isDarkMode ? '#132135' : '#FFFFFF', 
                                borderColor: isDarkMode ? '#A07A3522' : '#0E1A2B15' 
                              }}
                              className="p-3 border rounded flex items-center justify-between gap-6 text-left"
                            >
                              <div className="w-[180px] shrink-0 font-bold text-xs text-[#B8351F] temple-slides-font-serif">
                                {la.layer}
                              </div>
                              <div style={{ color: '#A07A35' }} className="w-[150px] shrink-0 font-mono text-[9px] bg-stone-500/10 py-1 px-2 rounded font-bold uppercase tracking-tight text-center">
                                {la.code}
                              </div>
                              <p className="flex-1 text-[10.5px] text-stone-500 leading-relaxed temple-slides-font-sans">
                                {la.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STYLE 13: Elegant massive ledger grids */}
                    {currentSlideData.style === 'ledger' && (
                      <div className="w-full space-y-4 text-left">
                        <div className="flex flex-col">
                          <h3 className="text-2xl font-bold temple-slides-font-serif">{currentSlideData.title}</h3>
                          <p className="text-xs text-[#B8351F] font-semibold tracking-wider uppercase mt-0.5 temple-slides-font-sans">{currentSlideData.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-1">
                          {currentSlideData.ledgerGrid?.map((lg, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                backgroundColor: isDarkMode ? '#132135' : '#FFFFFF', 
                                borderColor: isDarkMode ? '#A07A3522' : '#0E1A2B15' 
                              }}
                              className="p-4 border rounded shadow-sm flex flex-col justify-between text-left"
                            >
                              <div>
                                <span className="font-mono text-[8px] font-bold text-[#A07A35] block">BENEFICIARY PARTNER 0{idx + 1}</span>
                                <h4 style={{ color: '#B8351F' }} className="font-bold text-[12px] mt-1 temple-slides-font-serif">
                                  {lg.party}
                                </h4>
                                <div className="space-y-2 mt-3.5 text-[10px] text-stone-500 leading-relaxed temple-slides-font-sans">
                                  <p>👉 {lg.bullet1}</p>
                                  <p>👉 {lg.bullet2}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STYLE 14: Capitalized Financing / Milestones columns */}
                    {currentSlideData.style === 'financing' && (
                      <div className="w-full space-y-4 text-left">
                        <h3 className="text-2xl font-bold temple-slides-font-serif">{currentSlideData.title}</h3>
                        <p className="text-xs text-[#A07A35] font-semibold tracking-wider uppercase mb-2 temple-slides-font-sans">{currentSlideData.subtitle}</p>

                        <div className="grid grid-cols-3 gap-5">
                          {currentSlideData.financingSteps?.map((fi, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                backgroundColor: isDarkMode ? '#132135' : '#FFFFFF', 
                                borderColor: isDarkMode ? '#A07A3533' : '#0E1A2B15' 
                              }}
                              className="p-5 rounded-sm border flex flex-col justify-between text-left h-[155px]"
                            >
                              <div>
                                <h4 style={{ color: '#B8351F' }} className="font-bold text-xs temple-slides-font-serif">{fi.name}</h4>
                                <span style={{ backgroundColor: '#A07A3515', color: '#A07A35' }} className="text-[9px] rounded py-0.5 px-2 font-bold block mt-1.5 w-max temple-slides-font-sans">
                                  {fi.milestone}
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-500 leading-relaxed mt-2 temple-slides-font-sans">
                                {fi.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>

              </div>

              {/* Slider Footer branding block */}
              <div 
                style={{ 
                  borderTopColor: isDarkMode ? '#A07A3533' : '#0E1A2B15',
                  color: isDarkMode ? '#A07A35AA' : '#3A4250AA'
                }}
                className="flex items-center justify-between border-t pt-4 font-mono text-[9px] font-semibold pointer-events-none select-none"
              >
                <span>© SGSYEN SPATIAL LAB 2026</span>
                <span className="font-bold text-[#B8351F]">PROJECT / 庙街小巷 (TEMPLE STREET ALLEY)</span>
                <span>PAGE {String(currentSlide + 1).padStart(2, '0')} / {String(slidesData.length).padStart(2, '0')}</span>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COMPANION: Current slide Presenter Notes (Memo panel) */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                backgroundColor: isDarkMode ? '#132135' : '#FAF8F2',
                borderLeftColor: '#A07A3533',
                color: isDarkMode ? '#FAF9F5' : '#0E1A2B'
              }}
              className="w-80 border-l flex flex-col h-full z-20 shadow-2xl relative select-none temple-slides-font-sans"
            >
              <div style={{ borderBottomColor: '#A07A3522', backgroundColor: isDarkMode ? '#0E1A2B' : '#EFECE5' }} className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#B8351F] font-bold text-[10px] uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-[#B8351F]" />
                  <span>演讲备注 / 备忘录</span>
                </div>
                <button onClick={() => setShowNotes(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-4 text-left">
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block">
                  NOTE MEMO FOR SLIDE {currentSlide + 1}
                </span>

                <h4 style={{ color: '#B8351F' }} className="font-bold text-sm temple-slides-font-serif">
                  {currentSlideData.title}
                </h4>

                <p 
                  style={{ 
                    backgroundColor: isDarkMode ? '#0E1A2B' : '#FFFFFF', 
                    borderColor: '#A07A3533' 
                  }}
                  className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed p-4 border rounded font-normal italic select-text"
                >
                  {currentSlideData.notes}
                </p>

                <div style={{ borderTopColor: '#A07A3533' }} className="border-t border-dashed pt-4 space-y-2.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block pb-1">
                    🗣️ 自贸港高级表达指南
                  </span>
                  <div 
                    style={{ backgroundColor: isDarkMode ? '#1D2D44' : '#EFECE6' }}
                    className="p-3 text-[10px] text-stone-500 dark:text-stone-300 rounded leading-relaxed font-serif"
                  >
                    “不要单向兜售，而要把这个当作一份‘和海南共成长的夜色民生数据操作规程’。用老阿伯老陈的亲身故事破局，再用 GEO 技术细节震撼听众。”
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Under Carriage Controller Board (Remote clicker imitation) */}
      <footer 
        style={{ 
          borderTopColor: '#A07A3533', 
          backgroundColor: isDarkMode ? '#0E1A2B' : '#FFFFFF' 
        }}
        className="py-4 px-8 border-t flex items-center justify-between select-none z-10 temple-slides-font-sans"
      >
        <div className="flex items-center gap-6">
          <div className="text-xs text-stone-400 flex items-center gap-2">
            <span className="font-bold text-[#A07A35]">操作帮助:</span>
            <span className="bg-stone-500/10 px-1.5 py-0.5 rounded text-[10px] text-stone-500 border border-[#A07A3522]">← / PageUp / Backspace 键回退</span>
            <span className="bg-stone-500/10 px-1.5 py-0.5 rounded text-[10px] text-stone-500 border border-[#A07A3522]">→ / 空格 / PageDown / 翻页笔按键 前进</span>
          </div>
        </div>

        {/* Central Remote controller icons */}
        <div style={{ backgroundColor: '#A07A3515', borderColor: '#A07A3522' }} className="flex items-center gap-4 rounded-full py-1.5 px-4 border">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            style={{
              backgroundColor: currentSlide === 0 ? 'transparent' : '#B8351F',
              color: '#FFFFFF'
            }}
            className={`p-1.5 rounded-full cursor-pointer transition-colors ${
              currentSlide === 0 
                ? 'opacity-30 cursor-not-allowed text-stone-500' 
                : 'hover:bg-[#B8351F]/95'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold select-text px-2">
            {String(currentSlide + 1).padStart(2, '0')} / {String(slidesData.length).padStart(2, '0')}
          </span>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slidesData.length - 1}
            style={{
              backgroundColor: currentSlide === slidesData.length - 1 ? 'transparent' : '#B8351F',
              color: '#FFFFFF'
            }}
            className={`p-1.5 rounded-full cursor-pointer transition-colors ${
              currentSlide === slidesData.length - 1 
                ? 'opacity-30 cursor-not-allowed text-stone-500' 
                : 'hover:bg-[#B8351F]/95'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic laser guide indicator state */}
        <div className="text-xs font-sans flex items-center gap-2">
          {laserActive ? (
            <span className="text-[#B8351F] flex items-center gap-1 font-bold animate-pulse">
              ● 演讲笔激光已激活 (并在屏幕内随动拖拽)
            </span>
          ) : (
            <span className="opacity-45 text-stone-500">演讲笔激光已关闭</span>
          )}
        </div>
      </footer>
    </div>
  );
}
