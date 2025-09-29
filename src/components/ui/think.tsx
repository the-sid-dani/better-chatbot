"use client";

import Image from "next/image";

export const Think = () => {
  return (
    <div className="h-6 w-6 flex items-center justify-center">
      <Image
        src="/samba-resources/logos/samba-logo-2024.png"
        alt="Samba Logo"
        width={24}
        height={24}
        className="object-contain"
      />
    </div>
  );
};
