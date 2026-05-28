import React from 'react';
import SgsyenHero from './SgsyenHero';
import SgsyenDomains from './SgsyenDomains';
import SgsyenNetwork from './SgsyenNetwork';
import SgsyenCaseStudy from './SgsyenCaseStudy';
import SgsyenReports from './SgsyenReports';
import MacroPulseBar from './MacroPulseBar';

export default function SgsyenPortal() {
  return (
    <div id="sgsyen-portal-layout" className="w-full flex flex-col bg-[#FDFCF9] scroll-smooth antialiased">
      {/* 1. Hero Landing Cover */}
      <SgsyenHero />

      {/* 1.5 Live Macro Pulse — regime signal + 15 market indicators */}
      <MacroPulseBar />

      {/* 2. Study fields & metrics */}
      <SgsyenDomains />

      {/* 3. The SGSYEN Network of Affiliated Portals */}
      <SgsyenNetwork />

      {/* 4. Realtime Supabase integration points */}
      <SgsyenReports />

      {/* 5. Revitalization Planning Cases */}
      <SgsyenCaseStudy />

      {/* 6. Strip Banner footer accent */}
      <div 
        id="sgsyen-portal-footer-accent"
        className="flex items-center justify-center gap-12 py-5 overflow-hidden whitespace-nowrap text-[9px] font-sans font-bold uppercase tracking-[0.3em] bg-[#111110] text-[#FDFCF9]/30 border-t border-[#FDFCF9]/5"
      >
        <span>独立研判 &nbsp;·&nbsp; 深度深水 &nbsp;·&nbsp; 跨越学科领域</span>
        <span className="hidden md:inline">Independent &nbsp;·&nbsp; In-depth &nbsp;·&nbsp; Interdisciplinary Academic Focus</span>
        <span className="hidden lg:inline">为公共体系及核心前瞻产业提供深度智力支撑 (Est. 2020)</span>
      </div>
    </div>
  );
}
