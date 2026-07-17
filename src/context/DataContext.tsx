import React, { createContext, useContext, useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  getDoc,
  writeBatch
} from "firebase/firestore";
import { auth, db, googleProvider, signInWithPopup, signOut, OperationType, handleFirestoreError } from "../firebase";
import { WorkLog, CarLog } from "../types";

interface DataContextType {
  user: User | null;
  authLoading: boolean;
  dataLoading: boolean;
  workLogs: WorkLog[];
  carLogs: CarLog[];
  addWorkLog: (log: Omit<WorkLog, "id" | "createdAt">) => Promise<void>;
  updateWorkLog: (id: string, log: Partial<WorkLog>) => Promise<void>;
  deleteWorkLog: (id: string) => Promise<void>;
  addCarLog: (log: Omit<CarLog, "id" | "createdAt">) => Promise<void>;
  updateCarLog: (id: string, log: Partial<CarLog>) => Promise<void>;
  deleteCarLog: (id: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  syncLocalToFirebase: () => Promise<void>;
  hasLocalData: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [carLogs, setCarLogs] = useState<CarLog[]>([]);
  
  const [hasLocalData, setHasLocalData] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync state between Firebase and Local Storage fallback
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch data
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setDataLoading(true);
      // Fetch Work Logs for user
      const qWork = query(collection(db, "workLogs"), where("userId", "==", user.uid));
      const unsubWork = onSnapshot(
        qWork,
        (snapshot) => {
          const logs: WorkLog[] = [];
          snapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() } as WorkLog);
          });
          // Sort by date descending
          logs.sort((a, b) => b.date.localeCompare(a.date));
          setWorkLogs(logs);
          setDataLoading(false);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, "workLogs");
          setDataLoading(false);
        }
      );

      // Fetch Car Logs for user
      const qCar = query(collection(db, "carLogs"), where("userId", "==", user.uid));
      const unsubCar = onSnapshot(
        qCar,
        (snapshot) => {
          const logs: CarLog[] = [];
          snapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() } as CarLog);
          });
          // Sort by date descending
          logs.sort((a, b) => b.date.localeCompare(a.date));
          setCarLogs(logs);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, "carLogs");
        }
      );

      return () => {
        unsubWork();
        unsubCar();
      };
    } else {
      setWorkLogs([]);
      setCarLogs([]);
      setDataLoading(false);
    }
  }, [user, authLoading]);

  // Auth actions
  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login Error: ", error);
      let errMsg = error?.message || String(error);
      if (error?.code === "auth/configuration-not-found" || errMsg.includes("configuration-not-found")) {
        errMsg = "auth/configuration-not-found";
      } else if (error?.code === "auth/operation-not-allowed" || errMsg.includes("operation-not-allowed")) {
        errMsg = "auth/operation-not-allowed";
      } else if (error?.code === "auth/unauthorized-domain" || errMsg.includes("unauthorized-domain")) {
        errMsg = "auth/unauthorized-domain";
      }
      setAuthError(errMsg);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const logout = async () => {
    try {
      setAuthError(null);
      await signOut(auth);
      setWorkLogs([]);
      setCarLogs([]);
    } catch (error) {
      console.error("Logout Error: ", error);
    }
  };

  // Data Actions: WORK LOGS
  const addWorkLog = async (logInput: Omit<WorkLog, "id" | "createdAt">) => {
    if (!user) return;
    const id = "wl_" + Math.random().toString(36).substring(2, 11);
    const createdAt = new Date().toISOString();
    const newLog: WorkLog & { userId?: string } = {
      id,
      ...logInput,
      createdAt,
      userId: user.uid,
    };

    try {
      await setDoc(doc(db, "workLogs", id), newLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `workLogs/${id}`);
    }
  };

  const updateWorkLog = async (id: string, logUpdate: Partial<WorkLog>) => {
    if (!user) return;
    try {
      const docRef = doc(db, "workLogs", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const updatedData = { ...currentData, ...logUpdate };
        await setDoc(docRef, updatedData);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workLogs/${id}`);
    }
  };

  const deleteWorkLog = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "workLogs", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `workLogs/${id}`);
    }
  };

  // Data Actions: CAR LOGS
  const addCarLog = async (logInput: Omit<CarLog, "id" | "createdAt">) => {
    if (!user) return;
    const id = "cl_" + Math.random().toString(36).substring(2, 11);
    const createdAt = new Date().toISOString();
    const newLog: CarLog & { userId?: string } = {
      id,
      ...logInput,
      createdAt,
      userId: user.uid,
    };

    try {
      await setDoc(doc(db, "carLogs", id), newLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `carLogs/${id}`);
    }
  };

  const updateCarLog = async (id: string, logUpdate: Partial<CarLog>) => {
    if (!user) return;
    try {
      const docRef = doc(db, "carLogs", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const updatedData = { ...currentData, ...logUpdate };
        await setDoc(docRef, updatedData);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `carLogs/${id}`);
    }
  };

  const deleteCarLog = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "carLogs", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `carLogs/${id}`);
    }
  };

  // Sync Local Storage Data to Firebase after Login (No-op since offline is disabled)
  const syncLocalToFirebase = async () => {
    localStorage.removeItem("local_work_logs");
    localStorage.removeItem("local_car_logs");
    setHasLocalData(false);
  };

  return (
    <DataContext.Provider
      value={{
        user,
        authLoading,
        dataLoading,
        workLogs,
        carLogs,
        addWorkLog,
        updateWorkLog,
        deleteWorkLog,
        addCarLog,
        updateCarLog,
        deleteCarLog,
        loginWithGoogle,
        logout,
        syncLocalToFirebase,
        hasLocalData,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
