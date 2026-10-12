import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./pages/HomePage";
import { FaultLabPage } from "./pages/FaultLabPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TwoFactorChallengePage } from "./pages/TwoFactorChallengePage";
import { TwoFactorSetupPage } from "./pages/TwoFactorSetupPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { ModelInsightsPage } from "./pages/ModelInsightsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="lab" element={<FaultLabPage />} />
        <Route path="methodology" element={<MethodologyPage />} />
        <Route path="insights" element={<ModelInsightsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="2fa" element={<TwoFactorChallengePage />} />
        <Route path="2fa/setup" element={<TwoFactorSetupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
