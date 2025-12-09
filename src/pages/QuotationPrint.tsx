import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { quotationsApi } from '@/lib/api';
import { QuotationLineItem } from '@/types';
import { GoogleExportDialog } from '@/components/GoogleExportDialog';
import { QuotationVersionHistory } from '@/components/QuotationVersionHistory';
import type { Item } from '@/types';

const QuotationPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationsApi.getById(id!),
  });

  const handleDownload = async () => {
    if (!cardRef.current || !quotation) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: Math.min(3, window.devicePixelRatio || 2),
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`${quotation.quotation_number || 'quotation'}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsGenerating(false);
    }
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
      text: '1) 50% advance along with PO. 2) 30% before material dispatch. 3) 15% against running bill. 4) 5% after completion of job within 7 working days.',
    },
    {
      id: 2,
      title: 'Delivery Time',
      text: 'As discussed in the proposal or within mutually agreed timelines from receipt of confirmed purchase order and advance payment.',
    },
    { id: 3, title: 'Transportation', text: 'Inclusive unless otherwise specified in the quotation.' },
    { id: 4, title: 'Packing', text: 'Standard packing included.' },
    { id: 5, title: 'Unloading / Handling', text: 'In client scope unless specifically mentioned.' },
    { id: 6, title: 'Price Validity', text: '30 days from the date of quotation unless revised in writing.' },
    { id: 7, title: 'Supply of Material', text: 'As per standard manufacturer packing and specifications.' },
    { id: 8, title: 'Jurisdiction', text: 'All disputes subject to Sangli jurisdiction.' },
    {
      id: 9,
      title: 'Statutory Variations',
      text: 'Any change in duties / taxes / levies or new impositions by Central / State authorities will be to client’s account.',
    },
    { id: 10, title: 'Scaffolding / Labour Accommodation', text: 'In client scope, wherever required.' },
    { id: 11, title: 'Return Policy', text: 'Goods once sold will not be taken back.' },
  ];

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
      {/* Top toolbar (not printed) */}
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
          <GoogleExportDialog quotations={[quotation]} mode="single" />
          <Button onClick={handleDownload} className="gap-2" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isGenerating ? 'Preparing PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Printable content */}
      <Card
        ref={cardRef}
        id={`quotation-${quotation.id}`}
        className="mx-auto max-w-5xl border border-slate-200 bg-white text-slate-900 print:border-0 print:shadow-none shadow-sm"
      >
        <CardContent className="p-6 md:p-10">
          {/* Header */}
          <header className="border-b border-slate-300 pb-4 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Zen Engineering Solutions</h1>
                <p className="text-xs md:text-sm text-slate-600">
                  Industrial Automation &amp; Safety Solutions
                </p>
                <p className="text-[11px] text-slate-500">
                  Flat No. 001, Shree Ram Siddhi Apartment, 100 Feet Rd, Near Chetna Petrol Pump, Sangli – 416416,
                  Maharashtra, India
                </p>
                <p className="text-[11px] text-slate-500">
                  Email: darshan@zenengineerings.com &nbsp;|&nbsp; Phone: +91-79772 69774
                </p>
              </div>

              <div className="w-full max-w-xs border border-slate-300 rounded-md px-4 py-3 text-sm">
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-500">
                  Official Quotation
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Quotation No.</p>
                    <p className="font-mono text-base font-semibold">
                      {quotation.quotation_number}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Issued</p>
                      <p className="text-[13px] font-medium">
                        {formatDate(quotation.created_at)}
                      </p>
                    </div>
                    {quotation.valid_until && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Valid Until</p>
                        <p className="text-[13px] font-medium">
                          {formatDate(quotation.valid_until)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-200 pt-2 flex items-center justify-between text-[12px]">
                  <span className="text-slate-500">Grand Total</span>
                  <span className="font-semibold">
                    {formatCurrency(quotation.total)}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Party & project details */}
          <section className="mb-6 grid gap-4 md:grid-cols-2 text-xs md:text-sm">
            <div className="border border-slate-300 rounded-md p-3 md:p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-2">
                Quotation For
              </p>
              <p className="font-semibold text-sm md:text-base">
                {quotation.client?.name || '-'}
              </p>
              {quotation.client?.address && (
                <p className="mt-1 text-[12px] leading-snug text-slate-600">
                  {quotation.client.address}
                  {quotation.client.city && `, ${quotation.client.city}`}
                  {quotation.client.state && `, ${quotation.client.state}`}
                  {quotation.client.zip_code && ` - ${quotation.client.zip_code}`}
                </p>
              )}
              {quotation.client?.email && (
                <p className="mt-1 text-[12px] text-slate-600">
                  Email: {quotation.client.email}
                </p>
              )}
              {quotation.client?.phone && (
                <p className="text-[12px] text-slate-600">
                  Phone: {quotation.client.phone}
                </p>
              )}
            </div>

            <div className="border border-slate-300 rounded-md p-3 md:p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-2">
                Project Details
              </p>
              <p className="font-semibold text-sm md:text-base">
                {quotation.project_title || '-'}
              </p>
              {quotation.project_description && (
                <p className="mt-1 text-[12px] leading-snug text-slate-600 whitespace-pre-line">
                  {quotation.project_description}
                </p>
              )}
              {quotation.client?.tax_id && (
                <p className="mt-2 text-[12px] text-slate-600">
                  Client GSTIN: {quotation.client.tax_id}
                </p>
              )}
            </div>
          </section>

          {/* Line items */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                Quotation Summary
              </p>
              <p className="text-[11px] text-slate-500">All amounts in INR</p>
            </div>

            <div className="border border-slate-300 rounded-md overflow-hidden">
              <table className="w-full border-collapse text-xs md:text-sm">
                <thead className="bg-slate-100">
                  <tr className="border-b border-slate-300">
                    <th className="px-2 md:px-3 py-2 text-left font-semibold w-10">Sr.</th>
                    <th className="px-2 md:px-3 py-2 text-left font-semibold">
                      Description
                    </th>
                    <th className="px-2 md:px-3 py-2 text-right font-semibold w-16">
                      Qty
                    </th>
                    <th className="px-2 md:px-3 py-2 text-right font-semibold w-24">
                      Unit Price
                    </th>
                    <th className="px-2 md:px-3 py-2 text-right font-semibold w-28">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-[12px] text-slate-500"
                      >
                        No line items added.
                      </td>
                    </tr>
                  )}
                  {lineItems.map((item, index) => (
                    <tr
                      key={index}
                      className="border-t border-slate-200 align-top"
                    >
                      <td className="px-2 md:px-3 py-2 text-right">
                        {index + 1}
                      </td>
                      <td className="px-2 md:px-3 py-2">
                        <p className="font-medium text-[12px] md:text-sm">
                          {item.description || `Item ${index + 1}`}
                        </p>
                        {item.notes && (
                          <p className="mt-1 text-[11px] text-slate-600 whitespace-pre-line">
                            {item.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-2 md:px-3 py-2 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-2 md:px-3 py-2 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-2 md:px-3 py-2 text-right font-semibold">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Totals */}
          <section className="mb-6 flex justify-end">
            <div className="w-full max-w-xs text-xs md:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(quotation.subtotal)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">
                  Tax ({quotation.tax_rate}%)
                </span>
                <span className="font-medium">
                  {formatCurrency(quotation.tax_amount)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-300 mt-1">
                <span className="font-semibold">Grand Total</span>
                <span className="font-semibold">
                  {formatCurrency(quotation.total)}
                </span>
              </div>
            </div>
          </section>

          {/* Notes */}
          {quotation.notes && (
            <section className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-1">
                Special Notes
              </p>
              <div className="border border-slate-300 rounded-md p-3 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                {quotation.notes}
              </div>
            </section>
          )}

          {/* Terms & Conditions */}
          <section className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-2">
              Terms &amp; Conditions
            </p>
            <div className="border border-slate-300 rounded-md p-3">
              <ol className="list-decimal pl-4 space-y-1 text-[11px] md:text-xs leading-relaxed text-slate-700">
                {terms.map((term) => (
                  <li key={term.id}>
                    <span className="font-semibold">{term.title}: </span>
                    <span>{term.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-wrap justify-between items-end gap-4 text-[11px] md:text-xs text-slate-600">
            <div>
              <p>Thank you for the opportunity to submit this quotation.</p>
              <p className="mt-1">
                Kindly sign and return a copy of this document along with your
                purchase order as acceptance of the above terms.
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">For Zen Engineering Solutions</p>
              <div className="mt-6 border-t border-slate-400 pt-1">
                <p>Authorised Signatory</p>
              </div>
            </div>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationPrint;
