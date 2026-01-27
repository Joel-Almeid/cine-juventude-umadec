import { Flame } from 'lucide-react';

interface ScarcityBarProps {
  ticketsSold: number;
  ticketsTotal: number;
}

export function ScarcityBar({ ticketsSold, ticketsTotal }: ScarcityBarProps) {
  const remaining = ticketsTotal - ticketsSold;
  const percentage = (ticketsSold / ticketsTotal) * 100;

  return (
    <div className="bg-gradient-primary scarcity-pulse sticky top-0 z-50">
      <div className="container py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
        <Flame className="w-4 h-4 animate-pulse" />
        <span>
          Restam apenas <span className="font-bold">{remaining}</span> ingressos do 1º Lote!
        </span>
        <div className="hidden sm:flex items-center gap-2 ml-4">
          <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs opacity-80">{ticketsSold}/{ticketsTotal}</span>
        </div>
      </div>
    </div>
  );
}
