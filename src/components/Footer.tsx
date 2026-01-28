import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="py-6 border-t border-border/50 mt-auto">
      <div className="container flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          © 2026 Cine Juventude - UMADEC - COMADESMA
        </p>
        <button
          onClick={() => navigate('/admin')}
          className="p-2 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
          aria-label="Área administrativa"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
}
