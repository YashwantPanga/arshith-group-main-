/* Arshith Group - small behaviour on top of the Monoline template scripts */
(function ($) {
	'use strict';

	$(function () {
		// Image popups for news / gallery links
		$('.ag-popup').magnificPopup({ type: 'image', gallery: { enabled: true } });

		// Contact form - same behaviour as the previous site (confirmation message only)
		var form = document.getElementById('agContactForm');
		if (form) {
			form.addEventListener('submit', function (e) {
				e.preventDefault();
				var name = document.getElementById('contactName');
				var email = document.getElementById('contactEmail');
				var msg = document.getElementById('contactMsg');
				var out = document.getElementById('agFormSuccess');
				if (!name.value.trim() || !email.value.trim() || !msg.value.trim()) {
					out.textContent = 'Please fill in all required fields (Name, Email, and Message).';
					return;
				}
				out.textContent = '✅ Thank you! Your message has been sent successfully. We will get back to you shortly.';
				form.reset();
				setTimeout(function () { out.textContent = ''; }, 6000);
			});
		}
	});
})(jQuery);

/* Home company film: autoplay (muted) while on screen, pause when scrolled away, manual play/pause button */
(function () {
	'use strict';
	var box = document.querySelector('.ag-video-box');
	if (!box) return;
	var video = box.querySelector('video'), btn = box.querySelector('.ag-video-toggle');
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var userPaused = reduce; // respect reduced motion: start paused on the poster
	video.muted = true;

	function sync() {
		var paused = video.paused;
		box.classList.toggle('is-paused', paused);
		btn.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
		btn.innerHTML = paused ? '<i class="ti-control-play"></i>' : '<i class="ti-control-pause"></i>';
	}
	function tryPlay() { var p = video.play(); if (p && p.catch) p.catch(function () { sync(); }); }

	btn.addEventListener('click', function () {
		if (video.paused) { userPaused = false; tryPlay(); } else { userPaused = true; video.pause(); }
	});
	video.addEventListener('play', sync);
	video.addEventListener('pause', sync);

	if ('IntersectionObserver' in window) {
		new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (e.isIntersecting && !userPaused) tryPlay();
				else if (!e.isIntersecting) video.pause();
			});
		}, { threshold: 0.35 }).observe(box);
	} else if (!userPaused) {
		tryPlay();
	}
	sync();
})();
