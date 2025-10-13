"use client";

import * as React from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MarkerType,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getEventLabel } from "@/lib/analytics/posthog/journeys";

interface JourneyStep {
  eventName: string;
  eventLabel: string;
  userCount: number;
  completionRate: number;
  dropOffRate: number;
}

interface JourneyFlowDiagramProps {
  steps: JourneyStep[];
  totalStarted: number;
  className?: string;
}

export function JourneyFlowDiagram({
  steps,
  totalStarted,
  className,
}: JourneyFlowDiagramProps) {
  // Create nodes from steps
  const nodes: Node[] = steps.map((step, index) => {
    const completionRate = step.completionRate;
    const dropOffRate = step.dropOffRate;

    // Color based on completion rate
    let bgColor = "bg-green-100 border-green-500";
    if (completionRate < 25) bgColor = "bg-red-100 border-red-500";
    else if (completionRate < 50) bgColor = "bg-orange-100 border-orange-500";
    else if (completionRate < 75) bgColor = "bg-yellow-100 border-yellow-500";

    return {
      id: `step-${index}`,
      type: "default",
      position: { x: index * 250, y: 0 },
      data: {
        label: (
          <div className="text-center space-y-1">
            <div className="font-semibold text-sm">{step.eventLabel}</div>
            <div className="text-xs text-muted-foreground">
              {step.userCount.toLocaleString()} users
            </div>
            <div className="text-xs font-medium">
              {completionRate.toFixed(1)}% complete
            </div>
            {index > 0 && dropOffRate > 0 && (
              <div className="text-xs text-red-600">
                {dropOffRate.toFixed(1)}% drop-off
              </div>
            )}
          </div>
        ),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        minWidth: 180,
      },
      className: bgColor,
    };
  });

  // Create edges between nodes
  const edges: Edge[] = steps.slice(0, -1).map((step, index) => {
    const nextStep = steps[index + 1];
    const retentionRate = (nextStep.userCount / step.userCount) * 100;

    return {
      id: `edge-${index}`,
      source: `step-${index}`,
      target: `step-${index + 1}`,
      type: "smoothstep",
      animated: true,
      label: `${retentionRate.toFixed(0)}%`,
      labelStyle: { fill: "hsl(var(--foreground))", fontSize: 12 },
      labelBgStyle: { fill: "hsl(var(--background))" },
      style: {
        stroke: "hsl(var(--primary))",
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "hsl(var(--primary))",
      },
    };
  });

  return (
    <div className={className} style={{ height: 300 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        panOnDrag={false}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
