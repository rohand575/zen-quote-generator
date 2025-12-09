import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitCompare, Check, X, Minus, Plus, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { quotationVersionsApi } from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuotationVersionCompareProps {
  quotationId: string;
  quotationNumber: string;
}

interface VersionData {
  project_title: string;
  project_description?: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
  line_items: Array<{
    item_id: string;
    name?: string;
    description?: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

export const QuotationVersionCompare = ({ quotationId, quotationNumber }: QuotationVersionCompareProps) => {
  const [open, setOpen] = useState(false);
  const [leftVersionId, setLeftVersionId] = useState<string>('');
  const [rightVersionId, setRightVersionId] = useState<string>('');

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['quotation-versions', quotationId],
    queryFn: () => quotationVersionsApi.getByQuotationId(quotationId),
    enabled: open,
  });

  // Auto-select versions when data loads
  useMemo(() => {
    if (versions.length >= 2 && !leftVersionId && !rightVersionId) {
      setLeftVersionId(versions[1]?.id || '');
      setRightVersionId(versions[0]?.id || '');
    } else if (versions.length === 1 && !rightVersionId) {
      setRightVersionId(versions[0]?.id || '');
    }
  }, [versions, leftVersionId, rightVersionId]);

  const leftVersion = versions.find(v => v.id === leftVersionId);
  const rightVersion = versions.find(v => v.id === rightVersionId);
  
  const leftData = leftVersion?.quotation_data as unknown as VersionData | undefined;
  const rightData = rightVersion?.quotation_data as unknown as VersionData | undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const swapVersions = () => {
    const temp = leftVersionId;
    setLeftVersionId(rightVersionId);
    setRightVersionId(temp);
  };

  const getDiffClass = (leftVal: any, rightVal: any) => {
    if (leftVal === rightVal) return '';
    return 'bg-amber-500/10 border-l-2 border-amber-500';
  };

