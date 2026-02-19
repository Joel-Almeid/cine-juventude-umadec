import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Target date: 14/02/2026 às 19:30 (considering current date context)
    const targetDate = new Date('2026-02-21T19:30:00-03:00');

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="glass-card px-3 py-2 md:px-4 md:py-3 min-w-[50px] md:min-w-[70px]">
        <span className="text-xl md:text-3xl font-bold neon-text-purple font-mono">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{label}</span>
    </div>
  );

  return (
    <div className="glass-card p-4 md:p-6 text-center animate-fade-in">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-secondary" />
        <h3 className="font-display text-lg md:text-xl tracking-wide">O EVENTO COMEÇA EM</h3>
      </div>
      
      <div className="flex justify-center items-center gap-2 md:gap-4">
        <TimeBlock value={timeLeft.days} label="Dias" />
        <span className="text-2xl text-muted-foreground font-bold">:</span>
        <TimeBlock value={timeLeft.hours} label="Horas" />
        <span className="text-2xl text-muted-foreground font-bold">:</span>
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <span className="text-2xl text-muted-foreground font-bold">:</span>
        <TimeBlock value={timeLeft.seconds} label="Seg" />
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        📅 21 de Fevereiro às 19:30
      </p>
    </div>
  );
}
