const label: Record<string, string> = {
  queued: "Antre",
  transcribing: "Transkrip",
  analyzing: "Analisis",
  rendering: "Render",
  done: "Selesai",
  failed: "Gagal"
};

export function JobStatus({
  id,
  status,
  r2key
}: {
  id: string;
  status: string;
  r2key: string;
}) {
  return (
    <div>
      <p className="font-medium">{label[status] ?? status}</p>
      <p className="mt-1 text-xs text-stone-600">
        {r2key} · {id.slice(0, 8)}
      </p>
    </div>
  );
}
