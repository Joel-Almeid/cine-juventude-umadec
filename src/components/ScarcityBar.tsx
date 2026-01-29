import { Flame } from 'lucide-react';

interface ScarcityBarProps {
  ticketsSold: number;
}

export function ScarcityBar({ ticketsSold }: ScarcityBarProps) {
  const maxCapacity = 50;
  const remaining = maxCapacity - ticketsSold;
  const percentage = (ticketsSold / maxCapacity) * 100;

  return (
    <div className="bg-gradient-primary scarcity-pulse sticky top-0 z-50">
      <div className="container py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
        <Flame className="w-4 h-4 animate-pulse" />
        <span>
          🔥 CORRE! Mais de {Math.round(percentage)}% da sala já ocupada! Restam apenas{' '}
          <span className="font-bold text-cyan-300">{remaining}</span> lugares!
        </span>
        <div className="hidden sm:flex items-center gap-2 ml-4">
          <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className="text-xs opacity-80">{ticketsSold}/{maxCapacity}</span>
        </div>
      </div>
    </div>
  );
}
