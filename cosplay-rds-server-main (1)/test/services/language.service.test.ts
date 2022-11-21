import { LanguageService } from '../../src/services/language.service';

describe('LanguageService', () => {
  const languageService = new LanguageService();

  describe('getLanguage', () => {
    it('returns lang that passed', () => {
      const lang = languageService.getLanguage('en');

      expect(lang).toBe('en');
    });

    it('returns chiense lang', () => {
      const lang = languageService.getLanguage('zh-TW');

      expect(lang).toBe('zh');
    });

    it('returns default lang', () => {
      const lang = languageService.getLanguage('hello');

      expect(lang).toBe('en');
    });

    it('returns default lang when passed undefined', () => {
      const lang = languageService.getLanguage();

      expect(lang).toBe('en');
    });
  });
});
