import React, { useState, useMemo, useCallback, useEffect } from "react";
import type { MindMapNode, UserRole, PullRequest, User } from "./types";
import { NodeStatus, NodeType } from "./types";
import { INITIAL_NODES } from "./constants";
import MapCanvas from "./components/MapCanvas";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import NodeEditor from "./components/NodeEditor";
import FullContentOverlay from "./components/FullContentOverlay";
import ConfirmationModal from "./components/ConfirmationModal";
import FileExplorer from "./components/FileExplorer";
import UpdatePreviewModal from "./components/UpdatePreviewModal";
import AuthModal from "./components/AuthModal";
import type { User as FirebaseAuthUser } from "firebase/auth";
import {
  db,
  handleFirestoreError,
  OperationType,
  auth,
  // signInAnonymously,
} from "./firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocFromServer,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// const STORAGE_AUTH = "nexus_auth_v2";

interface Toast {
  id: string;
  message: string;
  type: "success" | "warning" | "info";
}

const App: React.FC = () => {
  // --- Estado de Autenticación ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseAuthUser | null) => {
        setIsAuthReady(false);
        if (!fbUser) {
          setCurrentUser(null);
          setRole("student");
          setIsAuthReady(true);
          return;
        }

        setIsProfileLoading(true);
        const userRef = doc(db, "users", fbUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userData: User = {
              id: fbUser.uid,
              name: data.name || fbUser.displayName || "Usuario",
              emailOrPhone: data.email || data.emailOrPhone || "",
              role: (data.role as UserRole) || "student",
            };
            setCurrentUser(userData);
            setRole(userData.role);
          } else {
            const newProfile: User = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email || "Usuario",
              emailOrPhone: fbUser.email || "",
              role: "student",
            };
            try {
              await setDoc(userRef, newProfile, { merge: true });
              setCurrentUser(newProfile);
              setRole(newProfile.role);
            } catch (e) {
              console.error("Error creating user profile:", e);
              try {
                handleFirestoreError(
                  e,
                  OperationType.WRITE,
                  `users/${fbUser.uid}`,
                );
              } catch {
                /* guardamos el fallo en consola, no rompemos el listener */
              }
              setCurrentUser(null);
            }
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
          setCurrentUser(null);
        } finally {
          setIsProfileLoading(false);
          setIsAuthReady(true);
        }
      },
    );
    return () => unsubAuth();
  }, []);

  const [role, setRole] = useState<UserRole>("student");

  const [viewMode, setViewMode] = useState<"main" | "personal" | "review">(
    "main",
  );

  // --- Datos Globales ---
  const [mainNodes, setMainNodes] = useState<MindMapNode[]>(INITIAL_NODES);
  const [publishedNodes, setPublishedNodes] =
    useState<MindMapNode[]>(INITIAL_NODES);
  const [mainVersion, setMainVersion] = useState<number>(1);
  const [pendingPRs, setPendingPRs] = useState<PullRequest[]>([]);
  const [userNodes, setUserNodes] = useState<MindMapNode[] | null>(null);
  const [userBaseVersion, setUserBaseVersion] = useState<number>(1);

  // --- UI State ---
  const [activePR, setActivePR] = useState<PullRequest | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullContentOpen, setIsFullContentOpen] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [emptyNodePrompt, setEmptyNodePrompt] = useState<MindMapNode | null>(
    null,
  );
  const [updatePreviewData, setUpdatePreviewData] = useState<{
    added: MindMapNode[];
    modified: MindMapNode[];
    removed: MindMapNode[];
  } | null>(null);

  // --- Notifications & Confirmation State ---
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "info";
  } | null>(null);

  const addToast = useCallback(
    (message: string, type: "success" | "warning" | "info" = "success") => {
      const id = `toast-${Date.now()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    [],
  );

  // --- Firestore Sync ---
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, "metadata", "config"));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("the client is offline")
        ) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const unsubMain = onSnapshot(
      doc(db, "main_map", "nodes"),
      (snapshot) => {
        if (snapshot.exists()) {
          setMainNodes(snapshot.data().nodes || INITIAL_NODES);
        } else if (role === "owner") {
          setDoc(doc(db, "main_map", "nodes"), { nodes: INITIAL_NODES }).catch(
            (e) =>
              handleFirestoreError(e, OperationType.WRITE, "main_map/nodes"),
          );
        }
      },
      (error) => {
        if (role === "owner")
          handleFirestoreError(error, OperationType.GET, "main_map/nodes");
      },
    );

    const unsubPublished = onSnapshot(
      doc(db, "published_map", "nodes"),
      (snapshot) => {
        if (snapshot.exists()) {
          setPublishedNodes(snapshot.data().nodes || INITIAL_NODES);
        } else if (role === "owner") {
          setDoc(doc(db, "published_map", "nodes"), {
            nodes: INITIAL_NODES,
          }).catch((e) =>
            handleFirestoreError(e, OperationType.WRITE, "published_map/nodes"),
          );
        }
      },
      (error) =>
        handleFirestoreError(error, OperationType.GET, "published_map/nodes"),
    );

    const unsubMetadata = onSnapshot(
      doc(db, "metadata", "config"),
      (snapshot) => {
        if (snapshot.exists()) {
          setMainVersion(snapshot.data().mainVersion || 1);
        } else if (role === "owner") {
          setDoc(doc(db, "metadata", "config"), { mainVersion: 1 }).catch((e) =>
            handleFirestoreError(e, OperationType.WRITE, "metadata/config"),
          );
        }
      },
      (error) =>
        handleFirestoreError(error, OperationType.GET, "metadata/config"),
    );

    const unsubPRs = onSnapshot(
      collection(db, "pull_requests"),
      (snapshot) => {
        const prs = snapshot.docs.map((d) => d.data() as PullRequest);
        setPendingPRs(prs);
      },
      (error) => {
        if (role === "owner")
          handleFirestoreError(error, OperationType.GET, "pull_requests");
      },
    );

    return () => {
      unsubMain();
      unsubPublished();
      unsubMetadata();
      unsubPRs();
    };
  }, [role, isAuthReady]);

  useEffect(() => {
    if (!isAuthReady || !currentUser) return;
    const unsubUser = onSnapshot(
      doc(db, "users", currentUser.id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.nodes) setUserNodes(data.nodes);
          if (data.baseVersion) setUserBaseVersion(data.baseVersion);
        }
      },
      (error) =>
        handleFirestoreError(
          error,
          OperationType.GET,
          `users/${currentUser.id}`,
        ),
    );

    return () => unsubUser();
  }, [currentUser, isAuthReady]);

  const syncUserToDB = useCallback(
    async (nodes: MindMapNode[] | null, baseVer: number, user: User | null) => {
      if (!user) return;
      try {
        await setDoc(
          doc(db, "users", user.id),
          {
            ...user,
            nodes,
            baseVersion: baseVer,
          },
          { merge: true },
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.id}`);
      }
    },
    [],
  );

  // --- Lógica de Publicación Propietario ---
  const isMainDirty = useMemo(() => {
    return JSON.stringify(mainNodes) !== JSON.stringify(publishedNodes);
  }, [mainNodes, publishedNodes]);

  const handlePublishVersion = () => {
    setPendingConfirmation({
      isOpen: true,
      title: "Publicar Nueva Versión",
      message:
        "Todos los cambios realizados en el borrador principal se harán visibles para todos los estudiantes y se incrementará el número de versión.",
      type: "info",
      onConfirm: async () => {
        try {
          await setDoc(doc(db, "published_map", "nodes"), { nodes: mainNodes });
          await updateDoc(doc(db, "metadata", "config"), {
            mainVersion: mainVersion + 1,
          });
          addToast("Nueva versión publicada correctamente", "success");
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, "publish");
        }
        setPendingConfirmation(null);
      },
    });
  };

  const handleRegister = async (user: User) => {
    setCurrentUser(user);
    setRole(user.role);
    const nodesToUse = [...publishedNodes];
    setUserNodes(nodesToUse);
    setUserBaseVersion(mainVersion);
    setViewMode("main");
    await syncUserToDB(nodesToUse, mainVersion, user);
    addToast(`¡Bienvenido, ${user.name}!`, "info");
  };

  const handleLogin = (
    user: User,
    savedNodes: MindMapNode[],
    baseVersion: number,
  ) => {
    setCurrentUser(user);
    setRole(user.role);
    setUserNodes(savedNodes);
    setUserBaseVersion(baseVersion);
    setViewMode("main");
    addToast(`Hola de nuevo, ${user.name}`, "info");
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      setUserNodes(null);
      setRole("student");
      setViewMode("main");
      addToast("Sesión cerrada correctamente", "info");
    } catch (e) {
      console.error("Error signing out:", e);
      addToast("Error al cerrar sesión", "warning");
    }
  };

  const isNodeModified = useCallback((m: MindMapNode, u: MindMapNode) => {
    const arePrerequisitesEqual = (a: string[], b: string[]) => {
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      return sortedA.every((val, index) => val === sortedB[index]);
    };
    return (
      m.label !== u.label ||
      m.description !== u.description ||
      m.content !== u.content ||
      !arePrerequisitesEqual(m.prerequisites, u.prerequisites)
    );
  }, []);

  const activeNodes = useMemo(() => {
    if (viewMode === "main")
      return role === "owner" ? mainNodes : publishedNodes;
    if (viewMode === "review" && activePR) return activePR.nodes;
    return userNodes || publishedNodes;
  }, [viewMode, mainNodes, publishedNodes, userNodes, activePR, role]);

  const hasActualUpdates = useMemo(() => {
    if (!userNodes || mainVersion <= userBaseVersion) return false;
    const added = publishedNodes.filter(
      (m) => !userNodes.some((u) => u.id === m.id),
    );
    if (added.length > 0) return true;
    const modified = publishedNodes.some((m) => {
      const u = userNodes.find((un) => un.id === m.id);
      if (!u) return false;
      return isNodeModified(m, u);
    });
    if (modified) return true;
    const removed = userNodes.some((u) => {
      const wasInOriginalMain =
        INITIAL_NODES.some((i) => i.id === u.id) ||
        publishedNodes.some((m) => m.id === u.id);
      return wasInOriginalMain && !publishedNodes.some((m) => m.id === u.id);
    });
    return removed;
  }, [userNodes, publishedNodes, mainVersion, userBaseVersion, isNodeModified]);

  const canEdit = useMemo(() => {
    if (viewMode === "review") return false;
    if (viewMode === "main") return role === "owner";
    return true;
  }, [viewMode, role]);

  const handleFork = () => {
    if (!userNodes) {
      setUserNodes([...publishedNodes]);
      setUserBaseVersion(mainVersion);
    }
    setViewMode("personal");
    addToast("Has creado tu propia rama de estudio", "success");
  };

  const openUpdatePreview = useCallback(() => {
    if (!userNodes) return;
    const added = publishedNodes.filter(
      (m) => !userNodes.some((u) => u.id === m.id),
    );
    const modified = publishedNodes.filter((m) => {
      const u = userNodes.find((un) => un.id === m.id);
      if (!u) return false;
      return isNodeModified(m, u);
    });
    const removed = userNodes.filter((u) => {
      const wasInOriginalPublished =
        INITIAL_NODES.some((i) => i.id === u.id) ||
        publishedNodes.some((m) => m.id === u.id);
      return (
        wasInOriginalPublished && !publishedNodes.some((m) => m.id === u.id)
      );
    });
    if (added.length === 0 && modified.length === 0 && removed.length === 0) {
      setUserBaseVersion(mainVersion);
      return;
    }
    setUpdatePreviewData({ added, modified, removed });
  }, [userNodes, publishedNodes, mainVersion, isNodeModified]);

  const handleUpdateFromMain = async () => {
    if (!userNodes || !updatePreviewData) return;
    let newUserNodes = [...publishedNodes];
    userNodes.forEach((uNode) => {
      const isCustom = !publishedNodes.some((m) => m.id === uNode.id);
      if (isCustom) {
        newUserNodes.push(uNode);
      } else {
        const mainMatch = newUserNodes.find((m) => m.id === uNode.id);
        if (mainMatch) mainMatch.status = uNode.status;
      }
    });
    setUserNodes(newUserNodes);
    setUserBaseVersion(mainVersion);
    await syncUserToDB(newUserNodes, mainVersion, currentUser);
    setUpdatePreviewData(null);
    addToast("Rama actualizada con éxito", "success");
  };

  const handleSubmitPR = async () => {
    if (!userNodes || !currentUser) return;
    const prId = `pr-${Date.now()}`;
    const newPR: PullRequest = {
      id: prId,
      userId: currentUser.id,
      userName: currentUser.name,
      nodes: userNodes,
      timestamp: Date.now(),
      status: "pending",
    };
    try {
      await setDoc(doc(db, "pull_requests", prId), newPR);
      addToast("Propuesta enviada al mentor", "info");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `pull_requests/${prId}`);
    }
  };

  const handleAcceptPR = async (pr: PullRequest) => {
    try {
      await setDoc(doc(db, "main_map", "nodes"), { nodes: pr.nodes });
      await deleteDoc(doc(db, "pull_requests", pr.id));
      setActivePR(null);
      setViewMode("main");
      addToast(
        "Propuesta aceptada en borrador. Recuerda publicar para aplicar los cambios.",
        "info",
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "accept_pr");
    }
  };

  const handleRejectPR = async (pr: PullRequest) => {
    try {
      await deleteDoc(doc(db, "pull_requests", pr.id));
      setActivePR(null);
      setViewMode("main");
      addToast("Propuesta rechazada", "warning");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "reject_pr");
    }
  };

  const confirmDelete = useCallback(
    (nodeId: string, nodeLabel: string) => {
      setPendingConfirmation({
        isOpen: true,
        title: "¿Eliminar tema?",
        message: `Estás a punto de eliminar "${nodeLabel}". Esta acción no se puede deshacer.`,
        type: "danger",
        onConfirm: async () => {
          const updater = (prev: MindMapNode[]) =>
            prev.filter((n) => n.id !== nodeId);
          if (viewMode === "main" && role === "owner") {
            const newNodes = updater(mainNodes);
            await setDoc(doc(db, "main_map", "nodes"), { nodes: newNodes });
          } else {
            const newNodes = updater(userNodes || []);
            setUserNodes(newNodes);
            await syncUserToDB(newNodes, userBaseVersion, currentUser);
          }
          setSelectedNodeId(null);
          addToast("Tema eliminado correctamente", "warning");
          setPendingConfirmation(null);
        },
      });
    },
    [
      viewMode,
      role,
      addToast,
      mainNodes,
      userNodes,
      userBaseVersion,
      currentUser,
      syncUserToDB,
    ],
  );

  const handleUpdateNode = useCallback(
    async (updatedNode: MindMapNode) => {
      const updater = (prev: MindMapNode[]) =>
        prev.map((n) => (n.id === updatedNode.id ? updatedNode : n));
      if (viewMode === "main" && role === "owner") {
        const newNodes = updater(mainNodes);
        await setDoc(doc(db, "main_map", "nodes"), { nodes: newNodes });
      } else {
        const newNodes = updater(userNodes || []);
        setUserNodes(newNodes);
        await syncUserToDB(newNodes, userBaseVersion, currentUser);
      }
    },
    [
      viewMode,
      role,
      mainNodes,
      userNodes,
      userBaseVersion,
      currentUser,
      syncUserToDB,
    ],
  );

  const expandAncestors = useCallback(
    (nodeId: string | null) => {
      if (!nodeId) return;
      const newExpanded = new Set(expandedFolders);
      let curr = activeNodes.find((n) => n.id === nodeId);
      while (curr && curr.parentId) {
        newExpanded.add(curr.parentId);
        curr = activeNodes.find((n) => n.id === curr?.parentId);
      }
      setExpandedFolders(newExpanded);
    },
    [activeNodes, expandedFolders],
  );

  const handleNodeClick = useCallback(
    (node: MindMapNode) => {
      if (node.type === NodeType.PARENT) {
        const hasChildren = activeNodes.some((n) => n.parentId === node.id);
        if (!hasChildren && canEdit) {
          setEmptyNodePrompt(node);
          return;
        }

        setExpandedFolders((prev) => {
          const next = new Set(prev);
          if (next.has(node.id)) next.delete(node.id);
          else next.add(node.id);
          return next;
        });

        setCurrentNodeId(node.id);
        setFocusedNodeId(null);
        setSelectedNodeId(null);
      } else {
        setSelectedNodeId(node.id);
        setFocusedNodeId(node.id);
        expandAncestors(node.id);
      }
    },
    [activeNodes, canEdit, expandAncestors],
  );

  const handleSelectFromExplorerOrSearch = useCallback(
    (node: MindMapNode) => {
      setCurrentNodeId(node.parentId);
      setSelectedNodeId(node.id);
      setFocusedNodeId(node.id);
      expandAncestors(node.id);
    },
    [expandAncestors],
  );

  const breadcrumbs = useMemo(() => {
    const chain: MindMapNode[] = [];
    let currentId = currentNodeId;
    while (currentId) {
      const node = activeNodes.find((n) => n.id === currentId);
      if (node) {
        chain.unshift(node);
        currentId = node.parentId;
      } else break;
    }
    return chain;
  }, [currentNodeId, activeNodes]);

  const filteredNodes = useMemo(
    () => activeNodes.filter((n) => n.parentId === currentNodeId),
    [activeNodes, currentNodeId],
  );
  const selectedNode = useMemo(
    () => activeNodes.find((n) => n.id === selectedNodeId) || null,
    [activeNodes, selectedNodeId],
  );

  if (!isAuthReady || isProfileLoading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-2xl shadow-indigo-500/20 animate-pulse">
          <i className="fas fa-brain"></i>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-progress origin-left"></div>
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Conectando con Nexus...
          </span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthModal onRegister={handleRegister} onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden select-none relative">
      <div className="fixed top-24 right-6 z-[3000] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 border backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-500/90 text-white border-emerald-400"
                : toast.type === "warning"
                  ? "bg-amber-500/90 text-white border-amber-400"
                  : "bg-indigo-600/90 text-white border-indigo-500"
            }`}
          >
            <i
              className={`fas ${toast.type === "success" ? "fa-check-circle" : toast.type === "warning" ? "fa-exclamation-circle" : "fa-info-circle"}`}
            ></i>
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        ))}
      </div>

      <Header
        nodes={activeNodes}
        user={currentUser}
        role={role}
        viewMode={viewMode}
        mainVersion={mainVersion}
        userBaseVersion={userBaseVersion}
        hasUpdate={hasActualUpdates}
        isDirty={isMainDirty}
        pendingPRs={pendingPRs}
        onSetViewMode={setViewMode}
        onSetRole={setRole}
        onFork={handleFork}
        onUpdateFromMain={openUpdatePreview}
        onPublishVersion={handlePublishVersion}
        onSubmitPR={handleSubmitPR}
        onReviewPR={(pr) => {
          setActivePR(pr);
          setViewMode("review");
        }}
        breadcrumbs={breadcrumbs}
        onBreadcrumbClick={setCurrentNodeId}
        onSearchSelect={handleSelectFromExplorerOrSearch}
        onOpenExplorer={() => setIsExplorerOpen(true)}
        onLogout={handleLogout}
      />

      <FileExplorer
        nodes={activeNodes}
        baselineNodes={publishedNodes}
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        expandedFolders={expandedFolders}
        onToggleFolder={(id) =>
          setExpandedFolders((prev) => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
          })
        }
        onSelectNode={handleSelectFromExplorerOrSearch}
        currentNodeId={currentNodeId}
        selectedNodeId={selectedNodeId}
        diffMode={viewMode !== "main"}
      />

      <div className="flex flex-1 relative overflow-hidden">
        <div className="flex-1 relative bg-white">
          <MapCanvas
            nodes={filteredNodes}
            allNodes={activeNodes}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
            focusedNodeId={focusedNodeId}
            onBackgroundClick={() => {}}
          />

          {canEdit && (
            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setSelectedNodeId(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
              >
                <i className="fas fa-plus text-xl"></i>
              </button>
            </div>
          )}

          {viewMode === "review" && activePR && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white px-8 py-4 rounded-3xl shadow-2xl border border-indigo-100 flex items-center gap-6 animate-in slide-in-from-bottom duration-500">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Revisando Propuesta de
                </span>
                <span className="font-bold text-slate-800">
                  {activePR.userName}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-100"></div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRejectPR(activePR)}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleAcceptPR(activePR)}
                  className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                >
                  Integrar en Borrador
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedNode && selectedNode.type === NodeType.CHILD && (
          <Sidebar
            selectedNode={selectedNode}
            allNodes={activeNodes}
            canEdit={canEdit}
            onEdit={() => setIsEditing(true)}
            onDelete={() => confirmDelete(selectedNode.id, selectedNode.label)}
            onStatusChange={(status) =>
              handleUpdateNode({ ...selectedNode, status })
            }
            onShowFullContent={() => setIsFullContentOpen(true)}
            onNavigateToNode={(id) => {
              const n = activeNodes.find((x) => x.id === id);
              if (n) {
                setCurrentNodeId(n.parentId);
                setSelectedNodeId(n.id);
                setFocusedNodeId(n.id);
                expandAncestors(n.id);
              }
            }}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {isEditing && (
        <NodeEditor
          nodes={activeNodes}
          editingNode={selectedNode}
          currentParentId={currentNodeId}
          onSave={(data) => {
            setPendingConfirmation({
              isOpen: true,
              title: selectedNode ? "¿Guardar cambios?" : "¿Crear nuevo tema?",
              message: selectedNode
                ? `Se actualizará la información de "${selectedNode.label}".`
                : "Se añadirá este nuevo tema a la estructura actual.",
              type: "info",
              onConfirm: async () => {
                if (selectedNode) {
                  await handleUpdateNode({
                    ...selectedNode,
                    ...data,
                  } as MindMapNode);
                  addToast("Cambios guardados correctamente");
                } else {
                  const newNode = {
                    ...data,
                    id: `node-${Date.now()}`,
                  } as MindMapNode;
                  if (viewMode === "main" && role === "owner") {
                    const newNodes = [...mainNodes, newNode];
                    await setDoc(doc(db, "main_map", "nodes"), {
                      nodes: newNodes,
                    });
                  } else {
                    const newNodes = [...(userNodes || []), newNode];
                    setUserNodes(newNodes);
                    await syncUserToDB(newNodes, userBaseVersion, currentUser);
                  }
                  addToast("Tema creado con éxito");
                }
                setIsEditing(false);
                setPendingConfirmation(null);
              },
            });
          }}
          onClose={() => setIsEditing(false)}
        />
      )}

      {isFullContentOpen && selectedNode && (
        <FullContentOverlay
          node={selectedNode}
          onClose={() => setIsFullContentOpen(false)}
          onNextLesson={() => {
            handleUpdateNode({ ...selectedNode, status: NodeStatus.COMPLETED });
            setIsFullContentOpen(false);
            addToast("¡Lección completada!", "success");
          }}
        />
      )}

      {emptyNodePrompt && (
        <div
          className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEmptyNodePrompt(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
              <i className="fas fa-folder-open text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Módulo Vacío
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              El módulo "{emptyNodePrompt.label}" no contiene temas todavía.
              ¿Qué deseas hacer?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setCurrentNodeId(emptyNodePrompt.id);
                  setIsEditing(true);
                  setEmptyNodePrompt(null);
                }}
                className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Agregar primer tema
              </button>
              <button
                onClick={() => {
                  const nodeToDelete = emptyNodePrompt;
                  setEmptyNodePrompt(null);
                  confirmDelete(nodeToDelete.id, nodeToDelete.label);
                }}
                className="w-full px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-trash-alt"></i>
                Eliminar Módulo Vacío
              </button>
              <button
                onClick={() => setEmptyNodePrompt(null)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {updatePreviewData && (
        <UpdatePreviewModal
          isOpen={true}
          newVersion={mainVersion}
          changes={updatePreviewData}
          onConfirm={handleUpdateFromMain}
          onCancel={() => setUpdatePreviewData(null)}
        />
      )}

      {pendingConfirmation && (
        <ConfirmationModal
          isOpen={pendingConfirmation.isOpen}
          title={pendingConfirmation.title}
          message={pendingConfirmation.message}
          type={pendingConfirmation.type}
          confirmText={
            pendingConfirmation.type === "danger" ? "Eliminar" : "Confirmar"
          }
          onConfirm={pendingConfirmation.onConfirm}
          onCancel={() => setPendingConfirmation(null)}
        />
      )}
    </div>
  );
};

export default App;
