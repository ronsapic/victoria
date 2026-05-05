import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return <SignupForm />;
}
