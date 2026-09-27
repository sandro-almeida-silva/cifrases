import Image from "next/image";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "justify-center" : ""}`}>
      <Image src="/icons/cifrases.svg" alt="" width={36} height={36} priority />
      <span className={compact ? "hidden" : "text-lg font-black tracking-[-0.04em]"}>Cifrases</span>
    </div>
  );
}
