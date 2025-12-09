import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Filter, X, History } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { quotationsApi, clientsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { GoogleExportDialog } from '@/components/GoogleExportDialog';
import { QuotationVersionHistory } from '@/components/QuotationVersionHistory';
import { QuotationVersionCompare } from '@/components/QuotationVersionCompare';

const Quotations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const queryClient = useQueryClient();
  
  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: quotationsApi.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: quotationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({
        title: 'Success',
        description: 'Quotation deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });

  const filteredQuotations = quotations.filter(quote => {
    // Text search
    const matchesSearch =
      quote.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.project_title.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

    // Client filter
    const matchesClient = clientFilter === 'all' || quote.client_id === clientFilter;

    // Date range filter
    const quoteDate = new Date(quote.created_at);
    const matchesDateFrom = !dateFrom || quoteDate >= dateFrom;
    const matchesDateTo = !dateTo || quoteDate <= dateTo;

    return matchesSearch && matchesStatus && matchesClient && matchesDateFrom && matchesDateTo;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuotations = filteredQuotations.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  const selectedQuotationData = quotations.filter(q => selectedQuotations.includes(q.id));

  const toggleSelectAll = () => {
    if (selectedQuotations.length === filteredQuotations.length) {
      setSelectedQuotations([]);
    } else {
      setSelectedQuotations(filteredQuotations.map(q => q.id));
    }
  };

  const toggleSelectQuotation = (id: string) => {
    setSelectedQuotations(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setClientFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== 'all' || clientFilter !== 'all' || dateFrom || dateTo || searchTerm;

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      deleteMutation.mutate(id);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Quotations</h1>
            <p className="text-muted-foreground">Manage all your project quotations</p>
          </div>
          {selectedQuotations.length > 0 && (
            <GoogleExportDialog
              quotations={selectedQuotationData}
              mode="bulk"
              trigger={
                <Button variant="outline" size="sm">
                  Export Selected ({selectedQuotations.length})
                </Button>
              }
            />
          )}
        </div>
        <Link to="/quotations/create">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="premium-card glass-card accent-glow">
        <CardContent className="p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by quotation number, client, or project..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-card/80 border-border/60 focus:border-accent focus:ring-0"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filters:</span>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Client Filter */}
            <Select value={clientFilter} onValueChange={(value) => {
              setClientFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal bg-background",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  {dateFrom ? format(dateFrom, "dd MMM yyyy") : "From Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    setDateFrom(date);
                    setCurrentPage(1);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal bg-background",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  {dateTo ? format(dateTo, "dd MMM yyyy") : "To Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    setDateTo(date);
                    setCurrentPage(1);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent/10"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t soft-divider">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Status: {statusFilter}
                </Badge>
              )}
              {clientFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Client: {clients.find(c => c.id === clientFilter)?.name}
                </Badge>
              )}
              {dateFrom && (
                <Badge variant="secondary" className="text-xs">
                  From: {format(dateFrom, "dd MMM yyyy")}
                </Badge>
              )}
              {dateTo && (
                <Badge variant="secondary" className="text-xs">
                  To: {format(dateTo, "dd MMM yyyy")}
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card className="premium-card glass-card accent-glow">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredQuotations.length > 0 && (
              <div className="flex items-center gap-2 px-6 py-4 border-b soft-divider bg-[hsl(var(--card))/0.6]">
                <Checkbox
                  checked={selectedQuotations.length === filteredQuotations.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select All ({filteredQuotations.length})
                </span>
              </div>
            )}
            <table className="w-full">
              <thead>
                <tr className="border-b soft-divider bg-[hsl(var(--navy))/0.14]">
                  <th className="w-12"></th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quote #</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuotations.map((quote, index) => (
                  <tr key={quote.id} className={`border-b soft-divider hover:bg-[hsl(var(--card))/0.6] transition-colors ${index % 2 === 0 ? 'bg-background/60' : 'bg-muted/30'}`}>
                    <td className="px-6">
                      <Checkbox
                        checked={selectedQuotations.includes(quote.id)}
                        onCheckedChange={() => toggleSelectQuotation(quote.id)}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <Link to={`/quotations/${quote.id}/print`} className="text-primary hover:underline font-mono text-sm font-medium">
                        {quote.quotation_number}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-medium">{quote.client?.name}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{quote.project_title}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {new Date(quote.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(quote.status)}</td>
                    <td className="py-4 px-6 text-right font-mono font-medium">{formatCurrency(quote.total)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <QuotationVersionCompare
                          quotationId={quote.id}
                          quotationNumber={quote.quotation_number}
                        />
                        <QuotationVersionHistory 
                          quotationId={quote.id}
                          quotationNumber={quote.quotation_number}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/10" asChild>
                          <Link to={`/quotations/${quote.id}/print`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/10" asChild>
                          <Link to={`/quotations/${quote.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(quote.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredQuotations.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t soft-divider">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[70px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  entries (showing {startIndex + 1}-{Math.min(endIndex, filteredQuotations.length)} of {filteredQuotations.length})
                </span>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={cn(
                          "cursor-pointer",
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>

                    {/* First page */}
                    {currentPage > 2 && (
                      <>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => setCurrentPage(1)}
                            className="cursor-pointer"
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {currentPage > 3 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                      </>
                    )}

                    {/* Previous page */}
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className="cursor-pointer"
                        >
                          {currentPage - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Current page */}
                    <PaginationItem>
                      <PaginationLink
                        isActive
                        className="cursor-default"
                      >
                        {currentPage}
                      </PaginationLink>
                    </PaginationItem>

                    {/* Next page */}
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className="cursor-pointer"
                        >
                          {currentPage + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Last page */}
                    {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => setCurrentPage(totalPages)}
                            className="cursor-pointer"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={cn(
                          "cursor-pointer",
                          currentPage === totalPages && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredQuotations.length === 0 && (
        <Card className="premium-card glass-card accent-glow">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No quotations found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Quotations;
