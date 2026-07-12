const Categoria = require('../models/Categoria');
const Atividade = require('../models/Atividade');

const PADRAO = ['Baile', 'Oficina', 'Reunião', 'Esporte', 'Outros'];

async function garantirCategoriasPadrao() {
    for (const nome of PADRAO) {
        const existe = await Categoria.findOne({ nome });
        if (!existe) {
            await Categoria.create({ nome, ativo: true });
        }
    }

    // Garante categorias usadas por atividades antigas
    const usadas = await Atividade.distinct('categoria');
    for (const nome of usadas) {
        const n = String(nome || '').trim();
        if (!n) continue;
        const existe = await Categoria.findOne({ nome: n });
        if (!existe) {
            await Categoria.create({ nome: n, ativo: true });
        }
    }
}

module.exports = { garantirCategoriasPadrao, PADRAO };
