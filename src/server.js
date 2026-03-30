require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // Luego crearemos esto
const authRoutes = require('./routes/authRoutes'); // Luego crearemos esto
const userRoutes = require('./routes/userRoutes'); // Luego crearemos esto

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/health', (req, res) => res.json({ status: 'server online' }));

// 2. Conecta las rutas con el prefijo
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);


const PORT = process.env.PORT || 3000;

// sequelize.sync() busca tus modelos y crea las tablas si no existen
sequelize.sync({ 
  force: false, // 'force: false' evita que se borren los datos cada vez que reinicias
  alter: true  // 'alter: true' actualiza las tablas para que coincidan con los modelos sin perder datos
}) 
  .then(() => {
    console.log('Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`Servidor listo en el puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar con la base de datos:', err);
  });