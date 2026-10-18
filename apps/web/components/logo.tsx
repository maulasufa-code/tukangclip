/**
 * Marka TukangClip: bingkai klip dengan dua garis, digambar ulang dari logo PNG.
 * Warna garis mengikuti `currentColor`, jadi berubah ke tinta di atas panel kuning.
 * File mandiri berwarna kuning ada di /logo-tukangclip.svg.
 */
export function Logo({ className = "h-[22px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 134" fill="none" aria-hidden="true" className={className}>
      <path
        d="M13.5 98V72C13.5 40 40 17.5 82 17.5H158C200 17.5 226.5 40 226.5 72V98Q226.5 122.5 202 122.5H38Q13.5 122.5 13.5 98Z"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinejoin="round"
      />
      <path d="M97.5 67V92M145.5 67V92" stroke="currentColor" strokeWidth="15" strokeLinecap="round" />
    </svg>
  );
}
