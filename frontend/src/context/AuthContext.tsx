import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  tenantId: number;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

const getStoredUser = (): AuthUser | null => {
  try {
    const storedUser =
      localStorage.getItem("user");

    if (
      !storedUser ||
      storedUser === "undefined"
    ) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Invalid user in localStorage",
      error
    );

    return null;
  }
};

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] =
    useState<AuthUser | null>(
      getStoredUser()
    );

  const login = (
    token: string,
    user: AuthUser
  ) => {
    console.log("TOKEN:", token);
    console.log("USER:", user);

    localStorage.setItem(
      "token",
      token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () =>
  useContext(AuthContext);