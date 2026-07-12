const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const { execFileSync } = require('child_process');
require('dotenv').config();

const atividadeRoutes = require('./routes/atividadeRoutes');
const idosoRoutes = require('./routes/idosoRoutes');
const presencaRoutes = require('./routes/presencaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cuidar_sesc';
const CERT_DIR = path.join(__dirname, '..', 'certs');
const KEY_PATH = path.join(CERT_DIR, 'key.pem');
const CERT_PATH = path.join(CERT_DIR, 'cert.pem');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/atividades', atividadeRoutes);
app.use('/api/idosos', idosoRoutes);
app.use('/api/presencas', presencaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/relatorios', relatorioRoutes);

function listarIpsLocais() {
    const ips = ['127.0.0.1'];
    const ifaces = os.networkInterfaces();
    for (const nets of Object.values(ifaces)) {
        for (const net of nets || []) {
            const ipv4 = net.family === 4 || net.family === 'IPv4';
            if (ipv4 && !net.internal) ips.push(net.address);
        }
    }
    if (process.env.HOST_IP) ips.push(process.env.HOST_IP);
    return [...new Set(ips)];
}

function obterCertificados() {
    if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
        return {
            key: fs.readFileSync(KEY_PATH),
            cert: fs.readFileSync(CERT_PATH)
        };
    }

    fs.mkdirSync(CERT_DIR, { recursive: true });
    const ips = listarIpsLocais();
    const san = [
        'DNS:localhost',
        'DNS:cuidar-sesc',
        ...ips.map((ip) => `IP:${ip}`)
    ].join(',');

    const confPath = path.join(CERT_DIR, 'openssl.cnf');
    fs.writeFileSync(
        confPath,
        `[req]
distinguished_name = dn
x509_extensions = v3_req
prompt = no

[dn]
CN = cuidar-sesc

[v3_req]
subjectAltName = ${san}
`
    );

    execFileSync('openssl', [
        'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
        '-keyout', KEY_PATH,
        '-out', CERT_PATH,
        '-days', '825',
        '-config', confPath,
        '-extensions', 'v3_req'
    ], { stdio: 'inherit' });

    console.log('Certificado HTTPS gerado em /certs (autoassinado).');
    return {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH)
    };
}

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Conectado ao MongoDB com sucesso!');

        const { garantirAdminSistema } = require('./utils/adminSistema');
        await garantirAdminSistema();

        const credenciais = obterCertificados();

        http.createServer((req, res) => {
            const host = (req.headers.host || `localhost:${PORT}`).split(':')[0];
            const location = `https://${host}:${HTTPS_PORT}${req.url || '/'}`;
            res.writeHead(301, { Location: location });
            res.end();
        }).listen(PORT, '0.0.0.0', () => {
            console.log(`HTTP  (redireciona p/ HTTPS) na porta ${PORT}`);
        });

        https.createServer(credenciais, app).listen(HTTPS_PORT, '0.0.0.0', () => {
            const ips = listarIpsLocais().filter((ip) => ip !== '127.0.0.1');
            console.log(`HTTPS na porta ${HTTPS_PORT}`);
            console.log(`Acesse: https://localhost:${HTTPS_PORT}`);
            ips.forEach((ip) => console.log(`Acesse na rede: https://${ip}:${HTTPS_PORT}`));
            console.log('Aceite o aviso do certificado (Avançado → Continuar).');
        });
    })
    .catch((err) => {
        console.error('Erro ao conectar no MongoDB:', err);
    });
