const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

function emailAdminSistema() {
    return String(process.env.ADMIN_EMAIL || '').toLowerCase().trim();
}

function senhaAdminSistema() {
    return String(process.env.ADMIN_SENHA || '');
}

function ehUsuarioProtegido(usuario) {
    const email = emailAdminSistema();
    return Boolean(email && usuario && String(usuario.email).toLowerCase() === email);
}

function paraCliente(usuario) {
    const obj = usuario.toSafeObject();
    obj.protegido = ehUsuarioProtegido(usuario);
    return obj;
}

// Garante o admin do .env: cria se não existir; se existir, mantém ativo + perfil admin.
async function garantirAdminSistema() {
    const email = emailAdminSistema();
    const senha = senhaAdminSistema();

    if (!email || !senha) {
        console.warn('ADMIN_EMAIL/ADMIN_SENHA não definidos no .env — admin protegido não foi provisionado.');
        return;
    }

    let usuario = await Usuario.findOne({ email });

    if (!usuario) {
        const senhaHash = await bcrypt.hash(senha, 10);
        usuario = await Usuario.create({
            nome: 'Administrador do Sistema',
            email,
            senhaHash,
            perfil: 'admin',
            ativo: true
        });
        console.log('Admin protegido criado a partir do .env:', email);
        return;
    }

    let alterou = false;
    if (usuario.perfil !== 'admin') {
        usuario.perfil = 'admin';
        alterou = true;
    }
    if (!usuario.ativo) {
        usuario.ativo = true;
        alterou = true;
    }
    if (alterou) {
        await usuario.save();
        console.log('Admin protegido do .env restaurado (ativo/admin):', email);
    }
}

module.exports = {
    emailAdminSistema,
    ehUsuarioProtegido,
    paraCliente,
    garantirAdminSistema
};
