import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/lib/types';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import confetti from 'canvas-confetti';
import ticketTemplate from '@/assets/ticket-template.png';

export default function Ticket() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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
    if (!ticketRef.current) return;
    
    setDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        quality: 1,
        pixelRatio: 2,
      });

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
      {/* Custom Ticket with physical template */}
      <div
        ref={ticketRef}
        className="relative w-full max-w-lg animate-scale-in"
      >
        <img
          src={ticketTemplate}
          alt="Ingresso Cine Jovem"
          className="w-full h-auto"
          crossOrigin="anonymous"
        />
        {/* Name overlay on the "Nome: ___" line */}
        <div
          className="absolute"
          style={{
            top: '3.5%',
            left: '18%',
            right: '5%',
            fontSize: 'clamp(14px, 3.2vw, 28px)',
            fontFamily: '"Bebas Neue", cursive',
            color: '#3a1a0a',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {order.customer_name}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-lg mt-6 space-y-3">
        <Button
          onClick={downloadTicket}
          disabled={downloading}
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
