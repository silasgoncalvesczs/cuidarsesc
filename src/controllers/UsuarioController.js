const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { JWT_SECRET } = require('../middleware/auth');
const { ehUsuarioProtegido, paraCliente } = require('../utils/adminSistema');

const PERFIS = ['admin', 'gestor', 'operador'];
const MSG_PROTEGIDO = 'Este é o administrador do sistema (.env) e não pode ser inativado, excluído ou despromovido.';

async function contarAdminsAtivos(excetoId) {
    const filtro = { perfil: 'admin', ativo: true };
    if (excetoId) {
        filtro._id = { $ne: excetoId };
    }
    return Usuario.countDocuments(filtro);
}

module.exports = {
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

            if (!PERFIS.includes(perfilFinal)) {
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

            return res.status(201).json(paraCliente(novoUsuario));
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
                usuario: paraCliente(usuario)
            });
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return res.status(500).json({ erro: 'Erro interno ao fazer login.' });
        }
    },

    async index(req, res) {
        try {
            const usuarios = await Usuario.find().sort({ nome: 1 });
            return res.json(usuarios.map(paraCliente));
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            return res.status(500).json({ erro: 'Erro interno ao listar usuários.' });
        }
    },

    async me(req, res) {
        return res.json(paraCliente(req.usuario));
    },

    async alterarSenha(req, res) {
        try {
            const { senhaAtual, senhaNova } = req.body;

            if (!senhaAtual || !senhaNova) {
                return res.status(400).json({ erro: 'Informe a senha atual e a nova senha.' });
            }

            if (String(senhaNova).length < 6) {
                return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres.' });
            }

            if (senhaAtual === senhaNova) {
                return res.status(400).json({ erro: 'A nova senha deve ser diferente da senha atual.' });
            }

            const usuario = await Usuario.findById(req.usuario._id);
            if (!usuario || !usuario.ativo) {
                return res.status(401).json({ erro: 'Usuário inválido ou inativo.' });
            }

            const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senhaHash);
            if (!senhaCorreta) {
                return res.status(400).json({ erro: 'Senha atual incorreta.' });
            }

            usuario.senhaHash = await bcrypt.hash(senhaNova, 10);
            await usuario.save();

            return res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso.' });
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            return res.status(500).json({ erro: 'Erro interno ao alterar senha.' });
        }
    },

    async show(req, res) {
        try {
            const usuario = await Usuario.findById(req.params.id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }
            return res.json(paraCliente(usuario));
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar usuário.' });
        }
    },

    async update(req, res) {
        try {
            const usuario = await Usuario.findById(req.params.id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }

            const protegido = ehUsuarioProtegido(usuario);
            const { nome, email, senha, perfil } = req.body;

            if (nome !== undefined) {
                const nomeTrim = String(nome).trim();
                if (!nomeTrim) {
                    return res.status(400).json({ erro: 'O nome é obrigatório.' });
                }
                usuario.nome = nomeTrim;
            }

            if (email !== undefined) {
                const emailNorm = String(email).toLowerCase().trim();
                if (!emailNorm) {
                    return res.status(400).json({ erro: 'O e-mail é obrigatório.' });
                }
                if (protegido && emailNorm !== String(usuario.email).toLowerCase()) {
                    return res.status(400).json({
                        erro: 'O e-mail do administrador do sistema (.env) não pode ser alterado.'
                    });
                }
                const conflito = await Usuario.findOne({
                    email: emailNorm,
                    _id: { $ne: usuario._id }
                });
                if (conflito) {
                    return res.status(400).json({ erro: 'Já existe um usuário com esse e-mail.' });
                }
                usuario.email = emailNorm;
            }

            if (perfil !== undefined) {
                if (!PERFIS.includes(perfil)) {
                    return res.status(400).json({ erro: 'Perfil inválido.' });
                }
                if (protegido && perfil !== 'admin') {
                    return res.status(400).json({ erro: MSG_PROTEGIDO });
                }
                if (usuario.perfil === 'admin' && perfil !== 'admin') {
                    const outrosAdmins = await contarAdminsAtivos(usuario._id);
                    if (outrosAdmins === 0) {
                        return res.status(400).json({
                            erro: 'Não é possível alterar o perfil do único administrador ativo.'
                        });
                    }
                }
                usuario.perfil = perfil;
            }

            if (senha) {
                if (String(senha).length < 6) {
                    return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
                }
                usuario.senhaHash = await bcrypt.hash(senha, 10);
            }

            await usuario.save();
            return res.json(paraCliente(usuario));
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return res.status(500).json({ erro: 'Erro interno ao atualizar usuário.' });
        }
    },

    async atualizarStatus(req, res) {
        try {
            const { ativo } = req.body;
            if (typeof ativo !== 'boolean') {
                return res.status(400).json({ erro: 'Informe ativo como true ou false.' });
            }

            const usuario = await Usuario.findById(req.params.id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }

            if (ehUsuarioProtegido(usuario) && ativo === false) {
                return res.status(400).json({ erro: MSG_PROTEGIDO });
            }

            if (String(usuario._id) === String(req.usuario._id) && ativo === false) {
                return res.status(400).json({ erro: 'Você não pode inativar a si mesmo.' });
            }

            if (usuario.perfil === 'admin' && usuario.ativo && ativo === false) {
                const outrosAdmins = await contarAdminsAtivos(usuario._id);
                if (outrosAdmins === 0) {
                    return res.status(400).json({
                        erro: 'Não é possível inativar o único administrador ativo.'
                    });
                }
            }

            usuario.ativo = ativo;
            await usuario.save();
            return res.json(paraCliente(usuario));
        } catch (error) {
            console.error('Erro ao atualizar status do usuário:', error);
            return res.status(500).json({ erro: 'Erro interno ao atualizar status.' });
        }
    },

    async remove(req, res) {
        try {
            const usuario = await Usuario.findById(req.params.id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }

            if (ehUsuarioProtegido(usuario)) {
                return res.status(400).json({ erro: MSG_PROTEGIDO });
            }

            if (String(usuario._id) === String(req.usuario._id)) {
                return res.status(400).json({ erro: 'Você não pode excluir a si mesmo.' });
            }

            if (usuario.perfil === 'admin' && usuario.ativo) {
                const outrosAdmins = await contarAdminsAtivos(usuario._id);
                if (outrosAdmins === 0) {
                    return res.status(400).json({
                        erro: 'Não é possível excluir o único administrador ativo.'
                    });
                }
            }

            await Usuario.findByIdAndDelete(usuario._id);
            return res.json({ sucesso: true, id: req.params.id });
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            return res.status(500).json({ erro: 'Erro interno ao excluir usuário.' });
        }
    }
};
