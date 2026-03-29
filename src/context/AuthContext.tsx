import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Student } from '@/types';
import { api, setToken, getToken } from '@/lib/api';

interface AuthContextType {
  userRole: UserRole | null;
  currentStudent: Student | null;
  loading: boolean;
  login: (role: UserRole, student?: Student) => void;
  logout: () => void;
  updateStudent: (student: Partial<Student>) => void;
  setCurrentStudent: (student: Student | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth
      .me()
      .then((data) => {
        if (data.role === 'admin') {
          setUserRole('admin');
        } else if (data.role === 'student' && data.student) {
          setUserRole('student');
          setStudent(data.student);
        } else {
          setToken(null);
        }
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = (role: UserRole, studentData?: Student) => {
    setUserRole(role);
    if (role === 'student' && studentData) {
      setStudent(studentData);
    } else {
      setStudent(null);
    }
  };

  const logout = () => {
    setToken(null);
    setUserRole(null);
    setStudent(null);
  };

  const updateStudent = (updates: Partial<Student>) => {
    if (student) {
      setStudent({ ...student, ...updates });
    }
  };

  const setCurrentStudent = (s: Student | null) => {
    setStudent(s);
  };

  return (
    <AuthContext.Provider
      value={{
        userRole,
        currentStudent: student,
        loading,
        login,
        logout,
        updateStudent,
        setCurrentStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
