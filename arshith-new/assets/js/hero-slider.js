/* Landing slideshow for the Arshith Group home page.
   - smooth crossfade between the brand slides with a slow Ken Burns zoom
   - text fades with the photos: soft blur + rise in, gentle fade up and out
   - always-on autoplay with progress bars (pauses only while the tab is hidden), arrows, dots, swipe, keyboard
   - first slide doubles as the page-load intro (nav links drop, feature box rises)
   <html> gets "ag-pre" in <head> so nothing flashes before the intro (not set for reduced motion). */
(function () {
	'use strict';

	var root = document.documentElement;
	var hero = document.querySelector('.ag-slider');
	if (!hero) return;

	var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var INTERVAL = 6000;     // time each slide stays
	var FADE = 1800;         // crossfade duration (matches CSS)
	var QOUT = 'cubic-bezier(.25,1,.5,1)';
	var COUT = 'cubic-bezier(.33,1,.68,1)';
	var CIN = 'cubic-bezier(.32,0,.67,0)';

	var bgs = [].slice.call(hero.querySelectorAll('.ag-slide'));
	var texts = [].slice.call(hero.querySelectorAll('.ag-slide-text'));
	var dots = [].slice.call(hero.querySelectorAll('.ag-dot'));
	var count = hero.querySelector('.ag-count b');
	var n = bgs.length;
	var current = 0, timer = 0, busy = false, paused = false, started = false;

	function anim(el, frames, delay, duration, easing) {
		if (!el || !el.animate || REDUCE) return null;
		el.getAnimations().forEach(function (a) { a.commitStyles && a.playState !== 'idle' && tryCommit(a); a.cancel(); });
		return el.animate(frames, { delay: delay, duration: duration, easing: easing, fill: 'both' });
	}

	// keep the current pose when an animation is replaced mid-flight, then drop the inline style
	function tryCommit(a) {
		try { a.commitStyles(); } catch (e) { /* element not rendered */ }
	}

	// ---------- text in / out: soft fade that rides along with the photo crossfade ----------
	var SOFT = 'cubic-bezier(.22,.61,.36,1)';
	function parts(t) {
		return [t.querySelector('.ag-tag-mask > span')]
			.concat([].slice.call(t.querySelectorAll('.ag-w > span')))
			.concat([t.querySelector('p.ag-mask > span'), t.querySelector('.ag-cta')]);
	}

	function textIn(i, base) {
		parts(texts[i]).forEach(function (el, k) {
			anim(el, [
				{ opacity: 0, transform: 'translateY(22px)', filter: 'blur(8px)' },
				{ opacity: 1, transform: 'none', filter: 'blur(0)' }
			], base + k * 90, 1300, SOFT);
		});
	}

	function textOut(i) {
		parts(texts[i]).forEach(function (el, k) {
			anim(el, [
				{ opacity: 1, transform: 'none', filter: 'blur(0)' },
				{ opacity: 0, transform: 'translateY(-14px)', filter: 'blur(6px)' }
			], k * 35, 750, SOFT);
		});
	}

	// ---------- background ----------
	function kenBurns(i) {
		var bg = bgs[i].querySelector('.ag-slide-bg');
		// alternate the drift direction for variety
		var dx = i % 2 ? '-1.5%' : '1.5%';
		anim(bg, [{ transform: 'scale(1.14) translateX(' + dx + ')' }, { transform: 'scale(1.02) translateX(0)' }], 0, INTERVAL + FADE + 400, 'cubic-bezier(.22,.61,.36,1)');
	}

	function setActive(i) {
		bgs.forEach(function (b, k) { b.classList.toggle('is-active', k === i); });
		texts.forEach(function (t, k) {
			t.classList.toggle('is-active', k === i);
			if (k === i) t.removeAttribute('aria-hidden'); else t.setAttribute('aria-hidden', 'true');
		});
		dots.forEach(function (d, k) {
			d.classList.toggle('is-active', k === i);
			d.setAttribute('aria-current', k === i ? 'true' : 'false');
		});
		if (count) count.textContent = ('0' + (i + 1)).slice(-2);
	}

	// ---------- navigation ----------
	function go(next) {
		next = (next + n) % n;
		if (busy || next === current) return;
		busy = true;
		var prev = current;
		current = next;
		textOut(prev);
		kenBurns(next);
		setActive(next);
		textIn(next, REDUCE ? 0 : 550);
		restartProgress();
		setTimeout(function () { busy = false; }, REDUCE ? 50 : 1200);
		schedule();
	}

	function schedule() {
		clearTimeout(timer);
		if (paused || document.hidden) return;
		timer = setTimeout(function () { go(current + 1); }, INTERVAL);
	}

	function restartProgress() {
		hero.classList.remove('is-running');
		void hero.offsetWidth; // restart the CSS progress animation
		if (!paused) hero.classList.add('is-running');
	}

	function pause(p) {
		paused = p;
		hero.classList.toggle('is-paused', p);
		if (p) clearTimeout(timer); else { restartProgress(); schedule(); }
	}

	hero.querySelector('.ag-next').addEventListener('click', function () { go(current + 1); });
	hero.querySelector('.ag-prev').addEventListener('click', function () { go(current - 1); });
	dots.forEach(function (d) {
		d.addEventListener('click', function () { go(+d.getAttribute('data-index')); });
	});
	document.addEventListener('visibilitychange', function () {
		if (document.hidden) clearTimeout(timer); else if (started) { restartProgress(); schedule(); }
	});
	document.addEventListener('keydown', function (e) {
		var r = hero.getBoundingClientRect();
		if (r.bottom < 0 || r.top > innerHeight) return; // only while the hero is on screen
		if (e.key === 'ArrowRight') go(current + 1);
		if (e.key === 'ArrowLeft') go(current - 1);
	});
	var sx = 0, sy = 0;
	hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
	hero.addEventListener('touchend', function (e) {
		var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
		if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(current + (dx < 0 ? 1 : -1));
	}, { passive: true });

	// ---------- page-load intro ----------
	var ran = false;
	function intro() {
		if (ran) return;
		ran = true;
		started = true;
		if (document.visibilityState === 'hidden' || REDUCE) {
			root.classList.remove('ag-pre');
			restartProgress(); schedule();
			return;
		}
		var bg0 = bgs[0].querySelector('.ag-slide-bg');
		anim(bg0, [{ transform: 'scale(1.3)' }, { transform: 'scale(1.02)' }], 0, INTERVAL + 1200, QOUT);
		[].slice.call(document.querySelectorAll('.site-navbar .site-menu > li > a')).forEach(function (a, i) {
			anim(a, [{ transform: 'translateY(-110%)', opacity: 0 }, { transform: 'none', opacity: 1 }], 100 + i * 100, 300, COUT);
		});
		anim(document.querySelector('.site-navbar .site-menu-toggle'), [{ opacity: 0 }, { opacity: 1 }], 530, 200, 'linear');
		anim(hero.querySelector('.ag-slider-ui'), [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], 900, 700, COUT);
		[].slice.call(hero.querySelectorAll('.ag-arrow')).forEach(function (a) {
			anim(a, [{ opacity: 0 }, { opacity: 1 }], 1000, 600, 'linear');
		});
		textIn(0, 380);
		anim(document.querySelector('#companies .feature_bg'), [{ opacity: 0, transform: 'translateY(60px)' }, { opacity: 1, transform: 'none' }], 700, 1000, COUT);
		root.classList.remove('ag-pre');
		restartProgress();
		schedule();

		// if the browser is not painting frames, jump straight to the end state
		var t0 = document.timeline ? document.timeline.currentTime : null;
		setTimeout(function () {
			var t1 = document.timeline ? document.timeline.currentTime : null;
			if (t0 === null || t1 === null || t1 - t0 < 500) {
				document.getAnimations().forEach(function (a) { if (a.playState !== 'finished') a.finish(); });
			}
		}, 2600);
	}

	function start() {
		requestAnimationFrame(function () { requestAnimationFrame(intro); });
		setTimeout(intro, 150); // rAF does not run in hidden/throttled tabs
	}

	var img = new Image();
	img.src = bgs[0].querySelector('.ag-slide-bg').style.backgroundImage.replace(/^url\(["']?|["']?\)$/g, '');
	var ready = Promise.all([
		img.decode ? img.decode().catch(function () {}) : Promise.resolve(),
		document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
	]);
	// preload the other slides so crossfades never show a blank frame
	bgs.slice(1).forEach(function (b) { var p = new Image(); p.src = b.querySelector('.ag-slide-bg').style.backgroundImage.replace(/^url\(["']?|["']?\)$/g, ''); });
	window.addEventListener('load', function () { ready.then(function () { setTimeout(start, 900); }); });
	setTimeout(start, 3500);
})();
