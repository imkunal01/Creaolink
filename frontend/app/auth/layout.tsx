import AuthTicker from "./components/AuthTicker";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Centered content area */}
      <div className="flex-1 flex items-start md:items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              CreaoLink
            </h1>
          </div>
          {children}
        </div>
      </div>

      {/* Bottom ticker */}
      <div className="py-4 sm:py-6 border-t border-border/50">
        <AuthTicker />
      </div>
    </div>
  );
}
