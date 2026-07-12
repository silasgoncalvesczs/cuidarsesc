const Categoria = require('../models/Categoria');
const Atividade = require('../models/Atividade');

module.exports = {
    async index(req, res) {
        try {
            const { ativo, busca } = req.query;
            const filtro = {};

            if (ativo === 'true') filtro.ativo = true;
            if (ativo === 'false') filtro.ativo = false;

            if (busca && String(busca).trim()) {
                filtro.nome = { $regex: String(busca).trim(), $options: 'i' };
            }

            const categorias = await Categoria.find(filtro).sort({ nome: 1 });
            return res.json(categorias);
        } catch (error) {
            console.error('Erro ao listar categorias:', error);
            return res.status(500).json({ erro: 'Erro ao listar categorias.' });
        }
    },

    async create(req, res) {
        try {
            const nome = String(req.body.nome || '').trim();
            if (!nome) {
                return res.status(400).json({ erro: 'O nome da categoria é obrigatório.' });
            }

            const existe = await Categoria.findOne({ nome: new RegExp('^' + nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
            if (existe) {
                return res.status(400).json({ erro: 'Já existe uma categoria com esse nome.' });
            }

            const categoria = await Categoria.create({ nome, ativo: true });
            return res.status(201).json(categoria);
        } catch (error) {
            console.error('Erro ao criar categoria:', error);
            if (error && error.code === 11000) {
                return res.status(400).json({ erro: 'Já existe uma categoria com esse nome.' });
            }
            return res.status(500).json({ erro: 'Erro ao criar categoria.' });
        }
    },

    async update(req, res) {
        try {
            const categoria = await Categoria.findById(req.params.id);
            if (!categoria) {
                return res.status(404).json({ erro: 'Categoria não encontrada.' });
            }

            const nomeAnterior = categoria.nome;
            const nome = req.body.nome !== undefined ? String(req.body.nome).trim() : undefined;

            if (nome !== undefined) {
                if (!nome) {
                    return res.status(400).json({ erro: 'O nome da categoria é obrigatório.' });
                }
                const conflito = await Categoria.findOne({
                    _id: { $ne: categoria._id },
                    nome: new RegExp('^' + nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i')
                });
                if (conflito) {
                    return res.status(400).json({ erro: 'Já existe uma categoria com esse nome.' });
                }
                categoria.nome = nome;
            }

            await categoria.save();

            if (nome && nome !== nomeAnterior) {
                await Atividade.updateMany({ categoria: nomeAnterior }, { $set: { categoria: nome } });
            }

            return res.json(categoria);
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            return res.status(500).json({ erro: 'Erro ao atualizar categoria.' });
        }
    },

    async atualizarStatus(req, res) {
        try {
            const { ativo } = req.body;
            if (typeof ativo !== 'boolean') {
                return res.status(400).json({ erro: 'Informe ativo como true ou false.' });
            }

            const categoria = await Categoria.findById(req.params.id);
            if (!categoria) {
                return res.status(404).json({ erro: 'Categoria não encontrada.' });
            }

            if (ativo === false) {
                const emUso = await Atividade.countDocuments({ categoria: categoria.nome, ativo: true });
                if (emUso > 0) {
                    return res.status(400).json({
                        erro: 'Há atividades ativas nesta categoria. Inative-as ou troque a categoria antes.'
                    });
                }
            }

            categoria.ativo = ativo;
            await categoria.save();
            return res.json(categoria);
        } catch (error) {
            console.error('Erro ao atualizar status da categoria:', error);
            return res.status(500).json({ erro: 'Erro ao atualizar status da categoria.' });
        }
    },

    async remove(req, res) {
        try {
            const categoria = await Categoria.findById(req.params.id);
            if (!categoria) {
                return res.status(404).json({ erro: 'Categoria não encontrada.' });
            }

            const emUso = await Atividade.countDocuments({ categoria: categoria.nome });
            if (emUso > 0) {
                return res.status(400).json({
                    erro: 'Não é possível excluir: existem atividades nesta categoria. Inative a categoria ou mova as atividades.'
                });
            }

            await Categoria.findByIdAndDelete(categoria._id);
            return res.json({ sucesso: true, id: req.params.id });
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            return res.status(500).json({ erro: 'Erro ao excluir categoria.' });
        }
    }
};
