const fs = require('fs');
const path = require('path');
const os = require('os');
const { pipeline } = require('stream/promises');
const archiver = require('archiver');
const unzipper = require('unzipper');

const Usuario = require('../models/Usuario');
const Idoso = require('../models/Idoso');
const Atividade = require('../models/Atividade');
const Presenca = require('../models/Presenca');
const Categoria = require('../models/Categoria');

const FORMATO_VERSAO = 1;
const COLLECTIONS = [
    { arquivo: 'usuarios.json', model: Usuario },
    { arquivo: 'idosos.json', model: Idoso },
    { arquivo: 'categorias.json', model: Categoria },
    { arquivo: 'atividades.json', model: Atividade },
    { arquivo: 'presencas.json', model: Presenca }
];

function nomeArquivoBackup(data = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const stamp =
        data.getFullYear() +
        pad(data.getMonth() + 1) +
        pad(data.getDate()) +
        '-' +
        pad(data.getHours()) +
        pad(data.getMinutes()) +
        pad(data.getSeconds());
    return `cuidar-sesc-backup-${stamp}.zip`;
}

function pastaBackupServidor() {
    const dir = String(process.env.BACKUP_DIR || '').trim();
    return dir || null;
}

async function coletarDados() {
    const contagens = {};
    const arquivos = {};

    for (const item of COLLECTIONS) {
        const docs = await item.model.find().lean();
        contagens[item.arquivo.replace('.json', '')] = docs.length;
        arquivos[item.arquivo] = JSON.stringify(docs);
    }

    const manifest = {
        formato: FORMATO_VERSAO,
        sistema: 'cuidar-sesc',
        geradoEm: new Date().toISOString(),
        contagens
    };

    return { manifest, arquivos, contagens };
}

function criarZipStream(manifest, arquivos) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
    for (const [nome, conteudo] of Object.entries(arquivos)) {
        archive.append(conteudo, { name: nome });
    }
    archive.finalize();
    return archive;
}

async function gravarZipEmArquivo(destinoPath) {
    const { manifest, arquivos, contagens } = await coletarDados();
    await fs.promises.mkdir(path.dirname(destinoPath), { recursive: true });
    const saida = fs.createWriteStream(destinoPath);
    const archive = criarZipStream(manifest, arquivos);
    await pipeline(archive, saida);
    return { manifest, contagens, caminho: destinoPath };
}

async function gerarBackupTemporario() {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cuidar-backup-'));
    const nome = nomeArquivoBackup();
    const caminho = path.join(dir, nome);
    const resultado = await gravarZipEmArquivo(caminho);
    return { ...resultado, dirTemp: dir, nomeArquivo: nome };
}

async function limparDirTemp(dirTemp) {
    if (!dirTemp) return;
    try {
        await fs.promises.rm(dirTemp, { recursive: true, force: true });
    } catch (_) { /* ignore */ }
}

async function lerBackupZip(caminhoZip) {
    const directory = await unzipper.Open.file(caminhoZip);
    const mapa = {};

    for (const entry of directory.files) {
        if (entry.type === 'Directory') continue;
        const nome = path.basename(entry.path);
        const buffer = await entry.buffer();
        mapa[nome] = buffer.toString('utf8');
    }

    if (!mapa['manifest.json']) {
        throw new Error('Arquivo inválido: falta manifest.json.');
    }

    let manifest;
    try {
        manifest = JSON.parse(mapa['manifest.json']);
    } catch (_) {
        throw new Error('manifest.json inválido.');
    }

    if (manifest.sistema !== 'cuidar-sesc') {
        throw new Error('Este arquivo não é um backup do CUIDAR SESC.');
    }

    if (Number(manifest.formato) !== FORMATO_VERSAO) {
        throw new Error('Versão de backup não suportada.');
    }

    const dados = {};
    for (const item of COLLECTIONS) {
        if (!mapa[item.arquivo]) {
            if (item.arquivo === 'categorias.json') {
                dados[item.arquivo] = [];
                continue;
            }
            throw new Error(`Arquivo incompleto: falta ${item.arquivo}.`);
        }
        try {
            dados[item.arquivo] = JSON.parse(mapa[item.arquivo]);
            if (!Array.isArray(dados[item.arquivo])) {
                throw new Error('não é lista');
            }
        } catch (err) {
            if (err && err.message === 'não é lista') {
                throw new Error(`${item.arquivo} inválido.`);
            }
            throw new Error(`${item.arquivo} inválido.`);
        }
    }

    return { manifest, dados };
}

async function restaurarDeZip(caminhoZip) {
    const { manifest, dados } = await lerBackupZip(caminhoZip);

    // Ordem: limpa dependentes primeiro, depois reinsere bases e por fim presenças
    await Presenca.deleteMany({});
    await Idoso.deleteMany({});
    await Atividade.deleteMany({});
    await Categoria.deleteMany({});
    await Usuario.deleteMany({});

    for (const item of COLLECTIONS) {
        const docs = dados[item.arquivo];
        if (docs.length) {
            await item.model.insertMany(docs, { ordered: false });
        }
    }

    const { garantirAdminSistema } = require('../utils/adminSistema');
    await garantirAdminSistema();
    const { garantirCategoriasPadrao } = require('../utils/categoriasPadrao');
    await garantirCategoriasPadrao();

    return {
        manifest,
        contagens: Object.fromEntries(
            COLLECTIONS.map((c) => [c.arquivo.replace('.json', ''), dados[c.arquivo].length])
        )
    };
}

async function listarBackupsServidor() {
    const dir = pastaBackupServidor();
    if (!dir) return [];

    try {
        await fs.promises.mkdir(dir, { recursive: true });
        const arquivos = await fs.promises.readdir(dir);
        const detalhes = [];
        for (const nome of arquivos) {
            if (!nome.endsWith('.zip')) continue;
            const full = path.join(dir, nome);
            const st = await fs.promises.stat(full);
            if (!st.isFile()) continue;
            detalhes.push({
                nome,
                tamanho: st.size,
                modificadoEm: st.mtime.toISOString()
            });
        }
        detalhes.sort((a, b) => String(b.modificadoEm).localeCompare(String(a.modificadoEm)));
        return detalhes;
    } catch (_) {
        return [];
    }
}

module.exports = {
    FORMATO_VERSAO,
    nomeArquivoBackup,
    pastaBackupServidor,
    coletarDados,
    criarZipStream,
    gravarZipEmArquivo,
    gerarBackupTemporario,
    limparDirTemp,
    restaurarDeZip,
    listarBackupsServidor
};
