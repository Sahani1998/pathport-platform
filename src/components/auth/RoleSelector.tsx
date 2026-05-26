import type { UserRole } from "@/types/auth";
import { ROLE_META } from "@/types/auth";
import { cn } from "@/lib/utils";

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-white/55 font-body text-sm mb-3 tracking-wide">
        I am a <span className="text-gold-400">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ROLE_META.map((role) => {
          const selected = value === role.value;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value)}
              className={cn(
                "relative flex items-start gap-3 p-4 rounded-xl border text-left",
                "transition-all duration-200 group",
                selected
                  ? "bg-gold-400/[0.10] border-gold-400/60 shadow-[0_0_16px_rgba(240,165,0,0.15)]"
                  : "bg-white/[0.04] border-white/[0.09] hover:border-white/20 hover:bg-white/[0.06]"
              )}
              aria-pressed={selected}
            >
              {/* Icon */}
              <span className="text-2xl flex-shrink-0 mt-0.5" role="img" aria-hidden>
                {role.icon}
              </span>
              {/* Text */}
              <div className="min-w-0">
                <p className={cn(
                  "font-body font-semibold text-sm leading-tight mb-0.5",
                  selected ? "text-gold-300" : "text-white/85"
                )}>
                  {role.label}
                </p>
                <p className="text-white/38 font-body text-xs leading-snug">
                  {role.description}
                </p>
              </div>
              {/* Selected indicator */}
              {selected && (
                <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-gold-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-navy-900" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
