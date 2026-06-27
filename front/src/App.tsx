import { AnimatePresence } from "motion/react";
import { Routes, Route, useLocation } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MovieDetailPage } from "./pages/MovieDetailPage";
import { BattlePage } from "./pages/BattlePage";

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/battle" element={<BattlePage />} />
      </Routes>
    </AnimatePresence>
  );
}
