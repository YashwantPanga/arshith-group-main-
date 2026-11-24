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
