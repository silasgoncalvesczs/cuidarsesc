const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Importando as nossas rotas
const atividadeRoutes = require('./routes/atividadeRoutes');
const idosoRoutes = require('./routes/idosoRoutes');
const presencaRoutes = require('./routes/presencaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cuidar_sesc';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Tornando a pasta "public" acessível pelo navegador
app.use(express.static(path.join(__dirname, 'public')));

// Conectando as rotas no Express
app.use('/api/atividades', atividadeRoutes);
app.use('/api/idosos', idosoRoutes);
app.use('/api/presencas', presencaRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Bem-vindo ao novo sistema de Gestão e Chamada CUIDAR SESC!' });
});

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Conectado ao MongoDB com sucesso!');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Erro ao conectar no MongoDB:', err);
    });