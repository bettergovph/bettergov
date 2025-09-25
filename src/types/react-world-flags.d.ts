declare module 'react-world-flags' {
  import * as React from 'react';
  export interface FlagProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    code: string;
  }
  const Flag: React.FC<FlagProps>;
  export default Flag;
}
