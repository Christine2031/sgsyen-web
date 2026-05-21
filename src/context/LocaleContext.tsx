import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { TRANSLATIONS } from '../translations';

export type LocaleType = 'zh' | 'en';

interface LocaleContextProps {
  locale: LocaleType;
  setLocale: (lang: LocaleType) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  // 真实用户对象
  user: User | null;
  session: Session | null;
  // 兼容旧代码的邮箱字段
  authorizedEmail: string | null;
  // 真实 Supabase 登录/登出
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  // 登录 Modal 控制
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  authLoading: boolean;
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [locale, setLocale] = useState<LocaleType>(() => {
    const saved = localStorage.getItem('ais_pricing_locale');
    if (saved === 'en' || saved === 'zh') return saved;
    return 'zh';
  });

  // 初始化：恢复 Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // 监听登录状态变化（跨 tab 同步）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setLocaleAndPersist = (newLocale: LocaleType) => {
    setLocale(newLocale);
    localStorage.setItem('ais_pricing_locale', newLocale);
  };

  // 真实 Supabase 邮箱 + 密码登录
  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // 友好化错误提示
      if (error.message.includes('Invalid login credentials')) {
        return { error: locale === 'zh' ? '邮箱或密码不正确，请重试。' : 'Incorrect email or password.' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: locale === 'zh' ? '邮箱尚未验证，请检查收件箱。' : 'Email not confirmed. Check your inbox.' };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const langDict = TRANSLATIONS[locale] || TRANSLATIONS.zh;
    let text = (langDict as Record<string, string>)[key] ?? (TRANSLATIONS.zh as Record<string, string>)[key] ?? key;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <LocaleContext.Provider value={{
      locale,
      setLocale: setLocaleAndPersist,
      t,
      user,
      session,
      authorizedEmail: user?.email ?? null,
      login,
      logout,
      showLoginModal,
      setShowLoginModal,
      authLoading,
    }}>
      {children}
    </LocaleContext.Provider>
  );
}
