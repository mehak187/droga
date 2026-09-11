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

    /* Enquiry form -------------------------------------------------------- */
    var form = document.querySelector('[data-enquiry-form]');

    if (form) {
        var status = form.querySelector('[data-enquiry-status]');
        var waLink = form.querySelector('[data-wa]');
        var TO = 'drogaindustries@gmail.com';
        var WA = '923348334334';
        var NL = String.fromCharCode(10);

        var field = function (id) {
            var el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        var say = function (msg, kind) {
            if (!status) { return; }
            status.textContent = msg;
            status.className = 'form-note is-' + kind;
            status.hidden = false;
        };

        var enquiryText = function () {
            return [
                'Name: ' + field('cf-name'),
                'Company: ' + (field('cf-company') || '-'),
                'Email: ' + field('cf-email'),
                'Product: ' + field('cf-cat'),
                '',
                'Order details:',
                field('cf-msg')
            ].join(NL);
        };

        /* keep the WhatsApp button carrying whatever has been typed so far */
        var syncWhatsApp = function () {
            if (!waLink) { return; }
            var filled = field('cf-name') || field('cf-msg');
            var body = filled
                ? 'Enquiry for Droga Industries' + NL + NL + enquiryText()
                : 'Hello Droga Industries, I would like to discuss a custom apparel order.';
            waLink.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(body);
        };

        form.addEventListener('input', syncWhatsApp);
        syncWhatsApp();

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!field('cf-name') || !field('cf-email') || !field('cf-msg')) {
                say('Please fill in your name, email and order details.', 'error');
                return;
            }

            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(field('cf-email'))) {
                say('That email address does not look right.', 'error');
                return;
            }

            var subject = 'Apparel enquiry - ' + field('cf-cat') + ' - ' + field('cf-name');

            window.location.assign('mailto:' + TO +
                '?subject=' + encodeURIComponent(subject) +
                '&body=' + encodeURIComponent(enquiryText()));

            say('Opening your email app with the enquiry ready to send. If nothing opens, email ' +
                TO + ' or use the WhatsApp button below.', 'ok');
        });
    }

    /* Ease the film grade back while a clip is running -------------------- */
    document.addEventListener('play', function (e) {
        if (e.target.tagName !== 'VIDEO') return;
        var reel = e.target.closest('.reel');
        if (reel) { reel.classList.add('is-playing'); }
    }, true);

    document.addEventListener('pause', function (e) {
        if (e.target.tagName !== 'VIDEO') return;
        var reel = e.target.closest('.reel');
        /* 'ended' rolls straight into the next clip, so only a real pause resets it */
        if (reel) { reel.classList.remove('is-playing'); }
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

        var load = function (next, autoplay) {
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
        };

        /* when a clip finishes, roll straight into the next one, then loop */
        video.addEventListener('ended', function () { load(i + 1, true); });

        /* skip a broken file instead of stalling on it */
        video.addEventListener('error', function () {
            if (box.dataset.recovering === '1') { return; }
            box.dataset.recovering = '1';
            setTimeout(function () { box.dataset.recovering = '0'; load(i + 1, true); }, 300);
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
