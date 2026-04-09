import React, { useState } from "react";
import type { User, UserRole, MindMapNode } from "../types";
import {
  db,
  // handleFirestoreError,
  // OperationType,
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthModalProps {
  onRegister: (user: User, initialNodes?: MindMapNode[]) => void;
  onLogin: (user: User, savedNodes: MindMapNode[], baseVersion: number) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onRegister, onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const OWNER_EMAIL = "alejandro.starke@gmail.com";

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const userId = firebaseUser.uid;
      const userEmail = firebaseUser.email || "";

      const userDoc = await getDoc(doc(db, "users", userId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        onLogin(
          {
            id: userId,
            name: userData.name,
            emailOrPhone: userData.emailOrPhone,
            role: userData.role,
          },
          userData.nodes || [],
          userData.baseVersion || 1,
        );
      } else {
        const role: UserRole =
          userEmail.toLowerCase() === OWNER_EMAIL ? "owner" : "student";
        const newUserProfile: User = {
          id: userId,
          emailOrPhone: userEmail,
          name: firebaseUser.displayName || name || "Usuario",
          role: role,
        };
        await setDoc(doc(db, "users", userId), newUserProfile);
        onRegister(newUserProfile);
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === "auth/operation-not-allowed") {
        setError(
          "El inicio de sesión con Google no está habilitado en Firebase Console. Por favor, actívalo en la sección Authentication > Sign-in method.",
        );
      } else {
        setError("Error al iniciar sesión con Google. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLoginMode && !name)) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (isLoginMode) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userId = result.user.uid;
        const userDoc = await getDoc(doc(db, "users", userId));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          onLogin(
            {
              id: userId,
              name: userData.name,
              emailOrPhone: userData.emailOrPhone,
              role: userData.role,
            },
            userData.nodes || [],
            userData.baseVersion || 1,
          );
        } else {
          // Profile missing? Create one
          const role: UserRole =
            email.toLowerCase() === OWNER_EMAIL ? "owner" : "student";
          const newUserProfile: User = {
            id: userId,
            emailOrPhone: email,
            name: result.user.displayName || "Usuario",
            role: role,
          };
          await setDoc(doc(db, "users", userId), newUserProfile);
          onRegister(newUserProfile);
        }
      } else {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const userId = result.user.uid;
        await updateProfile(result.user, { displayName: name });

        const role: UserRole =
          email.toLowerCase() === OWNER_EMAIL ? "owner" : "student";
        const newUserProfile: User = {
          id: userId,
          emailOrPhone: email,
          name: name,
          role: role,
        };
        await setDoc(doc(db, "users", userId), newUserProfile);
        onRegister(newUserProfile);
      }
    } catch (e: any) {
      console.error(e);
      if (
        e.code === "auth/user-not-found" ||
        e.code === "auth/wrong-password" ||
        e.code === "auth/invalid-credential"
      ) {
        setError("Credenciales incorrectas.");
      } else if (e.code === "auth/email-already-in-use") {
        setError("El correo ya está en uso.");
      } else if (e.code === "auth/weak-password") {
        setError("La contraseña es demasiado débil.");
      } else if (e.code === "auth/operation-not-allowed") {
        setError(
          "El inicio de sesión con Correo/Contraseña no está habilitado en Firebase Console. Por favor, actívalo en la sección Authentication > Sign-in method.",
        );
      } else {
        setError("Ocurrió un error. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900 overflow-y-auto flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none fixed">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-amber-500 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl max-w-md w-full p-6 sm:p-10 relative z-10 animate-in zoom-in duration-500 my-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl shadow-xl shadow-indigo-200 mb-6">
            <i className="fas fa-brain"></i>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">
            KnowledgeNexus
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            {isLoginMode ? "Bienvenido de nuevo" : "Crea tu cuenta de estudio"}
          </p>
        </div>

        {/* Tabs Toggle */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
          <button
            onClick={() => {
              setIsLoginMode(true);
              setError("");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${isLoginMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
          >
            Entrar
          </button>
          <button
            onClick={() => {
              setIsLoginMode(false);
              setError("");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${!isLoginMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
            )}
            {isLoginMode ? "Entrar con Google" : "Registrarse con Google"}
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              O con tu cuenta
            </span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Tu Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Alejandro Starke"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-700 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="email@ejemplo.com"
              className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-700 text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[11px] font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : isLoginMode ? (
              "Iniciar Sesión"
            ) : (
              "Crear Cuenta"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Tus cambios se guardan automáticamente
            <br />
            en tu perfil personal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
