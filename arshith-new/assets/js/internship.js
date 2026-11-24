/* Internship page: role details modal + search / filters. ROLE_DETAILS_DATA is defined inline on the page. */
(function ($) {
	'use strict';

	function li(items) {
		return (items || []).map(function (x) { return '<li>' + x + '</li>'; }).join('');
	}

	function openRole(roleId) {
		var data = ROLE_DETAILS_DATA[roleId] || ROLE_DETAILS_DATA.frontend;
		$('#modalRoleBadge').text(data.badge || 'INTERNSHIP PROGRAM');
		$('#modalRoleTitle').text(data.title);
		$('#modalRoleMeta').html(
			'<span><i class="fa fa-building-o"></i> ' + data.entity + '</span>' +
			'<span><i class="fa fa-map-marker"></i> ' + data.workType + '</span>' +
			'<span><i class="fa fa-clock-o"></i> ' + data.duration + '</span>'
		);
		$('#modalAboutText').text(data.about);
		$('#modalWhatYouWillDoList').html(li(data.whatYouWillDo));
		$('#modalTechStackContainer').html((data.techStack || []).map(function (t) {
			return '<span class="ag-chip">' + t + '</span>';
		}).join(''));
		$('#modalWhatYouWillLearnList').html(li(data.whatYouWillLearn));
		$('#modalProjectExpText').text(data.projectExperience);
		$('#modalEligibilityText').text(data.eligibility);
		$('#modalSelectionProcessList').html(li(data.selectionProcess));
		$('#modalApplyBtn').attr('href', data.applyUrl || 'apply-internship.html');
		var el = document.getElementById('roleModal');
		(bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el)).show();
	}

	function filterRoles() {
		var q = ($('#roleSearchInput').val() || '').toLowerCase().trim();
		var dom = $('#filterDomain').val();
		var work = $('#filterWorkType').val();
		var shown = 0;
		$('.role-card-portal').each(function () {
			var $c = $(this);
			var ok = (!q || $c.text().toLowerCase().indexOf(q) > -1) &&
				(dom === 'all' || $c.data('category') === dom) &&
				(work === 'all' || $c.data('worktype') === work);
			$c.toggle(ok);
			if (ok) shown++;
		});
		$('#noRoleResults').toggle(shown === 0);
	}

	$(function () {
		$(document).on('click', '[data-role]', function () { openRole($(this).data('role')); });
		$('#roleSearchInput').on('input', filterRoles);
		$('#filterDomain, #filterWorkType, #filterBatch').on('change', filterRoles);
		$('#clearFilters').on('click', function () {
			$('#roleSearchInput').val('');
			$('#filterDomain, #filterWorkType, #filterBatch').val('all');
			filterRoles();
		});
		// FAQ: keep the template's "active" card style in sync with the open panel
		$('#agFaq').on('show.bs.collapse', '.collapse', function () {
			$('#agFaq .card').removeClass('active');
			$(this).closest('.card').addClass('active');
		}).on('hide.bs.collapse', '.collapse', function () {
			$(this).closest('.card').removeClass('active');
		});
	});
})(jQuery);
