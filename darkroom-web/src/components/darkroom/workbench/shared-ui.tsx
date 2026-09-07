export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background p-3">
      <dt className="label-tech">{label}</dt>
      <dd className="mt-2 font-medium uppercase">{value}</dd>
    </div>
  );
}
