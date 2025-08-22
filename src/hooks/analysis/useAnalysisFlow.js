import { useState } from "react";

export const useAnalysisFlow = () => {
  const [step, setStep] = useState("instruction"); // instruction | preview

  const goToInstruction = () => {
    setStep("instruction");
  };

  const goToPreview = () => {
    setStep("preview");
  };

  const resetFlow = () => {
    setStep("instruction");
  };

  return {
    step,
    setStep,
    goToInstruction,
    goToPreview,
    resetFlow,
  };
};
