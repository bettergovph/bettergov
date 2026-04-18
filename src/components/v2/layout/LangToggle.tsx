import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../../i18n/languages';
import { LanguageType } from '../../../types';

const LangToggle: FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className='inline-flex border border-ed-ink bg-white font-mono-ed text-[10px] tracking-[0.12em]'>
      <select
        aria-label='Language'
        value={i18n.language}
        onChange={e => i18n.changeLanguage(e.target.value as LanguageType)}
        className='appearance-none border-0 bg-transparent px-2.5 py-1 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink cursor-pointer focus:outline-none'
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
