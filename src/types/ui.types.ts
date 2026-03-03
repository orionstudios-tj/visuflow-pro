export type UIComponentType = 'Page' | 'Grid' | 'Card' | 'Button' | 'Input' | 'Text';

export interface UINodeProps {
  label?: string;
  text?: string;
  placeholder?: string;
  columns?: number;
  gap?: number;
  variant?: string;
  [key: string]: unknown;
}

export interface UINodeStyle {
  padding?: string;
  margin?: string;
  backgroundColor?: string;
  color?: string;
  width?: string;
  height?: string;
  minHeight?: string;
  borderRadius?: string;
  border?: string;
  display?: string;
  flexDirection?: string;
  alignItems?: string;
  justifyContent?: string;
  gap?: string;
  fontSize?: string;
  fontWeight?: string;
  [key: string]: string | undefined;
}

export interface UINode {
  id: string;
  type: UIComponentType;
  props: UINodeProps;
  style: UINodeStyle;
  children: UINode[];
  parentId: string | null;
}

export interface UITree {
  root: UINode;
}
