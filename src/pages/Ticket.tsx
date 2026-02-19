import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, RefreshCw, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/lib/types';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import confetti from 'canvas-confetti';
import ticketTemplate from '@/assets/ticket-template.png';

export default function Ticket() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (order && order.status === 'paid') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#06b6d4', '#ec4899'],
      });
    }
  }, [order]);

  const renderTicket = useCallback(() => {
    if (!canvasRef.current || !order) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      // Ensure Caveat font is loaded before drawing
      try {
        await document.fonts.load('bold 32px "Caveat"');
      } catch (e) {
        // fallback if font API not available
      }

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Draw the customer name on the "Nome: ___" line
      const nameX = img.naturalWidth * 0.24;
      const nameY = img.naturalHeight * 0.085;
      const fontSize = Math.max(28, img.naturalWidth * 0.04);

      ctx.font = `bold italic ${fontSize}px "Caveat", Georgia, serif`;
      ctx.fillStyle = '#1a1a6e';
      ctx.textBaseline = 'middle';
      ctx.fillText(order.customer_name, nameX, nameY);

      setCanvasReady(true);
    };
    img.src = ticketTemplate;
  }, [order]);

  useEffect(() => {
    if (order) {
      renderTicket();
    }
  }, [order, renderTicket]);

  const fetchOrder = async () => {
    if (!orderId) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      navigate('/');
      return;
    }

    setOrder(data as unknown as Order);
    setLoading(false);
  };

  const downloadTicket = async () => {
    if (!canvasRef.current) return;

    setDownloading(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png', 1);
      const link = document.createElement('a');
      link.download = `ingresso-${order?.order_code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading ticket:', error);
    } finally {
      setDownloading(false);
    }
  };

  const sendToWhatsApp = () => {
    const text = encodeURIComponent(
      `🎬 Meu ingresso para o Cine Jovem está garantido! Nos vemos dia 21/02! 🍿`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order || order.status === 'cancelled') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-display mb-2">Ingresso Inválido</h1>
        <p className="text-muted-foreground mb-6">Este ingresso foi cancelado ou não existe.</p>
        <Button onClick={() => navigate('/')} className="btn-neon">
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      {/* Ticket rendered on canvas */}
      <canvas
        ref={canvasRef}
        className="w-full max-w-lg h-auto"
        style={{ display: canvasReady ? 'block' : 'none' }}
      />
      {!canvasReady && (
        <div className="w-full max-w-lg flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-lg mt-6 space-y-3">
        <Button
          onClick={downloadTicket}
          disabled={downloading || !canvasReady}
          className="w-full btn-neon text-primary-foreground py-6 text-lg font-semibold"
        >
          {downloading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Download className="w-5 h-5 mr-2" />
          )}
          Baixar Ingresso
        </Button>

        <Button
          onClick={sendToWhatsApp}
          className="w-full py-6 text-lg font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}
        >
          <MessageCircle className="w-5 h-5 mr-2" fill="white" />
          Enviar para WhatsApp
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="w-full py-6 text-lg font-semibold border-secondary text-secondary hover:bg-secondary/10"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Comprar Novo Ingresso
        </Button>
      </div>

      <WhatsAppButton />
    </div>
  );
}
