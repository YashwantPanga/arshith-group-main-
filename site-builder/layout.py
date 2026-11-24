# Shared layout for the Arshith Group site, following the Monoline template markup section by section.

LOGO = "logos/LOGO-removebg-preview.png"
ASSESSMENT_URL = "/candidate-exam-site/e/arshithgroup-technical-assessment-kbbncz"
CERT_URL = "https://codelekho.com/"

NAV = [
    ("Home", "index.html", []),
    ("About Us", "aboutgroup.html", [
        ("About Arshith Group", "aboutgroup.html", False),
        ("Executive Biographies", "aboutceo.html", False),
    ]),
    ("Businesses", "index.html#companies", [
        ("IT Services &amp; IT Consulting", "http://arshithinfotech.com/", True),
        ("E-Commerce", "https://arshithfresh.com/", True),
        ("Multi sellers", "https://seller.arshithfresh.com/", True),
        ("Business Consulting &amp; Services", "https://suntechorganization.com/", True),
        ("Digital Marketing", "https://suntechorganization.com/", True),
    ]),
    ("News", "LatestNews.html", []),
    ("Careers", "internship.html", [
        ("Certifications", CERT_URL, True),
        ("Internship", "internship.html", False),
        ("Online Assessment", ASSESSMENT_URL, False),
        ("Life at Arshith", "lifeatarshith.html", False),
        ("Certificate Verification", "certificate-verification.html", False),
    ]),
    ("Contact Us", "contact.html", []),
]

EXT = ' target="_blank" rel="noopener"'


def _ext(is_ext):
    return EXT if is_ext else ""


def wow(d=0.1):
    return f'wow fadeInUp" data-wow-duration="1s" data-wow-delay="{d:.1f}s" data-wow-offset="0'


def nav_html(active):
    out = []
    for label, href, children in NAV:
        cls = " active" if label == active else ""
        if children:
            items = "".join(f'<li><a href="{h}" class="nav-link"{_ext(e)}>{l}</a></li>' for l, h, e in children)
            out.append(f'\t\t\t\t\t\t<li class="has-children"><a href="{href}" class="nav-link{cls}">{label}</a>\n'
                       f'\t\t\t\t\t\t\t<ul class="dropdown">{items}</ul>\n\t\t\t\t\t\t</li>')
        else:
            out.append(f'\t\t\t\t\t\t<li><a class="nav-link{cls}" href="{href}">{label}</a></li>')
    return "\n".join(out)


def head(title, description, slider=False, intro=False):
    sl = '\n\t<link rel="stylesheet" href="assets/css/slider.css">' if slider else ""
    INTRO = ("\n\t<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches)"
             "document.documentElement.classList.add('ag-pre');</script>") if intro else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
	<meta name="description" content="{description}">
	<title>{title}</title>
	<link rel="icon" href="{LOGO}">
	<link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Jost:wght@400;500;600;700&display=swap">
	<link rel="stylesheet" href="assets/fonts/font-awesome.min.css">
	<link rel="stylesheet" href="assets/fonts/themify-icons.css">
	<link rel="stylesheet" href="assets/owlcarousel/css/owl.carousel.css">
	<link rel="stylesheet" href="assets/owlcarousel/css/owl.theme.css">
	<link rel="stylesheet" href="assets/css/fonts.css">
	<link rel="stylesheet" href="assets/css/animate.css">
	<link rel="stylesheet" href="assets/css/magnific-popup.css">{sl}
	<link rel="stylesheet" href="assets/css/menu.css">
	<link rel="stylesheet" href="assets/css/style.css">
	<link rel="stylesheet" href="assets/css/responsive.css">
	<link rel="stylesheet" href="assets/css/arshith.css">{INTRO}
</head>

<body data-spy="scroll" data-offset="80">

	<!-- START PRELOADER -->
	<div class="preloader"><div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div></div>
	<!-- END PRELOADER -->
