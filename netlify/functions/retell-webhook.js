const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fhoaqjtdahrhsngkiufl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZob2FxanRkYWhyaHNuZ2tpdWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjY3ODksImV4cCI6MjA5MDEwMjc4OX0.6oBOuL9VX9pQRx_vBzLB46DyBkO16r2raPBhrJPPf-U'
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    // Nur wenn Anruf beendet
    if (body.event !== 'call_ended') {
      return { statusCode: 200, body: 'OK' };
    }

    const call = body.data;
    const analysis = call.call_analysis || {};

    // Daten aus Retell extrahieren
    const eintrag = {
      name:     analysis.custom_analysis_data?.name     || 'Unbekannt',
      phone:    call.from_number                        || '',
      anliegen: analysis.custom_analysis_data?.anliegen || 'Sonstiges',
      notiz:    analysis.call_summary                   || '',
      status:   'Neu',
      datum:    new Date().toLocaleDateString('de-DE')
    };

    const { error } = await supabase.from('anrufer').insert([eintrag]);

    if (error) {
      console.error('Supabase Fehler:', error);
      return { statusCode: 500, body: 'Datenbankfehler' };
    }

    return { statusCode: 200, body: 'Anrufer gespeichert' };

  } catch (err) {
    console.error('Webhook Fehler:', err);
    return { statusCode: 500, body: 'Interner Fehler' };
  }
};
