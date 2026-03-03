import React from 'react';
import UIRenderer from '@/uiEngine/uiRenderer';
import { useAppStore } from '@/store/appStore';

const PreviewRenderer: React.FC = () => {
  const { uiTree, appState, lastExecution } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span>Live Preview</span>
        <span className="text-[10px] font-normal text-muted-foreground font-mono">
          state keys: {Object.keys(appState).length}
        </span>
      </div>
      <div className="flex-1 overflow-auto bg-background p-4">
        <UIRenderer node={uiTree.root} isPreview />
      </div>
      {/* Execution log */}
      {lastExecution && (
        <div className="border-t border-border max-h-32 overflow-auto">
          <div className="panel-header">
            <span>Execution Log</span>
            <span className={`text-[10px] font-mono ${lastExecution.success ? 'text-primary' : 'text-destructive'}`}>
              {lastExecution.success ? '✓ Success' : '✗ Error'}
            </span>
          </div>
          <div className="p-2 space-y-0.5">
            {lastExecution.log.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                <span className={entry.status === 'error' ? 'text-destructive' : entry.status === 'completed' ? 'text-primary' : 'text-muted-foreground'}>
                  {entry.status === 'completed' ? '●' : entry.status === 'error' ? '✗' : '○'}
                </span>
                <span className="text-muted-foreground">{entry.nodeType}</span>
                <span className="text-foreground">{entry.nodeId}</span>
                {entry.duration !== undefined && (
                  <span className="text-muted-foreground">{entry.duration}ms</span>
                )}
                {entry.error && <span className="text-destructive">{entry.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewRenderer;
