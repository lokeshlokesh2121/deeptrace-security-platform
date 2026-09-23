import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps) {
  const { user } = useAuth();

  if (
    !allowedRoles.includes(
      user?.role ?? ""
    )
  ) {
    return null;
  }

  return children;
}