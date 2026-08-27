import { computed, type ComputedRef } from 'vue'
import { useRouteLocale } from 'vuepress/client'

export type AppLocale = 'en' | 'zh'

export function useAppLocale(): ComputedRef<AppLocale> {
  const routeLocale = useRouteLocale()
  return computed(() => (routeLocale.value.startsWith('/zh') ? 'zh' : 'en'))
}

export function useIsZh(): ComputedRef<boolean> {
  const locale = useAppLocale()
  return computed(() => locale.value === 'zh')
}

/** Prefix an absolute site path with the current locale (`/zh` or ``). */
export function useLocalePath(): ComputedRef<(path: string) => string> {
  const locale = useAppLocale()
  return computed(() => {
    const prefix = locale.value === 'zh' ? '/zh' : ''
    return (path: string) => {
      if (!path) return path
      if (/^https?:\/\//.test(path)) return path
      const normalized = path.startsWith('/') ? path : `/${path}`
      if (prefix && normalized.startsWith(`${prefix}/`)) return normalized
      if (prefix && normalized === prefix) return `${prefix}/`
      return `${prefix}${normalized}`
    }
  })
}

export function pickLocaleText(
  locale: AppLocale,
  en: string,
  zh?: string,
): string {
  return locale === 'zh' && zh ? zh : en
}
