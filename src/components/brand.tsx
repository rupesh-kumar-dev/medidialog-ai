import { Link } from "@tanstack/react-router";
import { HeartPulse, Loader2 } from "lucide-react";

import logoAsset from "@/assets/logo.asset.json";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn("inline-flex items-center gap-2", className)}
      aria-label="MediSage AI home"
    >
      <img
        src={logoAsset.url}
        alt="MediSage AI logo"
        width={40}
        height={40}
        className="h-10 w-10 rounded-lg object-contain"
      />
      {withWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight">MediSage AI</span>
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Your Personal Healthcare Assistant
          </span>
        </span>
      ) : null}
    </Link>
  );
}

export function AiAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "gradient-brand inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <HeartPulse className="h-4 w-4" />
    </span>
  );
}

export function BrandLoader({ label = "MediSage AI is working…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="gradient-brand flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </span>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function TypingDots() {
  return (
    <span className="flex items-center gap-1" aria-label="MediSage AI is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-1.5 w-1.5 rounded-full bg-primary"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
