import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { Download, RefreshCw, Film, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Order, ProductType } from '@/lib/types';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import confetti from 'canvas-confetti';

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
      // Celebrate with confetti!
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

  const handleBuyAnother = () => {
    navigate('/');
  };

  const getProductEmoji = (type: ProductType) => {
    switch (type) {
      case 'single': return '🎟️';
      case 'combo_individual': return '🍿';
      case 'combo_couple': return '👥';
      default: return '🎬';
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
      {/* Ticket Card - Vertical Stories Format */}
      <div
        ref={ticketRef}
        className="w-full max-w-sm ticket-container p-0 animate-scale-in"
        style={{ aspectRatio: '9/16' }}
      >
        {/* Film strip top */}
        <div className="film-strip" />

        {/* Content */}
        <div className="p-6 flex flex-col h-full" style={{ height: 'calc(100% - 48px)' }}>
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Film className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-display neon-text-purple">CINE JUVENTUDE</h1>
            </div>
            <p className="text-xs text-muted-foreground tracking-widest">UMADEC & COMADESMA</p>
          </div>

          {/* Movie Poster Placeholder */}
          <div className="relative mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 aspect-video flex items-center justify-center">
            <div className="text-6xl">{getProductEmoji(order.product_type)}</div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-3">
              <p className="font-display text-lg">{order.product_name}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="glass-card p-4 mb-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">PARTICIPANTE</span>
              <span className="text-sm font-semibold">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">PEDIDO</span>
              <span className="text-sm font-mono text-primary">{order.order_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">STATUS</span>
              <span className={`text-sm font-semibold ${order.status === 'used' ? 'text-muted-foreground' : 'text-success'}`}>
                {order.status === 'used' ? '✅ UTILIZADO' : '✨ VÁLIDO'}
              </span>
            </div>
          </div>

          {/* Physical Ticket Alert */}
          <div className="glass-card p-3 mb-3 bg-accent/10 border border-accent/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-accent">
                <strong>IMPORTANTE:</strong> Apresente este QR Code na recepção para retirar seu INGRESSO FÍSICO.
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="qr-container p-3 mb-2">
              <QRCodeSVG
                value={`CINE-JUVENTUDE:${order.order_code}`}
                size={130}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-muted-foreground">Apresente este QR Code na entrada</p>
          </div>
        </div>

        {/* Film strip bottom */}
        <div className="film-strip" />
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm mt-6 space-y-3">
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
          onClick={handleBuyAnother}
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
