require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // Luego crearemos esto

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/health', (req, res) => res.json({ status: 'server online' }));

const PORT = process.env.PORT || 3000;

// Sincronizar DB y levantar servidor
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});