import { ref, computed } from 'vue';
import zhCN from './zh-CN';
import enUS from './en-US';

export type Locale = 'zh' | 'en';

const LOCALE_STORAGE_KEY = 'liquid-glass-lab-locale';

function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (saved === 'zh' || saved === 'en') return saved;
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('zh')) return 'zh';
  }
  return 'zh';
}

export const currentLocale = ref<Locale>(getInitialLocale());

export function setLocale(locale: Locale): void {
  currentLocale.value = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
}

export function toggleLocale(): void {
  setLocale(currentLocale.value === 'zh' ? 'en' : 'zh');
}

export const messages = {
  zh: zhCN,
  en: enUS,
};

export const t = computed(() => messages[currentLocale.value]);
