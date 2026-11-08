import { createBrowserRouter, Navigate } from "react-router";
import { lazy } from "react";
import { Root } from "./Root";
import { AppShell, FocusLayout, RequireAuth } from "./layouts";
import { LoginPage } from "@/features/auth/LoginPage";

// Feature pages are lazy so each screen is its own chunk. Feature agents replace the stub files behind these paths.
const HomePage = lazy(() => import("@/features/home/HomePage"));
const TrainingPage = lazy(() => import("@/features/career/TrainingPage"));
const PortfolioPage = lazy(() => import("@/features/career/PortfolioPage"));
const JobsPage = lazy(() => import("@/features/career/JobsPage"));
const OnboardingPage = lazy(() => import("@/features/onboarding/OnboardingPage"));
const ObjectivePage = lazy(() => import("@/features/objective/ObjectivePage"));
const ReviewPage = lazy(() => import("@/features/stage/ReviewPage"));
const PresentationFeedbackPage = lazy(() => import("@/features/presentation/PresentationFeedbackPage"));
const StagePage = lazy(() => import("@/features/stage/StagePage"));
const PresentationPage = lazy(() => import("@/features/presentation/PresentationPage"));
const KitPage = lazy(() => import("./KitPage"));

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/__kit", element: <KitPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <HomePage /> },
              { path: "training", element: <TrainingPage /> },
              { path: "training/:kind", element: <TrainingPage /> },
              { path: "portfolio", element: <PortfolioPage /> },
              { path: "jobs", element: <JobsPage /> },
            ],
          },
          {
            element: <FocusLayout />,
            children: [
              { path: "onboarding", element: <OnboardingPage /> },
              { path: "objective/:objectiveId", element: <ObjectivePage /> },
              { path: "objective/:objectiveId/review", element: <ReviewPage /> },
              { path: "objective/:objectiveId/feedback", element: <PresentationFeedbackPage /> },
              { path: "objective/:objectiveId/stage/:stageId", element: <StagePage /> },
              { path: "objective/:objectiveId/stage/:stageId/present", element: <PresentationPage /> },
            ],
          },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
