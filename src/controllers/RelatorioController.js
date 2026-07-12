const Presenca = require('../models/Presenca');
const Idoso = require('../models/Idoso');
const Atividade = require('../models/Atividade');

function inicioDoDia(dataStr) {
    const d = new Date(dataStr + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
}

function fimDoDia(dataStr) {
    const d = new Date(dataStr + 'T23:59:59.999');
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatarDataHora(valor) {
    if (!valor) return '';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('pt-BR');
}

function formatarData(valor) {
    if (!valor) return '';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR');
}

function csvEscape(valor) {
    const texto = String(valor == null ? '' : valor);
    if (/[",;\n\r]/.test(texto)) {
        return '"' + texto.replace(/"/g, '""') + '"';
    }
    return texto;
}

function enviarCsv(res, nomeArquivo, linhas) {
    const conteudo = '\uFEFF' + linhas.map((l) => l.map(csvEscape).join(';')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="' + nomeArquivo + '"');
    return res.send(conteudo);
}

module.exports = {
    async atividades(req, res) {
        try {
            const atividades = await Atividade.find().sort({ nome: 1 }).select('nome categoria ativo');
            return res.json(atividades);
        } catch (error) {
            console.error('Erro ao listar atividades p/ relatório:', error);
            return res.status(500).json({ erro: 'Erro ao listar atividades.' });
        }
    },

    async presencas(req, res) {
        try {
            const { atividadeId, dataInicio, dataFim, formato } = req.query;
            const filtro = {};

            if (atividadeId) {
                filtro.atividadeId = atividadeId;
            }

            if (dataInicio || dataFim) {
                filtro.dataHora = {};
                if (dataInicio) {
                    const ini = inicioDoDia(dataInicio);
                    if (!ini) return res.status(400).json({ erro: 'Data início inválida.' });
                    filtro.dataHora.$gte = ini;
                }
                if (dataFim) {
                    const fim = fimDoDia(dataFim);
                    if (!fim) return res.status(400).json({ erro: 'Data fim inválida.' });
                    filtro.dataHora.$lte = fim;
                }
            }

            const registros = await Presenca.find(filtro)
                .populate('idosoId', 'nomeCompleto dataNascimento ativo')
                .populate('atividadeId', 'nome categoria')
                .sort({ dataHora: -1 })
                .limit(5000)
                .lean();

            const linhas = registros.map((r) => ({
                id: r._id,
                dataHora: r.dataHora,
                dataHoraFormatada: formatarDataHora(r.dataHora),
                tipoRegistro: r.tipoRegistro || 'entrada',
                distanciaFacial: r.distanciaFacial,
                participanteId: r.idosoId && r.idosoId._id,
                participanteNome: (r.idosoId && r.idosoId.nomeCompleto) || 'Participante removido',
                participanteAtivo: r.idosoId ? r.idosoId.ativo : null,
                participanteNascimento: r.idosoId && r.idosoId.dataNascimento
                    ? formatarData(r.idosoId.dataNascimento)
                    : '',
                atividadeId: r.atividadeId && r.atividadeId._id,
                atividadeNome: (r.atividadeId && r.atividadeId.nome) || 'Atividade removida',
                atividadeCategoria: (r.atividadeId && r.atividadeId.categoria) || ''
            }));

            if (formato === 'csv') {
                const header = [
                    'Data/Hora',
                    'Participante',
                    'Nascimento',
                    'Status participante',
                    'Atividade',
                    'Categoria',
                    'Tipo',
                    'Distância facial'
                ];
                const body = linhas.map((l) => [
                    l.dataHoraFormatada,
                    l.participanteNome,
                    l.participanteNascimento,
                    l.participanteAtivo === false ? 'Inativo' : (l.participanteAtivo === true ? 'Ativo' : ''),
                    l.atividadeNome,
                    l.atividadeCategoria,
                    l.tipoRegistro,
                    l.distanciaFacial != null ? Number(l.distanciaFacial).toFixed(4) : ''
                ]);
                return enviarCsv(res, 'relatorio-presencas.csv', [header, ...body]);
            }

            return res.json({
                total: linhas.length,
                filtros: { atividadeId: atividadeId || null, dataInicio: dataInicio || null, dataFim: dataFim || null },
                registros: linhas
            });
        } catch (error) {
            console.error('Erro no relatório de presenças:', error);
            return res.status(500).json({ erro: 'Erro ao gerar relatório de presenças.' });
        }
    },

    async participantes(req, res) {
        try {
            const { ativo, dataInicio, dataFim, busca, formato } = req.query;
            const filtro = {};

            if (ativo === 'true') filtro.ativo = true;
            if (ativo === 'false') filtro.ativo = false;

            if (busca && String(busca).trim()) {
                const texto = String(busca).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                filtro.nomeCompleto = { $regex: texto, $options: 'i' };
            }

            if (dataInicio || dataFim) {
                filtro.createdAt = {};
                if (dataInicio) {
                    const ini = inicioDoDia(dataInicio);
                    if (!ini) return res.status(400).json({ erro: 'Data início inválida.' });
                    filtro.createdAt.$gte = ini;
                }
                if (dataFim) {
                    const fim = fimDoDia(dataFim);
                    if (!fim) return res.status(400).json({ erro: 'Data fim inválida.' });
                    filtro.createdAt.$lte = fim;
                }
            }

            const lista = await Idoso.find(filtro)
                .select('-fotosBase64 -faceDescriptor')
                .sort({ nomeCompleto: 1 })
                .limit(5000)
                .lean();

            const linhas = lista.map((p) => ({
                id: p._id,
                nomeCompleto: p.nomeCompleto,
                dataNascimento: p.dataNascimento,
                dataNascimentoFormatada: formatarData(p.dataNascimento),
                ativo: p.ativo,
                cadastradoEm: p.createdAt,
                cadastradoEmFormatado: formatarDataHora(p.createdAt),
                tipoSanguineo: (p.anamnese && p.anamnese.tipoSanguineo) || '',
                alergias: ((p.anamnese && p.anamnese.alergias) || []).join(', '),
                medicamentos: ((p.anamnese && p.anamnese.medicamentosUsoContinuo) || []).join(', ')
            }));

            if (formato === 'csv') {
                const header = [
                    'Nome completo',
                    'Nascimento',
                    'Status',
                    'Cadastrado em',
                    'Tipo sanguíneo',
                    'Alergias',
                    'Medicamentos'
                ];
                const body = linhas.map((l) => [
                    l.nomeCompleto,
                    l.dataNascimentoFormatada,
                    l.ativo ? 'Ativo' : 'Inativo',
                    l.cadastradoEmFormatado,
                    l.tipoSanguineo,
                    l.alergias,
                    l.medicamentos
                ]);
                return enviarCsv(res, 'relatorio-participantes.csv', [header, ...body]);
            }

            return res.json({
                total: linhas.length,
                filtros: {
                    ativo: ativo || null,
                    dataInicio: dataInicio || null,
                    dataFim: dataFim || null,
                    busca: busca || null
                },
                registros: linhas
            });
        } catch (error) {
            console.error('Erro no relatório de participantes:', error);
            return res.status(500).json({ erro: 'Erro ao gerar relatório de participantes.' });
        }
    }
};
