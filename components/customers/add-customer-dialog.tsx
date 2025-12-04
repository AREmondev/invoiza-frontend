'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/convex';
import { useToast } from '@/hooks/use-toast';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded?: () => void;
}

export function AddCustomerDialog({ open, onOpenChange, onCustomerAdded }: AddCustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'business' | 'individual' | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();

  const createCustomer = useMutation(api.mutations.customers.createCustomer);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createCustomer({
        name: name.trim(),
        type,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        mobile: mobile.trim() || undefined,
        userEmail: userEmail || undefined,
      });
      
      // Reset form
      setName('');
      setType(undefined);
      setEmail('');
      setPhone('');
      setMobile('');
      
      onOpenChange(false);
      onCustomerAdded?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>
            Create a new customer. Only name is required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input 
              id="name" 
              placeholder="Enter customer name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type (Optional)</Label>
            <Select value={type || ''} onValueChange={(value) => setType(value as 'business' | 'individual' | undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="Enter email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="Enter phone number" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile (Optional)</Label>
              <Input 
                id="mobile" 
                type="tel" 
                placeholder="Enter mobile number" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setName('');
                setType(undefined);
                setEmail('');
                setPhone('');
                setMobile('');
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Adding...' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}