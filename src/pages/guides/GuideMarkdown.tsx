import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';
import './guides.css';

/** Guide content is Markdown only; raw HTML is never executed. */
export default function GuideMarkdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn('guide-body', className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          table: ({ children }) => (
            <div
              className='guide-table'
              role='region'
              aria-label='Scrollable reference table'
              tabIndex={0}
            >
              <table>{children}</table>
            </div>
          ),
          // Requirements are a printable checklist, not disabled form fields.
          input: ({ checked }) => (
            <span aria-hidden='true' className='guide-checkbox'>
              {checked ? '☑' : '□'}
            </span>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
