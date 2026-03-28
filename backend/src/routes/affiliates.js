const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');
const Commission = require('../models/Commission');

// GET /api/affiliates/me — dashboard do afiliado
router.get('/me', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select('referralCode');

    // Gerar referralCode se o usuário ainda não tiver
    if (!user.referralCode) {
      const crypto = require('crypto');
      let code;
      let exists = true;
      while (exists) {
        code = crypto.randomBytes(4).toString('hex').toUpperCase();
        exists = await User.exists({ referralCode: code });
      }
      user = await User.findByIdAndUpdate(req.user._id, { referralCode: code }, { new: true }).select('referralCode');
    }

    const commissions = await Commission.find({ affiliate: req.user._id })
      .populate('referredUser', 'name email createdAt')
      .populate('subscription', 'plan startDate')
      .sort({ createdAt: -1 });

    const totalEarned = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingAmount = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidAmount = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalReferrals = await User.countDocuments({ referredBy: req.user._id });

    res.json({
      referralCode: user.referralCode,
      stats: {
        totalReferrals,
        totalSales: commissions.length,
        totalEarned: parseFloat(totalEarned.toFixed(2)),
        pendingAmount: parseFloat(pendingAmount.toFixed(2)),
        paidAmount: parseFloat(paidAmount.toFixed(2)),
      },
      commissions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar dados de afiliado.' });
  }
});

// Admin: GET /api/affiliates/admin/commissions — listar todas comissões
router.get('/admin/commissions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acesso negado.' });
    const filter = req.query.affiliateId ? { affiliate: req.query.affiliateId } : {};
    const commissions = await Commission.find(filter)
      .populate('affiliate', 'name email')
      .populate('referredUser', 'name email')
      .sort({ createdAt: -1 });
    res.json({ commissions });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar comissões.' });
  }
});

// Admin: GET /api/affiliates/admin/withdrawals — listar solicitações de saque
router.get('/admin/withdrawals', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acesso negado.' });
    const Log = require('../models/Log');
    const withdrawals = await Log.find({ action: 'withdrawal_request' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ withdrawals });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar saques.' });
  }
});

// Admin: GET /api/affiliates/admin/all — listar todos afiliados
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acesso negado.' });

    const affiliates = await User.find({ referralCode: { $ne: null } }).select('name email referralCode createdAt');

    const result = await Promise.all(affiliates.map(async (aff) => {
      const commissions = await Commission.find({ affiliate: aff._id });
      const pending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0);
      const paid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);
      return {
        _id: aff._id,
        name: aff.name,
        email: aff.email,
        referralCode: aff.referralCode,
        totalSales: commissions.length,
        pendingAmount: parseFloat(pending.toFixed(2)),
        paidAmount: parseFloat(paid.toFixed(2)),
      };
    }));

    res.json({ affiliates: result });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar afiliados.' });
  }
});

// Admin: PATCH /api/affiliates/admin/commission/:id/pay — marcar comissão como paga
router.patch('/admin/commission/:id/pay', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acesso negado.' });

    const commission = await Commission.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidAt: new Date(), notes: req.body.notes || '' },
      { new: true }
    );

    if (!commission) return res.status(404).json({ message: 'Comissão não encontrada.' });

    res.json({ message: 'Comissão marcada como paga.', commission });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar comissão.' });
  }
});

// POST /api/affiliates/withdrawal — solicitar saque
router.post('/withdrawal', auth, async (req, res) => {
  try {
    const { pixKey, pixKeyType, name, cpf, amount, notes } = req.body;

    if (!pixKey || !pixKeyType || !name || !cpf || !amount) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
    }

    // Verificar saldo disponível
    const commissions = await Commission.find({ affiliate: req.user._id, status: 'pending' });
    const pendingAmount = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    if (amount > pendingAmount) {
      return res.status(400).json({ message: `Saldo insuficiente. Disponível: R$ ${pendingAmount.toFixed(2)}` });
    }

    // Salvar solicitação nos logs (simplificado — admin verá nos logs)
    const Log = require('../models/Log');
    await Log.create({
      user: req.user._id,
      action: 'withdrawal_request',
      metadata: { pixKey, pixKeyType, name, cpf, amount, notes, requestedAt: new Date() },
    });

    res.json({ message: 'Solicitação de saque enviada! O admin entrará em contato em até 48h.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao solicitar saque.' });
  }
});

module.exports = router;
