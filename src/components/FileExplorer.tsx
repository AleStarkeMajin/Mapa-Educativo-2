import React, {
  useMemo,
  // useCallback
} from "react";
import { NodeType, NodeStatus, DiffStatus } from "../types";
import type { MindMapNode } from "../types";

interface FileExplorerProps {
  nodes: MindMapNode[];
  baselineNodes?: MindMapNode[];
  isOpen: boolean;
  onClose: () => void;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  onSelectNode: (node: MindMapNode) => void;
  currentNodeId: string | null;
  selectedNodeId: string | null;
  diffMode?: boolean;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  nodes,
  baselineNodes = [],
  isOpen,
  onClose,
  expandedFolders,
  onToggleFolder,
  onSelectNode,
  currentNodeId,
  selectedNodeId,
  diffMode = false,
}) => {
  const prereqSet = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach((n) => n.prerequisites.forEach((p) => set.add(p)));
    return set;
  }, [nodes]);

  const arePrerequisitesEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  const getDiffStatus = (node: MindMapNode): DiffStatus => {
    if (!diffMode) return DiffStatus.NONE;
    const base = baselineNodes.find((b) => b.id === node.id);
    if (!base) return DiffStatus.ADDED;

    const isModified =
      base.label !== node.label ||
      base.description !== node.description ||
      base.content !== node.content ||
      !arePrerequisitesEqual(base.prerequisites, node.prerequisites);

    if (isModified) return DiffStatus.MODIFIED;
    return DiffStatus.NONE;
  };

  const renderTree = (parentId: string | null, depth = 0) => {
    // Collect nodes from current set
    const currentItems = nodes.filter((n) => n.parentId === parentId);

    // In diff mode, we also need to see what was DELETED from baseline
    const deletedInBaseline = diffMode
      ? baselineNodes.filter(
          (b) => b.parentId === parentId && !nodes.some((n) => n.id === b.id),
        )
      : [];

    const allItems = [
      ...currentItems,
      ...deletedInBaseline.map((b) => ({ ...b, _deleted: true })),
    ];

    allItems.sort((a: any, b: any) => {
      if (a._deleted && !b._deleted) return 1;
      if (!a._deleted && b._deleted) return -1;
      const isConnectedA = a.prerequisites.length > 0 || prereqSet.has(a.id);
      const isConnectedB = b.prerequisites.length > 0 || prereqSet.has(b.id);
      if (isConnectedA && !isConnectedB) return -1;
      if (!isConnectedA && isConnectedB) return 1;
      return a.label.localeCompare(b.label);
    });

    return allItems.map((node: any) => {
      const isParent = node.type === NodeType.PARENT;
      const isExpanded = expandedFolders.has(node.id);
      const isCurrent = node.id === currentNodeId || node.id === selectedNodeId;
      const diffStatus = node._deleted
        ? DiffStatus.DELETED
        : getDiffStatus(node);

      let colorClass = "text-slate-600";
      let bgClass = isCurrent
        ? "bg-indigo-50 border-r-4 border-indigo-500"
        : "hover:bg-slate-50";
      let iconColor = isCurrent ? "text-indigo-500" : "text-slate-400";
      let diffIcon = null;

      if (diffStatus === DiffStatus.ADDED) {
        colorClass = "text-emerald-700 font-bold";
        bgClass = isCurrent
          ? "bg-emerald-50 border-r-4 border-emerald-500"
          : "hover:bg-emerald-50/50";
        iconColor = "text-emerald-500";
        diffIcon = (
          <i className="fas fa-plus-circle text-[8px] text-emerald-500 ml-1"></i>
        );
      } else if (diffStatus === DiffStatus.MODIFIED) {
        colorClass = "text-amber-700 font-bold";
        bgClass = isCurrent
          ? "bg-amber-50 border-r-4 border-amber-500"
          : "hover:bg-amber-50/50";
        iconColor = "text-amber-500";
        diffIcon = (
          <i className="fas fa-circle-notch text-[8px] text-amber-500 ml-1"></i>
        );
      } else if (diffStatus === DiffStatus.DELETED) {
        colorClass = "text-red-400 line-through italic";
        bgClass = "opacity-60 bg-red-50/20";
        iconColor = "text-red-300";
        diffIcon = (
          <i className="fas fa-minus-circle text-[8px] text-red-400 ml-1"></i>
        );
      }

      return (
        <div key={node.id} className="flex flex-col">
          <div
            onClick={() => {
              if (!node._deleted)
                isParent ? onToggleFolder(node.id) : onSelectNode(node);
            }}
            className={`flex items-center gap-2 py-2 px-3 cursor-pointer transition-colors group ${bgClass}`}
            style={{ paddingLeft: `${depth * 1.25 + 1}rem` }}
          >
            <i
              className={`fas ${isParent ? (isExpanded ? "fa-folder-open" : "fa-folder") : "fa-file-alt"} ${iconColor} text-sm`}
            ></i>
            <span className={`text-xs flex-1 truncate ${colorClass}`}>
              {node.label}
              {diffIcon}
            </span>
            {!node._deleted && (
              <div
                className={`w-2 h-2 rounded-full ${node.status === NodeStatus.COMPLETED ? "bg-emerald-500" : node.status === NodeStatus.IN_PROGRESS ? "bg-amber-500" : "bg-slate-200"}`}
              ></div>
            )}
          </div>
          {isParent && isExpanded && renderTree(node.id, depth + 1)}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-[60] flex flex-col shadow-xl animate-in slide-in-from-left duration-300">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex flex-col">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
            <i className="fas fa-archive text-indigo-500"></i>
            Archivero
          </h3>
          {diffMode && (
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
              Vista de Diferencias Activa
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {renderTree(null)}
      </div>
    </div>
  );
};

export default FileExplorer;
