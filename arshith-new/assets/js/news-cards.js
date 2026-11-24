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
		var title = ev.target.closest('.ag-gallery-card h4 a');
		if (title) {
			ev.preventDefault();
			var eye = title.closest('.ag-gallery-card').querySelector('.gallery_enlarge_icon');
			if (eye) eye.click();
		}
	});
})();
