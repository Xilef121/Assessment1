// src/components/IfElseNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';

interface IfElseNodeProps {
  id: string;
  data: {
    label: string;      // e.g. "If / Else Node"
    branches: string[]; // array of branch labels, e.g. ["Branch 1", "Branch 2", ...]
    elseLabel: string;  // label for the else branch, e.g. "Else"
    canDelete?: boolean;
  };
}

/**
 * This node:
 *  - Has one top handle (type="target") for the incoming connection(s).
 *  - Has multiple bottom handles (type="source")—one for each branch, plus one for Else.
 *    Each handle is horizontally spaced along the bottom, so the user can drag separate edges
 *    for each branch in the workflow.
 */
const IfElseNode = ({ data }: IfElseNodeProps) => {
  // The total number of bottom handles = data.branches.length + 1 (for Else).
  // We'll place them horizontally spaced along the node width (say 140px).
  const nodeWidth = 140; // match your typical node width
  const totalHandles = data.branches.length + 1;

  return (
    <div
      style={{
        width: nodeWidth,
        height: 70,
        borderRadius: 8,
        background: '#fff',
        border: '2px solid #333',
        position: 'relative',
        padding: '4px',
      }}
    >
      {/* One top handle for incoming edges */}
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

      {/* Main label (e.g. "If / Else Node") */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>
        {data.label}
      </div>

      {/* We display the branch labels, but the actual "branching" is done by multiple source handles. */}
      <div style={{ textAlign: 'center', fontSize: 12, color: '#666' }}>
        {data.branches.map((branch, idx) => branch).join(' | ')} 
        {` | ${data.elseLabel}`}
      </div>

      {/* Multiple bottom handles—one per branch plus one for else. */}
      {data.branches.map((branch, idx) => {
        // We'll space the handles along the bottom by dividing the node width into segments.
        const leftPercentage = ((idx + 1) / (totalHandles + 1)) * 100;
        return (
          <Handle
            key={`branch-${idx}`}
            type="source"
            position={Position.Bottom}
            id={`branch-${idx}`}   // unique ID for each branch handle
            style={{
              left: `${leftPercentage}%`,
              transform: 'translateX(-50%)',
              background: '#555',
            }}
          >
          </Handle>
        );
      })}

      {/* Else handle as the final source handle */}
      {(() => {
        const elseIndex = data.branches.length; // position for the else handle
        const leftPercentage = ((elseIndex + 1) / (totalHandles + 1)) * 100;
        return (
          <Handle
            key="else-handle"
            type="source"
            position={Position.Bottom}
            id="else"
            style={{
              left: `${leftPercentage}%`,
              transform: 'translateX(-50%)',
              background: '#555',
            }}
          />
        );
      })()}
    </div>
  );
};

export default IfElseNode;
