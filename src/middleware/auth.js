const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'troque-esse-segredo-em-producao';

// Exige token válido. Usa em rotas que só podem ser acessadas logado.
async function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token não informado.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const usuario = await Usuario.findById(payload.id);

        if (!usuario || !usuario.ativo) {
            return res.status(401).json({ erro: 'Usuário inválido ou inativo.' });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
}

// Tenta autenticar, mas não bloqueia se não houver token.
// Usado só na criação de usuário, para permitir o bootstrap do primeiro admin.
async function autenticarOpcional(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const usuario = await Usuario.findById(payload.id);
        if (usuario && usuario.ativo) {
            req.usuario = usuario;
        }
    } catch (error) {
        // token inválido: apenas segue sem autenticação
    }

    next();
}

// Restringe a rota a determinados perfis. Use depois de "autenticar".
function autorizar(...perfisPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ erro: 'Não autenticado.' });
        }
        if (!perfisPermitidos.includes(req.usuario.perfil)) {
            return res.status(403).json({ erro: 'Você não tem permissão para acessar este recurso.' });
        }
        next();
    };
}

module.exports = { autenticar, autenticarOpcional, autorizar, JWT_SECRET };