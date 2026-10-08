"use client";

import { useRouter } from "next/navigation";

export function ShopFilterForm({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        
        for (const [key, value] of formData.entries()) {
          if (value && typeof value === "string") {
            params.append(key, value);
          }
        }
        
        router.push(`/shop?${params.toString()}`);
      }}
    >
      {children}
    </form>
  );
}
