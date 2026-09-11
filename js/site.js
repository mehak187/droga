/* Droga Industries — site behaviour */
(function () {
    'use strict';

    /* Mobile navigation ------------------------------------------------- */
    var toggle = document.querySelector('[data-nav-toggle]');
    var menu = document.getElementById('navMenu');

    if (toggle && menu) {
        toggle.addEventListener('click', function () {
            var open = menu.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.innerHTML = open ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
        });

        menu.addEventListener('click', function (e) {
            if (e.target.closest('a') && window.innerWidth < 992) {
                menu.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }

    /* Reveal on scroll --------------------------------------------------- */
    var items = document.querySelectorAll('[data-reveal]');

    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach(function (el) { el.classList.add('is-in'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        items.forEach(function (el) { io.observe(el); });
    }

    /* Only one video plays at a time ------------------------------------- */
    document.addEventListener('play', function (e) {
        if (e.target.tagName !== 'VIDEO') return;
        document.querySelectorAll('video').forEach(function (v) {
            if (v !== e.target) { v.pause(); }
        });
    }, true);

    /* Auto-advancing category reels -------------------------------------- */
    document.querySelectorAll('.playlist').forEach(function (box) {
        var video = box.querySelector('video');
        var titleEl = box.querySelector('.np-title');
        var countEl = box.querySelector('.np-count b');
        var srcs, posters, titles;

        try {
            srcs = JSON.parse(box.dataset.srcs || '[]');
            posters = JSON.parse(box.dataset.posters || '[]');
            titles = JSON.parse(box.dataset.titles || '[]');
        } catch (err) { return; }

        if (!video || srcs.length < 2) { return; }

        var i = 0;

        function load(next, autoplay) {
            i = (next % srcs.length + srcs.length) % srcs.length;
            video.poster = posters[i] || '';
            video.src = srcs[i];
            if (titleEl) { titleEl.textContent = titles[i] || ''; }
            if (countEl) { countEl.textContent = String(i + 1); }
            video.load();
            if (autoplay) {
                var pr = video.play();
                if (pr && pr.catch) { pr.catch(function () { /* autoplay refused */ }); }
            }
        }

        /* when a clip finishes, roll straight into the next one, then loop */
        video.addEventListener('ended', function () { load(i + 1, true); });

        /* skip a broken file instead of stalling on it */
        video.addEventListener('error', function () {
            if (box.dataset.recovering === '1') { return; }
            box.dataset.recovering = '1';
            setTimeout(function () { box.dataset.recovering = '0'; load(i + 1, true); }, 300);
        });

        box.querySelectorAll('[data-step]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                load(i + parseInt(btn.dataset.step, 10), !video.paused);
            });
        });
    });

    /* Certificate viewer -------------------------------------------------- */
    window.showCert = function (src, title) {
        var modalEl = document.getElementById('certModal');
        if (!modalEl) { window.open(src, '_blank'); return; }
        document.getElementById('certModalImage').src = src;
        document.getElementById('certModalImage').alt = title;
        document.getElementById('certModalLabel').textContent = title;
        document.getElementById('certModalOpen').href = src;
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    };
})();
