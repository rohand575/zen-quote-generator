import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import { itemsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const Items = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const queryClient = useQueryClient();
  
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: itemsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: itemsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item added successfully');
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => itemsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item updated successfully');
      setIsDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update item');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: itemsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete item');
    },
  });

  // Extract unique categories from existing items
  const defaultCategories = ['Acoustics', 'Flooring', 'Ceiling', 'Paint & Coating'];
  const existingCategories = Array.from(
    new Set(
      items
        .map((item: any) => item.category)
        .filter((cat: string) => cat && cat.trim() !== '')
    )
  ).sort();

  // Combine default categories with existing ones
  const allCategories = Array.from(new Set([...defaultCategories, ...existingCategories]));

  const filteredItems = items.filter((item: any) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      unit: formData.get('unit') as string,
      unit_price: parseFloat(formData.get('unit_price') as string),
      category: selectedCategory || categorySearch, // Use selected category or typed value
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setSelectedCategory(item.category || '');
    setCategorySearch('');
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingItem(null);
      setSelectedCategory('');
      setCategorySearch('');
      setCategoryOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2 tracking-tight">Items Catalog</h1>
          <p className="text-muted-foreground text-lg">Manage your product and service catalog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="premium-gradient-accent text-accent-foreground gap-2 h-11 px-6 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <Plus className="h-5 w-5" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update the item details below.' : 'Add a new product or service to your catalog.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input id="name" name="name" placeholder="Industrial Motor 5HP" defaultValue={editingItem?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Heavy-duty 3-phase motor with overload protection" rows={3} defaultValue={editingItem?.description} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Input id="unit" name="unit" placeholder="ea" defaultValue={editingItem?.unit || 'ea'} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Unit Price *</Label>
                    <Input id="unit_price" name="unit_price" type="number" step="0.01" placeholder="25000" defaultValue={editingItem?.unit_price} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={categoryOpen}
                          className="w-full justify-between"
                        >
                          {selectedCategory || categorySearch || "Select category..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && categorySearch && !allCategories.some(cat => cat.toLowerCase() === categorySearch.toLowerCase())) {
                              e.preventDefault();
                              setSelectedCategory(categorySearch);
                              setCategoryOpen(false);
                            }
                          }}
                        >
                          <CommandInput
                            placeholder="Search or type new..."
                            value={categorySearch}
                            onValueChange={setCategorySearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="py-2 px-2 text-sm text-muted-foreground">
                                {categorySearch ? `Press Enter to add "${categorySearch}"` : 'No categories found'}
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {allCategories
                                .filter((category) =>
                                  category.toLowerCase().includes(categorySearch.toLowerCase())
                                )
                                .map((category) => (
                                  <CommandItem
                                    key={category}
                                    value={category}
                                    onSelect={(currentValue) => {
                                      setSelectedCategory(currentValue === selectedCategory ? '' : currentValue);
                                      setCategorySearch('');
                                      setCategoryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedCategory === category ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {category}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card/80 border-border/60 focus:border-accent focus:ring-0"
        />
      </div>

      <Card className="premium-card glass-card accent-glow animate-slide-up">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b soft-divider bg-[hsl(var(--navy))/0.14]">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item Name</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit Price</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item: any, index: number) => (
                  <tr key={item.id} className={`border-b soft-divider hover:bg-[hsl(var(--card))/0.6] transition-colors ${index % 2 === 0 ? 'bg-background/60' : 'bg-muted/30'}`}>
                    <td className="py-4 px-6 font-medium">{item.name}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground max-w-xs truncate">{item.description}</td>
                    <td className="py-4 px-6 text-sm">{item.category}</td>
                    <td className="py-4 px-6 text-sm font-mono">{item.unit}</td>
                    <td className="py-4 px-6 text-right font-mono font-medium">{formatCurrency(item.unit_price)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredItems.length === 0 && (
        <Card className="premium-card glass-card accent-glow">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No items found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Items;
