// src/components/AddButtonEdge.tsx
import React from 'react';
import { EdgeProps, getStraightPath } from 'reactflow';

export interface OnAddNodePayload {
  id: string;
  source: string;
  target: string;
  centerX: number;
  centerY: number;
}

const AddButtonEdge = (props: EdgeProps) => {
  const [edgePath] = getStraightPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  });

  const centerX = (props.sourceX + props.targetX) / 2;
  const centerY = (props.sourceY + props.targetY) / 2;

  const onAddNode = props.data?.onAddNode as ((payload: OnAddNodePayload) => void) | undefined;

  return (
    <>
      <path
        id={props.id}
        style={props.style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={props.markerEnd}
      />
      <foreignObject x={centerX - 10} y={centerY - 10} width={20} height={20} style={{ overflow: 'visible' }}>
        <button
          style={{
            width: 20,
            height: 20,
            padding: 0,
            borderRadius: '50%',
            border: '1px solid #000',
            background: '#fff',
            cursor: 'pointer',
          }}
          onClick={() =>
            onAddNode &&
            onAddNode({
              id: props.id,
              source: props.source,
              target: props.target,
              centerX,
              centerY,
            })
          }
        >
          +
        </button>
      </foreignObject>
    </>
  );
};

export default AddButtonEdge;

