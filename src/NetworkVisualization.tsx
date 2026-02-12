import React, { useEffect, useRef, useState } from "react";
import ForceGraph from "force-graph";
import { Person, ConnectionType } from "./types";

interface NetworkVisualizationProps {
  people: Person[];
  showConnections: boolean;
  onNodeClick?: (personId: string) => void;
  onAddConnection?: (personA: Person, personB: Person) => void;
}

interface NodeData {
  id: string;
  name: string;
  val?: number;
  color?: string;
  x?: number;
  y?: number;
}

interface LinkData {
  source: string | NodeData;
  target: string | NodeData;
  connectionType: ConnectionType;
  strength: number;
}

interface GraphDataType {
  nodes: NodeData[];
  links: LinkData[];
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  people,
  showConnections,
  onNodeClick,
  onAddConnection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<GraphDataType>({
    nodes: [],
    links: [],
  });
  const [connectionMode, setConnectionMode] = useState(false);
  const [selectedNodeInMode, setSelectedNodeInMode] = useState<string | null>(
    null,
  );
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  // Build graph data from people and connections
  useEffect(() => {
    const nodes: NodeData[] = people.map((person) => {
      const connectionCount = person.connections.length;
      return {
        id: person.id,
        name: person.name,
        val: 8 + connectionCount * 2,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      };
    });

    const links: LinkData[] = [];
    const seenPairs = new Set<string>();

    people.forEach((person) => {
      person.connections.forEach((conn) => {
        const pairKey = [person.id, conn.personId].sort().join("-");

        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          links.push({
            source: person.id,
            target: conn.personId,
            connectionType: conn.connectionType,
            strength: conn.strength,
          });
        }
      });
    });

    setGraphData({ nodes, links });
  }, [people]);

  // Initialize force graph
  useEffect(() => {
    if (
      !containerRef.current ||
      !showConnections ||
      graphData.nodes.length === 0
    ) {
      return;
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const ForceGraphConstructor = ForceGraph as unknown as typeof ForceGraph;
    const graph = new (ForceGraphConstructor as any)(containerRef.current)
      .graphData(graphData)
      .width(width)
      .height(height)
      .nodeCanvasObject((node: NodeData, ctx: CanvasRenderingContext2D) => {
        const size = (node.val || 10) / 2;

        ctx.fillStyle = node.color || "#4cc9f0";
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI);
        ctx.fill();

        // Draw border if selected in connection mode
        if (connectionMode && node.id === selectedNodeInMode) {
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Draw name
        ctx.fillStyle = "#e6eef8";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const displayName =
          node.name && node.name.length > 15
            ? node.name.substring(0, 12) + "..."
            : node.name || "";
        ctx.fillText(displayName, node.x || 0, (node.y || 0) + size + 8);
      })
      .linkCanvasObject((link: LinkData, ctx: CanvasRenderingContext2D) => {
        const source = link.source as unknown as NodeData;
        const target = link.target as unknown as NodeData;

        if (!source.x || !source.y || !target.x || !target.y) return;

        const connectionType = link.connectionType;
        const strength = link.strength;

        // Color by type
        const colorMap: Record<ConnectionType, string> = {
          family: "#22c55e",
          school: "#3b82f6",
          work: "#f97316",
          neighborhood: "#a855f7",
          activity: "#ef4444",
          friendship: "#fbbf24",
        };

        ctx.strokeStyle = colorMap[connectionType] || "#64748b";
        ctx.lineWidth = Math.max(1, Math.min(strength / 2, 3));

        // Dashed for weak connections
        if (strength === 1) {
          ctx.setLineDash([5, 5]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        ctx.setLineDash([]);
      })
      .onNodeClick((node: NodeData) => {
        if (connectionMode) {
          if (!selectedNodeInMode) {
            setSelectedNodeInMode(node.id);
          } else if (selectedNodeInMode !== node.id) {
            const personA = people.find((p) => p.id === selectedNodeInMode)!;
            const personB = people.find((p) => p.id === node.id)!;
            onAddConnection?.(personA, personB);
            setConnectionMode(false);
            setSelectedNodeInMode(null);
          } else {
            setSelectedNodeInMode(null);
          }
        } else {
          onNodeClick?.(node.id);
        }
      })

      .onLinkHover((link: LinkData | null) => {
        if (link) {
          const source = link.source as unknown as NodeData;
          const target = link.target as unknown as NodeData;
          const connectionType = link.connectionType;
          const strength = link.strength;
          const personA = people.find((p) => p.id === source.id);
          const personB = people.find((p) => p.id === target.id);

          setTooltip({
            x: ((source.x || 0) + (target.x || 0)) / 2,
            y: ((source.y || 0) + (target.y || 0)) / 2,
            text: `${personA?.name} <-> ${personB?.name}\nType: ${connectionType}\nStrength: ${strength}/10`,
          });
        } else {
          setTooltip(null);
        }
      });

    graphRef.current = graph;

    const handleResize = () => {
      if (containerRef.current) {
        graph
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [
    showConnections,
    connectionMode,
    selectedNodeInMode,
    onNodeClick,
    onAddConnection,
  ]);

  if (!showConnections) {
    return (
      <div
        style={{
          padding: "1rem",
          textAlign: "center",
          color: "#8aa3c2",
        }}
      >
        <p>Toggle "Show Connections" to visualize the network</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "0.5rem" }}>
        <button
          onClick={() => {
            setConnectionMode(!connectionMode);
            if (connectionMode) {
              setSelectedNodeInMode(null);
            }
          }}
          style={{
            padding: "0.5rem 1rem",
            background: connectionMode ? "#fbbf24" : "#3b82f6",
            color: connectionMode ? "#000" : "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {connectionMode ? "✓ Connection Mode Active" : "+ Connection Mode"}
        </button>
      </div>

      <div
        className="network-visualization-container"
        style={{ position: "relative" }}
      >
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            background: "rgba(7, 11, 20, 0.5)",
            borderRadius: "8px",
          }}
        />

        {connectionMode && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "#fbbf24",
              color: "#000",
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: "bold",
              zIndex: 10,
            }}
          >
            {selectedNodeInMode
              ? "Click another person to connect"
              : "Click a person to start"}
          </div>
        )}

        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              background: "rgba(7, 11, 20, 0.95)",
              border: "1px solid #1d2a44",
              padding: "0.5rem 0.75rem",
              borderRadius: "4px",
              fontSize: "0.75rem",
              color: "#e6eef8",
              whiteSpace: "pre-line",
              pointerEvents: "none",
              zIndex: 5,
              transform: "translate(-50%, -100%)",
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
};
