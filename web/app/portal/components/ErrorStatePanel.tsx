type ErrorStatePanelProps = {
  message: string;
};

export function ErrorStatePanel({ message }: ErrorStatePanelProps) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <p className="text-sm text-red-800">{message}</p>
    </section>
  );
}
