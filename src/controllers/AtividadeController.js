const Atividade = require('../models/Atividade');
const Categoria = require('../models/Categoria');
const Presenca = require('../models/Presenca');

async function validarCategoria(nomeCategoria) {
    const nome = String(nomeCategoria || '').trim();
    if (!nome) {
        return { ok: false, erro: 'A categoria é obrigatória.' };
    }
    const categoria = await Categoria.findOne({ nome });
    if (!categoria) {
        return { ok: false, erro: 'Categoria inválida. Cadastre a categoria antes.' };
    }
    if (!categoria.ativo) {
        return { ok: false, erro: 'Esta categoria está inativa.' };
    }
    return { ok: true, nome: categoria.nome };
}

module.exports = {
    async create(req, res) {
        try {
            const { nome, descricao, categoria } = req.body;

            if (!nome || !String(nome).trim()) {
                return res.status(400).json({ erro: 'O nome da atividade é obrigatório.' });
            }

            const cat = await validarCategoria(categoria || 'Outros');
            if (!cat.ok) {
                return res.status(400).json({ erro: cat.erro });
            }

            const novaAtividade = await Atividade.create({
                nome: String(nome).trim(),
                descricao: descricao ? String(descricao).trim() : '',
                categoria: cat.nome
            });
            return res.status(201).json(novaAtividade);
        } catch (error) {
            console.error('Erro ao criar atividade:', error);
            return res.status(500).json({ erro: 'Erro interno no servidor ao criar atividade.' });
        }
    },

    async index(req, res) {
        try {
            const { ativo, busca, categoria, todas } = req.query;
            const filtro = {};
            const autenticado = Boolean(req.usuario);

            // Público (totem): só atividades ativas
            if (!autenticado) {
                filtro.ativo = true;
            } else if (ativo === 'true') {
                filtro.ativo = true;
            } else if (ativo === 'false') {
                filtro.ativo = false;
            } else if (todas !== 'true' && ativo === undefined) {
                filtro.ativo = true;
            }

            if (categoria) filtro.categoria = String(categoria).trim();

            if (busca && String(busca).trim()) {
                filtro.nome = { $regex: String(busca).trim(), $options: 'i' };
            }

            const atividades = await Atividade.find(filtro).sort({ nome: 1 });
            return res.json(atividades);
        } catch (error) {
            console.error('Erro ao listar atividades:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar atividades.' });
        }
    },

    async show(req, res) {
        try {
            const atividade = await Atividade.findById(req.params.id);
            if (!atividade) {
                return res.status(404).json({ erro: 'Atividade não encontrada.' });
            }
            return res.json(atividade);
        } catch (error) {
            console.error('Erro ao buscar atividade:', error);
            return res.status(500).json({ erro: 'Erro ao buscar atividade.' });
        }
    },

    async update(req, res) {
        try {
            const atividade = await Atividade.findById(req.params.id);
            if (!atividade) {
                return res.status(404).json({ erro: 'Atividade não encontrada.' });
            }

            const { nome, descricao, categoria } = req.body;

            if (nome !== undefined) {
                const nomeTrim = String(nome).trim();
                if (!nomeTrim) {
                    return res.status(400).json({ erro: 'O nome da atividade é obrigatório.' });
                }
                atividade.nome = nomeTrim;
            }

            if (descricao !== undefined) {
                atividade.descricao = String(descricao).trim();
            }

            if (categoria !== undefined) {
                const cat = await validarCategoria(categoria);
                if (!cat.ok) {
                    return res.status(400).json({ erro: cat.erro });
                }
                atividade.categoria = cat.nome;
            }

            await atividade.save();
            return res.json(atividade);
        } catch (error) {
            console.error('Erro ao atualizar atividade:', error);
            return res.status(500).json({ erro: 'Erro ao atualizar atividade.' });
        }
    },

    async atualizarStatus(req, res) {
        try {
            const { ativo } = req.body;
            if (typeof ativo !== 'boolean') {
                return res.status(400).json({ erro: 'Informe ativo como true ou false.' });
            }

            const atividade = await Atividade.findById(req.params.id);
            if (!atividade) {
                return res.status(404).json({ erro: 'Atividade não encontrada.' });
            }

            if (ativo === true) {
                const cat = await Categoria.findOne({ nome: atividade.categoria });
                if (!cat || !cat.ativo) {
                    return res.status(400).json({
                        erro: 'A categoria desta atividade está inativa ou não existe. Ative/cadastre a categoria antes.'
                    });
                }
            }

            atividade.ativo = ativo;
            await atividade.save();
            return res.json(atividade);
        } catch (error) {
            console.error('Erro ao atualizar status da atividade:', error);
            return res.status(500).json({ erro: 'Erro ao atualizar status da atividade.' });
        }
    },

    async remove(req, res) {
        try {
            const atividade = await Atividade.findById(req.params.id);
            if (!atividade) {
                return res.status(404).json({ erro: 'Atividade não encontrada.' });
            }

            const presencas = await Presenca.countDocuments({ atividadeId: atividade._id });
            if (presencas > 0) {
                return res.status(400).json({
                    erro: 'Não é possível excluir: há registros de presença. Inative a atividade em vez de excluir.'
                });
            }

            await Atividade.findByIdAndDelete(atividade._id);
            return res.json({ sucesso: true, id: req.params.id });
        } catch (error) {
            console.error('Erro ao excluir atividade:', error);
            return res.status(500).json({ erro: 'Erro ao excluir atividade.' });
        }
    }
};
