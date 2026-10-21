export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <aside className="hidden bg-brand-dark p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Placeholder: swap for your real logo */}
        <span className="font-heading text-3xl font-extrabold tracking-tight">
          ROUTING<span className="font-semibold">.com</span>
        </span>
        <div>
          <p className="font-heading text-3xl font-bold leading-snug">
            Where Music
            <br />
            Gets Produced.
          </p>
          <p className="mt-3 max-w-sm text-sm text-white/70">
            {/* Platform &amp; marketplace produksi musik end-to-end di Indonesia. */}
            End-to-end music production platform & marketplace in Indonesia.
          </p>
        </div>
      </aside>

      <main className="flex justify-center px-4 py-10 sm:px-8 lg:items-center">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  )
}