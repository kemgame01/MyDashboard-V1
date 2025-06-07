import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMergedUser } from '../hooks/useMergedUser'; // You must implement/use this hook.
import Spinner from './Spinner';

/**
 * PrivateRoute protects routes that require authentication, and (optionally) a role.
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string|string[]} [props.role] - (optional) one role or array of roles (all lowercase)
 * @param {React.ReactNode} [props.loadingFallback] - custom loading UI
 * @param {string} [props.redirectTo] - redirect path if not allowed (default: "/")
 */
const PrivateRoute = ({
  children,
  role,
  loadingFallback = <Spinner text="Loading..." />,
  redirectTo = "/"
}) => {
  const user = useMergedUser();

  if (user === undefined) return loadingFallback;
  if (!user) return <Navigate to={redirectTo} />;

  // Role-based restriction (optional)
  if (role) {
    const userRole = (user.role || '').toLowerCase();
    const isRoot = !!user.isRootAdmin;
    const allowed = Array.isArray(role)
      ? role.map(r => r.toLowerCase()).includes(userRole) || isRoot
      : userRole === role.toLowerCase() || isRoot;
    if (!allowed) {
      return <Navigate to={redirectTo} />;
    }
  }

  // Optionally pass user to children (if needed as render prop)
  return typeof children === 'function' ? children({ user }) : children;
};

export default PrivateRoute;
