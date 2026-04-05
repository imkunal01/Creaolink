import AuthTicker from "./components/AuthTicker";
import AuthNavbar from "./components/AuthNavbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <AuthNavbar />

      {/* Centered content area */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-[460px]">
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
