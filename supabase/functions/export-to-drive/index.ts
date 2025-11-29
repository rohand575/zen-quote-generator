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
    const { accessToken, pdfData, fileName, quotationNumber } = await req.json();
    
    console.log('Exporting to Google Drive:', { fileName });

    // Create file metadata
    const metadata = {
      name: fileName || `Quotation-${quotationNumber}.pdf`,
      mimeType: 'application/pdf',
    };

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(pdfData.split(',')[1]), c => c.charCodeAt(0));

    // Create multipart form data
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata);

    const dataPart = delimiter +
      'Content-Type: application/pdf\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      pdfData.split(',')[1];

    const multipartRequestBody = metadataPart + dataPart + closeDelimiter;

    // Upload to Google Drive
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Failed to upload to Drive:', error);
      throw new Error('Failed to upload to Google Drive');
    }

    const file = await uploadResponse.json();
    
    console.log('Successfully uploaded to Google Drive:', file.id);

    return new Response(
      JSON.stringify({
        success: true,
        fileId: file.id,
        url: `https://drive.google.com/file/d/${file.id}/view`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in export-to-drive:', error);
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