"""


def header(active):
    return f"""
	<!-- START NAVBAR -->
	<div class="site-mobile-menu site-navbar-target">
		<div class="site-mobile-menu-header">
			<div class="site-mobile-menu-close mt-3"><span class="icon-close2 js-menu-toggle"></span></div>
		</div>
		<div class="site-mobile-menu-body"></div>
	</div>

	<header class="site-navbar js-sticky-header site-navbar-target" role="banner">
		<div class="container">
			<div class="row align-items-center">
				<div class="col-6 col-xl-2">
					<h1 class="mb-0 site-logo"><a href="index.html"><img src="{LOGO}" alt="Arshith Group"></a></h1>
				</div>
				<div class="col-12 col-md-10 d-none d-xl-block">
					<nav class="site-navigation position-relative text-right" role="navigation">
						<ul class="site-menu main-menu js-clone-nav mr-auto d-none d-lg-block">
{nav_html(active)}
						</ul>
					</nav>
				</div>
				<div class="col-6 d-inline-block d-xl-none ml-md-0 py-3" style="position: relative; top: 3px;">
					<a href="#" class="site-menu-toggle js-menu-toggle float-right"><span class="icon-menu h3"></span></a>
				</div>
			</div>
		</div>
	</header>
	<!-- END NAVBAR-->
"""


def section_top(title):
    return f"""
	<!-- START SECTION TOP -->
	<section class="section-top" style="background-image: url(assets/img/bg/section-top.png);background-size:cover; background-position: center center;">
		<div class="container">
			<div class="row">
				<div class="col-lg-12 col-sm-12 col-xs-12 text-center">
					<div class="section-top-title">
						<h1>{title}</h1>
					</div>
				</div><!--- END COL -->
			</div><!--- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END SECTION TOP -->
"""


def stitle(title, text="", white=False):
    w = ' class="section-title-white"' if white else ""
    p = f"\n\t\t\t\t<p{w}>{text}</p>" if text else ""
    return f"""<div class="section-title text-center">
				<h2{w}>{title}</h2>{p}
			</div>"""


# ------------------------------------------------------------------ common template sections
def features(items, title=None, text="", section_cls="feature_area", inner_bg=True, sid=""):
    """items: (icon_png, heading, text) - template FEATURES block."""
    cols = ""
    for i, (icon, h, p) in enumerate(items):
        cols += f"""
				<div class="col-lg-4 col-sm-6 col-xs-12 no-padding {wow(0.1 + (i % 6) * 0.1)}">
					<div class="single_feature">
						<img src="assets/img/icon/{icon}" alt="icon" />
						<h4>{h}</h4>
						<p>{p}</p>
					</div>
				</div><!-- END COL -->"""
    t = stitle(title, text) if title else ""
    rowcls = "row feature_bg" if inner_bg else "row text-center"
    idattr = f' id="{sid}"' if sid else ""
    return f"""
	<!-- FEATURES -->
	<section{idattr} class="{section_cls}">
		<div class="container">
			<div class="{rowcls}">
			{t}{cols}
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END FEATURES -->
"""


COUNTER_ICONS = ["counter-1.png", "counter-2.png", "counter-3.png", "counter-4.png"]


def counter(items, video=None):
    """items: (value, suffix, label). Integers animate like the template."""
    cols = ""
    for i, (val, suf, label) in enumerate(items):
        last = " single-project-mrnone" if i == len(items) - 1 else ""
        if isinstance(val, int):
            num = f'<h2><span class="counter-num">{val}</span>{suf}</h2>'
        else:
            num = f'<h2 class="ag-word">{val}</h2>'
        cols += f"""
				<div class="col-lg-3 col-sm-6 col-xs-12 no-padding {wow(0.1 + i * 0.1)}">
					<div class="single-project{last}">
						<img src="assets/img/icon/{COUNTER_ICONS[i % 4]}" alt="icon" />
						{num}
						<h4>{label}</h4>
					</div>
				</div><!-- END COL -->"""
    vid = ""
    if video:
        bg, href = video
        vid = f"""
			<div class="row text-center">
				<div class="col-lg-8 offset-lg-2 col-sm-12 col-xs-12 {wow(0.3)}">
					<div class="video_btn" style="background-image: url('{bg}');  background-size:cover; background-position: center center;">
						<a class="video-play" href="{href}"><i class="ti-video-clapper"></i></a>
					</div>
				</div>
			</div><!--- END ROW -->"""
    return f"""
	<!-- START COUNTER -->
	<section data-stellar-background-ratio="0.3" class="counter_feature section-padding">
		<div class="container">
			<div class="row text-center">{cols}
			</div><!--- END ROW -->{vid}
		</div><!--- END CONTAINER -->
	</section>
	<!-- END COUNTER-->
