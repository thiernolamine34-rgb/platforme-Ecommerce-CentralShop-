const amqp = require('amqplib');

const QUEUE       = 'commandes';
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000;

/**
 * Consumer RabbitMQ avec retry — identique au pattern de server.js
 * PROBLÈME PRÉCÉDENT : setTimeout(5000) sans retry → crash si RabbitMQ lent.
 * SOLUTION : boucle de 10 tentatives + reconnexion automatique sur fermeture.
 */
async function demarrerConsommateur() {
  const url = process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq';

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const conn    = await amqp.connect(url);
      const channel = await conn.createChannel();

      await channel.assertQueue(QUEUE, { durable: true });
      channel.prefetch(1);

      console.log('👂 Consommateur en attente de messages...');

      channel.consume(QUEUE, (msg) => {
        if (msg) {
          try {
            const commande = JSON.parse(msg.content.toString());
            console.log('\n🔔 NOUVELLE COMMANDE REÇUE !');
            console.log('   Client  :', commande.client);
            console.log('   Produit :', commande.produit);
            console.log('   ID      :', commande.id);
            console.log('📧 Email de confirmation envoyé (simulé)\n');
            channel.ack(msg);
          } catch (parseErr) {
            console.error('❌ Message invalide, rejeté :', parseErr.message);
            channel.nack(msg, false, false);
          }
        }
      });

      conn.on('close', () => {
        console.warn('⚠️ Connexion RabbitMQ fermée — redémarrage...');
        setTimeout(demarrerConsommateur, RETRY_DELAY);
      });

      return;

    } catch (err) {
      console.log(`⏳ Consumer RabbitMQ pas prêt (${i + 1}/${MAX_RETRIES})...`);
      await new Promise(res => setTimeout(res, RETRY_DELAY));
    }
  }

  console.error(`❌ Consumer : impossible de se connecter après ${MAX_RETRIES} tentatives`);
}

setTimeout(demarrerConsommateur, 5000);
