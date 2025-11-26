import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Quotation {
  id: string;
  quotationNumber: string;
  client: string;
  project: string;
  date: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  total: number;
}

const Quotations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data - will be replaced with real data from backend
  const [quotations] = useState<Quotation[]>([
    { id: '1', quotationNumber: 'ZEN-2025-0024', client: 'ABC Industries', project: 'Industrial Automation System', date: '2025-11-25', status: 'sent', total: 245000 },
    { id: '2', quotationNumber: 'ZEN-2025-0023', client: 'XYZ Manufacturing', project: 'Safety Equipment Installation', date: '2025-11-24', status: 'draft', total: 180000 },
    { id: '3', quotationNumber: 'ZEN-2025-0022', client: 'Tech Solutions Ltd', project: 'Control Panel Upgrade', date: '2025-11-23', status: 'accepted', total: 320000 },
    { id: '4', quotationNumber: 'ZEN-2025-0021', client: 'Prime Engineering', project: 'Motor Replacement Project', date: '2025-11-22', status: 'sent', total: 125000 },
    { id: '5', quotationNumber: 'ZEN-2025-0020', client: 'Global Industries', project: 'Annual Maintenance Contract', date: '2025-11-20', status: 'rejected', total: 450000 },
  ]);

  const filteredQuotations = quotations.filter(quote => 
    quote.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.project.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      draft: { variant: "secondary", className: "bg-muted" },
      sent: { variant: "default", className: "bg-primary" },
      accepted: { variant: "default", className: "bg-green-600" },
      rejected: { variant: "destructive", className: "" },
    };
    
    return (
      <Badge variant={variants[status]?.variant || "default"} className={variants[status]?.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Quotations</h1>
          <p className="text-muted-foreground">Manage all your project quotations</p>
        </div>
        <Link to="/quotations/create">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by quotation number, client, or project..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quotations Table */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Quote #</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Project</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Total</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((quote, index) => (
                  <tr key={quote.id} className={`border-b border-border hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                    <td className="py-4 px-6">
                      <Link to={`/quotations/${quote.id}/print`} className="text-primary hover:underline font-mono text-sm font-medium">
                        {quote.quotationNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-medium">{quote.client}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{quote.project}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {new Date(quote.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(quote.status)}</td>
                    <td className="py-4 px-6 text-right font-mono font-medium">{formatCurrency(quote.total)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/quotations/${quote.id}/print`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/quotations/${quote.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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

      {filteredQuotations.length === 0 && (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No quotations found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Quotations;
