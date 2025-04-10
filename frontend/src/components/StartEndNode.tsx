// StartEndNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';

const StartEndNode = ({ data }: any) => {
  const isStart = data.label === 'Start Node';

  return (
    <div
      style={{
        width: 140,
        height: 50,
        borderRadius: 8,
        background: isStart ? '#a2fca2' : '#faa2a2',
        border: '2px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {isStart ? (
        // Provide a source handle for the Start node
        <Handle type="source" position={Position.Bottom} />
      ) : (
        // Provide a target handle for the End node
        <Handle type="target" position={Position.Top} />
      )}
      {data.label}
    </div>
  );
};

export default StartEndNode;
