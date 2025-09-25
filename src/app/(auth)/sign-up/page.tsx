import SignUp from "@/components/sign-up";
import { getAuthConfig } from "lib/auth/config";

export default function SignUpPage() {
  const { socialAuthenticationProviders } = getAuthConfig();
  const enabledProviders = (
    Object.keys(
      socialAuthenticationProviders,
    ) as (keyof typeof socialAuthenticationProviders)[]
  ).filter((key) => socialAuthenticationProviders[key]);

  return <SignUp enabledProviders={enabledProviders} />;
}
