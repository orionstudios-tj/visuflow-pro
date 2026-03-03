import React from 'react';
import type { UIComponentType } from '@/types/ui.types';

/* ── Primitive UI Components ── */

const PageComponent: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ minHeight: '100%', ...style }}>{children}</div>
);

const GridComponent: React.FC<{ columns?: number; gap?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  columns = 2, gap = 16, style, children,
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: `${gap}px`, ...style }}>
    {children}
  </div>
);

const CardComponent: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      borderRadius: '8px',
      border: '1px solid hsl(225 12% 20%)',
      backgroundColor: 'hsl(225 15% 13%)',
      padding: '16px',
      ...style,
    }}
  >
    {children}
  </div>
);

const ButtonComponent: React.FC<{
  label?: string;
  text?: string;
  variant?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}> = ({ label, text, variant, onClick, style }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: '14px',
      backgroundColor: variant === 'destructive' ? 'hsl(0 65% 55%)' : 'hsl(167 70% 50%)',
      color: variant === 'destructive' ? '#fff' : 'hsl(225 15% 8%)',
      ...style,
    }}
  >
    {text || label || 'Button'}
  </button>
);

const InputComponent: React.FC<{
  placeholder?: string;
  style?: React.CSSProperties;
}> = ({ placeholder, style }) => (
  <input
    placeholder={placeholder || 'Enter text...'}
    style={{
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid hsl(225 12% 20%)',
      backgroundColor: 'hsl(225 15% 16%)',
      color: 'hsl(210 20% 90%)',
      fontSize: '14px',
      width: '100%',
      outline: 'none',
      ...style,
    }}
  />
);

const TextComponent: React.FC<{ text?: string; style?: React.CSSProperties }> = ({ text, style }) => (
  <span style={{ fontSize: '14px', color: 'hsl(210 20% 90%)', ...style }}>{text || 'Text'}</span>
);

/* ── Registry ── */

export const componentRegistry: Record<UIComponentType, React.FC<any>> = {
  Page: PageComponent,
  Grid: GridComponent,
  Card: CardComponent,
  Button: ButtonComponent,
  Input: InputComponent,
  Text: TextComponent,
};

/** Returns true if a component type can contain children */
export function isContainer(type: UIComponentType): boolean {
  return ['Page', 'Grid', 'Card'].includes(type);
}
