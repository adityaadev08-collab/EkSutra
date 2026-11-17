// =============================================================================
// app/apply/[id]/page.tsx — Dynamic Application Workspace Route
// =============================================================================
// WHY HERE: 
//   In Next.js App Router, folder names wrapped in square brackets like [id]
//   create dynamic URL route segments (/apply/scheme_001, /apply/12, etc.).
// =============================================================================

import Link from 'next/link'

// Opt-out of static build prerendering for dynamic route parameters in Next.js 16
export const instant = false

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const title = decodeURIComponent(id)
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 text-[#152d4d]">
      <section className="w-full max-w-lg rounded-[30px] border border-white bg-white/75 p-8 shadow-xl backdrop-blur-xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c27717]">
          Citizen Application
        </p>
        <h1 className="mt-3 font-serif text-3xl md:text-4xl tracking-[-0.04em] text-[#152d4d]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#718095]">
          Your application workspace is ready. Sign in with your citizen credentials to link your Aadhaar and submit required documentation.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/login"
            className="rounded-full bg-[#152d4d] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#22446d]"
          >
            Sign in to continue
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[#152d4d]/10 px-5 py-3 text-sm font-semibold text-[#152d4d] transition hover:bg-black/5"
          >
            Back to Catalog
          </Link>
        </div>
      </section>
    </main>
  )
}

