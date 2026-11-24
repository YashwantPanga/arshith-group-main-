/* News page: 3D tilt cards with a light glare, staggered scroll reveal,
   and "View Story" opening the same image popup as the card image. */
(function () {
	'use strict';

	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	// ---- staggered reveal on scroll ----
	var items = Array.prototype.slice.call(document.querySelectorAll('.ag-reveal'));
	if (!reduce && 'IntersectionObserver' in window) {
		document.documentElement.classList.add('ag-reveal-on');
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (e.isIntersecting) {
					e.target.classList.add('is-in');
					io.unobserve(e.target);
				}
			});
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
		items.forEach(function (el) { io.observe(el); });
		// never leave cards hidden if the observer does not fire
		setTimeout(function () { items.forEach(function (el) { el.classList.add('is-in'); }); }, 4000);
	}

	// ---- 3D tilt + glare (mouse / trackpad only) ----
	if (!reduce && finePointer) {
		var MAX = 8; // degrees
		Array.prototype.slice.call(document.querySelectorAll('.ag-tilt')).forEach(function (card) {
			var raf = 0;
			card.addEventListener('pointermove', function (ev) {
				var r = card.getBoundingClientRect();
				var x = (ev.clientX - r.left) / r.width;   // 0..1
				var y = (ev.clientY - r.top) / r.height;   // 0..1
				cancelAnimationFrame(raf);
				raf = requestAnimationFrame(function () {
					card.style.setProperty('--rx', ((0.5 - y) * MAX * 2).toFixed(2) + 'deg');
					card.style.setProperty('--ry', ((x - 0.5) * MAX * 2).toFixed(2) + 'deg');
					card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
					card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
					card.classList.add('is-tilting');
				});
			});
			card.addEventListener('pointerleave', function () {
				cancelAnimationFrame(raf);
				card.classList.remove('is-tilting');
				card.style.setProperty('--rx', '0deg');
				card.style.setProperty('--ry', '0deg');
			});
		});
	}

	// ---- "View Story" / gallery titles open the card's image popup ----
	document.addEventListener('click', function (ev) {
		var more = ev.target.closest('.ag-open');
		if (more) {
			ev.preventDefault();
			var media = more.closest('.ag-news-card').querySelector('.ag-news-media');
			if (media) media.click();
			return;
		}
		var dup = ev.target.closest('.ag-dup');
		if (dup) { // duplicate marquee tile: open the original tile's popup so the gallery has no repeats
			ev.preventDefault();
			var orig = document.querySelector('.ag-marquee .gallery_enlarge_icon[href="' + dup.getAttribute('href') + '"]');
			if (orig) orig.click();
			return;
		}
		var title = ev.target.closest('.ag-gallery-card h4 a');
		if (title) {
			ev.preventDefault();
			var eye = title.closest('.ag-gallery-card').querySelector('.gallery_enlarge_icon');
			if (eye) eye.click();
		}
	});
})();

/* Marquee rows: JS-driven so they can be scrolled by hand.
   - auto-glide (top row right, bottom row left) at a slow constant speed
   - hover: auto-glide eases to a stop; mouse wheel / trackpad scrolls the row with smooth inertia
   - drag (mouse or touch) to scroll, with momentum on release
   - leaving the row eases the auto-glide back in; the loop stays seamless (duplicated half) */
(function () {
	'use strict';
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	var rows = [].slice.call(document.querySelectorAll('.ag-marquee'));
	if (!rows.length) return;

	var states = rows.map(function (row) {
		row.classList.add('is-js');
		var track = row.querySelector('.ag-marquee-track');
		var dir = row.classList.contains('ag-to-right') ? 1 : -1;
		var s = { row: row, track: track, dir: dir, x: 0, vel: 0, auto: 1, hover: false, drag: null, half: 0 };
		function measure() { s.half = track.scrollWidth / 2; if (dir > 0 && s.x === 0) s.x = -s.half; }
		measure();
		window.addEventListener('resize', measure);

		row.addEventListener('mouseenter', function () { s.hover = true; });
		row.addEventListener('mouseleave', function () { s.hover = false; });
		row.addEventListener('wheel', function (e) {
			var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
			if (!d) return;
			e.preventDefault();
			s.vel -= d * 0.9; // px/s impulse, smoothed by the friction below
		}, { passive: false });

		row.addEventListener('pointerdown', function (e) {
			if (e.button !== 0) return;
			s.drag = { x: e.clientX, last: e.clientX, t: performance.now(), moved: 0 };
			s.vel = 0;
			row.classList.add('is-dragging');
		});
		window.addEventListener('pointermove', function (e) {
			if (!s.drag) return;
			var dx = e.clientX - s.drag.last, now = performance.now();
			s.x += dx;
			s.drag.moved += Math.abs(dx);
			s.vel = dx / Math.max(1, now - s.drag.t) * 1000 * 0.6;
			s.drag.last = e.clientX; s.drag.t = now;
		});
		window.addEventListener('pointerup', function () {
			if (!s.drag) return;
			// a real drag should not open the image popup
			if (s.drag.moved > 6) { row.addEventListener('click', function stop(ev) { ev.preventDefault(); ev.stopImmediatePropagation(); row.removeEventListener('click', stop, true); }, true); }
			s.drag = null;
			row.classList.remove('is-dragging');
		});
		return s;
	});

	var SPEED = 32, last = performance.now();
	function frame(now) {
		var dt = Math.min(0.6, (now - last) / 1000); // frame-rate independent (also on throttled tabs)
		last = now;
		states.forEach(function (s) {
			if (!s.half) s.half = s.track.scrollWidth / 2;
			var targetAuto = (s.hover || s.drag) ? 0 : 1;
			s.auto += (targetAuto - s.auto) * Math.min(1, dt * 3);       // ease auto-glide in/out
			if (!s.drag) {
				s.x += (s.dir * SPEED * s.auto + s.vel) * dt;
				s.vel *= Math.pow(0.06, dt);                                 // smooth inertia
				if (Math.abs(s.vel) < 1) s.vel = 0;
			}
			if (s.half) { // keep x inside [-half, 0) for a seamless loop
				while (s.x <= -s.half) s.x += s.half;
				while (s.x > 0) s.x -= s.half;
			}
			s.track.style.transform = 'translate3d(' + s.x.toFixed(2) + 'px,0,0)';
		});
		requestAnimationFrame(frame);
	}
	requestAnimationFrame(frame);
})();
