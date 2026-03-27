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

    // Normalisiere Event-Namen (Leerzeichen, Bindestriche → Unterstrich)
    const eventName = (body.event || '').toLowerCase().replace(/[\s-]/g, '_');
    console.log('Event original:', body.event);
    console.log('Event normalisiert:', eventName);
    console.log('Voller Body:', JSON.stringify(body, null, 2));

    // Alle bekannten Retell Events akzeptieren
    const validEvents = ['call_ended', 'call_analyzed', 'call_completed'];
    if (!validEvents.includes(eventName)) {
      console.log('Ignoriertes Event:', body.event);
      return { statusCode: 200, body: 'Event ignoriert: ' + body.event };
    }

    // Datenstruktur flexibel abfangen
    const call = body.data || body.call || body;
    const analysis = call.call_analysis || {};
    const custom = analysis.custom_analysis_data || {};

    console.log('Custom Analysis:', JSON.stringify(custom, null, 2));

    const eintrag = {
      name:     custom.name     || 'Unbekannt',
      phone:    call.from_number || '',
      anliegen: custom.anliegen || 'Sonstiges',
      notiz:    custom.notiz    || analysis.call_summary || '',
      status:   'Neu',
      datum:    new Date().toLocaleDateString('de-DE')
    };

    console.log('Eintrag:', JSON.stringify(eintrag, null, 2));

    const { error } = await supabase.from('anrufer').insert([eintrag]);

    if (error) {
      console.error('Supabase Fehler:', JSON.stringify(error, null, 2));
      return { statusCode: 500, body: 'Datenbankfehler: ' + error.message };
    }

    console.log('Erfolgreich gespeichert!');
    return { statusCode: 200, body: 'Anrufer gespeichert' };

  } catch (err) {
    console.error('Fehler:', err.message);
    return { statusCode: 500, body: 'Interner Fehler: ' + err.message };
  }
};
