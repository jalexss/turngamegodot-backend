const { SurvivalRun, MatchHistory, PlayerStats } = require('../models');
const { sequelize } = require('../models');

// POST /api/survival/start
exports.startRun = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Check for existing active run
    const activeRun = await SurvivalRun.findOne({
      where: { UserId: req.user.id, status: 'active' },
      transaction: t
    });

    if (activeRun) {
      await t.rollback();
      return res.status(409).json({
        error: 'Ya tienes una partida activa',
        active_run_id: activeRun.id
      });
    }

    const { seed, characters, map_data } = req.body;

    const run = await SurvivalRun.create({
      UserId: req.user.id,
      seed: seed || Math.floor(Math.random() * 2147483647),
      characters: characters || [],
      map_data: map_data || [],
      run_buffs: [],
      items: [],
      current_floor: 0,
      current_branch: 0,
      gold: 0,
      started_at: new Date()
    }, { transaction: t });

    await t.commit();

    return res.status(201).json({
      msg: 'Partida iniciada',
      run: {
        id: run.id,
        seed: run.seed,
        status: run.status,
        current_floor: run.current_floor,
        gold: run.gold,
        characters: run.characters,
        map_data: run.map_data,
        started_at: run.started_at
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('startRun error:', error);
    return res.status(500).json({ error: 'Error al iniciar partida' });
  }
};

// PUT /api/survival/save
exports.saveProgress = async (req, res) => {
  try {
    const run = await SurvivalRun.findOne({
      where: { UserId: req.user.id, status: 'active' }
    });

    if (!run) {
      return res.status(404).json({ error: 'No hay partida activa' });
    }

    const { current_floor, current_branch, gold, characters, run_buffs, items, map_data } = req.body;

    const newFloor = current_floor ?? run.current_floor;
    run.current_floor = newFloor;
    run.current_branch = current_branch ?? run.current_branch;
    run.gold = gold ?? run.gold;
    run.characters = characters ?? run.characters;
    run.run_buffs = run_buffs ?? run.run_buffs;
    run.items = items ?? run.items;
    if (map_data) run.map_data = map_data;
    run.max_floor_reached = Math.max(run.max_floor_reached, newFloor);

    await run.save();

    return res.json({
      msg: 'Progreso guardado',
      run: {
        id: run.id,
        current_floor: run.current_floor,
        current_branch: run.current_branch,
        max_floor_reached: run.max_floor_reached,
        gold: run.gold,
        seed: run.seed,
        map_data: run.map_data,
        characters: run.characters,
        run_buffs: run.run_buffs
      }
    });
  } catch (error) {
    console.error('saveProgress error:', error);
    return res.status(500).json({ error: 'Error al guardar progreso' });
  }
};

// PUT /api/survival/end
exports.endRun = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const run = await SurvivalRun.findOne({
      where: { UserId: req.user.id, status: 'active' },
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!run) {
      await t.rollback();
      return res.status(404).json({ error: 'No hay partida activa' });
    }

    const { result } = req.body; // 'victory' | 'defeat' | 'abandoned'
    const validResults = ['victory', 'defeat', 'abandoned'];
    const runResult = validResults.includes(result) ? result : 'abandoned';

    const now = new Date();
    const durationMs = now.getTime() - new Date(run.started_at).getTime();
    const durationSeconds = Math.floor(durationMs / 1000);

    // Finalize run
    run.status = runResult === 'victory' ? 'completed' : runResult;
    run.finished_at = now;
    run.duration_seconds = durationSeconds;
    await run.save({ transaction: t });

    // Create match history entry
    await MatchHistory.create({
      UserId: req.user.id,
      game_mode: 'supervivencia',
      result: runResult,
      duration_seconds: durationSeconds,
      characters_used: (run.characters || []).map(c => c.id || c.character_id || c),
      metadata: {
        seed: run.seed,
        max_floor: run.max_floor_reached,
        gold_earned: run.gold,
        total_buffs: (run.run_buffs || []).length
      },
      started_at: run.started_at,
      finished_at: now
    }, { transaction: t });

    // Update global player stats
    const stats = await PlayerStats.findOne({
      where: { UserId: req.user.id },
      transaction: t
    });
    if (stats) {
      stats.total_runs_survival += 1;
      stats.best_floor_survival = Math.max(stats.best_floor_survival, run.max_floor_reached);
      stats.total_time_played_seconds += durationSeconds;
      await stats.save({ transaction: t });
    }

    await t.commit();

    return res.json({
      msg: 'Partida finalizada',
      summary: {
        result: runResult,
        max_floor: run.max_floor_reached,
        gold_earned: run.gold,
        duration_seconds: durationSeconds,
        buffs_collected: (run.run_buffs || []).length
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('endRun error:', error);
    return res.status(500).json({ error: 'Error al finalizar partida' });
  }
};

// GET /api/survival/active
exports.getActiveRun = async (req, res) => {
  try {
    const run = await SurvivalRun.findOne({
      where: { UserId: req.user.id, status: 'active' }
    });

    if (!run) {
      return res.json({ has_active_run: false, run: null });
    }

    return res.json({
      has_active_run: true,
      run: {
        id: run.id,
        seed: run.seed,
        status: run.status,
        current_floor: run.current_floor,
        current_branch: run.current_branch,
        max_floor_reached: run.max_floor_reached,
        gold: run.gold,
        characters: run.characters,
        map_data: run.map_data,
        run_buffs: run.run_buffs,
        items: run.items,
        started_at: run.started_at
      }
    });
  } catch (error) {
    console.error('getActiveRun error:', error);
    return res.status(500).json({ error: 'Error al obtener partida activa' });
  }
};

// GET /api/survival/history?page=1&limit=10
exports.getRunHistory = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const offset = (page - 1) * limit;

    const { count, rows } = await SurvivalRun.findAndCountAll({
      where: {
        UserId: req.user.id,
        status: ['completed', 'abandoned']
      },
      order: [['finished_at', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'status', 'seed', 'max_floor_reached', 'gold', 'duration_seconds', 'started_at', 'finished_at']
    });

    return res.json({
      runs: rows,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('getRunHistory error:', error);
    return res.status(500).json({ error: 'Error al obtener historial' });
  }
};
