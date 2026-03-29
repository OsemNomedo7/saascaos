const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');
const Commission = require('../models/Commission');

const DEFAULT_RATE = parseFloat(process.env.AFFILIATE_COMMISSION_RATE || '30');

// ─── Usuário: GET /api/affiliates/me ───────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select('referralCode isAffiliateActive affiliateCommissionRate');

    if (!user.referralCode) {
      const crypto = require('crypto');
      let code, exists = true;
      while (exists) {
        code = crypto.randomBytes(4).toString('hex').toUpperCase();
        exists = await User.exists({ referralCode: code });
      }
      user = await User.findByIdAndUpdate(req.user._id, { referralCode: code }, { new: true })
        .select('referralCode isAffiliateActive affiliateCommissionRate');
    }

    const commissions = await Commission.find({ affiliate: req.user._id })
      .populate('referredUser', 'name email createdAt')
      .populate('subscription', 'plan startDate')
      .sort({ createdAt: -1 });

    const totalEarned   = commissions.reduce((s, c) => s + c.commissionAmount, 0);
    const pendingAmount = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0);
    const paidAmount    = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);
    const totalReferrals = await User.countDocuments({ referredBy: req.user._id });

    res.json({
      referralCode: user.referralCode,
      isAffiliateActive: user.isAffiliateActive,
      commissionRate: user.affiliateCommissionRate ?? DEFAULT_RATE,
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

// ─── Usuário: POST /api/affiliates/withdrawal ──────────────────────────────
router.post('/withdrawal', auth, async (req, res) => {
  try {
    const { pixKey, pixKeyType, name, cpf, amount, notes } = req.body;
    if (!pixKey || !pixKeyType || !name || !cpf || !amount)
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });

    const commissions = await Commission.find({ affiliate: req.user._id, status: 'pending' });
    const pendingAmount = commissions.reduce((s, c) => s + c.commissionAmount, 0);
    if (amount > pendingAmount)
      return res.status(400).json({ message: `Saldo insuficiente. Disponível: R$ ${pendingAmount.toFixed(2)}` });

    const Log = require('../models/Log');
    await Log.create({
      user: req.user._id,
      action: 'withdrawal_request',
      metadata: { pixKey, pixKeyType, name, cpf, amount, notes, requestedAt: new Date() },
    });

    res.json({ message: 'Solicitação enviada! O admin entrará em contato em até 48h.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao solicitar saque.' });
  }
});

// ─── Admin: middleware helper ──────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acesso negado.' });
  next();
};

// ─── Admin: GET /api/affiliates/admin/ranking ──────────────────────────────
router.get('/admin/ranking', auth, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Agrupa comissões do mês por afiliado
    const ranking = await Commission.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: '$affiliate',
          totalSales: { $sum: 1 },
          totalAmount: { $sum: '$commissionAmount' },
          totalRevenue: { $sum: '$saleAmount' },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
    ]);

    const populated = await User.populate(ranking, { path: '_id', select: 'name email referralCode' });

    res.json({
      month: now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
      ranking: populated.map((r, i) => ({
        position: i + 1,
        affiliate: r._id,
        totalSales: r.totalSales,
        totalAmount: parseFloat(r.totalAmount.toFixed(2)),
        totalRevenue: parseFloat(r.totalRevenue.toFixed(2)),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar ranking.' });
  }
});

// ─── Admin: GET /api/affiliates/admin/all ─────────────────────────────────
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const affiliates = await User.find({ referralCode: { $ne: null } })
      .select('name email referralCode createdAt isAffiliateActive affiliateCommissionRate');

    const result = await Promise.all(affiliates.map(async (aff) => {
      const commissions = await Commission.find({ affiliate: aff._id });
      const pending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0);
      const paid    = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);
      const totalReferrals = await User.countDocuments({ referredBy: aff._id });
      return {
        _id: aff._id,
        name: aff.name,
        email: aff.email,
        referralCode: aff.referralCode,
        isAffiliateActive: aff.isAffiliateActive,
        commissionRate: aff.affiliateCommissionRate ?? DEFAULT_RATE,
        totalSales: commissions.length,
        totalReferrals,
        pendingAmount: parseFloat(pending.toFixed(2)),
        paidAmount: parseFloat(paid.toFixed(2)),
      };
    }));

    res.json({ affiliates: result });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar afiliados.' });
  }
});

