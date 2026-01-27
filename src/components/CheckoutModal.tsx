import { useState, useRef } from 'react';
import { X, Upload, Copy, Check, Loader2, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, Seller } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CheckoutModalProps {
  product: Product | null;
  sellers: Seller[];
  pixKey: string;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export function CheckoutModal({ product, sellers, pixKey, onClose, onSuccess }: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatWhatsApp(e.target.value));
  };

  const copyPixKey = async () => {
    await navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success('Chave PIX copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const generateOrderCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CJ-${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !name || !whatsapp || !sellerId || !receiptFile) {
      toast.error('Preencha todos os campos e anexe o comprovante!');
      return;
    }

    setLoading(true);

    try {
      // Upload receipt to storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Create order
      const orderCode = generateOrderCode();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          customer_name: name,
          customer_whatsapp: whatsapp.replace(/\D/g, ''),
          seller_id: sellerId,
          product_type: product.id,
          product_name: product.name,
          price: product.price,
          status: 'paid',
          receipt_url: publicUrl,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update tickets sold
      const { data: currentSettings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'tickets_sold')
        .single();

      if (currentSettings) {
        const ticketsToAdd = product.id === 'combo_couple' ? 2 : 1;
        await supabase
          .from('settings')
          .update({ value: String(Number(currentSettings.value) + ticketsToAdd) })
          .eq('key', 'tickets_sold');
      }

      toast.success('Compra realizada com sucesso!');
      onSuccess(order.id);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao processar compra. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="glass-card border-primary/20 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <span className="text-3xl">{product.icon}</span>
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="bg-muted border-border focus:border-primary input-neon"
                required
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={handleWhatsAppChange}
                placeholder="(99) 99999-9999"
                maxLength={15}
                className="bg-muted border-border focus:border-primary input-neon"
                required
              />
            </div>

            <div>
              <Label htmlFor="seller">Quem te convidou?</Label>
              <Select value={sellerId} onValueChange={setSellerId} required>
                <SelectTrigger className="bg-muted border-border focus:border-primary">
                  <SelectValue placeholder="Selecione o vendedor" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Section */}
          <div className="glass-card p-4 space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor a pagar</p>
              <p className="text-3xl font-bold neon-text-cyan">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="qr-container">
                <QrCode className="w-32 h-32 text-background" />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Chave PIX (E-mail)</Label>
              <div className="flex gap-2">
                <Input
                  value={pixKey}
                  readOnly
                  className="bg-muted border-border text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyPixKey}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <Label>📸 Anexar Comprovante (Obrigatório)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full mt-2 h-20 border-dashed ${receiptFile ? 'border-success bg-success/10' : 'border-muted-foreground'}`}
            >
              {receiptFile ? (
                <div className="flex items-center gap-2 text-success">
                  <Check className="w-5 h-5" />
                  <span className="truncate max-w-[200px]">{receiptFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Clique para anexar</span>
                </div>
              )}
            </Button>
          </div>

          <Button
            type="submit"
            disabled={loading || !receiptFile}
            className="w-full btn-neon text-primary-foreground py-6 text-lg font-semibold disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'FINALIZAR COMPRA'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
