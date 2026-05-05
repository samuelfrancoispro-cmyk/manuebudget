import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import OnboardingProfil from "@/components/onboarding/OnboardingProfil";
import OnboardingComptesCourants from "@/components/onboarding/OnboardingComptesCourants";
import OnboardingEpargne from "@/components/onboarding/OnboardingEpargne";
import OnboardingBourse from "@/components/onboarding/OnboardingBourse";
import OnboardingRecurrents from "@/components/onboarding/OnboardingRecurrents";
import OnboardingObjectifs from "@/components/onboarding/OnboardingObjectifs";

const STEPS: Record<number, React.ComponentType> = {
  1: OnboardingProfil,
  2: OnboardingComptesCourants,
  3: OnboardingEpargne,
  4: OnboardingBourse,
  5: OnboardingRecurrents,
  6: OnboardingObjectifs,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile } = useStore();

  useEffect(() => {
    if (profile?.onboardingCompleted) {
      navigate("/dashboard", { replace: true });
    }
  }, [profile?.onboardingCompleted, navigate]);

  const currentStep = Math.max(1, profile?.onboardingStep ?? 1);
  const StepComponent = STEPS[currentStep] ?? STEPS[1];

  return <StepComponent />;
}
