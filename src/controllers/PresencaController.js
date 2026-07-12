const Presenca = require('../models/Presenca');
const Idoso = require('../models/Idoso');

function calcularDistanciaEuclidiana(desc1, desc2) {
    let sum = 0;
    for (let i = 0; i < 128; i++) {
        sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sum);
}

module.exports = {
    // PASSO 1: Só identifica quem é a pessoa, NÃO grava presença ainda
    async identificar(req, res) {
        try {
            const { faceDescriptor } = req.body;

            if (!faceDescriptor) {
                return res.status(400).json({ erro: 'Dados da câmera incompletos.' });
            }

            const usuarios = await Idoso.find({ ativo: true }).select('nomeCompleto faceDescriptor');

            if (usuarios.length === 0) {
                return res.status(404).json({ erro: 'Nenhum usuário cadastrado no sistema.' });
            }

            let melhorMatch = null;
            let menorDistancia = 0.5;

            for (let usuario of usuarios) {
                if (usuario.faceDescriptor && usuario.faceDescriptor.length === 128) {
                    const distancia = calcularDistanciaEuclidiana(faceDescriptor, usuario.faceDescriptor);
                    if (distancia < menorDistancia) {
                        menorDistancia = distancia;
                        melhorMatch = usuario;
                    }
                }
            }

            if (melhorMatch) {
                return res.json({
                    sucesso: true,
                    idosoId: melhorMatch._id,
                    nomeUsuario: melhorMatch.nomeCompleto,
                    distancia: menorDistancia
                });
            }

            return res.status(404).json({ erro: 'Rosto não reconhecido.' });

        } catch (error) {
            console.error('Erro ao identificar rosto:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor.' });
        }
    },

    // PASSO 2: Só é chamado depois que a pessoa clica em "Sim, sou eu"
    async confirmar(req, res) {
        try {
            const { idosoId, atividadeId, distancia } = req.body;

            if (!idosoId || !atividadeId) {
                return res.status(400).json({ erro: 'Dados incompletos para confirmar presença.' });
            }

            const presenca = await Presenca.create({
                idosoId,
                atividadeId,
                distanciaFacial: distancia
            });

            return res.status(201).json({ sucesso: true, presenca });

        } catch (error) {
            console.error('Erro ao confirmar presença:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor.' });
        }
    }
};