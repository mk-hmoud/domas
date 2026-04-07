import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Student } from '@domas/ts-types';
import { portalAuth } from '@domas/api-client';

interface StudentAuthContextType {
  student: Student | null;
  isLoading: boolean;
  login: (studentNumber: string) => Promise<void>;
  logout: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    portalAuth
      .me()
      .then(setStudent)
      .catch(() => setStudent(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (studentNumber: string) => {
    const profile = await portalAuth.login({ studentNumber });
    setStudent(profile);
  };

  const logout = async () => {
    await portalAuth.logout();
    setStudent(null);
  };

  return (
    <StudentAuthContext.Provider value={{ student, isLoading, login, logout }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) throw new Error('useStudentAuth must be used within StudentAuthProvider');
  return ctx;
}
