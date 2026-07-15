import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlowProvider, useReactFlow, useOnSelectionChange } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { collection, addDoc, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/features/simulator/hooks/useAuth';
import { toast } from 'sonner';

import { ComponentPalette } from '@/components/ComponentPalette';
import { NodeConfigPanel } from '@/components/NodeConfigPanel';
import { TextConfigPanel } from '@/components/TextConfigPanel';
import { FrameConfigPanel } from '@/components/FrameConfigPanel';
import type { ComponentType } from '@/types/simulator';
import { BEHAVIORS } from '@/lib/behaviors';
import { type SimNodeData } from '@/lib/simulation';
import { WELCOME_PRESET } from '@/lib/presets';
import { syncNodeIdCounter } from '@/lib/nodeIds';

// Feature hooks
import { useCanvasState } from '@/features/simulator/hooks/useCanvasState';
import { useSimulationLoop } from '@/features/simulator/hooks/useSimulationLoop';
import { useDragAndDrop } from '@/features/simulator/hooks/useDragAndDrop';
import { loadPersistedCanvas, useCanvasPersistence, useCanvasFileIO } from '@/features/simulator/hooks/useCanvasPersistence';
import { useExcalidrawZoom } from '@/hooks/useExcalidrawZoom';
import { HistoryProvider } from '@/context/HistoryContext';

// Feature components
import { SimulatorCanvas } from '@/features/simulator/components/SimulatorCanvas';
import { CanvasToolbar } from '@/features/simulator/components/CanvasToolbar';
import { ActionsMenu } from '@/features/simulator/components/ActionsMenu';
import { UndoRedoControls } from '@/features/simulator/components/UndoRedoControls';
import { WelcomeOverlay } from '@/features/simulator/components/WelcomeOverlay';

// ── Load initial state from localStorage (runs once at module eval time) ──────
const initialCanvasState = loadPersistedCanvas();

export function Simulator() {
  return (
    <ReactFlowProvider>
      <SimulatorInner />
    </ReactFlowProvider>
  );
}

function SimulatorInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStart,
    addSimNode,
    addTextNode,
    addFrameNode,
    updateNodeConfig,
    deleteNode,
    updateEdgePct,
    updateEdgeOutRate,
    setNodes,
    setEdges,
    setNodesAndEdges,
    takeSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    resetCanvas,
  } = useCanvasState(initialCanvasState);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [frameMode, setFrameMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [appMode, setAppMode] = useState<'draw' | 'simulate'>('draw');
  const flowContainerRef = useRef<HTMLDivElement>(null);

  const { screenToFlowPosition, getViewport, setViewport } = useReactFlow();

  // ── Firebase Auth & Cloud Storage state ────────────────────────────────────
  const { user, loginWithGoogle, logout, isConfigured } = useAuth();
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [currentDesignName, setCurrentDesignName] = useState<string>('');
  const [cloudDesigns, setCloudDesigns] = useState<{ id: string; name: string }[]>([]);
  const [fetchingCloud, setFetchingCloud] = useState(false);

  const fetchUserDesigns = useCallback(async (uid: string) => {
    if (!db) return;
    try {
      setFetchingCloud(true);
      const q = query(
        collection(db, 'designs'),
        where('ownerId', '==', uid)
      );
      const snap = await getDocs(q);
      const designs = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Untitled Design',
          updatedAt: data.updatedAt?.seconds || 0,
        };
      });
      // Sort in memory by updatedAt descending to prevent index requirement
      designs.sort((a, b) => b.updatedAt - a.updatedAt);
      setCloudDesigns(designs.map(d => ({ id: d.id, name: d.name })));
    } catch (error) {
      console.error('Failed to fetch user designs:', error);
    } finally {
      setFetchingCloud(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserDesigns(user.uid);
    } else {
      setCloudDesigns([]);
      setCurrentDesignId(null);
      setCurrentDesignName('');
    }
  }, [user, fetchUserDesigns]);

  const MAX_CLOUD_DESIGNS = 7;

  const deleteFromCloud = useCallback(async (designId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!db || !user) return;
    if (!confirm('Delete this cloud design permanently?')) return;
    try {
      await deleteDoc(doc(db, 'designs', designId));
      if (currentDesignId === designId) {
        setCurrentDesignId(null);
        setCurrentDesignName('');
      }
      toast.success('Design deleted from Cloud');
      fetchUserDesigns(user.uid);
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
  }, [db, user, currentDesignId, fetchUserDesigns]);

  const saveToCloud = useCallback(async () => {
    if (!user) {
      toast.error('You must sign in to save designs to the cloud.');
      return;
    }
    if (!db) {
      toast.error('Firebase has not been configured. Check your .env file.');
      return;
    }

    let name = currentDesignName;
    const isNew = !currentDesignId;

    if (isNew) {
      // Enforce 7-design limit for new saves only
      if (cloudDesigns.length >= MAX_CLOUD_DESIGNS) {
        toast.error(`Cloud limit reached (${MAX_CLOUD_DESIGNS} designs max). Delete an existing design first.`);
        return;
      }
      const enteredName = prompt('Enter a name for this design architecture:');
      if (!enteredName) return; // user cancelled
      name = enteredName.trim() || 'Untitled Design';
    }

    try {
      const state = {
        name,
        ownerId: user.uid,
        nodes,
        edges,
        viewport: getViewport(),
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        const docRef = await addDoc(collection(db, 'designs'), {
          ...state,
          createdAt: serverTimestamp(),
        });
        setCurrentDesignId(docRef.id);
        setCurrentDesignName(name);
        toast.success(`Created cloud design "${name}"`);
      } else {
        await setDoc(doc(db, 'designs', currentDesignId!), state, { merge: true });
        toast.success(`Saved changes to "${name}"`);
      }

      // Refresh list
      fetchUserDesigns(user.uid);
    } catch (error: any) {
      console.error('Failed to save design to cloud:', error);
      toast.error(`Save failed: ${error.message}`);
    }
  }, [user, currentDesignId, currentDesignName, nodes, edges, getViewport, fetchUserDesigns]);

  const loadFromCloud = useCallback(async (designId: string) => {
    if (!db) return;
    try {
      const docRef = doc(db, 'designs', designId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        
        takeSnapshot();
        setNodesAndEdges(data.nodes || [], data.edges || []);
        syncNodeIdCounter(data.nodes || []);
        
        if (data.viewport) {
          setViewport(data.viewport);
        }
        
        setCurrentDesignId(designId);
        setCurrentDesignName(data.name || 'Untitled Design');
        toast.success(`Loaded "${data.name}" from Cloud`);
        setShowMenu(false);
      } else {
        toast.error('Design not found in Cloud');
      }
    } catch (error: any) {
      console.error('Failed to load design:', error);
      toast.error(`Load failed: ${error.message}`);
    }
  }, [takeSnapshot, setNodesAndEdges, setViewport, setShowMenu]);

  // Track selection changes
  useOnSelectionChange({
    onChange: ({ nodes: selectedNodes }) => {
      setSelectedNodeIds(selectedNodes.map(n => n.id));
    },
  });

  const onNodeClick = useCallback((_e: React.MouseEvent, _node: Node) => {
    // React Flow handles selection state internally
  }, []);

  // ── Persistence ───────────────────────────────────────────────────────────
  const { onInit, onMoveEnd } = useCanvasPersistence({ nodes, edges });
  const { handleSave, handleImport } = useCanvasFileIO(
    nodes, edges, setNodes, setEdges, takeSnapshot,
    () => setShowMenu(false),
  );

  const { fitView } = useReactFlow();

  const loadPreset = useCallback((preset: any = WELCOME_PRESET) => {
    takeSnapshot();
    
    // Update nodes and edges atomically
    setNodesAndEdges(preset.nodes, preset.edges || []);
    
    // Sync the ID counter so new nodes don't collide
    syncNodeIdCounter(preset.nodes);
    
    // Fit the view to the newly loaded nodes
    // We use a small timeout to ensure React Flow has rendered the new nodes
    setTimeout(() => {
      fitView({ 
        padding: 0.2, 
        duration: 800,
        includeHiddenNodes: true 
      });
    }, 100);
  }, [takeSnapshot, setNodesAndEdges, fitView]);

  // ── Simulation engine ─────────────────────────────────────────────────────
  const { displayNodes, displayEdges } = useSimulationLoop({ nodes, edges, appMode });

  // ── Drag and drop ─────────────────────────────────────────────────────────
  const { dragType, pointerPos, isDragging, onDragStart, onDrop, onDragOver } = useDragAndDrop({
    flowContainerRef,
    addSimNode,
    onDropSuccess: () => setShowPalette(false),
  });

  // ── Custom zoom ───────────────────────────────────────────────────────────
  useExcalidrawZoom({ containerRef: flowContainerRef, minZoom: 0.05, maxZoom: 4 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (isMod && e.key === 'y') { e.preventDefault(); redo(); }
      else if (e.key === 'Escape') { setTextMode(false); setFrameMode(false); setSelectionMode(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // ── Pane Click (Deselect / Add Text / Add Frame) ──────────────────────────
  const onPaneClick = useCallback((e: React.MouseEvent) => {
    if (textMode && !showPalette && !showMenu) {
      try {
        const position = screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });
        addTextNode(position);
        setTextMode(false);
      } catch (err) {
        console.error('Failed to create text node:', err);
      }
    } else if (frameMode && !showPalette && !showMenu) {
      try {
        const position = screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });
        addFrameNode(position);
        setFrameMode(false);
      } catch (err) {
        console.error('Failed to create frame node:', err);
      }
    } else if (selectionMode && !showPalette && !showMenu) {
      // Do nothing, let ReactFlow handle the drag selection
    } else {
      setSelectedNodeIds([]);
      setShowPalette(false);
      setShowMenu(false);
    }
  }, [textMode, frameMode, selectionMode, showPalette, showMenu, screenToFlowPosition, addTextNode, addFrameNode]);

  // ── Add component (click from palette) ───────────────────────────────────
  const onAddComponent = useCallback((type: ComponentType) => {
    const finalPosition = screenToFlowPosition({
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 - 40,
    });
    addSimNode(type, finalPosition);
  }, [screenToFlowPosition, addSimNode]);

  // ── History context value ─────────────────────────────────────────────────
  const historyValue = useMemo(() => ({
    takeSnapshot, undo, redo, canUndo, canRedo,
  }), [takeSnapshot, undo, redo, canUndo, canRedo]);

  const selectedNode = selectedNodeIds.length === 1
    ? (nodes.find((n) => n.id === selectedNodeIds[0]) as Node<any> | undefined)
    : null;

  return (
    <HistoryProvider value={historyValue}>
      <div className="flex h-[100dvh] bg-[hsl(220_14%_8%)] overflow-hidden relative">

        {/* ── Undo / Redo ─────────────────────────────────────────────────── */}
        <UndoRedoControls
          canUndo={canUndo} canRedo={canRedo}
          onUndo={undo} onRedo={redo}
        />

        {/* ── Add Component button ─────────────────────────────────────────── */}
        <div className="absolute top-4 left-4 z-30">
          <button
            id="add-component-btn"
            onClick={() => {
              setShowPalette((v) => !v);
              setShowMenu(false);
            }}
            className={`group flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-[13px] font-black tracking-wide uppercase border transition-all duration-300 shadow-xl backdrop-blur-xl ${
              showPalette
                ? 'bg-sky-500 border-sky-400 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] scale-[1.02]'
                : 'bg-[hsl(220_14%_10%)]/95 border-white/10 text-white/50 hover:text-white/90 hover:bg-white/5 hover:scale-[1.02] active:scale-95'
            }`}
          >
            <div className={`transition-transform duration-300 ${showPalette ? 'rotate-45' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span className="hidden sm:inline">Components</span>
          </button>

          <AnimatePresence>
            {showPalette && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute top-12 left-0 z-50 origin-top-left w-64 h-[calc(100vh-160px)] bg-[hsl(220,14%,11%)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              >
                <ComponentPalette
                  onAddComponent={onAddComponent}
                  onDragStart={onDragStart}
                  onClose={() => setShowPalette(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ActionsMenu
          showMenu={showMenu}
          onToggle={() => {
            setShowMenu((v) => !v);
            setShowPalette(false);
          }}
          onSave={handleSave}
          onImport={(e) => {
            const fileInput = (e.target as HTMLInputElement);
            handleImport(e, { current: fileInput });
          }}
          onClear={() => { 
            resetCanvas(() => setSelectedNodeIds([])); 
            setCurrentDesignId(null);
            setCurrentDesignName('');
            setShowMenu(false); 
          }}
          onLoadPreset={(presetData) => {
            loadPreset(presetData);
            setShowMenu(false);
          }}
          user={user}
          onSignIn={loginWithGoogle}
          onSignOut={logout}
          onSaveCloud={saveToCloud}
          onLoadCloud={loadFromCloud}
          onDeleteCloud={deleteFromCloud}
          cloudDesigns={cloudDesigns}
          cloudDesignsLimit={MAX_CLOUD_DESIGNS}
        />

        {/* ── Top-center toolbar ───────────────────────────────────────────── */}
        <CanvasToolbar
          appMode={appMode}
          onSetMode={setAppMode}
          textMode={textMode}
          onToggleTextMode={() => {
            setTextMode((v) => !v);
            if (!textMode) {
              setSelectionMode(false);
              setFrameMode(false);
            }
          }}
          frameMode={frameMode}
          onToggleFrameMode={() => {
            setFrameMode((v) => !v);
            if (!frameMode) {
              setSelectionMode(false);
              setTextMode(false);
            }
          }}
          selectionMode={selectionMode}
          onToggleSelectionMode={() => {
            setSelectionMode((v) => !v);
            if (!selectionMode) {
              setTextMode(false);
              setFrameMode(false);
            }
          }}
        />

        {/* ── Welcome Overlay ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {nodes.length === 0 && (
            <WelcomeOverlay
              onOpen={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => handleImport(e as any, { current: input as any });
                input.click();
              }}
              onLoadPreset={loadPreset}
            />
          )}
        </AnimatePresence>

        {/* ── ReactFlow canvas ─────────────────────────────────────────────── */}
        <SimulatorCanvas
          ref={flowContainerRef}
          displayNodes={displayNodes}
          displayEdges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDragStart={onNodeDragStart}
          onPaneClick={onPaneClick}
          onInit={onInit}
          onMoveEnd={onMoveEnd}
          onDrop={onDrop}
          onDragOver={onDragOver}
          forceSelection={selectionMode}
        />

        {/* ── Configuration Panels ────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedNodeIds.length === 1 && selectedNode && (
            <>
              {selectedNode.type === 'simNode' && (
                <div
                  className="absolute top-[68px] right-4 bottom-4 z-40 w-72 rounded-2xl border border-white/10 bg-[hsl(220_14%_11%)]/95 backdrop-blur-2xl shadow-2xl ring-1 ring-white/5 animate-in slide-in-from-right-2 fade-in duration-200 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <NodeConfigPanel
                    node={selectedNode as Node<SimNodeData>}
                    edges={edges}
                    allNodes={nodes}
                    onClose={() => setSelectedNodeIds([])}
                    onUpdate={updateNodeConfig}
                    onDelete={(id) => deleteNode(id, () => setSelectedNodeIds([]))}
                    onUpdateEdgePct={updateEdgePct}
                    onUpdateEdgeOutRate={updateEdgeOutRate}
                  />
                </div>
              )}
              {selectedNode.type === 'textNode' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute top-20 left-6 z-40"
                >
                  <TextConfigPanel
                    node={selectedNode}
                    onClose={() => setSelectedNodeIds([])}
                  />
                </motion.div>
              )}
              {selectedNode.type === 'frameNode' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute top-20 left-6 z-40"
                >
                  <FrameConfigPanel
                    node={selectedNode}
                    onClose={() => setSelectedNodeIds([])}
                  />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* ── Drag overlay ─────────────────────────────────────────────────── */}
        {isDragging && pointerPos && (
          <div
            className="fixed pointer-events-none z-[100] opacity-50"
            style={{ left: pointerPos.x - 20, top: pointerPos.y - 20 }}
          >
            <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center">
              <span className="text-white font-bold">{dragType?.[0].toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>
    </HistoryProvider>
  );
}
