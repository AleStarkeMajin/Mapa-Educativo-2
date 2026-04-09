import React, { useState } from "react";
import type { MindMapNode } from "../types";

interface FullContentOverlayProps {
  node: MindMapNode;
  onClose: () => void;
  onNextLesson: () => void;
}

const FullContentOverlay: React.FC<FullContentOverlayProps> = ({
  node,
  onClose,
  onNextLesson,
}) => {
  // Estado para rastrear qué soluciones están visibles
  const [visibleSolutions, setVisibleSolutions] = useState<
    Record<number, boolean>
  >({});

  const toggleSolution = (index: number) => {
    setVisibleSolutions((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Función para procesar el texto y renderizar bloques de solución
  const renderContent = (content: string) => {
    if (!content)
      return "No hay contenido detallado registrado para este tema.";

    const parts = content.split(/(\[SOLUCION\][\s\S]*?\[\/SOLUCION\])/g);

    return parts.map((part, index) => {
      if (part.startsWith("[SOLUCION]") && part.endsWith("[/SOLUCION]")) {
        const solutionText = part
          .replace("[SOLUCION]", "")
          .replace("[/SOLUCION]", "")
          .trim();
        const isVisible = visibleSolutions[index];

        return (
          <div
            key={index}
            className="my-6 border-2 border-dashed border-emerald-200 rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => toggleSolution(index)}
              className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-700 font-bold text-sm"
            >
              <div className="flex items-center gap-2">
                <i
                  className={`fas ${isVisible ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
                {isVisible
                  ? "Ocultar Solución Paso a Paso"
                  : "Ver Solución y Explicación"}
              </div>
              <i
                className={`fas ${isVisible ? "fa-chevron-up" : "fa-chevron-down"} text-xs opacity-50`}
              ></i>
            </button>
            {isVisible && (
              <div className="p-6 bg-white border-t border-emerald-100 animate-in slide-in-from-top duration-300">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-6 h-6 rounded bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-[10px]">
                    <i className="fas fa-lightbulb"></i>
                  </div>
                  <h4 className="font-bold text-emerald-800 text-sm">
                    Explicación del Proceso
                  </h4>
                </div>
                <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {solutionText}
                </div>
              </div>
            )}
          </div>
        );
      }

      // Renderizar texto normal (bloques de teoría y código)
      return (
        <div key={index} className="whitespace-pre-wrap">
          {part}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-20 z-40 bg-slate-50 animate-in slide-in-from-bottom duration-500 flex flex-col">
      <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all text-sm font-bold"
            title="Volver al mapa"
          >
            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
            Volver al Mapa
          </button>
          <div className="h-4 w-px bg-slate-200 mx-2"></div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-book-open text-indigo-500"></i>
              {node.label}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden md:block">
            Modo Estudio
          </span>
          <div
            className={`w-2 h-2 rounded-full animate-pulse bg-indigo-500`}
          ></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <article className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-14 mb-20">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
              {node.label}
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed italic border-l-4 border-indigo-500 pl-6 py-2 bg-slate-50/50 rounded-r-xl">
              {node.description}
            </p>
          </div>

          <div className="prose prose-slate prose-lg max-w-none text-slate-700 leading-loose text-base">
            {renderContent(node.content || "")}
          </div>

          <div className="mt-20 pt-12 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-4">
              <i className="fas fa-graduation-cap"></i>
              ¿Dominas este tema?
            </div>
            <p className="text-slate-400 text-sm mb-8">
              Al marcar como completado, avanzaremos automáticamente al
              siguiente punto de tu ruta.
            </p>
            <button
              onClick={onNextLesson}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 mx-auto"
            >
              <span>Finalizar y Siguiente Tema</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </article>
      </main>
    </div>
  );
};

export default FullContentOverlay;
