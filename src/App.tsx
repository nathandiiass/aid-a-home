import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateRequest from "./pages/CreateRequest";
import Success from "./pages/Success";
import Inbox from "./pages/Inbox";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Locations from "./pages/Locations";
import SpecialistRegistration from "./pages/SpecialistRegistration";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Chat from "./pages/Chat";
import SpecialistHome from "./pages/SpecialistHome";
import SpecialistOrders from "./pages/SpecialistOrders";
import SpecialistRequestDetail from "./pages/SpecialistRequestDetail";
import QuoteForm from "./pages/QuoteForm";
import SpecialistProfile from "./pages/SpecialistProfile";
import UserProfile from "./pages/UserProfile";
import UserPersonalInfoPage from "./pages/UserPersonalInfoPage";
import SpecialistPersonalInfo from "./pages/SpecialistPersonalInfo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create-request" element={<CreateRequest />} />
          <Route path="/success" element={<Success />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/personal-info" element={<UserPersonalInfoPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/specialist-registration" element={<SpecialistRegistration />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/chat/:quoteId" element={<Chat />} />
          <Route path="/specialist" element={<SpecialistHome />} />
          <Route path="/specialist/orders" element={<SpecialistOrders />} />
          <Route path="/specialist/profile" element={<SpecialistProfile />} />
          <Route path="/specialist/requests/:id" element={<SpecialistRequestDetail />} />
          <Route path="/specialist/requests/:id/quote" element={<QuoteForm />} />
          <Route path="/specialist/:specialistId/profile" element={<SpecialistProfile />} />
          <Route path="/user/:userId/profile" element={<UserProfile />} />
          <Route path="/specialist/personal-info" element={<SpecialistPersonalInfo />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
