import { NaverLoginHandler } from "@/features/auth/social-login/ui/NaverLoginHandler";

export default function NaverCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <NaverLoginHandler />
    </div>
  );
}
