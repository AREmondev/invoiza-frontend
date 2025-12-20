"use client";

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash, Wallet, GripVertical, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/convex';
import { useToast } from '@/hooks/use-toast';
import { AddPaymentMethodDialog } from './add-payment-method-dialog';
import { EditPaymentMethodDialog } from './edit-payment-method-dialog';
import { formatCurrency } from '@/lib/currency';

export function PaymentMethodList() {
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();

  const deleteMethodMutation = useMutation(api.mutations.paymentMethods.deletePaymentMethod);

  const methods = useQuery(
    api.queries.paymentMethods.getPaymentMethods,
    userEmail ? { userEmail, includeInactive: true } : "skip"
  ) || [];

  // Fetch payment totals by method
  const paymentTotalsByMethod = useQuery(
    api.queries.payments.getPaymentTotalsByMethod,
    userEmail ? { userEmail } : "skip"
  ) || {};

  // Combine methods with their totals
  const methodsWithTotals = useMemo(() => {
    return methods.map((method: any) => ({
      ...method,
      totalReceivedCents: paymentTotalsByMethod[method.code] || 0,
    }));
  }, [methods, paymentTotalsByMethod]);

  const handleEditMethod = (method: any) => {
    setSelectedMethod(method);
    setEditDialogOpen(true);
  };

  const handleDeleteMethod = (method: any) => {
    setMethodToDelete(method);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMethod = async () => {
    if (!methodToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMethodMutation({
        methodId: methodToDelete._id,
        userEmail,
      });

      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      });
      setDeleteDialogOpen(false);
      setMethodToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment method",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">All Payment Methods</h2>
          <p className="text-muted-foreground">
            {methods.length} method{methods.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {methods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payment methods</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first payment method
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {methodsWithTotals.map((method: any) => (
            <Card key={method._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    <CardTitle>{method.name}</CardTitle>
                  </div>
                  <Badge variant={method.isActive ? "default" : "secondary"}>
                    {method.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Code:</span> {method.code}
                  </div>
                  {method.description && (
                    <div className="text-sm text-muted-foreground">
                      {method.description}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Type:</span> {method.type || 'other'}
                  </div>
                  {method.type === 'bank' && method.bankName && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Bank:</span> {method.bankName}
                      {method.accountNumber && ` - ${method.accountNumber}`}
                    </div>
                  )}
                  {method.type === 'e_wallet' && method.eWalletType && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">E-Wallet:</span> {method.eWalletType}
                      {method.eWalletNumber && ` - ${method.eWalletNumber}`}
                    </div>
                  )}
                  {(method.type === 'bank' || method.type === 'cash') && method.balanceCents !== undefined && (
                    <div className="text-sm font-medium text-green-600">
                      Current Balance: {formatCurrency(method.balanceCents)}
                    </div>
                  )}
                  {/* Total Received */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Total Received:</span>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(method.totalReceivedCents)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMethod(method)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteMethod(method)}
                    className="flex-1"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddPaymentMethodDialog open={open} onOpenChange={setOpen} />
      
      {selectedMethod && (
        <EditPaymentMethodDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          method={selectedMethod}
          onSuccess={() => {
            setEditDialogOpen(false);
            setSelectedMethod(null);
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{methodToDelete?.name}"? This action cannot be undone.
              {methodToDelete && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Note: Payment methods that are being used in payments cannot be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMethod}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

