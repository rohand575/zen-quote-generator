import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { quotationVersionsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface QuotationVersionHistoryProps {
  quotationId: string;
  quotationNumber: string;
}

export const QuotationVersionHistory = ({ quotationId, quotationNumber }: QuotationVersionHistoryProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['quotation-versions', quotationId],
    queryFn: () => quotationVersionsApi.getByQuotationId(quotationId),
    enabled: open,
  });

  const restoreMutation = useMutation({
    mutationFn: ({ quotationId, versionId }: { quotationId: string; versionId: string }) => 
      quotationVersionsApi.restoreVersion(quotationId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] });
      queryClient.invalidateQueries({ queryKey: ['quotation-versions', quotationId] });
      toast({
        title: 'Version Restored',
        description: 'Quotation has been restored to the selected version',
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Restore Failed',
        description: error.message,
      });
    },
  });

  const handleRestore = (versionId: string, versionNumber: number) => {
    if (confirm(`Are you sure you want to restore to version ${versionNumber}? This will create a new version with the restored data.`)) {
      restoreMutation.mutate({ quotationId, versionId });
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and restore previous versions of {quotationNumber}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No version history available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Versions are automatically saved when you update the quotation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => {
                const versionData = version.quotation_data as any;
                const isLatest = index === 0;
                
                return (
                  <Card key={version.id} className={isLatest ? 'border-primary shadow-md' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={isLatest ? "default" : "secondary"}>
                              Version {version.version_number}
                            </Badge>
                            {isLatest && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                                Current
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(version.created_at), "dd MMM yyyy 'at' hh:mm a")}
                              </span>
                            </div>
                            
                            {version.notes && (
                              <p className="text-xs text-muted-foreground italic">{version.notes}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {versionData.status}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total:</span>
                              <span className="ml-2 font-mono font-medium">
                                {formatCurrency(versionData.total)}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Project:</span>
                              <span className="ml-2">{versionData.project_title}</span>
                            </div>
                          </div>
                        </div>

                        {!isLatest && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleRestore(version.id, version.version_number)}
                            disabled={restoreMutation.isPending}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