"""


def hire_us(title, text, btn_text, btn_href, icon="search.png", btn2=None):
    b2 = f' <a class="btn_one" href="{btn2[1]}">{btn2[0]}</a>' if btn2 else ""
    return f"""
	<!-- HIRE US -->
	<div class="hire_us_area section-padding">
		<div class="container">
			<div class="row">
				<div class="offset-lg-1 col-lg-10 col-sm-12 col-xs-12 {wow(0.2)}">
					<div class="row">
						<div class="col-lg-4 col-sm-6 col-xs-12">
							<div class="hire_img"><img src="assets/img/icon/{icon}" class="img-fluid" alt="" /></div>
						</div><!-- END COL  -->
						<div class="col-lg-8 col-sm-6 col-xs-12">
							<div class="hire_content">
								<h2>{title}</h2>
								<p>{text}</p>
								<a class="btn_one" href="{btn_href}">{btn_text}</a>{b2}
							</div>
						</div><!-- END COL  -->
					</div><!-- END ROW -->
				</div><!-- END COL  -->
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</div>
	<!-- END HIRE US -->
"""


TEAM = [
    ("logos/farook_executive.jpg", "Farook N", "CEO - Arshith Group",
     [("ti-email", "mailto:ceo@arshithgroup.com"), ("ti-linkedin", "https://www.linkedin.com/in/farook-n-2bb2b5344/")]),
    ("logos/pallavi_executive.jpg", "Pallavi N", "Managing Director - Arshith Group",
     [("ti-email", "mailto:md@arshithgroup.com"), ("ti-linkedin", "https://www.linkedin.com/in/pallavi-n-4578033ab/")]),
    ("logos/satyanarayan.jpg", "P. Satyanarayan", "CEO - Arshith Commercial Business", []),
    ("logos/trinadh.png", "K. Trinadh", "Chief Marketing Officer (CMO)", []),
    ("logos/swapnika.jpg", "P. Swapnika", "Chief Financial Officer (CFO)", []),
    ("logos/stephen.png", "I. Stephen", "Chief Operating Officer (COO)", []),
]


def team(members=TEAM, title="Our Executive Team",
         text="Our executive leadership drives strategic vision, commercial operations, marketing expansion, financial excellence, and operational delivery across Arshith Group."):
    cols = ""
    for i, (img, name, role, links) in enumerate(members):
        soc = ""
        if links:
            soc = '<ul class="social">' + "".join(
                f'<li><a href="{u}" class="{ic}"{EXT if u.startswith("http") else ""} aria-label="{name}"></a></li>' for ic, u in links) + "</ul>"
        cols += f"""
				<div class="col-lg-4 col-sm-6 col-xs-12 {wow(0.1 + (i % 3) * 0.1)}">
					<div class="our-team">
						<div class="single-team">
							<img src="{img}" class="img-fluid" alt="{name} - {role}" />
							<h3>{name}</h3>
							<p>{role}</p>
						</div>
						{soc}
					</div><!--- END OUR TEAM -->
				</div><!--- END COL -->"""
    return f"""
	<!-- START TEAM MEMBERS -->
	<section id="team" class="team_area section-padding">
		<div class="container">
			{stitle(title, text)}
			<div class="row text-center">{cols}
			</div><!--- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END TEAM MEMBERS -->
