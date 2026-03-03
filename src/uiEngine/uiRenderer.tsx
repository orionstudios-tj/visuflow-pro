import React, { useCallback } from 'react';
import type { UINode } from '@/types/ui.types';
import { componentRegistry, isContainer } from './componentRegistry';
import { triggerEvent } from '@/eventBinder/eventBinder';
import { useAppStore } from '@/store/appStore';

interface UIRendererProps {
  node: UINode;
  isPreview?: boolean;
}

const UIRenderer: React.FC<UIRendererProps> = ({ node, isPreview = false }) => {
  const { eventBindings, logicGraphs, appState, setAppState } = useAppStore();

  const handleEvent = useCallback(
    (event: string) => {
      if (!isPreview) return;
      triggerEvent(node.id, event, eventBindings, logicGraphs, {
        appState,
        setAppState,
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

  const eventProps: Record<string, () => void> = {};
  if (isPreview) {
    const hasClickBinding = eventBindings.some(
      (b) => b.uiNodeId === node.id && b.event === 'onClick'
    );
    if (hasClickBinding) {
      eventProps.onClick = () => handleEvent('onClick');
    }
  }

  const childElements = isContainer(node.type)
    ? node.children.map((child) => (
        <UIRenderer key={child.id} node={child} isPreview={isPreview} />
      ))
    : undefined;

  return (
    <Component {...node.props} {...eventProps} style={node.style}>
      {childElements}
    </Component>
  );
};

export default UIRenderer;
