const User = require('../models/User');

const XP_REWARDS = {
  login: 5,
  download: 10,
  post: 15,
  comment: 5,
  review: 10,
  register: 20,
};

const LEVEL_THRESHOLDS = [
  { level: 'elite',         xp: 2000 },
  { level: 'avancado',      xp: 500  },
  { level: 'intermediario', xp: 100  },
  { level: 'iniciante',     xp: 0    },
];

function getLevelForXp(xp) {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.xp) return threshold.level;
  }
  return 'iniciante';
}

/**
 * Adiciona XP ao usuário e faz upgrade de nível se necessário.
 * @param {string} userId
 * @param {'login'|'download'|'post'|'comment'|'review'|'register'} action
 * @returns {Promise<{xp: number, level: string, leveledUp: boolean, oldLevel: string}>}
 */
async function addXp(userId, action) {
  const amount = XP_REWARDS[action];
  if (!amount) return null;

  try {
    const user = await User.findById(userId).select('xp level');
    if (!user) return null;

    const oldLevel = user.level;
    const newXp = (user.xp || 0) + amount;
    const newLevel = getLevelForXp(newXp);
    const leveledUp = newLevel !== oldLevel;

    await User.findByIdAndUpdate(userId, { xp: newXp, level: newLevel });

    return { xp: newXp, level: newLevel, leveledUp, oldLevel };
  } catch (err) {
    console.error('[XP] Error adding XP:', err.message);
    return null;
  }
}

module.exports = { addXp, XP_REWARDS, LEVEL_THRESHOLDS, getLevelForXp };
