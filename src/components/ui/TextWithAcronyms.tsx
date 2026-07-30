import React from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './Tooltip';
import acronymData from '../../data/acronyms.json';

type AcronymDataMap = Record<string, { fullName: string; description: string }>;
const dictionary = acronymData as AcronymDataMap;

interface TextWithAcronymsProps {
  text: string;
  className?: string;
}

export function TextWithAcronyms({ text, className }: TextWithAcronymsProps) {
  // Split the text at word boundaries to preserve spaces and punctuation
  // The regex (\b[A-Z]+\b) matches uppercase words and includes them in the split output
  const tokens = text.split(/(\b[A-Z]+\b)/);

  return (
    <span className={className}>
      {tokens.map((token, index) => {
        const acronymInfo = dictionary[token];

        if (acronymInfo) {
          return (
            <TooltipProvider key={index}>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className='cursor-help font-medium border-b-2 border-dotted border-slate-500 hover:text-slate-700 hover:border-slate-700 transition-colors'>
                    {token}
                  </span>
                </TooltipTrigger>
                <TooltipContent className='max-w-xs' sideOffset={6}>
                  <div className='font-semibold text-sm mb-1'>
                    {acronymInfo.fullName}
                  </div>
                  <div className='text-xs text-slate-300 leading-relaxed'>
                    {acronymInfo.description}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        // Return regular string if it's not an acronym
        return <React.Fragment key={index}>{token}</React.Fragment>;
      })}
    </span>
  );
}
