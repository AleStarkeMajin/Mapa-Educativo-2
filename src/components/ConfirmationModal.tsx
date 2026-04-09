import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  type?: "danger" | "info";
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  type = "info",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in duration-200">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${type === "danger" ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"}`}
        >
          <i
            className={`fas ${type === "danger" ? "fa-exclamation-triangle" : "fa-question-circle"} text-2xl`}
          ></i>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl text-white font-bold transition-all shadow-lg ${type === "danger" ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
