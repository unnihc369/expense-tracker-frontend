export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--fv-bp2)" }}
    >
      <div className="w-full max-w-md fv-card mb-0">{children}</div>
    </div>
  );
}
