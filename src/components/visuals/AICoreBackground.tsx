import AICoreOrb from './AICoreOrb';
import { aeOrbTheme, type AICoreIntensity, type AICoreVariant } from './orb-config';

interface AICoreBackgroundProps {
  variant?: AICoreVariant;
  intensity?: AICoreIntensity;
  className?: string;
  interactive?: boolean;
  reducedMotion?: boolean;
}

export function AICoreBackground({
  variant = 'hero',
  intensity = 'medium',
  className = '',
  interactive = true,
  reducedMotion = false,
}: AICoreBackgroundProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(circle at 72% 44%, ${aeOrbTheme.cyan}36 0%, transparent 34%), ` +
            `radial-gradient(circle at 56% 60%, ${aeOrbTheme.violet}28 0%, transparent 36%), ` +
            `linear-gradient(135deg, ${aeOrbTheme.background} 0%, ${aeOrbTheme.deepNavy} 100%)`,
        }}
      />
      <div className="absolute right-[-18%] top-[-18%] h-[560px] w-[560px] rounded-full bg-[#18C8FF]/10 blur-3xl" />
      <div className="absolute bottom-[-32%] left-[12%] h-[420px] w-[420px] rounded-full bg-[#7C3AED]/12 blur-3xl" />
      <div className="absolute inset-y-[-6%] right-[-4%] w-[74%] opacity-95">
        <AICoreOrb
          variant={variant}
          intensity={intensity}
          interactive={interactive}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
