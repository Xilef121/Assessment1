// src/components/WorkflowNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';

interface WorkflowNodeProps {
  id: string;
  data: {
    label: string;
    canDelete?: boolean;
  };
}

const WorkflowNode = ({ data }: WorkflowNodeProps) => {
  return (
    <div
      style={{
        width: 140,
        height: 50,
        borderRadius: 8,
        background: '#fff',
        border: '2px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Incoming handle */}
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      {data.label}
      {/* Outgoing handle */}
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

export default WorkflowNode;
