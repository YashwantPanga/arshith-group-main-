/* Apply page: domain tabs, dynamic questions and submission to /api/apply (server.js). domainConfigs is defined inline. */
(function () {
	'use strict';

	function $(id) { return document.getElementById(id); }

	function switchDomain(key) {
		var c = domainConfigs[key] || domainConfigs.frontend;
		document.querySelectorAll('.ag-tab').forEach(function (b) {
			b.classList.toggle('active', b.getAttribute('data-domain') === key);
		});
		$('currentDomainTitle').textContent = c.title;
		$('currentDomainDesc').textContent = c.desc;
		$('currentDomainCompany').textContent = c.company;
		$('hiddenSelectedDomain').value = c.hiddenVal;
		$('successFeedback').style.display = 'none';

		if (c.hasOpening !== false) {
			$('domainAppForm').style.display = 'block';
			$('noOpeningBanner').style.display = 'none';
			$('dynamicSectionHeading').textContent = '2. ' + c.heading;
			$('dynLabel1').textContent = c.q1Label;
			$('dynInput1').placeholder = c.q1Placeholder;
			$('dynLabel2').textContent = c.q2Label;
			$('dynInput2').placeholder = c.q2Placeholder;
			$('dynLabel3').textContent = c.q3Label;
			$('dynInput3').placeholder = c.q3Placeholder;
		} else {
			$('domainAppForm').style.display = 'none';
			$('noOpeningBanner').style.display = 'block';
			$('noOpeningTitle').textContent = 'No Current Openings for ' + c.title;
		}
	}

	function keyFromParam(p) {
		var l = p.toLowerCase();
		if (l.indexOf('frontend') > -1 || l.indexOf('web') > -1) return 'frontend';
		if (l.indexOf('backend') > -1) return 'backend';
		if (l.indexOf('fullstack') > -1 || l.indexOf('node') > -1) return 'fullstack';
		if (l.indexOf('ui') > -1 || l.indexOf('ux') > -1 || l.indexOf('design') > -1) return 'uiux';
		if (l.indexOf('qa') > -1 || l.indexOf('test') > -1) return 'qa';
		if (l.indexOf('cloud') > -1 || l.indexOf('deploy') > -1) return 'cloud';
		if (l.indexOf('marketing') > -1 || l.indexOf('seo') > -1) return 'marketing';
		if (l.indexOf('ecommerce') > -1 || l.indexOf('retail') > -1) return 'ecommerce';
		if (l.indexOf('consulting') > -1 || l.indexOf('business') > -1) return 'consulting';
		return 'general';
	}

	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('.ag-tab').forEach(function (b) {
			b.addEventListener('click', function () { switchDomain(b.getAttribute('data-domain')); });
		});
		var params = new URLSearchParams(window.location.search);
		var p = params.get('domain') || params.get('role');
		switchDomain(p ? keyFromParam(p) : 'frontend');

		$('domainAppForm').addEventListener('submit', async function (e) {
			e.preventDefault();
			var domainVal = $('hiddenSelectedDomain').value;
			var refCode = 'REF-AG-2026-' + Math.floor(1000 + Math.random() * 9000);
			var data = {
				refCode: refCode,
				domain: domainVal,
				fullName: $('fullName').value,
				email: $('emailAddr').value,
				phone: $('phoneNum').value,
				college: $('collegeName').value,
				gradYear: $('gradYear').value,
				duration: $('prefDuration').value,
				techStack: $('dynInput1').value,
				portfolioGithub: $('dynInput2').value,
				projectOverview: $('dynInput3').value,
				resumeLink: $('resumeLink').value,
				coverNote: $('coverNote').value
			};
			try {
				await fetch('/api/apply', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				});
			} catch (err) {
				console.warn('Local server storage fallback:', err);
			}
			$('submittedDomainName').textContent = domainVal;
			$('appRefCode').textContent = refCode;
			$('domainAppForm').style.display = 'none';
			$('successFeedback').style.display = 'block';
			$('successFeedback').scrollIntoView({ behavior: 'smooth', block: 'center' });
		});

		$('resetDomainForm').addEventListener('click', function () {
			$('domainAppForm').reset();
			$('domainAppForm').style.display = 'block';
			$('successFeedback').style.display = 'none';
		});
	});
})();
