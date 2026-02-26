export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-bg px-4 sm:px-6 py-6 sm:py-10">
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
  );
}
