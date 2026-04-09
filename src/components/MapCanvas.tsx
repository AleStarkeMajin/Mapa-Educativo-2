import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { MindMapNode } from "../types";
import { NodeType, NodeStatus } from "../types";
import { STATUS_COLORS } from "../constants";

interface MapCanvasProps {
  nodes: MindMapNode[];
  allNodes: MindMapNode[];
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  onNodeClick: (node: MindMapNode) => void;
  // Removed unused onNavigateToPrerequisite as it was causing type errors in App.tsx
  onBackgroundClick?: () => void;
}

const MapCanvas: React.FC<MapCanvasProps> = ({
  nodes,
  allNodes,
  selectedNodeId,
  focusedNodeId,
  onNodeClick,
  onBackgroundClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getParentStatus = (parentId: string): NodeStatus => {
    const children = allNodes.filter((n) => n.parentId === parentId);
    if (children.length === 0) return NodeStatus.TODO;

    const allCompleted = children.every((n) => {
      if (n.type === NodeType.PARENT)
        return getParentStatus(n.id) === NodeStatus.COMPLETED;
      return n.status === NodeStatus.COMPLETED;
    });
    if (allCompleted) return NodeStatus.COMPLETED;

    const anyInProgress = children.some((n) => {
      if (n.type === NodeType.PARENT)
        return getParentStatus(n.id) === NodeStatus.IN_PROGRESS;
      return (
        n.status === NodeStatus.IN_PROGRESS || n.status === NodeStatus.COMPLETED
      );
    });
    if (anyInProgress) return NodeStatus.IN_PROGRESS;

    return NodeStatus.TODO;
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;

    // SVGLength error often occurs when width/height are 0 or not yet resolved
    if (width <= 0 || height <= 0) {
      // Try to wait for next frame
      const timeout = setTimeout(() => {
        if (containerRef.current) {
          width = containerRef.current.clientWidth;
          height = containerRef.current.clientHeight;
          if (width > 0 && height > 0) render();
        }
      }, 50);
      return () => clearTimeout(timeout);
    }

    function render() {
      if (!svgRef.current || !containerRef.current) return;
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      // Create a container group for zooming/panning
      const g = svg.append("g");

      // Setup Zoom behavior
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoom);

      // Handle background click to close search
      svg.on("click", (event) => {
        if (event.target === svgRef.current && onBackgroundClick) {
          onBackgroundClick();
        }
      });

      // Rank calculation for hierarchical layout
      const getRank = (
        node: MindMapNode,
        visited = new Set<string>(),
      ): number => {
        if (visited.has(node.id)) return 0;
        visited.add(node.id);
        const internalPres = node.prerequisites.filter((id) =>
          nodes.some((n) => n.id === id),
        );
        if (internalPres.length === 0) return 0;
        return (
          1 +
          Math.max(
            ...internalPres.map((id) => {
              const preNode = nodes.find((n) => n.id === id)!;
              return getRank(preNode, visited);
            }),
          )
        );
      };

      const nodesWithRank = nodes.map((n) => ({ ...n, rank: getRank(n) }));
      const nodesByRank: Record<number, MindMapNode[]> = {};
      nodesWithRank.forEach((n) => {
        if (!nodesByRank[n.rank]) nodesByRank[n.rank] = [];
        nodesByRank[n.rank].push(n);
      });

      // Spacing: 107px is 2/3 of 160px
      const Y_SPACING = 107;
      const X_SPACING = 280;
      const NODE_WIDTH = 220;

      const layoutNodes = nodesWithRank.map((n) => {
        const rankNodes = nodesByRank[n.rank];
        const index = rankNodes.findIndex((rn) => rn.id === n.id);
        const totalInRank = rankNodes.length;
        return {
          ...n,
          x: (index - (totalInRank - 1) / 2) * X_SPACING + width / 2,
          y: n.rank * Y_SPACING + 100,
          currentStatus:
            n.type === NodeType.PARENT ? getParentStatus(n.id) : n.status,
        };
      });

      // Arrow marker defs
      svg
        .append("defs")
        .append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("orient", "auto")
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .append("svg:path")
        .attr("d", "M 0,-5 L 10 ,0 L 0,5")
        .attr("fill", "#94a3b8");

      const lineGenerator = d3
        .linkVertical()
        .x((d: any) => d.x)
        .y((d: any) => d.y);

      const links: any[] = [];
      nodes.forEach((node) => {
        node.prerequisites.forEach((preId) => {
          const target = layoutNodes.find((n) => n.id === node.id);
          const source = layoutNodes.find((n) => n.id === preId);
          if (source && target) links.push({ source, target });
        });
      });

      // Render Links
      g.append("g")
        .selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("d", (d: any) =>
          lineGenerator({ source: d.source, target: d.target }),
        )
        .attr("fill", "none")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrowhead)");

      // Render Nodes
      const nodeElements = g
        .append("g")
        .selectAll("g")
        .data(layoutNodes)
        .enter()
        .append("g")
        .attr("class", "cursor-pointer")
        .attr(
          "transform",
          (d: any) => `translate(${d.x - NODE_WIDTH / 2},${d.y - 35})`,
        )
        .on("click", (event, d) => {
          event.stopPropagation();
          onNodeClick(d);
        });

      nodeElements
        .append("foreignObject")
        .attr("width", NODE_WIDTH)
        .attr("height", 150)
        .append("xhtml:div")
        .attr(
          "class",
          (d: any) =>
            `flex items-center gap-3 p-4 rounded-2xl border-2 transition-all shadow-md overflow-hidden ${
              d.id === selectedNodeId
                ? "ring-4 ring-indigo-200 border-indigo-500 scale-105"
                : "border-white"
            }`,
        )
        .style("background-color", (d: any) =>
          d.currentStatus === NodeStatus.COMPLETED
            ? "#ecfdf5"
            : d.currentStatus === NodeStatus.IN_PROGRESS
              ? "#fffbeb"
              : "#ffffff",
        )
        .style(
          "border-color",
          (d: any) => STATUS_COLORS[d.currentStatus as NodeStatus],
        )
        .html(
          (d: any) => `
          <div class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white" style="background-color: ${STATUS_COLORS[d.currentStatus as NodeStatus]}">
              <i class="fas ${d.type === NodeType.PARENT ? "fa-folder" : "fa-file-alt"} text-xs"></i>
          </div>
          <div class="flex flex-col min-w-0 flex-1">
              <span class="font-bold text-xs text-slate-800 line-clamp-2 leading-tight">${d.label}</span>
              <span class="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">${d.type === NodeType.PARENT ? "Módulo" : "Tema"}</span>
          </div>
        `,
        );

      // Focus / Auto-centering logic with increased zoom level
      const targetId =
        focusedNodeId || (layoutNodes.length > 0 ? layoutNodes[0].id : null);
      if (targetId) {
        const target = layoutNodes.find((n) => n.id === targetId);
        if (target) {
          const scale = 1.4;
          const transform = d3.zoomIdentity
            .translate(
              width / 2 - target.x * scale,
              height / 2 - target.y * scale,
            )
            .scale(scale);

          svg.transition().duration(800).call(zoom.transform, transform);
        }
      }
    }

    render();

    // Responsive handling
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        width = containerRef.current.clientWidth;
        height = containerRef.current.clientHeight;
        if (width > 0 && height > 0) render();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [nodes, selectedNodeId, focusedNodeId, allNodes, onBackgroundClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-slate-50/30"
    >
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
      />
    </div>
  );
};

export default MapCanvas;
