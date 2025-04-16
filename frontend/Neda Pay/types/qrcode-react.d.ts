declare module 'qrcode.react' {
  import * as React from 'react';

  export interface QRCodeSVGProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    bgColor?: string;
    fgColor?: string;
    style?: React.CSSProperties;
    includeMargin?: boolean;
    imageSettings?: {
      src: string;
      x?: number;
      y?: number;
      height?: number;
      width?: number;
      excavate?: boolean;
    };
  }

  export class QRCodeSVG extends React.Component<QRCodeSVGProps> {}
  export class QRCodeCanvas extends React.Component<QRCodeSVGProps> {}
}
