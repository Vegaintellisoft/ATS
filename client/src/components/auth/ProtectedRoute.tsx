import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  /** @deprecated Use permissions instead. Kept for backward compatibility. */
  roles?: string[];
  /** Permissions allowed to access this route. User must have at least one. */
  permissions?: string[];
  children: ReactNode;
}

/**
 * ProtectedRoute — wraps a page component and enforces role-based access.
 *
 * Usage:
 *   <ProtectedRoute roles={["ADMIN"]}>
 *     <UsersPage />
 *   </ProtectedRoute>
 *
 * - If the user is not authenticated: renders nothing (App.tsx shows login).
 * - If the user's role is not in the allowed list: renders an Access Denied screen.
 * - Otherwise: renders children.
 */
export function ProtectedRoute({ roles, permissions, children }: ProtectedRouteProps) {
  const { user } = useAuth();

  // Not authenticated — App.tsx handles redirect to login
  if (!user) return null;

  // Permission check
  if (permissions && permissions.length > 0) {
    const hasAccess = permissions.some(p => user.permissions.includes(p));
    if (!hasAccess) {
      return (
        <div className="access-denied">
          <div className="access-denied-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>
            You need one of the following permissions to access this page:{" "}
            <strong>{permissions.join(", ")}</strong>
          </p>
          <p className="access-denied-sub">
            You are signed in as <strong>{user.email}</strong> ({user.role?.name || "Unknown Role"}).
          </p>
        </div>
      );
    }
  }

  // Role check (legacy)
  if (roles && !roles.includes(user.role?.name)) {
    return (
      <div className="access-denied">
        <div className="access-denied-icon">🔒</div>
        <h2>Access Denied</h2>
        <p>
          You need one of the following roles to access this page:{" "}
          <strong>{roles.join(", ")}</strong>
        </p>
        <p className="access-denied-sub">
          You are signed in as <strong>{user.email}</strong> ({user.role?.name || "Unknown Role"}).
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
