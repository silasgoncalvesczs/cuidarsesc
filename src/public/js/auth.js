const TOKEN_KEY = 'cuidarsesc_token';
const USUARIO_KEY = 'cuidarsesc_usuario';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getUsuarioLogado() {
    try {
        return JSON.parse(localStorage.getItem(USUARIO_KEY));
    } catch (e) {
        return null;
    }
}

function salvarSessao(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    window.location.href = '/login.html';
}

// Chame no topo de páginas que exigem login
function exigirLogin() {
    if (!getToken()) {
        window.location.href = '/login.html';
    }
}

// Chame no topo de páginas restritas a certos perfis
function exigirPerfil(perfisPermitidos) {
    exigirLogin();
    const usuario = getUsuarioLogado();
    if (!usuario || !perfisPermitidos.includes(usuario.perfil)) {
        alert('Você não tem permissão para acessar esta página.');
        window.location.href = '/index.html';
    }
}

// Use no lugar de fetch() normal para chamadas à API protegida
async function fetchAutenticado(url, options = {}) {
    const token = getToken();
    const headers = Object.assign(
        {},
        options.headers,
        token ? { 'Authorization': 'Bearer ' + token } : {}
    );

    const response = await fetch(url, Object.assign({}, options, { headers }));

    if (response.status === 401) {
        logout();
    }

    return response;
}