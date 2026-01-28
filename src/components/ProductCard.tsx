import { Check, Sparkles, Ticket } from 'lucide-react';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <div className={`product-card relative animate-fade-in ${product.popular ? 'border-gradient' : ''}`}>
      {product.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          MAIS VENDIDO
        </div>
      )}
      
      <div className="text-4xl mb-4 float-animation">{product.icon}</div>
      
      <h3 className="text-xl font-display tracking-wide mb-2">{product.name}</h3>
      <p className="text-muted-foreground text-sm mb-4">{product.description}</p>
      
      <div className="mb-4">
        <span className="text-3xl font-bold neon-text-cyan">
          R$ {product.price.toFixed(2).replace('.', ',')}
        </span>
      </div>
      
      <ul className="text-sm text-muted-foreground space-y-2 mb-6">
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-success" />
          Entrada garantida
        </li>
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-success" />
          Ingresso digital
        </li>
        {product.id !== 'single' && (
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            Pipoca + Refri incluso
          </li>
        )}
        <li className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-success" />
          Retirada do Ingresso Físico inclusa
        </li>
      </ul>
      
      <Button 
        onClick={() => onSelect(product)}
        className="w-full btn-neon text-primary-foreground py-6 text-lg font-semibold"
      >
        COMPRAR AGORA
      </Button>
    </div>
  );
}
