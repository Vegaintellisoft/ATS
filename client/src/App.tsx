// import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/layout/Sidebar";
import { ToastContainer } from "./components/common/Toast";
import { DashboardPage } from "./pages/DashboardPage";
import { UploadPage } from "./pages/UploadPage";
import { SearchPage } from "./pages/SearchPage";
import { ListPage } from "./pages/ListPage";
import { TeamsPage } from "./pages/TeamsPage";
import { UsersPage } from "./pages/UsersPage";
import { CreateUserPage } from "./pages/CreateUserPage";
import { LoginPage } from "./pages/LoginPage";
import { AccountsPage } from "./pages/AccountsPage";
import { RequirementsPage } from "./pages/RequirementsPage";
import { RequirementDetailPage } from "./pages/RequirementDetailPage";
import { ReportsPage } from "./pages/ReportsPage";
import { OrganizationsPage } from "./pages/OrganizationsPage";
import { RoleMasterPage } from "./pages/RoleMasterPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary"; // Force TS re-evaluation
import "./App.css";

function AppInner() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-layout">
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
      </div>

      <Sidebar />

      <main className="main-content">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route
              path="requirements/:id"
              element={
                <ProtectedRoute permissions={["requirement:view"]}>
                  <RequirementDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="requirements"
              element={
                <ProtectedRoute permissions={["requirement:view"]}>
                  <RequirementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounts"
              element={
                <ProtectedRoute permissions={["account:view"]}>
                  <AccountsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="applications"
              element={
                <ProtectedRoute permissions={["application:view"]}>
                  <ApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="search"
              element={
                <ProtectedRoute permissions={["candidate:view"]}>
                  <SearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="list"
              element={
                <ProtectedRoute permissions={["candidate:view"]}>
                  <ListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="upload"
              element={
                <ProtectedRoute permissions={["resume:upload"]}>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="organizations"
              element={
                <ProtectedRoute permissions={["organization:view"]}>
                  <OrganizationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="teams"
              element={
                <ProtectedRoute permissions={["team:view"]}>
                  <TeamsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute permissions={["user:view"]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/new"
              element={
                <ProtectedRoute permissions={["user:create"]}>
                  <CreateUserPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute permissions={["report:view"]}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="roles"
              element={
                <ProtectedRoute permissions={["role:manage"]}>
                  <RoleMasterPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>

      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
