import React, { createContext, useContext, useState, useEffect } from "react";
import {
  type CustomerUser,
  getCustomerSession,
  saveCustomerSession,
  clearCustomerSession,
} from "../utils/authService";

interface CustomerAuthContextType {
  user: CustomerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (token: string, user: CustomerUser) => void;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Restore persistent login session on mount
  useEffect(() => {
    const session = getCustomerSession();
    if (session.token && session.user) {
      setToken(session.token);
      setUser(session.user);
    }
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const login = (newToken: string, newUser: CustomerUser) => {
    saveCustomerSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
    setIsLoginModalOpen(false);
  };

  const logout = () => {
    clearCustomerSession();
    setToken(null);
    setUser(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export function useCustomerAuth(): CustomerAuthContextType {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}
