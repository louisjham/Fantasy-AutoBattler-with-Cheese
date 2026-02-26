import React, { useState } from 'react';
import { useGameStore } from '../store';
import { FloorNode } from '../types';

interface NodeMapProps {
  onNodeSelect: (type: string) => void;
}

export default function NodeMap({ onNodeSelect }: NodeMapProps) {
  const { floor, currentNodeMap, currentNodeIndex, setCurrentNode, completeNode, difficulty } = useGameStore();
  const [showRestModal, setShowRestModal] = useState(false);

  const currentNode = currentNodeMap[currentNodeIndex];

  // Find available nodes (nodes that are nextNodes of the current node, or the current node if it's the start and not completed)
  let availableNodeIds: string[] = [];
  if (currentNode && !currentNode.completed) {
    availableNodeIds = [currentNode.id];
  } else if (currentNode && currentNode.completed) {
    availableNodeIds = currentNode.nextNodes || [];
  }

  const handleNodeClick = (node: FloorNode) => {
    if (node.completed) return;
    if (!availableNodeIds.includes(node.id)) return;

    setCurrentNode(node.id);

    if (node.type === 'rest') {
      setShowRestModal(true);
    } else {
      onNodeSelect(node.type);
    }
  };

  const handleRestChoice = () => {
    if (currentNode) {
      completeNode(currentNode.id);
    }
    setShowRestModal(false);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'combat': return '#FF4422';
      case 'elite': return '#FF8800';
      case 'shop': return '#FFCC00';
      case 'event': return '#2244FF';
      case 'rest': return '#33AA44';
      case 'boss': return '#9922CC';
      default: return '#FFFFFF';
    }
  };

  // Group nodes by depth for layout
  const maxDepth = Math.max(...currentNodeMap.map(n => n.depth));
  const nodesByDepth: FloorNode[][] = Array.from({ length: maxDepth + 1 }, () => []);
  currentNodeMap.forEach(n => nodesByDepth[n.depth].push(n));

  return (
    <div className="w-full h-full min-h-[600px] bg-[#0D0D0D] relative flex flex-col items-center p-6 font-sans overflow-y-auto">
      <div className="text-center mb-8 z-10">
        <h2 className="text-2xl text-white tracking-widest" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          FLOOR {floor}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <p className="text-zinc-500 text-sm">{currentNodeMap[0]?.biome || 'Unknown Biome'}</p>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-sm text-black" style={{ backgroundColor: difficulty === 'easy' ? '#FFCC00' : difficulty === 'hard' ? '#FF4422' : '#2244FF' }}>
            {difficulty.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="relative flex-1 w-full max-w-2xl flex flex-col-reverse justify-between items-center py-10">
        {/* SVG for lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {currentNodeMap.map(node => {
            if (!node.nextNodes) return null;
            return node.nextNodes.map(nextId => {
              const nextNode = currentNodeMap.find(n => n.id === nextId);
              if (!nextNode) return null;

              // Calculate positions (rough approximation based on flex layout)
              const startY = 100 - (node.depth / maxDepth) * 100;
              const endY = 100 - (nextNode.depth / maxDepth) * 100;

              const startLayer = nodesByDepth[node.depth];
              const endLayer = nodesByDepth[nextNode.depth];

              const startX = 50 + ((startLayer.indexOf(node) - (startLayer.length - 1) / 2) * 20);
              const endX = 50 + ((endLayer.indexOf(nextNode) - (endLayer.length - 1) / 2) * 20);

              const isPathActive = node.completed && availableNodeIds.includes(nextNode.id);
              const isPathCompleted = node.completed && nextNode.completed;

              return (
                <line
                  key={`${node.id}-${nextId}`}
                  x1={`${startX}%`} y1={`${startY}%`}
                  x2={`${endX}%`} y2={`${endY}%`}
                  stroke={isPathCompleted ? '#555' : isPathActive ? '#888' : '#333'}
                  strokeWidth={isPathActive ? 3 : 2}
                  strokeDasharray={isPathActive ? "5,5" : "none"}
                />
              );
            });
          })}
        </svg>

        {/* Nodes */}
        {nodesByDepth.map((layer, d) => (
          <div key={d} className="flex justify-center gap-12 w-full z-10" style={{ marginBottom: d === maxDepth ? 0 : '40px' }}>
            {layer.map(node => {
              const isAvailable = availableNodeIds.includes(node.id);
              const isCurrent = currentNode?.id === node.id;
              const isLocked = !node.completed && !isAvailable;
              const color = getNodeColor(node.type);

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`relative flex items-center justify-center w-12 h-12 transition-all duration-300 ${isAvailable ? 'cursor-pointer hover:scale-110' : ''}`}
                  style={{
                    opacity: node.completed ? 0.5 : isLocked ? 0.2 : 1,
                    transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                    animation: isAvailable && !isCurrent ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  {/* Hexagon shape */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: '#1A1A1A',
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      border: `2px solid ${color}`,
                      boxShadow: isCurrent ? `0 0 15px ${color}` : 'none'
                    }}
                  />

                  {/* Inner color fill based on type */}
                  <div
                    className="absolute inset-1"
                    style={{
                      backgroundColor: color,
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      opacity: 0.2
                    }}
                  />

                  {/* Icon */}
                  <span className="z-10 text-xs font-bold" style={{ color }}>
                    {node.type === 'boss' ? '☠️' : node.type.substring(0, 1).toUpperCase()}
                  </span>

                  {node.completed && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 text-white text-xl">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Rest Modal */}
      {showRestModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-xl max-w-md w-full text-center space-y-6">
            <h3 className="text-2xl text-green-400 font-bold">Rest Site</h3>
            <p className="text-zinc-400">Take a moment to recover.</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleRestChoice}
                className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-green-900/50 text-white transition-colors"
              >
                Heal 30% HP
              </button>
              <button
                onClick={handleRestChoice}
                className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-indigo-900/50 text-white transition-colors"
              >
                Upgrade a Summon +1 Tier
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
      `}</style>
    </div>
  );
}
