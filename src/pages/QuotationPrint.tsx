import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { quotationsApi } from '@/lib/api';
import { QuotationLineItem } from '@/types';
import { GoogleExportDialog } from '@/components/GoogleExportDialog';
import { QuotationVersionHistory } from '@/components/QuotationVersionHistory';
import { generateQuotationPdf, COMPANY, TERMS, formatCurrency, formatCurrencyShort, formatDate } from '@/lib/generateQuotationPdf';

const QuotationPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationsApi.getById(id!),
  });

  const handleDownload = async () => {
    if (!quotation) return;
    setIsGenerating(true);

    try {
      const pdf = generateQuotationPdf(quotation);
      pdf.save(`${quotation.quotation_number || 'quotation'}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 rounded-full border-b-2 border-primary animate-spin" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <p className="text-muted-foreground">Quotation not found</p>
        <Button onClick={() => navigate('/quotations')} className="mt-4">
          Back to Quotations
        </Button>
      </div>
    );
  }

  const lineItems = (quotation.line_items as unknown as QuotationLineItem[]) || [];

  return (
    <div className="space-y-6">
      {/* Top toolbar */}
      <div className="flex items-center justify-between">
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
          <GoogleExportDialog quotations={[quotation]} mode="single" />
          <Button onClick={handleDownload} className="gap-2" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isGenerating ? 'Preparing PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="mx-auto max-w-4xl border border-slate-200 bg-white text-slate-900 shadow-sm rounded-lg p-8">
        {/* Header */}
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-xl font-bold">{COMPANY.name}</h1>
          <p className="text-xs text-slate-600 mt-1">{COMPANY.address}</p>
          <p className="text-xs text-slate-600">Contact No: {COMPANY.phone} | Email: {COMPANY.email}</p>
          <p className="text-xs font-semibold mt-2">GSTIN: {COMPANY.gstin}</p>
        </div>

        {/* Title */}
        <div className="bg-slate-100 text-center py-2 mb-6 border">
          <h2 className="font-bold text-lg">QUOTATION</h2>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
          <div className="space-y-1">
            <p><span className="font-semibold">Client's Name:</span> {quotation.client?.name || '-'}</p>
            <p><span className="font-semibold">Address:</span> {quotation.client?.address || '-'}</p>
            <p><span className="font-semibold">City/State:</span> {[quotation.client?.city, quotation.client?.state].filter(Boolean).join(', ') || '-'}</p>
            <p><span className="font-semibold">Phone No.:</span> {quotation.client?.phone || '-'}</p>
            <p><span className="font-semibold">Email Id:</span> {quotation.client?.email || '-'}</p>
            <p><span className="font-semibold">GSTIN:</span> {quotation.client?.tax_id || '-'}</p>
          </div>
          <div className="space-y-1">
            <p><span className="font-semibold">Quotation No:</span> {quotation.quotation_number}</p>
            <p><span className="font-semibold">Date:</span> {formatDate(quotation.created_at)}</p>
            <p><span className="font-semibold">Valid Until:</span> {quotation.valid_until ? formatDate(quotation.valid_until) : '30 days'}</p>
            <p><span className="font-semibold">Project Name:</span> {quotation.project_title || '-'}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-slate-100">
              <th className="border px-2 py-2 text-center w-10">Sr.</th>
              <th className="border px-2 py-2 text-left">Material Description</th>
              <th className="border px-2 py-2 text-center w-14">Unit</th>
              <th className="border px-2 py-2 text-center w-14">Qty</th>
              <th className="border px-2 py-2 text-right w-20">Rate</th>
              <th className="border px-2 py-2 text-center w-14">Tax %</th>
              <th className="border px-2 py-2 text-right w-20">Tax Amt</th>
              <th className="border px-2 py-2 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => {
              const itemTax = (item.total * (quotation.tax_rate || 0)) / 100;
              const itemTotal = item.total + itemTax;
              return (
                <tr key={index}>
                  <td className="border px-2 py-2 text-center">{index + 1}</td>
                  <td className="border px-2 py-2">
                    <p className="font-medium">{item.description || item.name || `Item ${index + 1}`}</p>
                    {item.notes && <p className="text-xs text-slate-500 mt-1">{item.notes}</p>}
                  </td>
                  <td className="border px-2 py-2 text-center">Nos</td>
                  <td className="border px-2 py-2 text-center">{item.quantity}</td>
                  <td className="border px-2 py-2 text-right">{formatCurrencyShort(item.unit_price)}</td>
                  <td className="border px-2 py-2 text-center">{quotation.tax_rate}%</td>
                  <td className="border px-2 py-2 text-right">{formatCurrencyShort(itemTax)}</td>
                  <td className="border px-2 py-2 text-right font-semibold">{formatCurrencyShort(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64 text-sm">
            <div className="flex justify-between border px-3 py-1">
              <span>Subtotal</span>
              <span>{formatCurrency(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between border-x border-b px-3 py-1">
              <span>Tax ({quotation.tax_rate}%)</span>
              <span>{formatCurrency(quotation.tax_amount)}</span>
            </div>
            <div className="flex justify-between border-x border-b px-3 py-2 bg-slate-100 font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(quotation.total)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">TERMS & CONDITIONS</h3>
          <ol className="text-xs space-y-1 list-decimal pl-4">
            {TERMS.map((term, index) => (
              <li key={index}>
                <span className="font-semibold">{term.title}:</span> {term.text}
              </li>
            ))}
          </ol>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-1">Special Notes:</h3>
            <p className="text-sm text-slate-600">{quotation.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-sm">
          <p>Thank you for the opportunity to submit this quotation.</p>
          <p className="text-slate-600">Kindly sign and return a copy of this document along with your purchase order as acceptance of the above terms.</p>
          <div className="mt-8 text-right">
            <p className="font-bold">For {COMPANY.name}</p>
            <div className="mt-16 border-t border-slate-400 inline-block w-48 pt-1">
              <p>Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPrint;
