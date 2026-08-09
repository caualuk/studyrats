"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";

export function UserMenu({
  user,
}: {
  user: { name: string; username: string; avatarUrl: string | null };
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [menuOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        aria-label="Abrir menu do perfil"
        aria-expanded={menuOpen}
        className="cursor-pointer rounded-full outline-none ring-accent transition-opacity hover:opacity-80 focus-visible:ring-2"
      >
        <Avatar src={user.avatarUrl} name={user.name} size="md" />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="animate-modal-in absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar src={user.avatarUrl} name={user.name} size="lg" />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{user.name}</div>
              <div className="truncate text-xs text-white/45">@{user.username}</div>
            </div>
          </div>
          <div className="h-px bg-border" />
          <Link
            href="/perfil"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-3 text-sm text-white transition-colors hover:bg-white/5"
          >
            Ver perfil
          </Link>
          <Link
            href="/configuracoes"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-3 text-sm text-white transition-colors hover:bg-white/5"
          >
            Configurações
          </Link>
        </div>
      )}
    </div>
  );
}
