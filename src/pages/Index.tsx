import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ScarcityBar } from '@/components/ScarcityBar';
import { ProductCard } from '@/components/ProductCard';
import { CheckoutModal } from '@/components/CheckoutModal';
import { CountdownTimer } from '@/components/CountdownTimer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Footer } from '@/components/Footer';
import { PRODUCTS, Product, Seller } from '@/lib/types';
import cinemaBg from '@/assets/cinema-bg.jpg';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [ticketsSold, setTicketsSold] = useState(15);
  const [ticketsTotal, setTicketsTotal] = useState(100);
  const [pixKey, setPixKey] = useState('cinejuventude@email.com');
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();

    // Parallax effect
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchData = async () => {
    const [sellersRes, settingsRes] = await Promise.all([
      supabase.from('sellers').select('*').eq('active', true),
      supabase.from('settings').select('*'),
    ]);

    if (sellersRes.data) {
      setSellers(sellersRes.data as unknown as Seller[]);
    }

    if (settingsRes.data) {
      const settings = settingsRes.data;
      const soldSetting = settings.find(s => s.key === 'tickets_sold');
      const totalSetting = settings.find(s => s.key === 'tickets_total');
      const pixSetting = settings.find(s => s.key === 'pix_key');

      if (soldSetting) setTicketsSold(Number(soldSetting.value));
      if (totalSetting) setTicketsTotal(Number(totalSetting.value));
      if (pixSetting) setPixKey(pixSetting.value);
    }

    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'settings' },
        (payload) => {
          const { key, value } = payload.new as { key: string; value: string };
          if (key === 'tickets_sold') setTicketsSold(Number(value));
          if (key === 'tickets_total') setTicketsTotal(Number(value));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePurchaseSuccess = (orderId: string) => {
    setSelectedProduct(null);
    navigate(`/ticket/${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Parallax Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${cinemaBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translateY(${scrollY * 0.3}px)`,
        }}
      />
      
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-background/85 pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <ScarcityBar ticketsSold={ticketsSold} ticketsTotal={ticketsTotal} />
        
        <Header />

        {/* Countdown Section */}
        <section className="container py-6">
          <CountdownTimer />
        </section>

        {/* Products Section */}
        <main className="container pb-12 flex-1">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display mb-2 neon-text-cyan animate-fade-in">GARANTA SEU INGRESSO</h2>
            <p className="text-muted-foreground animate-fade-in">Escolha a opção ideal para você</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRODUCTS.map((product, index) => (
              <div 
                key={product.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProductCard
                  product={product}
                  onSelect={setSelectedProduct}
                />
              </div>
            ))}
          </div>

          {/* Event Info */}
          <div className="mt-12 text-center glass-card max-w-md mx-auto p-6 animate-fade-in">
            <h3 className="font-display text-xl mb-4">📅 INFORMAÇÕES DO EVENTO</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Data:</strong> 14 de Fevereiro de 2026</p>
              <p><strong className="text-foreground">Horário:</strong> 19:30</p>
              <p><strong className="text-foreground">Organização:</strong> UMADEC & COMADESMA</p>
            </div>
          </div>
        </main>

        <Footer />

        <CheckoutModal
          product={selectedProduct}
          sellers={sellers}
          pixKey={pixKey}
          onClose={() => setSelectedProduct(null)}
          onSuccess={handlePurchaseSuccess}
        />
      </div>

      <WhatsAppButton />
    </div>
  );
};

export default Index;
