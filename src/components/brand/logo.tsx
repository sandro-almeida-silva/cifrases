import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image src="/icons/cifrases.svg" alt="" width={36} height={36} priority />
      <span className="text-lg font-black tracking-[-0.04em]">Cifrases</span>
    </div>
  );
}
