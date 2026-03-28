const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Mapeia o nome do produto (InovaPay) para o plano interno
const mapProductToPlan = (productName = '') => {
  const name = productName.toLowerCase();
  if (name.includes('semanal') || name.includes('weekly')) return 'weekly';
  if (name.includes('mensal') || name.includes('monthly')) return 'monthly';
  if (name.includes('vitalicio') || name.includes('vitalício') || name.includes('lifetime')) return 'lifetime';
  return null;
};

// Calcula a data de expiração baseado no plano
const calcEndDate = (plan) => {
  if (plan === 'lifetime') return null;
  const now = new Date();
  if (plan === 'weekly') {
    now.setDate(now.getDate() + 7);
  } else if (plan === 'monthly') {
    now.setMonth(now.getMonth() + 1);
  }
  return now;
};

// POST /api/webhooks/inovapay
router.post('/inovapay', async (req, res) => {
  try {
    const { event, token, transaction, client, orderItems } = req.body;

    // Validar token de segurança
    const webhookToken = process.env.INOVAPAY_WEBHOOK_TOKEN;
    if (webhookToken && token !== webhookToken) {
      console.warn('[Webhook] Token inválido recebido');
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Só processar eventos de pagamento aprovado
    const approvedStatuses = ['approved', 'paid', 'completed', 'active'];
    const transactionStatus = (transaction?.status || '').toLowerCase();

    if (!approvedStatuses.includes(transactionStatus)) {
      console.log(`[Webhook] Evento ignorado: event=${event} status=${transactionStatus}`);
      return res.status(200).json({ message: 'Evento ignorado' });
    }

    // Pegar email do cliente
    const email = client?.email?.toLowerCase()?.trim();
    if (!email) {
      console.warn('[Webhook] Email não encontrado no payload');
      return res.status(400).json({ message: 'Email não encontrado' });
    }

    // Identificar o plano pelo nome do produto
    const productName = orderItems?.[0]?.product?.name || '';
    const plan = mapProductToPlan(productName);
    if (!plan) {
      console.warn(`[Webhook] Plano não identificado para produto: "${productName}"`);
      return res.status(400).json({ message: `Plano não identificado: ${productName}` });
    }

    // Buscar usuário pelo email
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`[Webhook] Usuário não encontrado: ${email}`);
      // Retorna 200 pra InovaPay não ficar reenviando
      return res.status(200).json({ message: 'Usuário não encontrado na plataforma' });
    }

    // Cancelar assinatura ativa anterior (se houver)
    await Subscription.updateMany(
      { user: user._id, status: 'active' },
      { $set: { status: 'cancelled' } }
    );

    // Criar nova assinatura
    const endDate = calcEndDate(plan);
    const subscription = await Subscription.create({
      user: user._id,
      plan,
      status: 'active',
      startDate: new Date(),
      endDate,
      paymentId: transaction?.id || null,
      gateway: 'manual',
      amount: transaction?.amount || 0,
      currency: transaction?.currency || 'BRL',
      metadata: {
        inovapayEvent: event,
        inovapayTransactionId: transaction?.id,
        productName,
        webhookReceivedAt: new Date().toISOString(),
      },
    });

    console.log(`[Webhook] ✓ Assinatura criada: user=${email} plan=${plan} id=${subscription._id}`);
    return res.status(200).json({ message: 'Assinatura ativada com sucesso' });

  } catch (err) {
    console.error('[Webhook] Erro:', err.message);
    return res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