// ─── Admin: GET /api/affiliates/admin/affiliate/:id ───────────────────────
router.get('/admin/affiliate/:id', auth, adminOnly, async (req, res) => {
  try {
    const aff = await User.findById(req.params.id)
      .select('name email referralCode createdAt isAffiliateActive affiliateCommissionRate');
    if (!aff) return res.status(404).json({ message: 'Afiliado não encontrado.' });

    // Usuários indicados (com ou sem venda)
    const referredUsers = await User.find({ referredBy: aff._id })
      .select('name email createdAt level')
      .sort({ createdAt: -1 });

    // IDs que compraram
    const buyerIds = await Commission.distinct('referredUser', { affiliate: aff._id });
    const buyerSet = new Set(buyerIds.map(id => id.toString()));

    const referredWithConversion = referredUsers.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      level: u.level,
      converted: buyerSet.has(u._id.toString()),
    }));

    const conversionRate = referredUsers.length > 0
      ? parseFloat(((buyerIds.length / referredUsers.length) * 100).toFixed(1))
      : 0;

    // Comissões detalhadas
    const commissions = await Commission.find({ affiliate: aff._id })
      .populate('referredUser', 'name email')
      .sort({ createdAt: -1 });

    const pending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0);
    const paid    = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);

    res.json({
      affiliate: {
        _id: aff._id,
        name: aff.name,
        email: aff.email,
        referralCode: aff.referralCode,
        createdAt: aff.createdAt,
        isAffiliateActive: aff.isAffiliateActive,
        commissionRate: aff.affiliateCommissionRate ?? DEFAULT_RATE,
      },
      stats: {
        totalReferrals: referredUsers.length,
        totalSales: commissions.length,
        conversionRate,
        pendingAmount: parseFloat(pending.toFixed(2)),
        paidAmount: parseFloat(paid.toFixed(2)),
      },
      referredUsers: referredWithConversion,
      commissions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar afiliado.' });
  }
});

// ─── Admin: PATCH /api/affiliates/admin/affiliate/:id ─────────────────────
router.patch('/admin/affiliate/:id', auth, adminOnly, async (req, res) => {
  try {
    const { isAffiliateActive, affiliateCommissionRate } = req.body;
    const update = {};
    if (typeof isAffiliateActive === 'boolean') update.isAffiliateActive = isAffiliateActive;
    if (typeof affiliateCommissionRate === 'number') update.affiliateCommissionRate = affiliateCommissionRate;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('name email isAffiliateActive affiliateCommissionRate');

    if (!user) return res.status(404).json({ message: 'Afiliado não encontrado.' });
    res.json({ message: 'Afiliado atualizado.', user });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar afiliado.' });
  }
});

// ─── Admin: GET /api/affiliates/admin/commissions ─────────────────────────
router.get('/admin/commissions', auth, adminOnly, async (req, res) => {
  try {
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

// ─── Admin: PATCH /api/affiliates/admin/commission/:id/pay ────────────────
router.patch('/admin/commission/:id/pay', auth, adminOnly, async (req, res) => {
  try {
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

// ─── Admin: GET /api/affiliates/admin/withdrawals ─────────────────────────
router.get('/admin/withdrawals', auth, adminOnly, async (req, res) => {
  try {
    const Log = require('../models/Log');
    const withdrawals = await Log.find({ action: 'withdrawal_request' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ withdrawals });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar saques.' });
  }
});

module.exports = router;
