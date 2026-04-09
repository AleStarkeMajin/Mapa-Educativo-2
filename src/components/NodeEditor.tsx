import React, { useState, useEffect, useMemo } from "react";
import { NodeType, NodeStatus } from "../types";
import type { MindMapNode } from "../types";

interface NodeEditorProps {
  nodes: MindMapNode[];
  editingNode: MindMapNode | null;
  currentParentId: string | null;
  onSave: (data: Partial<MindMapNode>) => void;
  onClose: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({
  nodes,
  editingNode,
  currentParentId,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<MindMapNode>>({
    label: "",
    description: "",
    content: "",
    type: NodeType.CHILD,
    status: NodeStatus.TODO,
    parentId: currentParentId,
    prerequisites: [],
  });

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (editingNode) {
      setFormData(editingNode);
      // Auto-expand parents of prerequisites
      const newExpanded = new Set<string>();
      editingNode.prerequisites.forEach((preId) => {
        let node = nodes.find((n) => n.id === preId);
        while (node && node.parentId) {
          newExpanded.add(node.parentId);
          node = nodes.find((n) => n.id === node?.parentId);
        }
      });
      setExpandedFolders(newExpanded);
    }
  }, [editingNode, nodes]);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePrerequisite = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites?.includes(id)
        ? prev.prerequisites.filter((p) => p !== id)
        : [...(prev.prerequisites || []), id],
    }));
  };

  // Helper to calculate rank for sorting (similar to MapCanvas logic)
  const getRank = (node: MindMapNode, visited = new Set<string>()): number => {
    if (visited.has(node.id)) return 0;
    visited.add(node.id);
    if (node.prerequisites.length === 0) return 0;
    return (
      1 +
      Math.max(
        ...node.prerequisites.map((id) => {
          const preNode = nodes.find((n) => n.id === id);
          return preNode ? getRank(preNode, visited) : 0;
        }),
      )
    );
  };

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => getRank(a) - getRank(b));
  }, [nodes]);

  const renderTree = (parentId: string | null, depth = 0) => {
    // Filter nodes for the tree based on context
    const items = sortedNodes.filter((n) => n.parentId === parentId);

    // When creating a new node, only allow siblings at the current level
    if (!editingNode && parentId !== currentParentId && depth === 0) {
      const currentLevelItems = items.filter(
        (n) => n.parentId === currentParentId,
      );
      return currentLevelItems.map((node) => renderNodeItem(node, depth));
    }

    return items.map((node) => renderNodeItem(node, depth));
  };

  const renderNodeItem = (node: MindMapNode, depth: number) => {
    if (editingNode && node.id === editingNode.id) return null;

    const isParent = node.type === NodeType.PARENT;
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = formData.prerequisites?.includes(node.id);
    const hasChildren = nodes.some((n) => n.parentId === node.id);

    return (
      <div key={node.id} className="flex flex-col">
        <div
          className="flex items-center gap-2 py-1 px-2 hover:bg-slate-100 rounded transition-colors group"
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        >
          {/* File/Folder icon & Toggle */}
          <div className="flex items-center gap-1 min-w-[1.5rem]">
            {isParent && hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.id);
                }}
                className="text-slate-400 hover:text-slate-600 w-4 h-4 flex items-center justify-center"
              >
                <i
                  className={`fas ${isExpanded ? "fa-chevron-down" : "fa-chevron-right"} text-[10px]`}
                ></i>
              </button>
            ) : (
              <div className="w-4" />
            )}
            <i
              className={`fas ${isParent ? (isExpanded ? "fa-folder-open" : "fa-folder") : "fa-file-alt"} text-sm ${isParent ? "text-indigo-400" : "text-amber-400"}`}
            ></i>
          </div>

          {/* Label */}
          <span
            className={`text-xs flex-1 truncate ${isSelected ? "font-bold text-indigo-700" : "text-slate-600"}`}
          >
            {node.label}
          </span>

          {/* Checkbox selector */}
          <label className="flex items-center cursor-pointer p-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => togglePrerequisite(node.id)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>
        </div>

        {isParent && isExpanded && (
          <div className="flex flex-col">{renderTree(node.id, depth + 1)}</div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">
            {editingNode ? "Editar Tema" : "Nuevo Tema"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Título
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej. Regla de la Cadena"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Tipo de Nodo
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFormData({ ...formData, type: NodeType.PARENT })
                  }
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${formData.type === NodeType.PARENT ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  <i className="fas fa-folder mr-2"></i> Nivel
                </button>
                <button
                  onClick={() =>
                    setFormData({ ...formData, type: NodeType.CHILD })
                  }
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${formData.type === NodeType.CHILD ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-100" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  <i className="fas fa-file-alt mr-2"></i> Concepto
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Resumen / Descripción corta
            </label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none h-20"
              placeholder="¿De qué trata este tema?"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {formData.type === NodeType.CHILD && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Material de Estudio (Lección completa)
              </label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none h-40"
                placeholder="Escribe o pega aquí la información detallada..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {editingNode
                ? "Pre-requisitos (Estructura de Carpeta)"
                : "Pre-requisitos (Temas del Nivel Actual)"}
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto border-dashed border-2">
              {editingNode ? renderTree(null) : renderTree(currentParentId)}
              {(editingNode
                ? nodes
                : nodes.filter((n) => n.parentId === currentParentId)
              ).length === 0 && (
                <span className="text-[10px] text-slate-400">
                  No hay temas disponibles para seleccionar como pre-requisito.
                </span>
              )}
            </div>
            {!editingNode && (
              <p className="mt-2 text-[10px] text-slate-400">
                * Durante la creación solo puedes ver temas del mismo nivel.
                Edita el nodo después para ver toda la jerarquía.
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.label}
            className="flex-[2] px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200"
          >
            {editingNode ? "Confirmar Cambios" : "Crear Tema"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
