const mongoose = require('mongoose');

const idosoSchema = new mongoose.Schema({
    nomeCompleto: {
        type: String,
        required: true,
        trim: true
    },
    dataNascimento: {
        type: Date
    },

    // --- BIOMETRIA FACIAL ---
    fotosBase64: [{
        type: String
    }], // Guardaremos as fotos de cadastro aqui (ou links do S3 no futuro)
    faceDescriptor: {
        type: [Number]
    }, // Este é o "embedding", o vetor matemático que o face-api vai gerar para reconhecer o rosto

    // --- ANAMNESE (Ficha Médica) ---
    anamnese: {
        tipoSanguineo: String,
        alergias: [String],
        medicamentosUsoContinuo: [String],
        contatoEmergencia: {
            nome: String,
            telefone: String,
            parentesco: String
        },
        condicoesPreExistentes: [String], // Ex: Diabetes, Hipertensão
        observacoesMedicas: String
    },

    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Cria automaticamente os campos 'createdAt' e 'updatedAt'
});

module.exports = mongoose.model('Idoso', idosoSchema);