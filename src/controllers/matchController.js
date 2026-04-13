const { MatchHistory } = require('../models');
const { Op } = require('sequelize');

// GET /api/matches/history?page=1&limit=10&mode=supervivencia
exports.getHistory = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const offset = (page - 1) * limit;

    const where = { UserId: req.user.id };

    const validModes = ['supervivencia', 'historia', 'multijugador'];
    if (req.query.mode && validModes.includes(req.query.mode)) {
      where.game_mode = req.query.mode;
    }

    const { count, rows } = await MatchHistory.findAndCountAll({
      where,
      order: [['finished_at', 'DESC']],
      limit,
      offset
    });

    return res.json({
      matches: rows,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('getHistory error:', error);
    return res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// GET /api/matches/stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const modes = ['supervivencia', 'historia', 'multijugador'];
    const stats = {};

    for (const mode of modes) {
      const matches = await MatchHistory.findAll({
        where: { UserId: userId, game_mode: mode }
      });

      const victories = matches.filter(m => m.result === 'victory').length;
      const defeats = matches.filter(m => m.result === 'defeat').length;
      const totalTime = matches.reduce((sum, m) => sum + (m.duration_seconds || 0), 0);

      stats[mode] = {
        total_matches: matches.length,
        victories,
        defeats,
        abandoned: matches.length - victories - defeats,
        total_time_seconds: totalTime,
        win_rate: matches.length > 0 ? Math.round((victories / matches.length) * 100) : 0
      };
    }

    return res.json({ stats });
  } catch (error) {
    console.error('getStats error:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
