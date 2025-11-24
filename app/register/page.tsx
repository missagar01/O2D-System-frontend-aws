"use client";

import { RegisterView } from "@/components/register-view";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <RegisterView />
      </div>
    </div>
  );
}
