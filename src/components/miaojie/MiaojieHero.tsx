import React from 'react';
import { motion } from 'motion/react';

const FOUR_POINTS = [
  {
    num: '01',
    title: '技术红利落到摊位',
    sub: '10 人团队 → 一个人 + 工具链 · 成本压到 1/5',
  },
  {
    num: '02',
    title: '政策红利长在脚下',
    sub: '2025.12.18 封关 · 15% 所得税 · 跨境数据',
  },
  {
    num: '03',
    title: '数据本地变成资产',
    sub: '城市消费图谱本地留存 · 可交付智慧城市',
  },
  {
    num: '04',
    title: '在地文化成为壁垒',
    sub: '琼剧 · 黎歌苗舞 · 渔港 · 别人复制不了的语料',
  },
];

export default function MiaojieHero() {
  return (
    <section
      className="min-h-screen flex flex-col justify-between relative overflow-hidden py-16 px-8 md:px-16 lg:px-24"
      style={{ background: 'linear-gradient(160deg, #0e1a12 0%, #131320 100%)' }}
    >
      {/* Ambient glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 78% 20%, rgba(196,163,90,0.07) 0%, transparent 50%), radial-gradient(circle at 22% 78%, rgba(200,62,62,0.05) 0%, transparent 50%)',
        }}
      />

      {/* Top badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center gap-4"
      >
        <span className="text-[10px] tracking-[0.4em] uppercase font-sans font-bold text-[#C4A35A]">
          TOPV · 海甸 SERIES 2026
        </span>
        <span
          className="block w-16 h-px"
          style={{ background: 'linear-gradient(90deg, rgba(196,163,90,0.4), transparent)' }}
        />
        <span className="text-[10px] tracking-[0.3em] uppercase font-sans text-white/35">
          庙街小巷 · 商业技术书
        </span>
      </motion.div>

      {/* Preamble */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18 }}
        className="relative z-10 max-w-3xl text-white/55 text-lg md:text-xl leading-relaxed mt-14"
        style={{ fontFamily: '"Noto Serif SC", "Source Serif 4", Georgia, serif' }}
      >
        AI 时代改写每条产业的成本结构，新质生产力重写土地、数据与产业的价值定义。这两件事，第一次在同一年、同一座岛、同一个项目里同时落地——
        <span className="text-white/90 font-semibold">十年一遇。</span>
      </motion.p>

      {/* Main formula */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.32 }}
        className="relative z-10 my-10"
      >
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex flex-wrap items-baseline gap-4 md:gap-6">
            <span
              className="font-black text-5xl md:text-7xl lg:text-[5.5rem] text-white leading-none"
              style={{ fontFamily: '"Playfair Display", "Noto Serif SC", serif' }}
            >
              AI 时代
            </span>
            <span className="text-[#C4A35A] text-4xl md:text-5xl font-light leading-none">+</span>
            <span
              className="font-black text-5xl md:text-7xl lg:text-[5.5rem] text-white leading-none"
              style={{ fontFamily: '"Playfair Display", "Noto Serif SC", serif' }}
            >
              新质生产力
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-4 md:gap-6">
            <span className="text-[#C4A35A] text-4xl md:text-5xl font-light leading-none">=</span>
            <span
              className="font-black text-5xl md:text-7xl lg:text-[5.5rem] leading-none"
              style={{ color: '#C83E3E', fontFamily: '"Playfair Display", "Noto Serif SC", serif' }}
            >
              海甸溪机会
            </span>
          </div>
        </div>

        <div className="w-20 h-[3px] mb-7" style={{ background: '#C83E3E' }} />

        <p
          className="text-white/65 text-xl md:text-2xl leading-relaxed max-w-xl"
          style={{ fontFamily: '"Noto Serif SC", "Source Serif 4", Georgia, serif' }}
        >
          不是把烟火气包装成网红，<br />
          是让烟火气<span className="text-white font-semibold">长出新流量。</span>
        </p>
      </motion.div>

      {/* 4 cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.52 }}
        className="relative z-10"
      >
        <p className="text-[10px] tracking-[0.35em] uppercase font-sans font-bold text-[#C4A35A] mb-5">
          双重红利 · 四件最重要的事
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded overflow-hidden">
          {FOUR_POINTS.map((pt) => (
            <div
              key={pt.num}
              className="bg-[#0e1a12] hover:bg-white/[0.04] transition-colors duration-300 p-6 flex flex-col gap-3"
            >
              <span className="font-mono text-[11px] text-[#C4A35A] font-bold tracking-[0.3em]">
                {pt.num}
              </span>
              <h3
                className="font-bold text-white text-base md:text-lg leading-snug"
                style={{ fontFamily: '"Noto Serif SC", serif' }}
              >
                {pt.title}
              </h3>
              <p className="font-sans text-white/45 text-sm leading-relaxed">{pt.sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="relative z-10 mt-10 flex items-center justify-between"
      >
        <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
          海口 · 海甸溪北岸 · 2026
        </span>
        <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
          01 · WHY NOW
        </span>
      </motion.div>
    </section>
  );
}
