import React, { useCallback } from 'react';
import type { UINode } from '@/types/ui.types';
import { componentRegistry, isContainer } from './componentRegistry';
import { triggerEvent } from '@/eventBinder/eventBinder';
import { useAppStore } from '@/store/appStore';

interface UIRendererProps {
  node: UINode;
  isPreview?: boolean;
}

const resolveValue = (val: any, state: Record<string, any>) => {
  if (typeof val !== 'string') return val;
  return val.replace(/\{\{state\.(.*?)\}\}/g, (_, path) => {
    return (state[path] as string) || '';
  });
};

const UIRenderer: React.FC<UIRendererProps> = ({ node, isPreview = false }) => {
  const { eventBindings, logicGraphs, appState, setAppState } = useAppStore();

  const handleEvent = useCallback(
    (event: string, value?: any) => {
      if (!isPreview) return;
      triggerEvent(node.id, event, eventBindings, logicGraphs, {
        appState,
        setAppState,
        eventValue: value
      }).then((results) => {
        if (results.length > 0) {
          const lastResult = results[results.length - 1];
          if (lastResult) {
            useAppStore.getState().setLastExecution(lastResult);
          }
        }
      });
    },
    [node.id, isPreview, eventBindings, logicGraphs, appState, setAppState]
  );

  const Component = componentRegistry[node.type];
  if (!Component) return <div>Unknown: {node.type}</div>;

  const resolvedProps = Object.keys(node.props).reduce((acc, key) => {
    acc[key] = resolveValue(node.props[key], appState);
    return acc;
  }, {} as any);

  const eventProps: any = {};
  if (isPreview) {
    const hasClickBinding = eventBindings.some(
      (b) => b.uiNodeId === node.id && b.event === 'onClick'
    );
    if (hasClickBinding) {
      eventProps.onClick = () => handleEvent('onClick');
    }

    const hasChangeBinding = eventBindings.some(
      (b) => b.uiNodeId === node.id && b.event === 'onChange'
    );
    if (hasChangeBinding) {
      eventProps.onChange = (e: React.ChangeEvent<HTMLInputElement>) => 
        handleEvent('onChange', e.target.value);
    }
  }

  const childElements = isContainer(node.type)
    ? node.children.map((child) => (
        <UIRenderer key={child.id} node={child} isPreview={isPreview} />
      ))
    : undefined;

  return (
    <Component {...resolvedProps} {...eventProps} style={node.style}>
      {childElements}
    </Component>
  );
};

export default UIRenderer;
