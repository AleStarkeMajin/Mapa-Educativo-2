import React, { useState, useMemo, useRef, useEffect } from "react";
import type { MindMapNode, UserRole, PullRequest, User } from "../types";
import { NodeType } from "../types";

interface HeaderProps {
  nodes: MindMapNode[];
  user: User;
  role: UserRole;
  viewMode: "main" | "personal" | "review";
  mainVersion: number;
  userBaseVersion: number;
  hasUpdate: boolean;
  isDirty?: boolean;
  pendingPRs: PullRequest[];
  onSetViewMode: (mode: "main" | "personal") => void;
  onSetRole: (role: UserRole) => void;
  onFork: () => void;
  onUpdateFromMain: () => void;
  onPublishVersion?: () => void;
  onSubmitPR: () => void;
  onReviewPR: (pr: PullRequest) => void;
  breadcrumbs: MindMapNode[];
  onBreadcrumbClick: (id: string | null) => void;
  onSearchSelect: (node: MindMapNode) => void;
  onOpenExplorer: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  nodes,
  user,
  role,
  viewMode,
  mainVersion,
  userBaseVersion,
  hasUpdate,
  isDirty,
  pendingPRs,
  onSetViewMode,
  onSetRole,
  onFork,
  onUpdateFromMain,
  onPublishVersion,
  onSubmitPR,
  onReviewPR,
  breadcrumbs,
  onBreadcrumbClick,
  onSearchSelect,
  onOpenExplorer,
  onLogout,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showPRs, setShowPRs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const OWNER_EMAIL = "alejandro.starke@gmail.com";
  const isOwnerIdentity = user.emailOrPhone.toLowerCase() === OWNER_EMAIL;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
        setShowPRs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return nodes
      .filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [nodes, searchQuery]);

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-50 shadow-sm relative">
      <div className="flex items-center gap-6 overflow-hidden flex-1">
        <button
          onClick={onOpenExplorer}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all border border-slate-200 flex-shrink-0"
        >
          <i className="fas fa-bars"></i>
        </button>

        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col flex-shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${viewMode === "main" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}
              >
                {viewMode === "main" ? "Main" : "Personal"}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                v{viewMode === "main" ? mainVersion : userBaseVersion}
              </span>
            </div>
            <h1 className="text-sm font-bold text-slate-800 hidden md:block">
              KnowledgeNexus
            </h1>
          </div>

          <div className="h-8 w-px bg-slate-100 hidden md:block flex-shrink-0"></div>

          <nav className="hidden lg:flex items-center gap-1 text-xs font-bold overflow-hidden">
            <button
              onClick={() => onBreadcrumbClick(null)}
              className="text-slate-400 hover:text-indigo-600 px-2 py-1 rounded whitespace-nowrap"
            >
              Inicio
            </button>
            {breadcrumbs.map((n, i) => (
              <React.Fragment key={n.id}>
                <i className="fas fa-chevron-right text-[8px] text-slate-300 flex-shrink-0"></i>
                <button
                  onClick={() => onBreadcrumbClick(n.id)}
                  className={`px-2 py-1 rounded whitespace-nowrap ${i === breadcrumbs.length - 1 ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"}`}
                >
                  {n.label}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-6 relative" ref={searchRef}>
        <div
          className={`relative flex items-center transition-all duration-300 ${isSearchFocused ? "scale-105" : ""}`}
        >
          <i
            className={`fas fa-search absolute left-4 transition-colors ${isSearchFocused ? "text-indigo-500" : "text-slate-400"}`}
          ></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Buscar temas o conceptos..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 py-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
            {searchResults.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 text-xs">
                No hay resultados
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {searchResults.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      onSearchSelect(node);
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors group flex items-start gap-4"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${node.type === NodeType.PARENT ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"}`}
                    >
                      <i
                        className={`fas ${node.type === NodeType.PARENT ? "fa-folder" : "fa-file-alt"} text-sm`}
                      ></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {node.label}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {node.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0" ref={profileRef}>
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className={`w-11 h-11 rounded-2xl bg-slate-50 overflow-hidden border-2 transition-all flex items-center justify-center ${showProfile ? "border-indigo-500 scale-105 shadow-lg" : "border-white hover:border-slate-200 shadow-sm"}`}
          >
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              alt="Avatar"
              className="w-9 h-9 rounded-xl"
            />
            {(hasUpdate || (role === "owner" && isDirty)) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {showProfile && (
            <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-[32px] shadow-2xl border border-slate-100 py-4 z-[100] animate-in slide-in-from-top-2">
              <div className="px-6 py-4 border-b border-slate-50 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-xl bg-slate-50"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user.emailOrPhone}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-block text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${role === "owner" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {role === "owner" ? "Catedrático" : "Estudiante"}
                </span>
              </div>

              <div className="px-4 mb-4">
                <p className="px-2 mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Rama de Trabajo
                </p>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  <button
                    onClick={() => {
                      onSetViewMode("main");
                      setShowProfile(false);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all ${viewMode === "main" ? "bg-white text-indigo-600 shadow-md border border-indigo-50" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <i className="fas fa-network-wired"></i> Principal
                  </button>
                  <button
                    onClick={() => {
                      userBaseVersion > 0
                        ? onSetViewMode("personal")
                        : onFork();
                      setShowProfile(false);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all relative ${viewMode === "personal" ? "bg-white text-amber-600 shadow-md border border-amber-50" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <i className="fas fa-user-edit"></i>{" "}
                    {userBaseVersion > 0 ? "Mi Rama" : "Ramificar"}
                    {hasUpdate && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                  </button>
                </div>

                {role === "owner" && viewMode === "main" && isDirty && (
                  <button
                    onClick={() => {
                      onPublishVersion?.();
                      setShowProfile(false);
                    }}
                    className="w-full mt-2 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                  >
                    <i className="fas fa-rocket mr-2"></i> Publicar Versión
                  </button>
                )}

                {hasUpdate && viewMode === "personal" && (
                  <button
                    onClick={() => {
                      onUpdateFromMain();
                      setShowProfile(false);
                    }}
                    className="w-full mt-2 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                  >
                    <i className="fas fa-sync-alt mr-2"></i> Hay Actualizaciones
                  </button>
                )}

                {viewMode === "personal" && !hasUpdate && (
                  <button
                    onClick={() => {
                      onSubmitPR();
                      setShowProfile(false);
                    }}
                    className="w-full mt-2 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    <i className="fas fa-paper-plane mr-2"></i> Enviar al Mentor
                  </button>
                )}
              </div>

              <div className="px-2 space-y-1">
                {role === "owner" && (
                  <button
                    onClick={() => setShowPRs(!showPRs)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${showPRs ? "bg-indigo-50 text-indigo-600" : "text-slate-600"}`}
                  >
                    <div className="flex items-center gap-3">
                      <i className="fas fa-inbox text-indigo-400"></i>
                      Propuestas Pendientes
                    </div>
                    {pendingPRs.length > 0 && (
                      <span className="bg-red-500 text-white text-[8px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                        {pendingPRs.length}
                      </span>
                    )}
                  </button>
                )}

                {isOwnerIdentity && (
                  <button
                    onClick={() => {
                      onSetRole(role === "owner" ? "student" : "owner");
                      setShowProfile(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-600 transition-colors flex items-center gap-3"
                  >
                    <i className="fas fa-exchange-alt text-slate-400"></i>
                    Modo {role === "owner" ? "Estudiante" : "Catedrático"}
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-2xl text-xs font-bold text-red-600 transition-colors flex items-center gap-3"
                >
                  <i className="fas fa-sign-out-alt text-red-400"></i>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}

          {showPRs && role === "owner" && (
            <div className="absolute top-full right-[290px] mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-[110] animate-in slide-in-from-right-2">
              <h4 className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">
                Buzón de Entrada
              </h4>
              {pendingPRs.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 text-xs">
                  Todo al día
                </div>
              ) : (
                pendingPRs.map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => {
                      onReviewPR(pr);
                      setShowPRs(false);
                      setShowProfile(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex flex-col transition-colors border-b border-slate-50 last:border-0 group"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                      {pr.userName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(pr.timestamp).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
