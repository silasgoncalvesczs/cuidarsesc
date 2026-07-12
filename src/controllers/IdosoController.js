const Idoso = require('../models/Idoso');

function escaparRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function semBiometria(doc) {
    if (!doc) return null;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    delete obj.fotosBase64;
    delete obj.faceDescriptor;
    return obj;
}

module.exports = {
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

            return res.status(201).json(semBiometria(novoIdoso));
        } catch (error) {
            console.error('Erro ao cadastrar idoso:', error);
            return res.status(500).json({ erro: 'Erro interno ao cadastrar idoso.' });
        }
    },

    async index(req, res) {
        try {
            const { busca, ativo } = req.query;
            const filtro = {};

            if (ativo === 'true') {
                filtro.ativo = true;
            } else if (ativo === 'false') {
                filtro.ativo = false;
            }

            if (busca && String(busca).trim()) {
                filtro.nomeCompleto = {
                    $regex: escaparRegex(String(busca).trim()),
                    $options: 'i'
                };
            }

            const idosos = await Idoso.find(filtro)
                .select('-fotosBase64 -faceDescriptor')
                .sort({ nomeCompleto: 1 })
                .limit(200);

            return res.json(idosos);
        } catch (error) {
            console.error('Erro ao listar idosos:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar idosos.' });
        }
    },

    async show(req, res) {
        try {
            const idoso = await Idoso.findById(req.params.id)
                .select('-fotosBase64 -faceDescriptor');

            if (!idoso) {
                return res.status(404).json({ erro: 'Participante não encontrado.' });
            }

            return res.json(idoso);
        } catch (error) {
            console.error('Erro ao buscar idoso:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar participante.' });
        }
    },

    async update(req, res) {
        try {
            const idoso = await Idoso.findById(req.params.id);
            if (!idoso) {
                return res.status(404).json({ erro: 'Participante não encontrado.' });
            }

            const {
                nomeCompleto,
                dataNascimento,
                anamnese,
                fotosBase64,
                faceDescriptor
            } = req.body;

            if (nomeCompleto !== undefined) {
                const nome = String(nomeCompleto).trim();
                if (!nome) {
                    return res.status(400).json({ erro: 'O nome completo é obrigatório.' });
                }
                idoso.nomeCompleto = nome;
            }

            if (dataNascimento !== undefined) {
                idoso.dataNascimento = dataNascimento || undefined;
            }

            if (anamnese !== undefined) {
                idoso.anamnese = {
                    ...((idoso.anamnese && idoso.anamnese.toObject)
                        ? idoso.anamnese.toObject()
                        : (idoso.anamnese || {})),
                    ...anamnese
                };
            }

            // Biometria só é substituída se enviada completa
            if (Array.isArray(faceDescriptor) && faceDescriptor.length === 128) {
                idoso.faceDescriptor = faceDescriptor;
                if (Array.isArray(fotosBase64)) {
                    idoso.fotosBase64 = fotosBase64;
                }
            }

            await idoso.save();
            return res.json(semBiometria(idoso));
        } catch (error) {
            console.error('Erro ao atualizar idoso:', error);
            return res.status(500).json({ erro: 'Erro interno ao atualizar participante.' });
        }
    },

    async atualizarStatus(req, res) {
        try {
            const { ativo } = req.body;

            if (typeof ativo !== 'boolean') {
                return res.status(400).json({ erro: 'Informe ativo como true ou false.' });
            }

            const idoso = await Idoso.findByIdAndUpdate(
                req.params.id,
                { ativo },
                { new: true }
            ).select('-fotosBase64 -faceDescriptor');

            if (!idoso) {
                return res.status(404).json({ erro: 'Participante não encontrado.' });
            }

            return res.json(idoso);
        } catch (error) {
            console.error('Erro ao atualizar status do idoso:', error);
            return res.status(500).json({ erro: 'Erro interno ao atualizar status.' });
        }
    },

    async remove(req, res) {
        try {
            const idoso = await Idoso.findByIdAndDelete(req.params.id);
            if (!idoso) {
                return res.status(404).json({ erro: 'Participante não encontrado.' });
            }
            return res.json({ sucesso: true, id: req.params.id });
        } catch (error) {
            console.error('Erro ao excluir idoso:', error);
            return res.status(500).json({ erro: 'Erro interno ao excluir participante.' });
        }
    }
};
