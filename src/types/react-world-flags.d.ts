declare module 'react-world-flags' {
  import { ImgHTMLAttributes, FC } from 'react';
  export interface FlagProps extends ImgHTMLAttributes<HTMLImageElement> {
    code: string;
  }
  const Flag: FC<FlagProps>;
  export default Flag;
}
