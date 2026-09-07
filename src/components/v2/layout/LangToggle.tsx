import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from 'lucide-react';
import { LANGUAGES } from '../../../i18n/languages';
import { LanguageType } from '../../../types';

const LangToggle: FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className='relative inline-flex'>
      <select
        aria-label='Language'
        value={i18n.language}
        onChange={e => i18n.changeLanguage(e.target.value as LanguageType)}
        className='cursor-pointer appearance-none border border-ed-rule-strong bg-white py-1 pl-2.5 pr-7 font-serif-ed text-[12px] max-sm:py-0.5 max-sm:pl-2 max-sm:pr-6 max-sm:text-[11px] text-ed-ink-3 transition-colors hover:border-ed-navy hover:text-ed-navy focus:border-ed-navy focus:outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ed-navy'
      >
        {Object.entries(LANGUAGES).map(([code, lang]) => (
          <option key={code} value={code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={12}
        className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ed-ink-3'
      />
    </div>
  );
};

export default LangToggle;
