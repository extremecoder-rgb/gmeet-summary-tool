const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsAppSummary(to, summary) {
  try {
    await client.messages.create({
      body: summary,
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+916290642933'
    });
    console.log('WhatsApp summary sent successfully');
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

module.exports = { sendWhatsAppSummary };