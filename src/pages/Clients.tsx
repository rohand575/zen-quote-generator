import { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  taxId: string;
}

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Mock data - will be replaced with real data from backend
  const [clients] = useState<Client[]>([
    { id: '1', name: 'ABC Industries', email: 'contact@abcindustries.com', phone: '+91 98765 43210', city: 'Mumbai', taxId: '27AABCU9603R1ZV' },
    { id: '2', name: 'XYZ Manufacturing', email: 'info@xyzmfg.com', phone: '+91 98765 43211', city: 'Delhi', taxId: '07AABCU9603R1ZW' },
    { id: '3', name: 'Tech Solutions Ltd', email: 'hello@techsolutions.com', phone: '+91 98765 43212', city: 'Bangalore', taxId: '29AABCU9603R1ZX' },
  ]);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Client added successfully');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Clients</h1>
          <p className="text-muted-foreground">Manage your client database</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Enter the client details below to add them to your database.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input id="name" placeholder="ABC Industries" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="contact@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Mumbai" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">GST/Tax ID</Label>
                  <Input id="taxId" placeholder="27AABCU9603R1ZV" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Business Park, Sector 5" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Add Client
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name, email, or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{client.city}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{client.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{client.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">GST/Tax ID</p>
                <p className="text-sm font-mono">{client.taxId}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No clients found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Clients;
