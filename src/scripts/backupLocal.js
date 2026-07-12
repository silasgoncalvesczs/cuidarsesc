/**
 * Gera backup na pasta BACKUP_DIR (para cron / automação).
 * Uso no container:
 *   docker compose exec app node src/scripts/backupLocal.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const backupService = require('../services/backupService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cuidar_sesc';

async function main() {
    const pasta = backupService.pastaBackupServidor();
    if (!pasta) {
        console.error('Defina BACKUP_DIR no .env (ex: /app/backups).');
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    const nome = backupService.nomeArquivoBackup();
    const destino = path.join(pasta, nome);
    const gerado = await backupService.gravarZipEmArquivo(destino);
    console.log('Backup salvo:', gerado.caminho);
    console.log('Contagens:', gerado.contagens);
    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error('Falha no backup automático:', err);
    try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
    process.exit(1);
});
