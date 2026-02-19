import { useState, useRef } from 'react';
import { Copy, Check, Loader2, ChevronDown, Upload, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product, ProductType } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface CheckoutModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

const PIX_PAYLOAD = '00020126510014BR.GOV.BCB.PIX0111090957113900214CINEMA JOVENS 5204000053039865802BR5925JOEL ABREU MARTINS DE ALM6015FORMOSO DO ARAG62070503***630421BB';
const PIX_CPF = '090.957.113-90';

export function CheckoutModal({ product, onClose, onSuccess }: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedCpf, setCopiedCpf] = useState(false);
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

  const copyPixCode = async () => {
    await navigator.clipboard.writeText(PIX_PAYLOAD);
    setCopiedPix(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const copyCpfKey = async () => {
    await navigator.clipboard.writeText(PIX_CPF);
    setCopiedCpf(true);
    toast.success('Chave PIX (CPF) copiada!');
    setTimeout(() => setCopiedCpf(false), 2000);
  };

  const generateOrderCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CJ-${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !name || !whatsapp || !receiptFile) {
      toast.error('Preencha todos os campos e anexe o comprovante!');
      return;
    }

    setLoading(true);

    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      const orderCode = generateOrderCode();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          customer_name: name,
          customer_whatsapp: whatsapp.replace(/\D/g, ''),
          product_type: product.id,
          product_name: product.name,
          price: product.price,
          status: 'paid',
          receipt_url: publicUrl,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { data: currentSettings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'tickets_sold')
        .single();

      if (currentSettings) {
        await supabase
          .from('settings')
          .update({ value: String(Number(currentSettings.value) + 1) })
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
                placeholder="Seu nome completo (aparecerá no ingresso)"
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
              <div className="qr-container p-3">
                <QRCodeSVG
                  value={PIX_PAYLOAD}
                  size={110}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* PIX Copia e Cola */}
            <div>
              <Label className="text-xs text-muted-foreground">Código PIX Copia e Cola</Label>
              <div className="flex gap-2">
                <Input
                  value={PIX_PAYLOAD.substring(0, 40) + '...'}
                  readOnly
                  className="bg-muted border-border text-sm font-mono"
                />
                <Button type="button" variant="outline" size="icon" onClick={copyPixCode} className="shrink-0">
                  {copiedPix ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Chave PIX CPF */}
            <div>
              <Label className="text-xs text-muted-foreground">Chave PIX (CPF)</Label>
              <div className="flex gap-2">
                <Input
                  value={PIX_CPF}
                  readOnly
                  className="bg-muted border-border text-sm font-mono"
                />
                <Button type="button" variant="outline" size="icon" onClick={copyCpfKey} className="shrink-0">
                  {copiedCpf ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Após realizar o pagamento, seu ingresso com nome será gerado automaticamente.
            </p>

            {/* Scroll cue for mobile users */}
            {!receiptFile && (
              <div className="mt-4 flex flex-col items-center animate-bounce">
                <span className="text-amber-400 font-bold text-sm">
                  👇 Não esqueça de anexar o comprovante
                </span>
                <ChevronDown className="w-5 h-5 text-amber-400" />
              </div>
            )}
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
              className={`w-full mt-2 h-20 border-dashed ${receiptFile ? 'border-green-500 bg-green-500/10' : 'border-muted-foreground'}`}
            >
              {receiptFile ? (
                <div className="flex items-center gap-2 text-green-400">
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

          {/* WhatsApp support hint */}
          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
            <MessageCircle className="w-3 h-3 text-green-400" />
            Em caso de dúvidas, clique no ícone do WhatsApp para falar conosco.
          </p>

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
