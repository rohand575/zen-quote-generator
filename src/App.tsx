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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppShell>
                <Dashboard />
              </AppShell>
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute>
              <AppShell>
                <Clients />
              </AppShell>
            </ProtectedRoute>
          } />
          <Route path="/items" element={
            <ProtectedRoute>
              <AppShell>
                <Items />
              </AppShell>
            </ProtectedRoute>
          } />
          <Route path="/quotations" element={
            <ProtectedRoute>
              <AppShell>
                <Quotations />
              </AppShell>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
