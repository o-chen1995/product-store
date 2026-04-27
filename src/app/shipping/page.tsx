export const metadata = {
  title: "Shipping | Northline Goods",
  description: "Shipping policy placeholder.",
};

export default function ShippingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Policy
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Shipping
        </h1>
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>Orders are processed after manual confirmation from our team.</p>
          <p>Processing time: 1-3 business days after confirmation.</p>
          <p>Shipping time depends on the destination and carrier service.</p>
          <p>Please make sure your shipping address is complete and accurate.</p>
        </div>
      </div>
    </div>
  );
}
