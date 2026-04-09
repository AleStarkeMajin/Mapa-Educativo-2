import React from "react";
import type { MindMapNode } from "../types";

interface UpdatePreviewModalProps {
  isOpen: boolean;
  newVersion: number;
  changes: {
    added: MindMapNode[];
    modified: MindMapNode[];
    removed: MindMapNode[];
  };
  onConfirm: () => void;
  onCancel: () => void;
}

const UpdatePreviewModal: React.FC<UpdatePreviewModalProps> = ({
  isOpen,
  newVersion,
  changes,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const hasChanges =
    changes.added.length > 0 ||
    changes.modified.length > 0 ||
    changes.removed.length > 0;

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 bg-indigo-50/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <i className="fas fa-sync-alt text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                Actualizar a Versión {newVersion}
              </h3>
              <p className="text-sm text-slate-500 font-medium text-indigo-600">
                Sincronización con la rama principal
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {!hasChanges ? (
            <div className="py-12 text-center">
              <i className="fas fa-check-circle text-emerald-400 text-4xl mb-4"></i>
              <p className="text-slate-500">
                Tu rama ya está al día con la versión principal.
              </p>
            </div>
          ) : (
            <>
              {changes.added.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fas fa-plus-circle"></i> Temas Agregados (
                    {changes.added.length})
                  </h4>
                  <div className="space-y-2">
                    {changes.added.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3"
                      >
                        <i className="fas fa-file-alt text-emerald-500"></i>
                        <span className="text-xs font-bold text-emerald-900">
                          {n.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {changes.modified.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fas fa-pen-nib"></i> Contenido Actualizado (
                    {changes.modified.length})
                  </h4>
                  <div className="space-y-2">
                    {changes.modified.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3"
                      >
                        <i className="fas fa-edit text-blue-500"></i>
                        <span className="text-xs font-bold text-blue-900">
                          {n.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {changes.removed.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fas fa-trash-alt"></i> Temas Obsoletos (
                    {changes.removed.length})
                  </h4>
                  <div className="space-y-2">
                    {changes.removed.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 opacity-70"
                      >
                        <i className="fas fa-minus-circle text-red-500"></i>
                        <span className="text-xs font-bold text-red-900 line-through">
                          {n.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              <i className="fas fa-info-circle mr-1 text-indigo-500"></i>
              Tus temas personalizados y tu progreso de aprendizaje
              (Completado/En proceso) se mantendrán intactos tras la
              actualización.
            </p>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-all"
          >
            Mantener mi versión
          </button>
          <button
            onClick={onConfirm}
            disabled={!hasChanges}
            className="flex-[2] px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
          >
            Aplicar Actualizaciones
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePreviewModal;
