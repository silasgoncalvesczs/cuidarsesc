const Idoso = require('../models/Idoso');

module.exports = {
    // Criar um novo cadastro de Idoso
    async create(req, res) {
        try {
            const {
                nomeCompleto,
                dataNascimento,
                fotosBase64,
                faceDescriptor,
                anamnese
            } = req.body;

            if (!nomeCompleto) {
                return res.status(400).json({ erro: 'O nome completo é obrigatório.' });
            }

            const novoIdoso = await Idoso.create({
                nomeCompleto,
                dataNascimento,
                fotosBase64,
                faceDescriptor,
                anamnese
            });

            return res.status(201).json(novoIdoso);

        } catch (error) {
            console.error('Erro ao cadastrar idoso:', error);
            return res.status(500).json({ erro: 'Erro interno ao cadastrar idoso.' });
        }
    },

    // Listar todos os idosos ativos
    async index(req, res) {
        try {
            // Trazemos todos os idosos ativos, mas não precisamos carregar as fotos gigantes em base64 na listagem geral para não pesar a rede
            const idosos = await Idoso.find({ ativo: true })
                .select('-fotosBase64')
                .sort({ nomeCompleto: 1 });
            return res.json(idosos);

        } catch (error) {
            console.error('Erro ao listar idosos:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar idosos.' });
        }
    }
};