"""


def contact_form(title="Contact Us",
                 text="Have a question or want to work with us? Reach out and our team will get back to you shortly."):
    return f"""
	<!-- CONTACT -->
	<div id="contact" class="contact_area section-padding">
		<div class="container">
			{stitle(title, text, white=True)}
			<div class="row">
				<div class="offset-lg-1 col-lg-10 col-sm-12 col-xs-12 text-center {wow(0.2)}">
					<div class="contact">
						<form id="agContactForm" novalidate>
							<div class="row">
								<div class="form-group col-md-6">
									<input type="text" id="contactName" name="name" class="form-control" placeholder="Full Name" required>
								</div>
								<div class="form-group col-md-6">
									<input type="email" id="contactEmail" name="email" class="form-control" placeholder="Email Address" required>
								</div>
								<div class="form-group col-md-6">
									<input type="tel" id="contactPhone" name="phone" class="form-control" placeholder="Phone Number">
								</div>
								<div class="form-group col-md-6">
									<select id="contactSubject" name="subject" class="form-control">
										<option value="">Select a topic</option>
										<option>Careers &amp; Jobs</option>
										<option>Internship</option>
										<option>Business Enquiry</option>
										<option>Other</option>
									</select>
								</div>
								<div class="form-group col-md-12">
									<textarea rows="6" id="contactMsg" name="message" class="form-control" placeholder="Write your message here..." required></textarea>
								</div>
								<div class="col-md-12 text-center">
									<button type="submit" class="contact_btn" title="Submit Your Message!">Send Message</button>
									<p id="agFormSuccess" class="ag-form-success" role="status"></p>
								</div>
							</div>
						</form>
					</div>
				</div><!-- END COL  -->
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</div>
	<!-- END CONTACT -->
"""


BRANDS = [
    ("Arshith InfoTech", "IT Services", "http://arshithinfotech.com/"),
    ("Arshith Fresh", "E-Commerce", "https://arshithfresh.com/"),
    ("Arshith Fresh Sellers", "Multi sellers", "https://seller.arshithfresh.com/"),
    ("Suntech Solutions", "Business Consulting", "https://suntechorganization.com/"),
]


def partners():
    cols = ""
    for i, (name, sub, url) in enumerate(BRANDS):
        bm = " single_logo_bm" if i % 2 == 0 else ""
        cols += f"""
				<div class="col-lg-3 col-sm-6 col-xs-12 no-padding {wow(0.1 + i * 0.1)}">
					<div class="single_logo{bm}">
						<a href="{url}"{EXT} class="ag-brand"><span>{name}</span><small>{sub}</small></a>
					</div>
				</div><!--- END COL -->"""
    return f"""
	<!-- START PARTNER LOGO -->
	<div class="partner-logo section-padding">
		<div class="container">
			<div class="row text-center">{cols}
			</div><!--- END ROW -->
		</div><!--- END CONTAINER -->
	</div>
	<!-- END PARTNER LOGO -->
