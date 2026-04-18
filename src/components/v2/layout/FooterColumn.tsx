import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type FooterLink = {
  label: ReactNode;
  href: string;
  external?: boolean;
};

type Props = {
  heading: ReactNode;
  links: FooterLink[];
};

const FooterColumn: FC<Props> = ({ heading, links }) => (
  <div>
    <h4 className='mb-[18px] font-mono-ed text-[11px] font-medium uppercase tracking-[0.14em] text-white'>
      {heading}
    </h4>
    <ul className='m-0 list-none p-0'>
      {links.map(l =>
        l.external ? (
          <li key={String(l.label)} className='mb-2.5'>
            <a
              href={l.href}
              target='_blank'
              rel='noreferrer'
              className='text-white/80 no-underline hover:text-white hover:underline'
            >
              {l.label}
            </a>
          </li>
        ) : (
          <li key={String(l.label)} className='mb-2.5'>
            <Link
              to={l.href}
              className='text-white/80 no-underline hover:text-white hover:underline'
            >
              {l.label}
            </Link>
          </li>
        )
      )}
    </ul>
  </div>
);

export default FooterColumn;
