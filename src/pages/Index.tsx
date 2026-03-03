import React from 'react';
import { useAppStore } from '@/store/appStore';
import UIBuilder from '@/components/uiBuilder/UIBuilder';
import LogicBuilder from '@/components/logicBuilder/LogicBuilder';
import PreviewRenderer from '@/components/renderer/PreviewRenderer';
import EventBindingPanel from '@/components/eventBindingPanel/EventBindingPanel';
import { Layers, Workflow, Eye, Link } from 'lucide-react';

const TABS = [
  { id: 'ui' as const, label: 'UI Builder', icon: <Layers size={14} /> },
  { id: 'logic' as const, label: 'Logic', icon: <Workflow size={14} /> },
  { id: 'preview' as const, label: 'Preview', icon: <Eye size={14} /> },
];

const Index: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const [showBindings, setShowBindings] = React.useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-10 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
            <Layers size={12} className="text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">ReactForge</span>
          <span className="text-[10px] text-muted-foreground font-mono ml-1">v1.0</span>
        </div>
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs border-none cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => setShowBindings(!showBindings)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs border-none cursor-pointer transition-colors ${
              showBindings
                ? 'bg-accent text-accent-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Link size={14} />
            Bindings
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Main panel */}
        <div className="flex-1 min-w-0">
          {activeTab === 'ui' && (
            <div className="flex h-full">
              <div className="w-72 border-r border-border overflow-hidden">
                <UIBuilder />
              </div>
              <div className="flex-1">
                <PreviewRenderer />
              </div>
            </div>
          )}
          {activeTab === 'logic' && <LogicBuilder />}
          {activeTab === 'preview' && <PreviewRenderer />}
        </div>

        {/* Bindings panel */}
        {showBindings && (
          <div className="w-64 border-l border-border">
            <EventBindingPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
