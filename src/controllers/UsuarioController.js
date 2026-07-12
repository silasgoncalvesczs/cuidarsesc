const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { JWT_SECRET } = require('../middleware/auth');

module.exports = {
    // Se não existir NENHUM usuário no sistema, permite criar o primeiro
    // (que vira admin automaticamente) sem precisar de token.
    // A partir do segundo usuário em diante, só admin logado pode criar.
    async create(req, res) {
        try {
            const { nome, email, senha, perfil } = req.body;

            if (!nome || !email || !senha) {
                return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
            }

            const totalUsuarios = await Usuario.countDocuments();
            const ehPrimeiroUsuario = totalUsuarios === 0;

            if (!ehPrimeiroUsuario) {
                if (!req.usuario) {
                    return res.status(401).json({ erro: 'É necessário estar autenticado para criar usuários.' });
                }
                if (req.usuario.perfil !== 'admin') {
                    return res.status(403).json({ erro: 'Apenas administradores podem criar novos usuários.' });
                }
            }

            const perfilFinal = ehPrimeiroUsuario ? 'admin' : perfil;

            if (!['admin', 'gestor', 'operador'].includes(perfilFinal)) {
                return res.status(400).json({ erro: 'Perfil inválido.' });
            }

            const jaExiste = await Usuario.findOne({ email: email.toLowerCase() });
            if (jaExiste) {
                return res.status(400).json({ erro: 'Já existe um usuário com esse e-mail.' });
            }

            const senhaHash = await bcrypt.hash(senha, 10);

            const novoUsuario = await Usuario.create({
                nome,
                email: email.toLowerCase(),
                senhaHash,
                perfil: perfilFinal
            });

            return res.status(201).json(novoUsuario.toSafeObject());

        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            return res.status(500).json({ erro: 'Erro interno ao criar usuário.' });
        }
    },

    async login(req, res) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
            }

            const usuario = await Usuario.findOne({ email: email.toLowerCase() });

            if (!usuario || !usuario.ativo) {
                return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
            }

            const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);

            if (!senhaCorreta) {
                return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
            }

            const token = jwt.sign(
                { id: usuario._id, perfil: usuario.perfil },
                JWT_SECRET,
                { expiresIn: '12h' }
            );

            return res.json({
                token,
                usuario: usuario.toSafeObject()
            });

        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return res.status(500).json({ erro: 'Erro interno ao fazer login.' });
        }
    },

    async index(req, res) {
        try {
            const usuarios = await Usuario.find().sort({ nome: 1 });
            return res.json(usuarios.map(u => u.toSafeObject()));
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            return res.status(500).json({ erro: 'Erro interno ao listar usuários.' });
        }
    }
};