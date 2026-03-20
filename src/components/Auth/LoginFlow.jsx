import { useState } from "react";
import RoleSelectModal from "./RoleSelectModal";
import CustomerLoginModal from "./CustomerLoginModal";
import ProviderLoginModal from "./ProviderLoginModal";

/**
 * LoginFlow
 *
 * Manages the three-step login modal flow:
 *   1. Role selection  (customer | provider)
 *   2. Customer Login Modal
 *   3. Provider Login Modal
 *
 * Usage:
 *   <LoginFlow>
 *     {(openLogin) => <button onClick={openLogin}>Log In</button>}
 *   </LoginFlow>
 */
function LoginFlow({ children, onCustomerLoginSuccess, onProviderLoginSuccess }) {
  // step: null | "select" | "customer" | "provider"
  const [step, setStep] = useState(null);

  const open = () => setStep("select");
  const close = () => setStep(null);

  const selectRole = (role) => setStep(role); // "customer" | "provider"
  const goBack = () => setStep("select");

  return (
    <>
      {/* Render trigger via render prop / children function */}
      {children(open)}

      {/* Step 1 – Role selection */}
      {step === "select" && (
        <RoleSelectModal onSelect={selectRole} onClose={close} />
      )}

      {/* Step 2a – Customer Login */}
      {step === "customer" && (
        <CustomerLoginModal
          onBack={goBack}
          onClose={close}
          onLoginSuccess={onCustomerLoginSuccess}
        />
      )}

      {/* Step 2b – Provider Login */}
      {step === "provider" && (
        <ProviderLoginModal
          onBack={goBack}
          onClose={close}
          onLoginSuccess={onProviderLoginSuccess}
        />
      )}
    </>
  );
}

export default LoginFlow;
