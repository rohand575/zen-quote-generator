import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileSpreadsheet, HardDrive, Loader2 } from 'lucide-react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateQuotationPdf } from '@/lib/generateQuotationPdf';

interface GoogleExportDialogProps {
  quotations: any[];
  trigger?: React.ReactNode;
  mode?: 'single' | 'bulk';
}

export const GoogleExportDialog = ({ quotations, trigger, mode = 'bulk' }: GoogleExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [exportingSheets, setExportingSheets] = useState(false);
  const [exportingDrive, setExportingDrive] = useState(false);
  const { isAuthenticated, accessToken, signIn, signOut } = useGoogleAuth();

  const exportToSheets = async () => {
    if (!accessToken) return;

    setExportingSheets(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-to-sheets', {
        body: {
          accessToken,
          quotations,
          spreadsheetTitle: mode === 'single'
            ? `Quotation ${quotations[0].quotation_number}`
            : `Quotations Export ${new Date().toLocaleDateString('en-IN')}`,
        },
      });

      if (error) throw error;

      toast.success('Exported to Google Sheets', {
        description: 'Click to open spreadsheet',
        action: {
          label: 'Open',
          onClick: () => window.open(data.url, '_blank'),
        },
      });
      setOpen(false);
    } catch (error) {
      console.error('Export to Sheets error:', error);
      toast.error('Failed to export to Google Sheets');
    } finally {
      setExportingSheets(false);
    }
  };

  const exportToDrive = async () => {
    if (!accessToken) return;

    setExportingDrive(true);
    try {
      for (const quotation of quotations) {
        // Generate PDF using the shared utility
        const pdf = generateQuotationPdf(quotation);
        const pdfData = pdf.output('dataurlstring');

        const { data, error } = await supabase.functions.invoke('export-to-drive', {
          body: {
            accessToken,
            pdfData,
            fileName: `Quotation-${quotation.quotation_number}.pdf`,
            quotationNumber: quotation.quotation_number,
          },
        });

        if (error) throw error;

        toast.success(`Exported ${quotation.quotation_number} to Drive`, {
          description: 'Click to open file',
          action: {
            label: 'Open',
            onClick: () => window.open(data.url, '_blank'),
          },
        });
      }
      setOpen(false);
    } catch (error) {
      console.error('Export to Drive error:', error);
      toast.error('Failed to export to Google Drive');
    } finally {
      setExportingDrive(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to Google
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export to Google</DialogTitle>
          <DialogDescription>
            {mode === 'single'
              ? 'Export this quotation to Google Sheets or Drive'
              : `Export ${quotations.length} quotation${quotations.length > 1 ? 's' : ''} to Google`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isAuthenticated ? (
            <Button onClick={signIn} className="w-full">
              Connect to Google
            </Button>
          ) : (
            <>
              <div className="space-y-3">
                <Button
                  onClick={exportToSheets}
                  disabled={exportingSheets}
                  className="w-full"
                  variant="outline"
                >
                  {exportingSheets ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  Export to Google Sheets
                </Button>

                <Button
                  onClick={exportToDrive}
                  disabled={exportingDrive}
                  className="w-full"
                  variant="outline"
                >
                  {exportingDrive ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <HardDrive className="mr-2 h-4 w-4" />
                  )}
                  Export PDF to Google Drive
                </Button>
              </div>

              <Button onClick={signOut} variant="ghost" size="sm" className="w-full">
                Disconnect from Google
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
