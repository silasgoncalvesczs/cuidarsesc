const fs = require('fs');
const path = require('path');
const multer = require('multer');
const os = require('os');
const backupService = require('../services/backupService');

const UPLOAD_DIR = path.join(os.tmpdir(), 'cuidar-restore-uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
    dest: UPLOAD_DIR,
    limits: { fileSize: 200 * 1024 * 1024 }
});

module.exports = {
    uploadRestore: upload.single('arquivo'),

    async info(req, res) {
        try {
            const pasta = backupService.pastaBackupServidor();
            const noServidor = pasta ? await backupService.listarBackupsServidor() : [];
            return res.json({
                pastaServidorConfigurada: Boolean(pasta),
                pastaServidor: pasta || null,
                backupsNoServidor: noServidor
            });
        } catch (error) {
            console.error('Erro ao ler info de backup:', error);
            return res.status(500).json({ erro: 'Erro ao consultar configuração de backup.' });
        }
    },

    async download(req, res) {
        let dirTemp = null;
        try {
            const gerado = await backupService.gerarBackupTemporario();
            dirTemp = gerado.dirTemp;

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="' + gerado.nomeArquivo + '"'
            );
            res.setHeader('X-Backup-Filename', gerado.nomeArquivo);
            res.setHeader('X-Backup-Counts', JSON.stringify(gerado.contagens));

            const stream = fs.createReadStream(gerado.caminho);
            stream.on('close', () => backupService.limparDirTemp(dirTemp));
            stream.on('error', async () => {
                await backupService.limparDirTemp(dirTemp);
                if (!res.headersSent) {
                    res.status(500).json({ erro: 'Erro ao enviar o backup.' });
                }
            });
            stream.pipe(res);
        } catch (error) {
            await backupService.limparDirTemp(dirTemp);
            console.error('Erro ao gerar backup:', error);
            if (!res.headersSent) {
                return res.status(500).json({ erro: 'Erro ao gerar backup.' });
            }
        }
    },

    async salvarServidor(req, res) {
        try {
            const pasta = backupService.pastaBackupServidor();
            if (!pasta) {
                return res.status(400).json({
                    erro: 'Pasta do servidor não configurada. Defina BACKUP_DIR no .env.'
                });
            }

            await fs.promises.mkdir(pasta, { recursive: true });
            const nome = backupService.nomeArquivoBackup();
            const destino = path.join(pasta, nome);
            const gerado = await backupService.gravarZipEmArquivo(destino);

            return res.json({
                sucesso: true,
                nomeArquivo: nome,
                caminho: gerado.caminho,
                contagens: gerado.contagens,
                geradoEm: gerado.manifest.geradoEm
            });
        } catch (error) {
            console.error('Erro ao salvar backup no servidor:', error);
            return res.status(500).json({ erro: 'Erro ao salvar backup no servidor.' });
        }
    },

    async restore(req, res) {
        if (!req.file) {
            return res.status(400).json({ erro: 'Envie o arquivo .zip do backup.' });
        }

        const confirmacao = String(req.body.confirmacao || '').trim().toUpperCase();
        if (confirmacao !== 'RESTAURAR') {
            try { await fs.promises.unlink(req.file.path); } catch (_) { /* ignore */ }
            return res.status(400).json({
                erro: 'Para confirmar, digite RESTAURAR no campo de confirmação.'
            });
        }

        try {
            const resultado = await backupService.restaurarDeZip(req.file.path);
            return res.json({
                sucesso: true,
                mensagem: 'Backup restaurado com sucesso.',
                contagens: resultado.contagens,
                geradoEm: resultado.manifest.geradoEm
            });
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            return res.status(400).json({
                erro: error.message || 'Não foi possível restaurar o backup.'
            });
        } finally {
            try { await fs.promises.unlink(req.file.path); } catch (_) { /* ignore */ }
        }
    }
};
