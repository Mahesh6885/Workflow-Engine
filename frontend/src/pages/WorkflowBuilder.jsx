import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ReactFlow, Background, Controls, MiniMap, 
  useNodesState, useEdgesState, addEdge, BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Save, CheckCircle, Layers, Settings2, Plus, ArrowLeft } from 'lucide-react';
import StepNode from '../components/StepNode';
import api from '../api';

const nodeTypes = {
  customStep: StepNode,
};

export default function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (id === 'new') {
        setLoading(false);
        return;
    }
    
    api.get(`/workflows/${id}/`).then(data => {
      setWorkflow(data);
      const version = data.active_version_detail || data.versions?.[0];
      if (version && version.steps) {
        const initialNodes = version.steps.map(step => ({
          id: String(step.id),
          type: 'customStep',
          position: { x: step.position_x || 250, y: step.position_y || 100 },
          data: { ...step }
        }));

        const initialEdges = [];
        version.steps.forEach(step => {
          if (step.rules) {
            step.rules.forEach(rule => {
                if (rule.target_step) {
                    initialEdges.push({
                        id: `e${step.id}-${rule.target_step}`,
                        source: String(step.id),
                        target: String(rule.target_step),
                        label: rule.name,
                        type: 'smoothstep',
                        style: { stroke: '#475569', strokeWidth: 2 }
                    });
                }
            });
          }
        });

        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id, setNodes, setEdges]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ 
    ...params, 
    type: 'smoothstep', 
    style: { stroke: '#6366f1', strokeWidth: 2 } 
  }, eds)), [setEdges]);

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    try {
      await api.post(`/workflows/${id}/update_canvas/`, { nodes, edges });
      alert('Workflow saved successfully!');
    } catch (err) {
      alert('Save failed: ' + err);
    }
  };

  const handlePublish = async () => {
    try {
        await api.post(`/workflows/${id}/publish/`, { changelog: 'Updated via Builder' });
        alert('Published!');
        navigate('/workflows');
    } catch (err) {
        alert('Publish failed: ' + err);
    }
  };

  const handleAddStep = async (type) => {
    try {
      const res = await api.post(`/workflows/${id}/steps/`, {
        name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        step_type: type,
        config: {},
        position_x: 100,
        position_y: 100
      });
      
      const newNode = {
        id: String(res.id),
        type: 'customStep',
        position: { x: res.position_x, y: res.position_y },
        data: { ...res }
      };
      
      setNodes(nds => nds.concat(newNode));
    } catch (err) {
      alert('Failed to add step: ' + err);
    }
  };

  if (loading) return <div className="p-10 text-white">Loading Workflow...</div>;

  return (
    <div className="h-full flex flex-col w-full relative -m-6" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Builder Toolbar */}
      <div className="absolute top-4 left-6 right-6 z-10 glass-panel h-16 px-6 flex items-center justify-between border !border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/workflows')} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
               <h2 className="text-xl font-bold text-white tracking-tight leading-none text-shadow">{workflow?.name || 'New Workflow'}</h2>
               <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-warning/20 text-warning border border-warning/30">
                 {workflow?.status || 'Draft'}
               </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Version: {workflow?.active_version_detail?.version_number || 1}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="btn-secondary text-sm !border-white/10"><Save size={16} /> Save Changes</button>
          <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
          <button onClick={handlePublish} className="btn-success text-sm !py-1.5"><CheckCircle size={16} /> Publish</button>
          <button className="btn-primary text-sm shadow-primary/40" onClick={() => api.post(`/workflows/${id}/execute/`).then(() => navigate('/monitor'))}><Play size={16} fill="currentColor" /> Simulate</button>
        </div>
      </div>

      {/* Floating Action Menu for Steps */}
      <div className="absolute left-6 top-24 z-10 glass-panel p-2 flex flex-col gap-2">
         {['task', 'approval', 'condition', 'notification'].map(type => (
           <button 
            key={type} 
            onClick={() => handleAddStep(type)}
            className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors group" 
            title={`Add ${type}`}
           >
              <Plus size={20} className="group-hover:scale-125 transition-transform" />
           </button>
         ))}
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex-1 w-full bg-[#0B1120]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
        >
          <Background color="#1e293b" gap={24} size={2} variant={BackgroundVariant.Dots} />
          <Controls className="!bg-[#1e293b] !border-white/10 !fill-white" />
          <MiniMap className="!bg-[#0f172a] !border !border-white/5 !rounded-lg overflow-hidden" maskColor="rgba(15, 23, 42, 0.8)" nodeColor="#6366f1" />
        </ReactFlow>
      </div>

      {/* Side Settings Panel (Rule Builder UI) */}
      <div className={clsx(
        "absolute right-0 top-0 bottom-0 w-96 glass-panel border-r-0 border-y-0 !rounded-none transition-transform duration-300 z-20 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]",
        panelOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-surface/50">
          <h3 className="font-semibold text-white truncate pr-2">{selectedNode?.data?.name || 'Step Config'}</h3>
          <button onClick={() => setPanelOpen(false)} className="text-slate-400 hover:text-white pb-1 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
           <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-400">Step Name</label>
              <input type="text" className="input-field" defaultValue={selectedNode?.data?.name} />
           </div>

           {selectedNode?.data?.step_type === 'approval' && (
             <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-400">Assigned Role</label>
                <select className="input-field cursor-pointer">
                  <option>Manager</option>
                  <option>CEO</option>
                  <option>Finance Dept</option>
                </select>
             </div>
           )}

           {selectedNode?.data?.step_type === 'condition' && (
              <div className="glass-panel p-4 bg-slate-900/50">
                 <h4 className="text-sm font-semibold text-primary mb-3">Rule Evaluator (DSL)</h4>
                 <div className="space-y-3">
                   <div className="flex gap-2 text-xs">
                     <select className="bg-surface border-white/10 rounded px-2 w-1/3 text-white"><option>amount</option></select>
                     <select className="bg-surface border-white/10 rounded px-2 w-1/3 text-warning"><option>{'>'}</option></select>
                     <input className="input-field !py-1 !px-2 w-1/3 h-8" defaultValue="10000" />
                   </div>
                   <button className="text-primary text-xs w-full text-left font-medium">+ Add Condition (AND)</button>
                 </div>
              </div>
           )}

           <div className="pt-6 border-t border-white/10 space-y-4">
              <h4 className="text-sm font-medium text-slate-200">Advanced Config</h4>
              <div className="flex items-center gap-3 justify-between">
                 <span className="text-sm text-slate-400">Max Retries</span>
                 <input type="number" className="w-20 bg-surface border border-white/10 rounded px-2 py-1 text-white text-center" defaultValue="0" />
              </div>
              <div className="flex items-center gap-3 justify-between">
                 <span className="text-sm text-slate-400">Timeout (s)</span>
                 <input type="number" className="w-20 bg-surface border border-white/10 rounded px-2 py-1 text-white text-center" defaultValue="300" />
              </div>
           </div>
        </div>
        <div className="p-4 border-t border-white/10 flex gap-3 bg-surface/80">
           <button className="btn-secondary flex-1" onClick={() => setPanelOpen(false)}>Cancel</button>
           <button className="btn-primary flex-1">Save Config</button>
        </div>
      </div>
    </div>
  );
}
