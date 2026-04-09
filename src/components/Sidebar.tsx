import React from "react";
import { NodeType, NodeStatus } from "../types";
import type { MindMapNode } from "../types";

interface SidebarProps {
  selectedNode: MindMapNode | null;
  allNodes: MindMapNode[];
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: NodeStatus) => void;
  onShowFullContent: () => void;
  onNavigateToNode: (id: string) => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedNode,
  allNodes,
  canEdit,
  onEdit,
  onDelete,
  onStatusChange,
  onShowFullContent,
  onNavigateToNode,
  onClose,
}) => {
  if (!selectedNode || selectedNode.type !== NodeType.CHILD) return null;

  // Function to calculate rank for sorting based on prerequisite depth
  const getGlobalRank = (
    node: MindMapNode,
    visited = new Set<string>(),
  ): number => {
    if (visited.has(node.id)) return 0;
    visited.add(node.id);
    if (!node.prerequisites || node.prerequisites.length === 0) return 0;
    return (
      1 +
      Math.max(
        ...node.prerequisites.map((id) => {
          const preNode = allNodes.find((n) => n.id === id);
          return preNode ? getGlobalRank(preNode, visited) : 0;
        }),
      )
    );
  };

  // Type predicate filter to prevent parsing ambiguity
  const sortedPrerequisites = selectedNode.prerequisites
    .map((id) => allNodes.find((n) => n.id === id))
    .filter((n): n is MindMapNode => n !== undefined && n !== null)
    .sort((a, b) => getGlobalRank(a) - getGlobalRank(b));

  const hasContent =
    selectedNode.content && selectedNode.content.trim().length > 0;

  return (
    <aside className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 transition-colors"
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="flex justify-between items-start mb-4 pr-8">
          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
            Concepto / Lección
          </span>
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                onClick={onDelete}
                className="text-slate-400 hover:text-red-600 p-1 transition-colors"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 break-words leading-tight">
          {selectedNode.label}
        </h2>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-8 scrollbar-thin">
        <section>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Tu Progreso
          </h3>
          <div className="flex flex-col gap-2">
            {(Object.values(NodeStatus) as NodeStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between border ${
                  selectedNode.status === status
                    ? status === NodeStatus.COMPLETED
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100"
                      : status === NodeStatus.IN_PROGRESS
                        ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100"
                        : "bg-slate-700 text-white border-slate-700 shadow-lg shadow-slate-100"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span>
                  {status === NodeStatus.COMPLETED
                    ? "Aprendido"
                    : status === NodeStatus.IN_PROGRESS
                      ? "En Proceso"
                      : "Pendiente"}
                </span>
                {selectedNode.status === status && (
                  <i className="fas fa-check-circle text-xs opacity-70"></i>
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Descripción
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 border-dashed">
            {selectedNode.description || "Sin descripción."}
          </p>
        </section>

        {sortedPrerequisites.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Requisitos Previos
              </h3>
              <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                {sortedPrerequisites.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {sortedPrerequisites.map((pre) => (
                <button
                  key={pre.id}
                  onClick={() => onNavigateToNode(pre.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all group"
                  title={`Navegar a ${pre.label}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      pre.status === NodeStatus.COMPLETED
                        ? "bg-emerald-500"
                        : pre.status === NodeStatus.IN_PROGRESS
                          ? "bg-amber-500"
                          : "bg-slate-300"
                    }`}
                  ></div>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-700 truncate w-full group-hover:text-indigo-600 transition-colors">
                      {pre.label}
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-tighter">
                      {pre.status === NodeStatus.COMPLETED
                        ? "Completado"
                        : pre.status === NodeStatus.IN_PROGRESS
                          ? "En curso"
                          : "Pendiente"}
                    </span>
                  </div>
                  <i className="fas fa-link text-[10px] text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"></i>
                </button>
              ))}
            </div>
          </section>
        )}

        {hasContent && (
          <button
            onClick={onShowFullContent}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transform active:scale-95 transition-all mt-4"
          >
            <i className="fas fa-book-open"></i> Ver lección completa
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
