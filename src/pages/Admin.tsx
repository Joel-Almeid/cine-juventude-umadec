import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  QrCode, 
  LogOut, 
  Search, 
  ExternalLink, 
  XCircle,
  Check,
  Loader2,
  DollarSign,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Order, Seller } from '@/lib/types';
import { toast } from 'sonner';

const ADMIN_PASSWORD = 'cinejuventude2024';

export default function Admin() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [receiptModal, setReceiptModal] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<Order | null>(null);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_auth');
    if (isAuth === 'true') {
      setAuthenticated(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [ordersRes, sellersRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('sellers').select('*').order('total_sales', { ascending: false }),
    ]);

    if (ordersRes.data) setOrders(ordersRes.data as unknown as Order[]);
    if (sellersRes.data) setSellers(sellersRes.data as unknown as Seller[]);
    
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      setAuthenticated(true);
      fetchData();
    } else {
      toast.error('Senha incorreta!');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setAuthenticated(false);
  };

  const searchTicket = async () => {
    if (!searchCode.trim()) {
      toast.error('Digite um código de ingresso');
      return;
    }

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('order_code', searchCode.trim().toUpperCase())
      .single();

    if (data) {
      setFoundOrder(data as unknown as Order);
    } else {
      toast.error('Ingresso não encontrado');
      setFoundOrder(null);
    }
  };

  const validateTicket = async (order: Order) => {
    if (order.status === 'used') {
      toast.error('Ingresso já foi utilizado!');
      return;
    }
    if (order.status === 'cancelled') {
      toast.error('Ingresso cancelado!');
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', order.id);

    if (!error) {
      toast.success('✅ Check-in realizado com sucesso!');
      setFoundOrder({ ...order, status: 'used' });
      fetchData();
    }
  };

  const cancelOrder = async (order: Order) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id);

    if (!error) {
      toast.success('Pedido cancelado');
      setCancelModal(null);
      fetchData();
    }
  };

  // Calculate stats
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.price), 0);
  const totalTickets = orders.filter(o => o.status !== 'cancelled').length;
  const usedTickets = orders.filter(o => o.status === 'used').length;

  // Calculate seller rankings
  const sellerRankings = sellers.map(seller => ({
    ...seller,
    sales: orders.filter(o => o.seller_id === seller.id && o.status !== 'cancelled').length,
    revenue: orders.filter(o => o.seller_id === seller.id && o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.price), 0),
  })).sort((a, b) => b.sales - a.sales);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl neon-text-purple">ÁREA ADMIN</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted border-border"
              />
              <Button type="submit" className="w-full btn-neon">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card rounded-none border-x-0 border-t-0 p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            <h1 className="font-display text-xl">PAINEL ADMIN</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/20">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendido</p>
                <p className="text-2xl font-bold neon-text-cyan">R$ {totalRevenue.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingressos Emitidos</p>
                <p className="text-2xl font-bold">{totalTickets}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/20">
                <Check className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-ins</p>
                <p className="text-2xl font-bold">{usedTickets}/{totalTickets}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="orders">
              <Users className="w-4 h-4 mr-2" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="ranking">
              <Trophy className="w-4 h-4 mr-2" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="checkin">
              <QrCode className="w-4 h-4 mr-2" />
              Check-in
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4">
            <Card className="glass-card">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-primary">{order.order_code}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{order.product_name}</TableCell>
                        <TableCell>R$ {Number(order.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.status === 'paid' ? 'bg-success/20 text-success' :
                            order.status === 'used' ? 'bg-muted text-muted-foreground' :
                            'bg-destructive/20 text-destructive'
                          }`}>
                            {order.status === 'paid' ? 'Pago' : 
                             order.status === 'used' ? 'Utilizado' : 'Cancelado'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {order.receipt_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReceiptModal(order.receipt_url)}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            {order.status === 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setCancelModal(order)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="mt-4">
            <Card className="glass-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posição</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Vendas</TableHead>
                      <TableHead>Faturamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellerRankings.map((seller, index) => (
                      <TableRow key={seller.id}>
                        <TableCell>
                          <span className={`text-lg ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-400' :
                            index === 2 ? 'text-amber-600' : ''
                          }`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">{seller.name}</TableCell>
                        <TableCell>{seller.sales}</TableCell>
                        <TableCell className="text-success">R$ {seller.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Check-in Tab */}
          <TabsContent value="checkin" className="mt-4">
            <Card className="glass-card">
              <CardContent className="p-6 space-y-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código do ingresso (ex: CJ-ABC123)"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    className="bg-muted border-border font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && searchTicket()}
                  />
                  <Button onClick={searchTicket} className="btn-neon shrink-0">
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>

                {foundOrder && (
                  <div className={`glass-card p-4 border-2 ${
                    foundOrder.status === 'paid' ? 'border-success' :
                    foundOrder.status === 'used' ? 'border-muted' : 'border-destructive'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-mono text-lg text-primary">{foundOrder.order_code}</p>
                        <p className="text-xl font-semibold">{foundOrder.customer_name}</p>
                        <p className="text-muted-foreground">{foundOrder.product_name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${
                        foundOrder.status === 'paid' ? 'bg-success/20 text-success' :
                        foundOrder.status === 'used' ? 'bg-muted text-muted-foreground' :
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {foundOrder.status === 'paid' ? '✅ VÁLIDO' : 
                         foundOrder.status === 'used' ? '⚠️ JÁ USADO' : '❌ CANCELADO'}
                      </span>
                    </div>

                    {foundOrder.status === 'paid' && (
                      <Button 
                        onClick={() => validateTicket(foundOrder)}
                        className="w-full btn-neon py-6 text-lg"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        CONFIRMAR ENTRADA
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Receipt Modal */}
      <Dialog open={!!receiptModal} onOpenChange={() => setReceiptModal(null)}>
        <DialogContent className="glass-card max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprovante</DialogTitle>
          </DialogHeader>
          {receiptModal && (
            <img src={receiptModal} alt="Comprovante" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={!!cancelModal} onOpenChange={() => setCancelModal(null)}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancelar Pedido</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja cancelar o pedido <strong>{cancelModal?.order_code}</strong>?</p>
          <p className="text-sm text-muted-foreground">
            O ingresso de {cancelModal?.customer_name} será invalidado.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModal(null)}>
              Voltar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => cancelModal && cancelOrder(cancelModal)}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
