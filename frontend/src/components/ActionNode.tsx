// src/components/ActionNode.tsx
import React from 'react';

interface ActionNodeProps {
  id: string;
  data: {
    label: string;
  };
}

const ActionNode = ({ data }: ActionNodeProps) => {
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
        textAlign: 'center',
      }}
    >
      {data.label}
    </div>
  );
};

export default ActionNode;