"""


SOCIALS = [
    ("https://www.linkedin.com/in/farook-n-2bb2b5344/", "fa-linkedin", "Farook N on LinkedIn"),
    ("https://www.linkedin.com/company/arshith-fresh-india-pvt-ltd/posts/?feedView=all", "fa-linkedin", "Arshith Fresh on LinkedIn"),
    ("https://www.linkedin.com/in/pallavi-n-4578033ab/", "fa-linkedin", "Pallavi N on LinkedIn"),
    ("https://www.linkedin.com/company/suntech-it-solution/", "fa-linkedin", "Suntech on LinkedIn"),
    ("https://www.instagram.com/arshithgroup?igsh=MWRnNXN0NDRpeWQ1bg==", "fa-instagram", "Arshith Group on Instagram"),
    ("https://youtube.com/@vamikadurbar?si=mvXxo3HM8Qe4liD9", "fa-youtube", "Vamika Durbar on YouTube"),
    ("https://youtube.com/@arshithfresh?si=ZjvzneHlriAxv322", "fa-youtube", "Arshith Fresh on YouTube"),
]


def footer():
    soc = "".join(
        f'<li><a href="{u}"{EXT} class="{"f_linkedin" if "linkedin" in i else "f_instagram" if "insta" in i else "f_twitter"}"><i class="fa {i}" title="{t}"></i></a></li>'
        for u, i, t in SOCIALS)
    return f"""
	<!-- START FOOTER -->
	<div class="footer" style="background-image: url(assets/img/bg/footer.png);  background-size:cover;">
		<div class="container">
			<div class="row footer_bg">
				<div class="col-lg-3 col-sm-6 col-xs-12">
					<div class="footer_logo">
						<img src="{LOGO}" alt="Arshith Group" />
						<p>Arshith Group is committed to innovation, sustainability, and excellence across multiple industries including E-Commerce, Technology, and Digital Services. We empower communities and deliver trusted solutions.</p>
					</div>
					<div class="social_profile">
						<ul>{soc}</ul>
					</div>
				</div><!--- END COL -->
				<div class="col-lg-3 col-sm-6 col-xs-12">
					<div class="single_footer">
						<h4>About Us</h4>
						<ul>
							<li><a href="aboutgroup.html">About Arshith Group</a></li>
							<li><a href="aboutceo.html">Executive Biographies</a></li>
							<li><a href="aboutceo.html#ceo-bio">Leadership</a></li>
							<li><a href="aboutgroup.html#journey">Our Journey</a></li>
							<li><a href="aboutceo.html">Awards</a></li>
							<li><a href="lifeatarshith.html">Life at Arshith Group</a></li>
							<li><a href="LatestNews.html">News</a></li>
							<li><a href="internship.html">Careers</a></li>
							<li><a href="/admin/">Admin Examinar</a></li>
						</ul>
					</div>
				</div><!--- END COL -->
				<div class="col-lg-3 col-sm-6 col-xs-1">
					<div class="single_footer">
						<h4>Businesses</h4>
						<ul>
							<li><a href="https://arshithfresh.com/"{EXT}>E-Commerce</a></li>
							<li><a href="https://suntechorganization.com/"{EXT}>Business Consulting &amp; Services</a></li>
							<li><a href="https://suntechorganization.com/"{EXT}>Digital &amp; Marketing</a></li>
							<li><a href="http://arshithinfotech.com/"{EXT}>Software Development</a></li>
							<li><a href="index.html#companies">Business</a></li>
							<li><a href="contact.html">Contact Us</a></li>
						</ul>
					</div>
				</div><!--- END COL -->
				<div class="col-lg-3 col-sm-6 col-xs-12">
					<div class="single_footer">
						<h4>Need Help?</h4>
						<ul class="ag-help">
							<li>Bengaluru, Karnataka, India - 560076</li>
							<li><a href="tel:+918618471424">+91 8618471424</a></li>
							<li><a href="mailto:info@arshithgroup.com">info@arshithgroup.com</a></li>
							<li>Mon - Sat: 9:00 AM - 6:00 PM</li>
						</ul>
						<p class="ag-start">Let&rsquo;s start with <strong>Arshith</strong>.</p>
					</div>
				</div><!--- END COL -->
			</div><!--- END ROW -->
			<div class="row">
				<div class="col-lg-12 text-center">
					<div class="footer_copyright">
						<p>&copy; 2026 Arshith Group. All rights reserved. &nbsp;|&nbsp; Legal Disclaimer &middot; Privacy Notice &middot; Terms &amp; Conditions &middot; Cookie Policy</p>
						<p>Template by <a href="https://bestwpware.com/"{EXT}>Bestwpware</a> &middot; Distributed by <a href="https://themewagon.com"{EXT}>ThemeWagon</a></p>
					</div>
				</div>
			</div>
		</div><!--- END CONTAINER -->
	</div>
	<!-- END FOOTER -->
"""


def scripts(extra="", swipe=False):
    sw = '\n\t<script src="assets/js/jquery.touchSwipe.min.js"></script>' if swipe else ""
    return f"""
	<script src="assets/js/jquery-1.12.4.min.js"></script>
	<script src="assets/bootstrap/js/bootstrap.min.js"></script>
	<script src="assets/js/modernizr-2.8.3.min.js"></script>
	<script src="assets/owlcarousel/js/owl.carousel.min.js"></script>
	<script src="assets/js/jquery.magnific-popup.min.js"></script>
	<script src="assets/js/jquery.mixitup.js"></script>
	<script src="assets/js/jquery.appear.js"></script>
	<script src="assets/js/jquery.inview.min.js"></script>{sw}
	<script src="assets/js/jquery.stellar.min.js"></script>
	<script src="assets/js/wow.min.js"></script>
	<script src="assets/js/menu.js"></script>
	<script src="assets/js/jquery.sticky.js"></script>
	<script src="assets/js/scrolltopcontrol.js"></script>
	<script src="assets/js/scripts.js"></script>
	<script src="assets/js/arshith.js"></script>
{extra}
</body>
</html>
"""


def page(title, description, active, body, extra_js="", slider=False, intro=False):
    return head(title, description, slider, intro) + header(active) + body + footer() + scripts(extra_js, swipe=slider)
