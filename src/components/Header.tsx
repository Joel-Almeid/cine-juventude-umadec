import { Film } from 'lucide-react';

export function Header() {
  return (
    <header className="py-8 px-4 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Film className="w-10 h-10 text-primary" />
        <h1 className="text-4xl sm:text-5xl font-display neon-text-purple tracking-wider">
          CINE JUVENTUDE
        </h1>
      </div>
      <p className="text-muted-foreground text-sm tracking-widest">
        UMADEC & COMADESMA
      </p>
    </header>
  );
}
