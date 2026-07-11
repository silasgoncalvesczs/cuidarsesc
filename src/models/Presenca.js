const mongoose = require('mongoose');

const presencaSchema = new mongoose.Schema({
    // Relacionamento com o Idoso
    idosoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Idoso',
        required: true
    },
    // Relacionamento com a Atividade
    atividadeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Atividade',
        required: true
    },
    dataHora: {
        type: Date,
        default: Date.now
    },
    // Guardamos a "certeza" matemática do reconhecimento facial (opcional, mas bom para auditoria)
    distanciaFacial: {
        type: Number
    },
    // Tipo de registro (entrada ou saída, caso no futuro queiram controlar o tempo que o idoso ficou)
    tipoRegistro: {
        type: String,
        enum: ['entrada', 'saida'],
        default: 'entrada'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Presenca', presencaSchema);