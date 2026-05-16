import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../../i18n/languages';
import { LanguageType } from '../../../types';

const LangToggle: FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className='inline-flex'>
      <select
        aria-label='Language'
        value={i18n.language}
        onChange={e => i18n.changeLanguage(e.target.value as LanguageType)}
        className='appearance-none border-0 bg-transparent p-0 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-3 cursor-pointer hover:text-ed-navy focus:outline-none'
      >
        {Object.entries(LANGUAGES).map(([code, lang]) => (
          <option key={code} value={code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LangToggle;
