export const metadata = {
  title: "Terms | Northline Goods",
  description: "Terms placeholder.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Policy
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Terms
        </h1>
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>All orders are subject to stock availability and manual review.</p>
          <p>Product details, prices, and availability may change without notice.</p>
          <p>We may contact you to confirm shipping details before fulfillment.</p>
          <p>By placing an order, you agree to our store policies and order terms.</p>
        </div>
      </div>
    </div>
  );
}
