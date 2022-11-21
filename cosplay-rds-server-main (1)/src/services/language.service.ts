import { Service } from 'typedi';

@Service()
export class LanguageService {
  private readonly defaultLang = 'en';
  private readonly chineseLocalLanguages = ['zh-CN', 'zh-TW'];
  private readonly acceptLanguages = ['en', 'ja', 'zh', ...this.chineseLocalLanguages];

  getLanguage(lang?: string): string {
    if (!lang) return this.defaultLang;
    const validatedLang = this.acceptLanguages.includes(lang) ? lang : this.defaultLang;

    return this.chineseLocalLanguages.includes(validatedLang)
      ? validatedLang.substring(0, 2)
      : validatedLang;
  }
}
