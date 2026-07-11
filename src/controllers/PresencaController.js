const Presenca = require('../models/Presenca');
const Idoso = require('../models/Idoso'); // Lembre-se: o nome do arquivo técnico continua 'Idoso', mas a lógica serve para qualquer usuário

// Função matemática para comparar os rostos
function calcularDistanciaEuclidiana(desc1, desc2) {
    let sum = 0;
    for (let i = 0; i < 128; i++) {
        sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sum);
}

module.exports = {
    async reconhecer(req, res) {
        try {
            const { atividadeId, faceDescriptor } = req.body;

            if (!atividadeId || !faceDescriptor) {
                return res.status(400).json({ erro: 'Dados da câmera incompletos.' });
            }

            // 1. Busca todos os usuários ativos no banco
            const usuarios = await Idoso.find({ ativo: true }).select('nomeCompleto faceDescriptor');

            if (usuarios.length === 0) {
                return res.status(404).json({ erro: 'Nenhum usuário cadastrado no sistema.' });
            }

            let melhorMatch = null;
            let menorDistancia = 0.5; // Nota de corte. Abaixo de 0.5 consideramos que é a mesma pessoa!

            // 2. Compara o rosto da câmera com todos os usuários do banco
            for (let usuario of usuarios) {
                if (usuario.faceDescriptor && usuario.faceDescriptor.length === 128) {
                    const distancia = calcularDistanciaEuclidiana(faceDescriptor, usuario.faceDescriptor);

                    if (distancia < menorDistancia) {
                        menorDistancia = distancia;
                        melhorMatch = usuario;
                    }
                }
            }

            // 3. Se encontrou alguém parecido...
            if (melhorMatch) {
                // Salva a presença no banco de dados!
                await Presenca.create({
                    idosoId: melhorMatch._id,
                    atividadeId: atividadeId,
                    distanciaFacial: menorDistancia
                });

                return res.json({
                    sucesso: true,
                    nomeUsuario: melhorMatch.nomeCompleto
                });
            } else {
                return res.status(401).json({ erro: 'Rosto não reconhecido. Tente novamente.' });
            }

        } catch (error) {
            console.error('Erro ao registrar presença:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor.' });
        }
    }
};