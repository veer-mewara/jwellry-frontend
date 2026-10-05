"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="pageShell">
      <div className="emptyState" role="alert">
        <span className="eyebrow">Something went wrong</span>
        <h2>We couldn’t show this page</h2>
        <p>An unexpected error occurred. Please try again, or head back to the home page.</p>
        <div className="statusActions">
          <button type="button" className="button buttonDark" onClick={() => retry()}>Try again</button>
          <Link href="/" className="button buttonOutline">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
