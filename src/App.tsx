import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Items from "./pages/Items";
import Quotations from "./pages/Quotations";
import CreateQuotation from "./pages/CreateQuotation";
import Templates from "./pages/Templates";
import QuotationPrint from "./pages/QuotationPrint";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// 👇 add this (optional but clean)
const basename =
  import.meta.env.BASE_URL.replace(/\/$/, ""); // trims trailing "/"

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* 👇 IMPORTANT: add basename */}
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Clients />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/items"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Items />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Quotations />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/create"
            element={
              <ProtectedRoute>
                <AppShell>
                  <CreateQuotation />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/:id/edit"
            element={
              <ProtectedRoute>
                <AppShell>
                  <CreateQuotation />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/:id/print"
            element={
              <ProtectedRoute>
                <AppShell>
                  <QuotationPrint />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Templates />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
