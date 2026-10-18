import { Chip } from "@/components/ui";

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
  const namaFile = r2key.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "") ?? r2key;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <p className="truncate font-medium">{namaFile}</p>
        <p className="mt-1 text-sm text-stone-700">Job {id.slice(0, 8)}</p>
      </div>
      <div className="flex items-center gap-3">
        <Chip nada={status === "failed" ? "bahaya" : status === "done" ? "aktif" : "netral"}>
          {label[status] ?? status}
        </Chip>
        {status === "done" && (
          <a href={`/studio/${id}`} className="inline-flex min-h-[44px] items-center text-sm font-medium underline underline-offset-4">
            Buka studio
          </a>
        )}
      </div>
    </div>
  );
}
