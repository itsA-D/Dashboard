export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/60 bg-white/85 p-8 shadow-card">{children}</div>
    </main>
  );
}
