import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Users } from "./pages/Users";
import { Customers } from "./pages/Customers";
import { Products } from "./pages/Products";
import { Orders } from "./pages/Orders";
import { Reviews } from "./pages/Reviews";
import { Profile } from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import { Toaster } from "./components/Toaster";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ROLES } from "../constants/roles";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster />
        <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OPERATION_ADMIN, ROLES.CS_ADMIN]}>
              <Customers />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OPERATION_ADMIN]}>
              <Products />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}