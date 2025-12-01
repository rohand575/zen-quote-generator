import { useState } from 'react';
import { Plus, Trash2, Edit, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { templatesApi, itemsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { QuotationLineItem } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Templates = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    { item_id: '', quantity: 1, unit_price: 0, total: 0 }
  ]);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: templatesApi.getAll,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: itemsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: 'Success', description: 'Template created successfully' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => templatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: 'Success', description: 'Template updated successfully' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: 'Success', description: 'Template deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setNotes('');
    setTaxRate('18');
    setLineItems([{ item_id: '', quantity: 1, unit_price: 0, total: 0 }]);
    setEditingTemplate(null);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description || '');
    setNotes(template.notes || '');
    setTaxRate(template.tax_rate.toString());
    setLineItems(template.line_items);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || lineItems.some(item => !item.item_id)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    const templateData = {
      name,
      description,
      notes,
      tax_rate: parseFloat(taxRate),
      line_items: lineItems,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: templateData });
    } else {
      createMutation.mutate(templateData);
    }
  };

  const handleItemChange = (index: number, field: keyof QuotationLineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'item_id') {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        newItems[index].unit_price = Number(selectedItem.unit_price);
        newItems[index].total = Number(selectedItem.unit_price) * newItems[index].quantity;
      }
    } else if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { item_id: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Quotation Templates</h1>
          <p className="text-muted-foreground">Save and reuse common quotation structures</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-accent hover:bg-accent/90">
              <Plus className="h-5 w-5" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>
                {editingTemplate ? 'Update template details' : 'Define a reusable quotation template'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Standard MEP Package"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this template"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Line Items *</Label>
                  <Button type="button" onClick={addLineItem} size="sm" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                {lineItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end border p-3 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Item</Label>
                      <Select
                        value={item.item_id}
                        onValueChange={(value) => handleItemChange(index, 'item_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map(availableItem => (
                            <SelectItem key={availableItem.id} value={availableItem.id}>
                              {availableItem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-20 space-y-2">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="w-28 space-y-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="w-28 space-y-2">
                      <Label className="text-xs">Total</Label>
                      <div className="h-10 flex items-center font-mono text-sm">
                        {formatCurrency(item.total)}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Default Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Default notes or terms for this template"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90">
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{template.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(template.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {template.description && (
                <CardDescription>{template.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{Array.isArray(template.line_items) ? template.line_items.length : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax Rate:</span>
                  <span className="font-medium">{template.tax_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(template.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first template to speed up quotation creation
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Templates;