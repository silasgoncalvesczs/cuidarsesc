const mongoose = require('mongoose');

const atividadeSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    descricao: {
        type: String,
        trim: true
    },
    categoria: {
        type: String,
        required: true,
        trim: true,
        default: 'Outros'
    },
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Atividade', atividadeSchema);
