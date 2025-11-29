import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken, quotations, spreadsheetTitle } = await req.json();
    
    console.log('Exporting to Google Sheets:', { count: quotations.length, title: spreadsheetTitle });

    // Create a new spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: spreadsheetTitle || 'Quotations Export',
        },
        sheets: [{
          properties: {
            title: 'Quotations',
          },
        }],
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('Failed to create spreadsheet:', error);
      throw new Error('Failed to create spreadsheet');
    }

    const spreadsheet = await createResponse.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    
    console.log('Created spreadsheet:', spreadsheetId);

    // Prepare data for the sheet
    const headers = [
      'Quotation Number',
      'Client Name',
      'Project Title',
      'Status',
      'Subtotal (₹)',
      'Tax Rate (%)',
      'Tax Amount (₹)',
      'Total (₹)',
      'Valid Until',
      'Created At',
    ];

    const rows = quotations.map((q: any) => [
      q.quotation_number,
      q.client?.name || '',
      q.project_title,
      q.status,
      q.subtotal,
      q.tax_rate,
      q.tax_amount,
      q.total,
      q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '',
      new Date(q.created_at).toLocaleDateString('en-IN'),
    ]);

    const allData = [headers, ...rows];

    // Update the sheet with data
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Quotations!A1:J${allData.length}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: allData,
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Failed to update sheet:', error);
      throw new Error('Failed to update sheet data');
    }

    console.log('Successfully exported to Google Sheets');

    return new Response(
      JSON.stringify({
        success: true,
        spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in export-to-sheets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
