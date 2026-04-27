export const metadata = {
  title: "Returns | Northline Goods",
  description: "Returns policy placeholder.",
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Policy
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Returns
        </h1>
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>Please contact support within 7 days of delivery for return requests.</p>
          <p>Returned items must be unused, unworn, and in original packaging.</p>
          <p>Return approval is handled manually after review.</p>
          <p>Refund timing depends on the return method and inspection result.</p>
        </div>
      </div>
    </div>
  );
}
