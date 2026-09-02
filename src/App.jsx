import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewBill from "./pages/NewBill";
import BillHistory from "./pages/BillHistory";
import TodaySales from "./pages/TodaySales";
import Jewellery from "./pages/Jewellery";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0a",
          color: "#c5a05b",
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
        }}
      >
        लोड हो रहा है...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/new-bill"
          element={
            <ProtectedRoute>
              <NewBill />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bill-history"
          element={
            <ProtectedRoute>
              <BillHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/today-sales"
          element={
            <ProtectedRoute>
              <TodaySales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jewellery"
          element={

            <ProtectedRoute>
              <Jewellery />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
