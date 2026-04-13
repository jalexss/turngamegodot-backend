const { User, PlayerCharacter, PlayerInventory, GachaHistory } = require('../models');
const { sequelize } = require('../models');

// Character pool — must match characters.json IDs and rarities
const CHARACTER_POOL = [
  { id: 1, name: 'Character',  rarity: 'common' },
  { id: 2, name: 'Character2', rarity: 'common' },
  { id: 3, name: 'Character3', rarity: 'rare' },
  { id: 4, name: 'Jeremias',   rarity: 'common' },
];

const RARITY_WEIGHTS = {
  common:    60,
  rare:      30,
  epic:      8,
  legendary: 2,
};

const PULL_COST_SINGLE = 100;
const PULL_COST_MULTI  = 900; // 10x with 10% discount
const DUPLICATE_REFUND = 20;
const SOFT_PITY_START  = 50;
const HARD_PITY        = 90;
const PITY_BONUS_PER_PULL = 5; // +5% Epic+ per pull after soft pity

function rollRarity(pullsSincePity) {
  let weights = { ...RARITY_WEIGHTS };

  // Hard pity: guaranteed epic+
  if (pullsSincePity >= HARD_PITY) {
    return Math.random() < 0.75 ? 'epic' : 'legendary';
  }

  // Soft pity: boost epic+ rates
  if (pullsSincePity >= SOFT_PITY_START) {
    const bonus = (pullsSincePity - SOFT_PITY_START + 1) * PITY_BONUS_PER_PULL;
    weights.epic += bonus * 0.8;
    weights.legendary += bonus * 0.2;
    weights.common = Math.max(weights.common - bonus, 5);
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const [rarity, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return 'common';
}

function pickCharacterByRarity(rarity) {
  const candidates = CHARACTER_POOL.filter(c => c.rarity === rarity);
  // If no characters of that rarity exist yet, pick from closest available
  if (candidates.length === 0) {
    const fallbackOrder = ['rare', 'common', 'epic', 'legendary'];
    for (const fb of fallbackOrder) {
      const fbCandidates = CHARACTER_POOL.filter(c => c.rarity === fb);
      if (fbCandidates.length > 0) {
        return fbCandidates[Math.floor(Math.random() * fbCandidates.length)];
      }
    }
    return CHARACTER_POOL[0]; // absolute fallback
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// GET /api/player/characters
exports.getCharacters = async (req, res) => {
  try {
    const characters = await PlayerCharacter.findAll({
      where: { UserId: req.user.id },
      order: [['character_id', 'ASC']]
    });
    return res.json({ characters });
  } catch (error) {
    console.error('getCharacters error:', error);
    return res.status(500).json({ error: 'Error al obtener personajes' });
  }
};

// GET /api/player/inventory
exports.getInventory = async (req, res) => {
  try {
    let inventory = await PlayerInventory.findOne({ where: { UserId: req.user.id } });
    if (!inventory) {
      inventory = await PlayerInventory.create({ UserId: req.user.id, cristales: 0 });
    }
    return res.json({ cristales: inventory.cristales });
  } catch (error) {
    console.error('getInventory error:', error);
    return res.status(500).json({ error: 'Error al obtener inventario' });
  }
};

// POST /api/player/gacha/pull  body: { count: 1 | 10 }
exports.gachaPull = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const count = req.body.count === 10 ? 10 : 1;
    const cost = count === 10 ? PULL_COST_MULTI : PULL_COST_SINGLE;

    // Get inventory with lock
    let inventory = await PlayerInventory.findOne({
      where: { UserId: req.user.id },
      lock: t.LOCK.UPDATE,
      transaction: t
    });
    if (!inventory) {
      inventory = await PlayerInventory.create({ UserId: req.user.id, cristales: 0 }, { transaction: t });
    }

    if (inventory.cristales < cost) {
      await t.rollback();
      return res.status(400).json({ error: 'Cristales insuficientes', cristales: inventory.cristales, cost });
    }

    // Get pity counter (pulls since last epic+ pull)
    const lastPityReset = await GachaHistory.findOne({
      where: { UserId: req.user.id, rarity: ['epic', 'legendary'] },
      order: [['pull_number', 'DESC']]
    });
    const lastPullRecord = await GachaHistory.findOne({
      where: { UserId: req.user.id },
      order: [['pull_number', 'DESC']]
    });

    let currentPullNumber = lastPullRecord ? lastPullRecord.pull_number : 0;
    let pullsSinceEpic = lastPityReset
      ? currentPullNumber - lastPityReset.pull_number
      : currentPullNumber;

    // Get user's existing characters
    const existingChars = await PlayerCharacter.findAll({
      where: { UserId: req.user.id },
      transaction: t
    });
    const ownedIds = new Set(existingChars.map(c => c.character_id));

    const results = [];
    let cristalesRefund = 0;

    for (let i = 0; i < count; i++) {
      pullsSinceEpic++;
      currentPullNumber++;

      const rarity = rollRarity(pullsSinceEpic);
      const character = pickCharacterByRarity(rarity);
      const isPity = pullsSinceEpic >= HARD_PITY;

      // Reset pity counter on epic+
      if (rarity === 'epic' || rarity === 'legendary') {
        pullsSinceEpic = 0;
      }

      const isNew = !ownedIds.has(character.id);

      if (isNew) {
        await PlayerCharacter.create({
          UserId: req.user.id,
          character_id: character.id,
          is_starter: false
        }, { transaction: t });
        ownedIds.add(character.id);
      } else {
        cristalesRefund += DUPLICATE_REFUND;
      }

      await GachaHistory.create({
        UserId: req.user.id,
        character_id: character.id,
        rarity,
        pull_number: currentPullNumber,
        is_pity: isPity
      }, { transaction: t });

      results.push({
        character_id: character.id,
        name: character.name,
        rarity,
        is_new: isNew,
        is_pity: isPity,
        duplicate_refund: isNew ? 0 : DUPLICATE_REFUND
      });
    }

    // Update cristales: deduct cost, add refund
    inventory.cristales = inventory.cristales - cost + cristalesRefund;
    await inventory.save({ transaction: t });

    await t.commit();

    return res.json({
      results,
      cristales: inventory.cristales,
      total_refund: cristalesRefund,
      pity_counter: pullsSinceEpic
    });

  } catch (error) {
    await t.rollback();
    console.error('gachaPull error:', error);
    return res.status(500).json({ error: 'Error en el gacha' });
  }
};

// ============================================================================
// DEBUG ENDPOINTS (only available when NODE_ENV !== 'production')
// ============================================================================

// POST /api/player/debug/cristales  body: { amount: number }
exports.debugAddCristales = async (req, res) => {
  try {
    const amount = parseInt(req.body.amount) || 0;
    let inventory = await PlayerInventory.findOne({ where: { UserId: req.user.id } });
    if (!inventory) {
      inventory = await PlayerInventory.create({ UserId: req.user.id, cristales: 0 });
    }
    inventory.cristales = Math.max(0, inventory.cristales + amount);
    await inventory.save();
    return res.json({ cristales: inventory.cristales });
  } catch (error) {
    console.error('debugAddCristales error:', error);
    return res.status(500).json({ error: 'Error debug cristales' });
  }
};

// POST /api/player/debug/reset-cristales
exports.debugResetCristales = async (req, res) => {
  try {
    let inventory = await PlayerInventory.findOne({ where: { UserId: req.user.id } });
    if (!inventory) {
      inventory = await PlayerInventory.create({ UserId: req.user.id, cristales: 0 });
    }
    inventory.cristales = 0;
    await inventory.save();
    return res.json({ cristales: 0 });
  } catch (error) {
    console.error('debugResetCristales error:', error);
    return res.status(500).json({ error: 'Error debug reset' });
  }
};

// POST /api/player/debug/unlock-all
exports.debugUnlockAll = async (req, res) => {
  try {
    for (const char of CHARACTER_POOL) {
      await PlayerCharacter.findOrCreate({
        where: { UserId: req.user.id, character_id: char.id },
        defaults: { is_starter: false }
      });
    }
    const characters = await PlayerCharacter.findAll({
      where: { UserId: req.user.id },
      order: [['character_id', 'ASC']]
    });
    return res.json({ characters });
  } catch (error) {
    console.error('debugUnlockAll error:', error);
    return res.status(500).json({ error: 'Error debug unlock' });
  }
};
