export const metadata = {
  title: "Privacy | Northline Goods",
  description: "Privacy policy placeholder.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Policy
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Privacy
        </h1>
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>We only collect information needed to process and deliver orders.</p>
          <p>Your contact details are used for order communication and shipping.</p>
          <p>We do not sell customer data.</p>
          <p>Administrative access is limited to authorized team members only.</p>
        </div>
      </div>
    </div>
  );
}
