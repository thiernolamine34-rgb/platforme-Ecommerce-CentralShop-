const amqp = require('amqplib');

let channel;
const QUEUE = 'commandes';

async function connectRabbitMQ(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq';
      const conn = await amqp.connect(url);
      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      console.log('✅ RabbitMQ connecté');
      return;
    } catch (err) {
      console.log(`⏳ RabbitMQ pas prêt, nouvelle tentative (${i + 1}/${retries})...`);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error('❌ Impossible de se connecter à RabbitMQ');
}

function publierCommande(commande) {
  if (!channel) {
    console.error('❌ Canal RabbitMQ non initialisé — message perdu');
    return;
  }
  const msg = JSON.stringify(commande);
  channel.sendToQueue(QUEUE, Buffer.from(msg), { persistent: true });
  console.log('📤 Message publié dans RabbitMQ');
}

module.exports = { connectRabbitMQ, publierCommande };
