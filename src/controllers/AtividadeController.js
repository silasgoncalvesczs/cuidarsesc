const Atividade = require('../models/Atividade');

module.exports = {
    // Criar uma nova atividade (ex: "Oficina de Pintura")
    async create(req, res) {
        try {
            const { nome, descricao, categoria } = req.body;

            if (!nome) {
                return res.status(400).json({ erro: 'O nome da atividade é obrigatório.' });
            }

            const novaAtividade = await Atividade.create({ nome, descricao, categoria });
            return res.status(201).json(novaAtividade);

        } catch (error) {
            console.error('Erro ao criar atividade:', error);
            return res.status(500).json({ erro: 'Erro interno no servidor ao criar atividade.' });
        }
    },

    // Listar todas as atividades ativas
    async index(req, res) {
        try {
            // Busca apenas as atividades com ativo: true e ordena por nome
            const atividades = await Atividade.find({ ativo: true }).sort({ nome: 1 });
            return res.json(atividades);

        } catch (error) {
            console.error('Erro ao listar atividades:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar atividades.' });
        }
    }
};