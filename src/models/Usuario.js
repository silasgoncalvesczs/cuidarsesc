const mongoose = require('mongoose');

const PERFIS_VALIDOS = ['admin', 'gestor', 'operador'];

const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    senhaHash: {
        type: String,
        required: true
    },
    perfil: {
        type: String,
        enum: PERFIS_VALIDOS,
        required: true
    },
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Nunca devolvemos a senha (nem o hash) pro frontend
usuarioSchema.methods.toSafeObject = function () {
    return {
        _id: this._id,
        nome: this.nome,
        email: this.email,
        perfil: this.perfil,
        ativo: this.ativo,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('Usuario', usuarioSchema);
module.exports.PERFIS_VALIDOS = PERFIS_VALIDOS;