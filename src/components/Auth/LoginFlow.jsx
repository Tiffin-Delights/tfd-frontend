import { useState } from "react";
import RoleSelectModal from "./RoleSelectModal";
import CustomerLoginModal from "./CustomerLoginModal";
import ProviderLoginModal from "./ProviderLoginModal";
import CustomerSignupModal from "./CustomerSignupModal";
import ProviderSignupModal from "./ProviderSignupModal";

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
  // step: null | "select" | "customer-login" | "provider-login" | "customer-signup" | "provider-signup"
  const [step, setStep] = useState(null);

  const open = () => setStep("select");
  const close = () => setStep(null);

  const selectRole = (role) => setStep(`${role}-login`);
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
      {step === "customer-login" && (
        <CustomerLoginModal
          onBack={goBack}
          onClose={close}
          onLoginSuccess={onCustomerLoginSuccess}
          onSwitchToSignup={() => setStep("customer-signup")}
        />
      )}

      {/* Step 2b – Provider Login */}
      {step === "provider-login" && (
        <ProviderLoginModal
          onBack={goBack}
          onClose={close}
          onLoginSuccess={onProviderLoginSuccess}
          onSwitchToSignup={() => setStep("provider-signup")}
        />
      )}

      {/* Step 3a – Customer Signup */}
      {step === "customer-signup" && (
        <CustomerSignupModal
          onBack={() => setStep("customer-login")}
          onClose={close}
          onSignupSuccess={onCustomerLoginSuccess}
        />
      )}

      {/* Step 3b – Provider Signup */}
      {step === "provider-signup" && (
        <ProviderSignupModal
          onBack={() => setStep("provider-login")}
          onClose={close}
          onSignupSuccess={onProviderLoginSuccess}
        />
      )}
    </>
  );
}

export default LoginFlow;