  const getValueChange = (leftVal: number, rightVal: number) => {
    const diff = rightVal - leftVal;
    if (diff === 0) return null;
    return (
      <span className={cn(
        'text-xs font-medium flex items-center gap-1',
        diff > 0 ? 'text-green-600' : 'text-destructive'
      )}>
        {diff > 0 ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
        {formatCurrency(Math.abs(diff))}
      </span>
    );
  };

  // Compare line items
  const lineItemComparison = useMemo(() => {
    if (!leftData?.line_items || !rightData?.line_items) return [];
    
    const allItemIds = new Set([
      ...leftData.line_items.map(i => i.item_id),
      ...rightData.line_items.map(i => i.item_id),
    ]);

    return Array.from(allItemIds).map(itemId => {
      const leftItem = leftData.line_items.find(i => i.item_id === itemId);
      const rightItem = rightData.line_items.find(i => i.item_id === itemId);
      
      return {
        itemId,
        name: rightItem?.name || leftItem?.name || rightItem?.description || leftItem?.description || 'Unknown Item',
        leftItem,
        rightItem,
        status: !leftItem ? 'added' : !rightItem ? 'removed' : 
          (leftItem.quantity !== rightItem.quantity || leftItem.unit_price !== rightItem.unit_price) ? 'modified' : 'unchanged'
      };
    });
  }, [leftData, rightData]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <GitCompare className="h-4 w-4" />
          Compare Versions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Compare Versions</DialogTitle>
          <DialogDescription>
            Compare changes between versions of {quotationNumber}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : versions.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Need at least 2 versions to compare</p>
            <p className="text-sm text-muted-foreground mt-2">
              Currently {versions.length} version(s) available
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Version Selectors */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Older Version</label>
                <Select value={leftVersionId} onValueChange={setLeftVersionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id} disabled={v.id === rightVersionId}>
                        Version {v.version_number} - {format(new Date(v.created_at), 'dd MMM yyyy HH:mm')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="ghost" size="icon" onClick={swapVersions} className="mt-6">
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
              
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Newer Version</label>
                <Select value={rightVersionId} onValueChange={setRightVersionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id} disabled={v.id === leftVersionId}>
                        Version {v.version_number} - {format(new Date(v.created_at), 'dd MMM yyyy HH:mm')}
                        {v.id === versions[0]?.id && ' (Current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {leftData && rightData && (
              <ScrollArea className="h-[500px]">
                <div className="space-y-6">
                  {/* Summary Comparison */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">Summary Changes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left py-2 px-4 font-medium">Field</th>
                            <th className="text-left py-2 px-4 font-medium">Version {leftVersion?.version_number}</th>
                            <th className="text-left py-2 px-4 font-medium">Version {rightVersion?.version_number}</th>
                            <th className="text-left py-2 px-4 font-medium">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={cn("border-t", getDiffClass(leftData.status, rightData.status))}>
                            <td className="py-2 px-4 text-muted-foreground">Status</td>
                            <td className="py-2 px-4">
                              <Badge variant="outline">{leftData.status}</Badge>
                            </td>
                            <td className="py-2 px-4">
                              <Badge variant="outline">{rightData.status}</Badge>
                            </td>
                            <td className="py-2 px-4">
                              {leftData.status !== rightData.status ? (
                                <Badge variant="secondary" className="text-xs">Changed</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          </tr>
                          <tr className={cn("border-t", getDiffClass(leftData.project_title, rightData.project_title))}>
                            <td className="py-2 px-4 text-muted-foreground">Project Title</td>
                            <td className="py-2 px-4">{leftData.project_title}</td>
                            <td className="py-2 px-4">{rightData.project_title}</td>
                            <td className="py-2 px-4">
                              {leftData.project_title !== rightData.project_title ? (
                                <Badge variant="secondary" className="text-xs">Changed</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          </tr>
                          <tr className={cn("border-t", getDiffClass(leftData.subtotal, rightData.subtotal))}>
                            <td className="py-2 px-4 text-muted-foreground">Subtotal</td>
                            <td className="py-2 px-4 font-mono">{formatCurrency(leftData.subtotal)}</td>
                            <td className="py-2 px-4 font-mono">{formatCurrency(rightData.subtotal)}</td>
                            <td className="py-2 px-4">{getValueChange(leftData.subtotal, rightData.subtotal) || <span className="text-muted-foreground text-xs">—</span>}</td>
                          </tr>
                          <tr className={cn("border-t", getDiffClass(leftData.tax_rate, rightData.tax_rate))}>
                            <td className="py-2 px-4 text-muted-foreground">Tax Rate</td>
                            <td className="py-2 px-4">{leftData.tax_rate}%</td>
                            <td className="py-2 px-4">{rightData.tax_rate}%</td>
                            <td className="py-2 px-4">
                              {leftData.tax_rate !== rightData.tax_rate ? (
                                <Badge variant="secondary" className="text-xs">Changed</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          </tr>
                          <tr className={cn("border-t", getDiffClass(leftData.total, rightData.total))}>
                            <td className="py-2 px-4 text-muted-foreground font-medium">Total</td>
                            <td className="py-2 px-4 font-mono font-bold">{formatCurrency(leftData.total)}</td>
                            <td className="py-2 px-4 font-mono font-bold">{formatCurrency(rightData.total)}</td>
                            <td className="py-2 px-4">{getValueChange(leftData.total, rightData.total) || <span className="text-muted-foreground text-xs">—</span>}</td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  {/* Line Items Comparison */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">Line Items Changes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left py-2 px-4 font-medium">Item</th>
                            <th className="text-right py-2 px-4 font-medium">V{leftVersion?.version_number} Qty</th>
                            <th className="text-right py-2 px-4 font-medium">V{rightVersion?.version_number} Qty</th>
                            <th className="text-right py-2 px-4 font-medium">V{leftVersion?.version_number} Total</th>
                            <th className="text-right py-2 px-4 font-medium">V{rightVersion?.version_number} Total</th>
                            <th className="text-center py-2 px-4 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItemComparison.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-4 px-4 text-center text-muted-foreground">
                                No line items to compare
                              </td>
                            </tr>
                          ) : (
                            lineItemComparison.map((item) => (
                              <tr 
                                key={item.itemId} 
                                className={cn(
                                  "border-t",
                                  item.status === 'added' && 'bg-green-500/10',
                                  item.status === 'removed' && 'bg-destructive/10',
                                  item.status === 'modified' && 'bg-amber-500/10'
                                )}
                              >
                                <td className="py-2 px-4">
                                  <span className="font-medium">{item.name}</span>
                                </td>
                                <td className="py-2 px-4 text-right font-mono">
                                  {item.leftItem?.quantity ?? '—'}
                                </td>
                                <td className="py-2 px-4 text-right font-mono">
                                  {item.rightItem?.quantity ?? '—'}
                                </td>
                                <td className="py-2 px-4 text-right font-mono">
                                  {item.leftItem ? formatCurrency(item.leftItem.total) : '—'}
                                </td>
                                <td className="py-2 px-4 text-right font-mono">
                                  {item.rightItem ? formatCurrency(item.rightItem.total) : '—'}
                                </td>
                                <td className="py-2 px-4 text-center">
                                  {item.status === 'added' && (
                                    <Badge className="bg-green-600 text-white text-xs gap-1">
                                      <Plus className="h-3 w-3" /> Added
                                    </Badge>
                                  )}
                                  {item.status === 'removed' && (
                                    <Badge variant="destructive" className="text-xs gap-1">
                                      <X className="h-3 w-3" /> Removed
                                    </Badge>
                                  )}
                                  {item.status === 'modified' && (
                                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                                      Modified
                                    </Badge>
                                  )}
                                  {item.status === 'unchanged' && (
                                    <span className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                                      <Check className="h-3 w-3" /> Same
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  {/* Notes Comparison */}
                  {(leftData.notes || rightData.notes) && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">Notes Changes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Version {leftVersion?.version_number}</p>
                            <div className={cn(
                              "p-3 rounded-md border text-sm whitespace-pre-wrap min-h-[80px]",
                              leftData.notes !== rightData.notes && "border-amber-500/50 bg-amber-500/5"
                            )}>
                              {leftData.notes || <span className="text-muted-foreground italic">No notes</span>}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Version {rightVersion?.version_number}</p>
                            <div className={cn(
                              "p-3 rounded-md border text-sm whitespace-pre-wrap min-h-[80px]",
                              leftData.notes !== rightData.notes && "border-amber-500/50 bg-amber-500/5"
                            )}>
                              {rightData.notes || <span className="text-muted-foreground italic">No notes</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};