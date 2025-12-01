import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { quotationsApi } from '@/lib/api';
import { QuotationLineItem } from '@/types';
import { GoogleExportDialog } from '@/components/GoogleExportDialog';
import { QuotationVersionHistory } from '@/components/QuotationVersionHistory';

const QuotationPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationsApi.getById(id!),
  });

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const terms = [
    {
      id: 1,
      title: 'Payment Terms',
      text: '1) 50% advance to be released along with PO. 2) 30% before material dispatch. 3) 15% RA BILL. 4) 5% after completion of job within 7 working days.',
    },
    {
      id: 2,
      title: 'Delivery Time',
      text: 'Dated: 30-10-2025. Ex Stock, 15 / 30 / 60 / 90 days from date of receipt of PO with advance payment. Techno-commercially clear order with final colour / shade selections as applicable etc.',
    },
    { id: 3, title: 'Transportation', text: 'Inclusive.' },
    { id: 4, title: 'Packing', text: 'Inclusive.' },
    { id: 5, title: 'Unloading/ Warai charges IF ANY', text: 'In Client Scope.' },
    { id: 6, title: 'Price Validity', text: '30 Days from date of submission of quotation.' },
    { id: 7, title: 'Supply Of Material', text: 'Supply will be as per standard box packing.' },
    { id: 8, title: 'Jurisdiction', text: 'Under SANGLI Jurisdiction.' },
    {
      id: 9,
      title: 'Statutory Variations',
      text: 'Any change in the existing Duties / Taxes / Levies or any fresh imposition of Duties / Taxes / Levies by the Central/State Governments will be debited to Purchaser’s Account.',
    },
    { id: 10, title: 'SCAFFOLDING/ Labour accommodation', text: 'In Client Scope.' },
    { id: 11, title: 'Return Policy', text: 'Goods once sold will not be returned.' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Quotation not found</p>
        <Button onClick={() => navigate('/quotations')} className="mt-4">
          Back to Quotations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Quotation</h1>
            <p className="text-muted-foreground">{quotation.quotation_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <QuotationVersionHistory 
            quotationId={quotation.id}
            quotationNumber={quotation.quotation_number}
          />
          <GoogleExportDialog
            quotations={[quotation]}
            mode="single"
          />
          <Button onClick={handlePrint} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-0" id={`quotation-${quotation.id}`}>
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-primary/20 shadow-md">
              <img src="/zen-logo.png" alt="Zen Engineering logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-heading font-bold text-primary mb-1">Zen Engineering</h1>
              <p className="text-muted-foreground">Industrial Automation & Safety Solutions</p>
            </div>
          </div>

          {/* Quotation Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">QUOTATION FOR:</h2>
              <div className="space-y-1">
                <p className="font-semibold text-lg">{quotation.client?.name}</p>
                {quotation.client?.email && <p className="text-sm">{quotation.client.email}</p>}
                {quotation.client?.phone && <p className="text-sm">{quotation.client.phone}</p>}
                {quotation.client?.address && (
                  <p className="text-sm">
                    {quotation.client.address}
                    {quotation.client.city && `, ${quotation.client.city}`}
                    {quotation.client.state && `, ${quotation.client.state}`}
                    {quotation.client.zip_code && ` - ${quotation.client.zip_code}`}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Quotation No: </span>
                  <span className="font-mono font-semibold">{quotation.quotation_number}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date: </span>
                  <span>{formatDate(quotation.created_at)}</span>
                </div>
                {quotation.valid_until && (
                  <div>
                    <span className="text-sm text-muted-foreground">Valid Until: </span>
                    <span>{formatDate(quotation.valid_until)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="mb-8">
            <h2 className="text-xl font-heading font-semibold mb-2">{quotation.project_title}</h2>
            {quotation.project_description && (
              <p className="text-muted-foreground">{quotation.project_description}</p>
            )}
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary">
                  <th className="text-left py-3 text-sm font-semibold text-muted-foreground">Item</th>
                  <th className="text-center py-3 text-sm font-semibold text-muted-foreground">Quantity</th>
                  <th className="text-right py-3 text-sm font-semibold text-muted-foreground">Unit Price</th>
                  <th className="text-right py-3 text-sm font-semibold text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {(quotation.line_items as unknown as QuotationLineItem[]).map((item, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">Item {index + 1}</p>
                        </div>
                      </td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 text-right font-mono font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-mono">{formatCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Tax ({quotation.tax_rate}%):</span>
                <span className="font-mono">{formatCurrency(quotation.tax_amount)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-primary">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-mono font-bold">{formatCurrency(quotation.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="mb-8 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Notes:</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{quotation.notes}</p>
            </div>
          )}

          {/* Terms & Conditions */}
          <div className="mb-8">
            <h3 className="text-xl font-heading font-semibold mb-3">Terms &amp; Conditions</h3>
            <table className="w-full border-collapse">
              <tbody>
                {terms.map((term) => (
                  <tr key={term.id} className="align-top border-b border-border/70 last:border-b-0">
                    <td className="py-2 pr-3 text-sm font-semibold text-muted-foreground w-10">{term.id}.</td>
                    <td className="py-2 pr-4 text-sm font-semibold">{term.title}</td>
                    <td className="py-2 text-sm text-muted-foreground">{term.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>Thank you for your business!</p>
            <p className="mt-2">For any queries, please contact us.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationPrint;
