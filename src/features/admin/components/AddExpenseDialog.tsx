import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { localData } from '@/shared/integrations/local/client';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddExpenseDialogProps {
  properties: { id: string; address: string }[];
  onExpenseAdded: () => void;
}

const EXPENSE_TYPES = [
  'Vedlikehold',
  'Forsikring',
  'Kommunale avgifter',
  'Strøm',
  'Internett',
  'Eiendomsskatt',
  'Renhold',
  'Oppussing',
  'Juridisk',
  'Takstvurdering',
  'Annet',
];

const PAYMENT_METHODS = ['Faktura', 'Kort', 'Autotrekk', 'Vipps', 'Overføring'];

const AddExpenseDialog = ({ properties, onExpenseAdded }: AddExpenseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setAmount('');
    setPaymentType('');
    setPaymentMethod('');
    setPropertyId('');
    setDescription('');
    setDate(new Date().toISOString().substring(0, 10));
  };

  const handleSave = async () => {
    if (!amount || !paymentType) {
      toast.error('Fyll inn beløp og type');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Ugyldig beløp');
      return;
    }

    setSaving(true);
    try {
      const newExpense = {
        id: `pay-manual-${Date.now()}`,
        user_id: 'local-user',
        amount: Math.round(parsedAmount),
        payment_type: paymentType,
        payment_status: 'completed',
        payment_method: paymentMethod || null,
        created_at: new Date(date).toISOString(),
        currency: 'NOK',
        description: description || `${paymentType}${propertyId ? '' : ''}`,
        property_id: propertyId || null,
      };

      await localData.from('payment_records').insert(newExpense);
      toast.success('Utgift registrert');
      resetForm();
      setOpen(false);
      onExpenseAdded();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Feil ved registrering av utgift');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Ny utgift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Registrer ny utgift</DialogTitle>
          <DialogDescription>
            Legg til en utgift for porteføljen din
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-amount">Beløp (NOK) *</Label>
            <Input
              id="expense-amount"
              type="text"
              inputMode="numeric"
              placeholder="f.eks. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger>
                <SelectValue placeholder="Velg utgiftstype" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment method */}
          <div className="space-y-1.5">
            <Label>Betalingsmetode</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Velg metode" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property */}
          <div className="space-y-1.5">
            <Label>Eiendom</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg eiendom (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen / Generelt</SelectItem>
                {properties.map(prop => (
                  <SelectItem key={prop.id} value={prop.id}>{prop.address}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-date">Dato</Label>
            <Input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-desc">Beskrivelse</Label>
            <Textarea
              id="expense-desc"
              placeholder="Valgfri beskrivelse..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Lagrer...' : 'Lagre utgift'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
