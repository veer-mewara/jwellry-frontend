import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pageShell">
      <div className="emptyState">
        <span className="eyebrow">Error 404</span>
        <h2>Page not found</h2>
        <p>The page you are looking for may have moved or no longer exists. Let us help you find your way back.</p>
        <div className="statusActions">
          <Link href="/shop" className="button buttonDark">Shop jewellery</Link>
          <Link href="/" className="button buttonOutline">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
