// Helpers de câmera — getUserMedia exige HTTPS (ou localhost).

function mensagemErroCamera(err) {
    if (!window.isSecureContext) {
        const httpsUrl = 'https://' + location.hostname + ':3443' + location.pathname;
        return (
            'A câmera só funciona em conexão segura (HTTPS).\n\n' +
            'Abra o sistema assim:\n' + httpsUrl + '\n\n' +
            'No aviso de certificado, clique em Avançado → Continuar para o site.'
        );
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return 'Este navegador não permite acesso à câmera. Use Chrome ou Edge atualizado.';
    }

    const nome = err && (err.name || err.message) ? String(err.name || err.message) : '';

    if (nome === 'NotAllowedError' || nome === 'PermissionDeniedError') {
        return 'Permissão da câmera negada. Clique no cadeado da barra de endereço e permita a câmera.';
    }
    if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError') {
        return 'Nenhuma câmera foi encontrada neste computador.';
    }
    if (nome === 'NotReadableError' || nome === 'TrackStartError') {
        return 'A câmera está em uso por outro aplicativo. Feche-o e tente de novo.';
    }

    return 'Erro ao acessar a câmera: ' + (err && err.message ? err.message : 'desconhecido');
}

async function obterStreamCamera(constraints) {
    if (!window.isSecureContext) {
        const erro = new Error('Contexto inseguro (HTTP)');
        erro.name = 'SecurityError';
        throw erro;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const erro = new Error('getUserMedia indisponível');
        erro.name = 'NotSupportedError';
        throw erro;
    }
    return navigator.mediaDevices.getUserMedia(
        constraints || { video: { facingMode: 'user' }, audio: false }
    );
}
