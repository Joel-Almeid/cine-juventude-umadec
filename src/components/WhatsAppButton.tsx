import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const handleClick = () => {
    window.open('https://wa.me/5563992218495?text=Ol%C3%A1!%20Estou%20com%20uma%20d%C3%BAvida%20sobre%20a%20compra%20do%20ingresso%20para%20o%20Cine%20Jovem.', '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl animate-fade-in"
      style={{ backgroundColor: '#25D366' }}
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" fill="white" />
    </button>
  );
}
