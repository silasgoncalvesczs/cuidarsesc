(function () {
    var TEMA_KEY = 'cuidarsesc_tema';

    function getTema() {
        try {
            var tema = localStorage.getItem(TEMA_KEY);
            return tema === 'escuro' ? 'escuro' : 'claro';
        } catch (e) {
            return 'claro';
        }
    }

    function syncBotoesTema(tema) {
        var valor = tema === 'escuro' ? 'escuro' : 'claro';
        var btn = document.getElementById('btnTemaTopbar');
        var icon = document.getElementById('iconTemaTopbar');
        var label = document.getElementById('labelTemaTopbar');

        if (btn) {
            btn.setAttribute('aria-label', valor === 'escuro' ? 'Usar modo claro' : 'Usar modo escuro');
            btn.title = valor === 'escuro' ? 'Modo claro' : 'Modo escuro';
        }
        if (label) {
            label.textContent = valor === 'escuro' ? 'Claro' : 'Escuro';
        }
        if (icon) {
            var url = valor === 'escuro' ? '/icons/sun.svg' : '/icons/moon.svg';
            icon.style.maskImage = 'url(' + url + ')';
            icon.style.webkitMaskImage = 'url(' + url + ')';
        }

        var btnClaro = document.getElementById('btnTemaClaro');
        var btnEscuro = document.getElementById('btnTemaEscuro');
        if (btnClaro) btnClaro.classList.toggle('ativo', valor === 'claro');
        if (btnEscuro) btnEscuro.classList.toggle('ativo', valor === 'escuro');
    }

    function aplicarTema(tema) {
        var valor = tema === 'escuro' ? 'escuro' : 'claro';
        document.documentElement.setAttribute('data-tema', valor);
        try {
            localStorage.setItem(TEMA_KEY, valor);
        } catch (e) { /* ignore */ }
        syncBotoesTema(valor);
        return valor;
    }

    function setTema(tema) {
        return aplicarTema(tema);
    }

    function alternarTema() {
        return aplicarTema(getTema() === 'escuro' ? 'claro' : 'escuro');
    }

    aplicarTema(getTema());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            syncBotoesTema(getTema());
        });
    } else {
        syncBotoesTema(getTema());
    }

    window.getTema = getTema;
    window.setTema = setTema;
    window.alternarTema = alternarTema;
})();
