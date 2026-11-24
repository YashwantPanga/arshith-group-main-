from layout import *

# Real photos from the previous site (no AI-generated images).
P = {
    "fresh_team": "about-us-top_pic.png",
    "office_screen": "marque/15.jpeg",
    "group_photo": "marque/06.jpeg",
    "ceo_stage": "marque/03.jpeg",
    "ceo_cutout": "ceo.png",
    "md_cutout": "md.png",
    "auditorium": "logos/mallareddy.jpeg",
    "college_group": "logos/diest%20collage.jpeg",
    "team": "logos/Team.jpeg",
    "students": "logos/students.jpeg",
    "career_fair": "marque/12.jpeg",
    "ceo_desk": "marque/09.jpeg",
    "meeting": "marque/19.jpeg",
    "panel": "marque/20.jpeg",
    "expert_talk": "marque/14.jpeg",
    "award": "marque/02.jpeg",
    "interview": "marque/11.jpeg",
    "classroom": "marque/13.jpeg",
    "workshop": "marque/17.jpeg",
    "md_signing": "logos/news4.jpeg",
    "ceo_signing": "logos/news5.jpeg",
    "md_photo": "logos/mamimagefinal.jpeg",
    "ceo_photo": "logos/farook_executive.jpg",
    "products": "logos/E%20COMMERCE.jpeg",
}

# ======================================================================= HOME (template index_two order)
SLIDES = [
    ("logos/ecommerce3.png", "E-Commerce", "Arshith Fresh",
     "Rooted in nature, grown with care, We bring freshness beyond compare. From farm to you, pure and true, Quality you trust in all we do..",
     "https://arshithfresh.com/", "", "fadeInRight"),
    ("logos/infotech.jpeg", "IT Services &amp; IT Consulting", "ArshithInfoTech",
     "Building innovative solutions with modern code, Turning ideas into a powerful digital mode, Driven by quality, performance, and trust, Delivering excellence through ArshithInfoTech.",
     "http://arshithinfotech.com/", " kenburns_061_slide_right", "fadeInLeft"),
    ("logos/nonit.png", "Business Consulting &amp; Services", "Suntech Solutions.",
     "Empowering businesses with smart digital solutions, Driving growth through innovation and precision. Your trusted partner for success and transformation, Building a stronger future with Suntech Organization.",
     "https://suntechorganization.com/", " kenburns_061_slide_center", "fadeInDown"),
]

BUSINESSES = [
    ("web.png", "IT Services &amp; IT Consulting",
     "<strong>ArshithInfoTech</strong> - Building innovative solutions with modern code, Turning ideas into a powerful digital mode, Driven by quality, performance, and trust, Delivering excellence through ArshithInfoTech.", "http://arshithinfotech.com/"),
    ("cart.png", "E-Commerce",
     "<strong>Arshith Fresh</strong> - Rooted in nature, grown with care, We bring freshness beyond compare. From farm to you, pure and true, Quality you trust in all we do.", "https://arshithfresh.com/"),
    ("sales.png", "Multi sellers",
     "The Arshith Fresh seller platform for multi-seller inventory and marketplace operations.", "https://seller.arshithfresh.com/"),
    ("strategy.png", "Business Consulting &amp; Services",
     "<strong>Suntech Solutions</strong> - Empowering businesses with smart digital solutions, Driving growth through innovation and precision. Your trusted partner for success and transformation.", "https://suntechorganization.com/"),
    ("marketing-1.png", "Digital Marketing",
     "Digital marketing services from Suntech Solutions, building a stronger future with Suntech Organization.", "https://suntechorganization.com/"),
    ("research.png", "Internships &amp; Training",
     "Hands-on industry projects, structured mentorship, and direct campus hiring.", "internship.html"),
]


def business_features():
    cols = ""
    for i, (icon, h, p, url) in enumerate(BUSINESSES):
        ext = EXT if url.startswith("http") else ""
        cols += f"""
				<div class="col-lg-4 col-sm-6 col-xs-12 no-padding {wow(0.1 + i * 0.1)}">
					<div class="single_feature">
						<img src="assets/img/icon/{icon}" alt="icon" />
						<h4><a href="{url}"{ext}>{h}</a></h4>
						<p>{p}</p>
					</div>
				</div><!-- END COL -->"""
    return f"""
	<!-- FEATURES -->
	<section id="companies" class="feature_area">
		<div class="container">
			<div class="row feature_bg">
			{stitle("One Vision. Three Distinct Strengths.", "Arshith Group is a high-growth corporate ecosystem built on innovation, digital transformation, and sustainable business solutions.")}{cols}
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END FEATURES -->
"""


JOURNEY = [
    ("2019", "The Beginning", "Arshith Group was founded with Suntech Solutions, building businesses with core purpose.", 20),
    ("2021", "Laying the Foundation", "Built strong foundation, defined core values, and expanded backend management services.", 40),
    ("2023", "Building Momentum", "Consolidated operations under the unified Arshith Group identity to drive long-term impact.", 60),
    ("2025", "A Diversified Future", "Inaugurated Arshith Fresh India, expanding portfolio into direct organic e-commerce.", 80),
    ("2026", "The Journey Continues", "Scaling Arshith Info-Tech globally with software, cloud, and digital transformations.", 100),
]


def journey_skills(bg):
    bars = ""
    for yr, h, p, pct in JOURNEY:
        bars += f"""
							<div class="progress-bar-linear" title="{p}">
								<p class="progress-bar-text">{yr} &middot; {h}<span>{yr}</span></p>
								<div class="progress-bar"><span data-percent="{pct}"></span></div>
								<small class="ag-bar-note">{p}</small>
							</div>"""
    return f"""
	<!-- SKILLS -->
	<section id="journey" class="skills_area section-padding" style="background-image: url('{bg}');  background-size:cover;background-position:center;">
		<div class="container">
			<div class="row">
				<div class="col-lg-5 col-sm-8 col-xs-12 {wow(0.2)}">
					<div class="skill_bg">
						<div class="skill_content">
							<h2>Great outcomes are engineered through complex challenges.</h2>
							<p>From a vision to a diversified group, our journey has been driven by purpose, resilience, and a commitment to creating opportunities that make a difference.</p>
						</div>
						<div class="skill_bar">{bars}
						</div>
					</div>
				</div><!-- END COL -->
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END SKILLS -->
"""


PATHWAYS = [
    (P["career_fair"], "internship.html", "Job Opportunities", "24+ Roles",
     "Full-time engineering, consulting, and operational roles across Arshith companies.", "View Open Roles"),
    (P["ceo_desk"], "aboutceo.html", "Our Values &amp; Culture", "Core Ethos",
     "Built on transparency, mutual respect, integrity, and relentless innovation.", "Explore Ethos"),
    (P["meeting"], "lifeatarshith.html", "Life at Arshith", "Work Culture",
     "Collaborative workspaces, hackathons, wellness programs, and team retreats.", "See Life Here"),
    (P["students"], "internship.html", "Internships &amp; Training", "Mentorship",
     "Hands-on industry projects, structured mentorship, and direct campus hiring.", "Apply Internship"),
]


def blog_cards(items, col=3):
    cols = ""
    for i, (img, href, h, cat, p, btn) in enumerate(items):
        cols += f"""
				<div class="col-lg-{col} col-sm-6 col-xs-12 {wow(0.1 + (i % 4) * 0.1)}">
					<div class="home_single_blog">
						<img src="{img}" class="img-fluid" alt="{h}" />
						<div class="home_blog_content">
							<div class="blog_title_info">
								<h2><a href="{href}">{h}</a></h2>
								<span>Arshith Group</span>
								<span><a href="{href}">{cat}</a></span>
							</div>
							<p>{p}</p>
							<a class="home_b_btn" href="{href}">{btn}</a>
						</div>
					</div>
				</div><!-- END COL -->"""
    return cols


TESTIMONIALS = [
    (None, "Bhavana", "Frontend Intern &rarr; Software Engineer",
     "My internship gave me hands-on experience with real projects from the very beginning. Working with Git, participating in code reviews, and solving real development challenges helped me grow from a frontend intern into a more confident software engineer."),
    (None, "Kavya", "UI/UX &amp; Web Intern",
     "Working on the Arshith Fresh e-commerce platform gave me hands-on experience in designing for real users and understanding how e-commerce products work at scale. It helped me strengthen my UI/UX skills and taught me how thoughtful design can improve the overall user experience."),
    (None, "Priya", "Back end developer intern",
     "Working on real backend projects gave me valuable experience with APIs, databases, and server-side development. I learned how to build reliable solutions, solve real-world problems, and work effectively with the development team."),
]


def testimonials(items, title, text, col=6):
    cols = ""
    for i, (img, name, role, quote) in enumerate(items):
        pic = (f'<img src="{img}" alt="{name}" />' if img
               else f'<span class="ag-initial">{name[0]}</span>')
        cols += f"""
							<div class="col-lg-{col} col-sm-12 col-xs-12 {wow(0.1 + i * 0.1)}">
								<div class="single_testimonial">
									<div class="testimonial_img">{pic}</div>
									<p>&ldquo;{quote}&rdquo;</p>
									<h4>{name}</h4>
									<h5>{role}</h5>
								</div>
							</div><!-- END COL  -->"""
    return f"""
	<!-- TESTIMONIALS -->
	<div class="testimonial_area section-padding">
		<div class="container">
			{stitle(title, text)}
			<div class="row">
				<div class="col-lg-10 offset-lg-1 col-sm-12 col-xs-12">
					<div class="row">{cols}
					</div>
				</div>
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</div>
	<!-- END TESTIMONIALS -->
"""


def home():
    portfolio = ""
    for img, cats, wide, title in [
        (P["award"], "partnerships events", False, "Strategic Growth &amp; Partnerships"),
        (P["group_photo"], "leadership", False, "Corporate Leadership &amp; Operations"),
        (P["expert_talk"], "events", False, "Corporate Events &amp; Milestone Sessions"),
        (P["meeting"], "workplace", True, "Executive &amp; Cross-Team Synergy"),
        (P["panel"], "events leadership", True, "Pre-Placement Talk"),
    ]:
        w = 6 if wide else 4
        portfolio += f"""
					<div class="col-lg-{w} col-sm-6 col-xs-12 portfolio-item mix {cats}">
						<div class="single-gallery">
							<img src="{img}" class="img-fluid" alt="{title}">
							<a href="{img}" class="gallery_enlarge_icon" title="{title}"><i class="ti-eye"></i></a>
							<h4><a href="LatestNews.html">{title}</a></h4>
						</div>
					</div><!-- End Col -->"""

    testi = [(P["md_cutout"], "Pallavi N", "Managing Director - Arshith Group",
              "Our aim is not to create a successful company, but to create a company that makes a real difference.")] + TESTIMONIALS

    body = f"""
	<!-- START HOME -->
	<section data-stellar-background-ratio="0.3" id="home" class="home_bg" style="background-image: url(assets/img/bg/home-bg.jpg);  background-size:cover; background-position: center center;">
		<div class="container">
			<div class="row">
				<div class="col-lg-12 col-sm-12 col-xs-12 text-center">
					<div class="hero-text">
						<h2>We build businesses that matter</h2>
						<p>IT Services &amp; Consulting &middot; E-Commerce &middot; Business Consulting &amp; Services &mdash; One Vision. Three Distinct Strengths.</p>
						<a href="aboutgroup.html">Learn More</a>
					</div>
				</div><!--- END COL -->
			</div><!--- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END  HOME -->
{business_features()}
{counter([(7, "+", "Years of Innovation"), (100, "+", "Career Openings"), ("Continuous", "", "Mentorship &amp; Growth"), ("People First", "", "Global Workplace")],
         video=(P["ceo_stage"], "logos/Logo%20video.mp4"))}
	<!-- START WHY CHOOSE US -->
	<section class="why_choose_area section-padding">
		<div class="container">
			<div class="row">
				<div class="col-lg-6 col-sm-12 col-xs-12 {wow(0.1)}">
					<div class="single_why_choose">
						<h2>The best view <br /> comes after the <br /> hardest climb.</h2>
						<p>Every meaningful achievement begins with a challenge. We embrace the journey, learn from every obstacle, and move forward with purpose. Because true growth is not about taking the easiest path.</p>
						<p class="ag-sign"><strong>Farook N</strong><br />Chief Executive Officer, Arshith Group<br /><a href="mailto:ceo@arshithgroup.com">ceo@arshithgroup.com</a></p>
						<a class="btn_one" href="aboutceo.html">View Profile</a>
					</div>
				</div><!--- END COL -->
				<div class="col-lg-6 col-sm-12 col-xs-12 {wow(0.1)}">
					<div class="single_why_choose_img">
						<img src="{P["ceo_cutout"]}" class="img-fluid" alt="Farook N - CEO &amp; Chairman, Arshith Group" />
					</div>
				</div><!--- END COL -->
			</div><!--- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END WHY CHOOSE US-->

	<!-- START PORTFOLIO -->
	<section id="portfolio" class="portfolio_area section-padding">
		<div class="container-fluid">
			{stitle("Latest Highlights", "Operational highlights, events and milestones from across Arshith Group.")}
			<div class="col-lg-12 text-center">
				<div class="portfolio_filter">
					<ul>
						<li class="active filter" data-filter="all">All</li>
						<li class="filter" data-filter=".events">Events</li>
						<li class="filter" data-filter=".partnerships">Partnerships</li>
						<li class="filter" data-filter=".leadership">Leadership</li>
						<li class="filter" data-filter=".workplace">Workplace</li>
					</ul>
				</div>
			</div>
			<div class="portfolio-grid">
				<div class="row">{portfolio}
				</div><!-- END ROW -->
				<div class="col-lg-12 text-center">
					<div class="portfolio_btn"><a class="btn_one" href="LatestNews.html">View More</a></div>
				</div><!-- END Col -->
			</div>
		</div><!-- END CONTAINER -->
	</section>
	<!-- END PORTFOLIO -->
{journey_skills(P["auditorium"])}
	<!-- PROMOTIONAL AREA -->
	<div class="promotional_area section-padding">
		<div class="container">
			<div class="row">
				<div class="col-lg-12 col-sm-12 col-xs-12">
					<div class="promotional_content">
						<img src="{P["college_group"]}" class="img-fluid" alt="Arshith Group team" />
						<p>&ldquo;We don't just build businesses, we build a legacy of trust, growth, and impact.&rdquo; &mdash; <strong>ARSHITH GROUP</strong><br />People First &middot; Driven by Innovation &middot; Built on Trust &middot; Focused on Growth</p>
					</div>
				</div><!-- END COL -->
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</div>
	<!-- END PROMOTIONAL AREA -->
{testimonials(testi, "What People Say", "Words from our leadership and the interns who built live features with us.")}
	<!-- BLOG -->
	<section id="careers" class="blog_area section-padding">
		<div class="container">
			{stitle("Build Your Career. Grow With Purpose.", "At Arshith Group, we bring together visionary minds, innovators, and leaders to shape the future of enterprise technology, consulting, and digital commerce.")}
			<div class="row text-center">{blog_cards(PATHWAYS)}
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END BLOG -->
{contact_form()}
{partners()}
"""
    return page("Arshith Group", "Arshith Group - IT Services, E-Commerce and Business Consulting.", "Home", body)


# ======================================================================= ABOUT (template about.html order)
def aboutgroup():
    journey = [("research.png", f"{y} &middot; {h}", p) for y, h, p, _ in JOURNEY]
    journey.append(("brand.png", "Our Values", "People First &middot; Driven by Innovation &middot; Built on Trust &middot; Focused on Growth. We don't just build businesses, we build a legacy of trust, growth, and impact."))
    body = f"""
{section_top("About Arshith Group")}
	<!-- ABOUT PAGE -->
	<section id="story" class="about_page_area">
		<div class="container">
			<div class="row text-center">
				<div class="offset-lg-1 col-lg-10 col-sm-12 col-xs-12 {wow(0.1)}">
					<div class="single_about_content">
						<h2>Architecting Growth Across <br /> 3 Core Pillars</h2>
						<p><strong>Arshith Group</strong> is a high-growth corporate ecosystem built on innovation, digital transformation, and sustainable business solutions. Through our three key entities &mdash; <a href="http://arshithinfotech.com/"{EXT}>Arshith InfoTech</a> (IT &amp; Software Solutions), <a href="https://arshithfresh.com/"{EXT}>Arshith Fresh</a> (Sustainable Agri &amp; E-Commerce) and <a href="https://suntechorganization.com/"{EXT}>SunTech Solutions</a> (Business Consulting &amp; Services) &mdash; we empower enterprises to scale, innovate, and succeed across global markets.</p>
						<p>Founded in <strong>2019</strong> with the inception of <strong>SunTech Solutions</strong>, Arshith Group began as an ambitious enterprise dedicated to corporate consulting, operations management, and business scaling. By delivering backend operational support and strategic consulting, SunTech built a strong foundation of trust and client satisfaction.</p>
						<p>As service operations expanded into digital consulting and technical infrastructure, all business divisions were consolidated under the unified corporate identity of <strong>Arshith Group</strong> in <strong>2023</strong>&mdash;establishing a multi-sector conglomerate engineered for sustainable innovation.</p>
						<p>In <strong>2025</strong>, the group incorporated <strong>Arshith Fresh India Pvt Ltd</strong>, pioneering a direct-to-consumer e-commerce platform that connects farmers directly with consumers. By delivering 100% natural, farm-sourced products, Arshith Fresh empowers local agricultural communities while guaranteeing uncompromised purity to households.</p>
						<p>Today, through <strong>Arshith InfoTech</strong> (scaled globally in <strong>2025</strong>), the organization engineers cutting-edge software solutions, cloud architectures, and digital transformations for enterprises worldwide. By uniting technology, sustainability, and trust, Arshith Group is building a future where innovation benefits everyone.</p>
						<a class="btn_one" href="aboutceo.html">Executive Biographies</a>
					</div>
				</div><!-- END COL -->
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END ABOUT PAGE -->
{features(journey, "Our Journey", "From a vision to a diversified group, our journey has been driven by purpose, resilience, and a commitment to creating opportunities that make a difference.", "feature_area section-padding", inner_bg=False, sid="journey")}
{counter([(7, "+", "Years of Experience"), (10, "+", "Services &amp; Solutions"), (100, "+", "Quality Products"), (30, "k+", "Happy Customers")])}
{team(title="Leadership", text="Our executive leadership drives strategic vision, commercial operations, marketing expansion, financial excellence, and operational delivery across Arshith Group.")}
{hire_us("Want to work with us?", "At Arshith Group, we bring together visionary minds, innovators, and leaders to shape the future of enterprise technology, consulting, and digital commerce.", "Contact us", "contact.html", btn2=("Explore All Positions", "internship.html"))}
{contact_form()}
{partners()}
"""
    return page("About Arshith Group | Our Ecosystem &amp; Pillars", "About Arshith Group - our story, journey and leadership.", "About Us", body)


# ======================================================================= EXECUTIVE BIOGRAPHIES (single_service + team layout)
def marketing_block(anchor, heading, img, alt, paras):
    text = "".join(f"\n\t\t\t\t\t\t<p>{p}</p>" for p in paras)
    return f"""
	<!-- START SERVICE MARKETING PAGE -->
	<section id="{anchor}" class="marketing_area section-padding">
		<div class="container">
			<div class="row">
				<div class="col-lg-5 col-sm-12 col-xs-12 {wow(0.1)}">
					<div class="marketing_content">
						<h2>{heading}</h2>
						<img src="{img}" class="img-fluid" alt="{alt}" />
					</div>
				</div><!-- END COL -->
				<div class="col-lg-7 col-sm-12 col-xs-12 {wow(0.2)}">
					<div class="marketing_text">{text}
					</div>
				</div><!-- END COL -->
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END SERVICE MARKETING PAGE -->
"""


def aboutceo():
    ceo = [
        "<strong class='ag-name'>Farook N</strong> &mdash; CEO, Arshith Group &middot; <a href='mailto:ceo@arshithgroup.com'>ceo@arshithgroup.com</a>",
        "Every great journey starts with a thought. &ldquo;Why not build something of our own?&rdquo;",
        "Our story began with years of experience gained in the corporate world. After working for two years and then stepping into the role of Chief Operating Officer in an organization, the idea of building something on our own began to grow stronger.",
        "The question was simple but powerful: <em>Why keep building someone else&rsquo;s vision when we can create and build our own?</em> That question became the spark for <strong>Suntech Solutions</strong>.",
        "<strong>The Beginning. Suntech Solutions</strong><br />With a vision to build a reliable and service-focused technology business, Suntech Solutions was born. It marked the step in our journey from employee to entrepreneur. At the start, the company focused on backend support and technology services. We helped organizations manage their operations and meet their business needs. Over time we moved into software support and broader technology solutions, which gave us insight into what businesses truly needed from their technology partners. Suntech was more than a company. It was the foundation where our entrepreneurial journey began.",
        "<strong>Expanding Beyond Technology. Arshith Fresh India</strong><br />As we grew, we saw an opportunity beyond technology. We wanted to explore new areas, new industries, and new ways to serve customers. That led to the creation of <strong>Arshith Fresh India Private Limited</strong>, an e-commerce business dedicated to bringing natural products to people. This move into the e-commerce and organic space was a shift. It was also a natural one. We were already building a brand around trust, quality, and customer value. So launching Arshith Fresh India felt like a continuation of that vision.",
        "<strong>Building a Vision. Arshith Group</strong><br />As our businesses grew, we began to see a bigger picture. Instead of keeping each business separate, we wanted to bring them together under one shared identity. This led to the formation of <strong>Arshith Group</strong>. Today Arshith Group is home to three businesses, each with its own focus but all united by the same values and purpose.",
        "<strong>The Next Chapter. Arshith Infotech</strong><br />Technology has always been at the center of our journey. So the launch of <strong>Arshith Infotech</strong> is the next step. Focused on software development, IT solutions, and building technology projects for organizations, Arshith Infotech is built to turn business needs into practical, reliable, and scalable results. What started as an idea &mdash; to build something of our own &mdash; has become a diversified group with businesses in technology, e-commerce, and business services.",
        "<strong>One Journey. Multiple Businesses. One Shared Vision.</strong><br />We started by learning in the corporate world. We took the step into entrepreneurship. We grew across industries. Through it all, we stayed true to one principle: <strong>LEARN. BUILD. EVOLVE.</strong> Arshith Group is not just where we are today. It is the foundation for where we're going tomorrow.",
    ]
    md = [
        "<strong class='ag-name'>Pallavi N</strong> &mdash; Managing Director, Arshith Group &middot; <a href='mailto:md@arshithgroup.com'>md@arshithgroup.com</a>",
        "Every organization starts with an idea. Making something important takes experience, belief, and the strength to take the first step.",
        "My work life started with a chance to learn how companies work, how groups develop, and how the right mix of technology, plans, and leadership can make value. After learning a lot in the industry and taking on leadership roles, I started to think about a question: <strong>Why not start our own company &mdash; one that is based on purpose, new ideas, and a long-term plan?</strong>",
        "That idea became the base for what we're doing now. Going from working in a job to starting a business was not a job change. It was a choice to make opportunities, fix business problems, and create a company that can grow with its workers, customers, and partners.",
        "As Managing Director, my job is to create a culture where <strong>new ideas become real, people are given chances to grow, and every business choice is made with long-term value in mind</strong>. We think that real growth comes from trust, continuous learning, strong connections, and being able to change with the world.",
        "Now our plan goes beyond just starting one company. We are trying to make an eco-system ready company that can <strong>start, support, and grow businesses in many areas</strong>.",
        "The path is continuous. Every step is a chance to learn, come up with new things, and keep going.",
    ]
    three = ""
    for i, (icon, h, p) in enumerate([
        ("strategy.png", "Suntech Solutions", "Backend support &amp; software services."),
        ("cart.png", "Arshith Fresh India", "Natural products direct e-commerce."),
        ("web.png", "Arshith Infotech", "Software &amp; enterprise IT projects."),
        ("brand.png", "LEARN. BUILD. EVOLVE.", "One Journey. Multiple Businesses. One Shared Vision."),
    ]):
        three += f"""
						<div class="col-lg-6 col-sm-12 col-xs-12 {wow(0.1 + i * 0.1)}">
							<div class="single_marketing">
								<div class="marketing_icon_img"><img src="assets/img/icon/{icon}" alt="icon" /></div>
								<h3>{h}</h3>
								<p>{p}</p>
							</div>
						</div><!-- END COL  -->"""
    body = f"""
{section_top("Executive Biographies")}
{marketing_block("ceo-bio", "From Experience to Entrepreneurship. From One Vision to a Growing Group.", P["ceo_photo"], "Farook N - CEO &amp; Chairman, Arshith Group", ceo)}
	<!-- MARKETING LIST -->
	<div class="marketing_list_area section-padding">
		<div class="container">
			{stitle("Three Businesses. One Shared Vision.", "Today Arshith Group is home to three businesses, each with its own focus but all united by the same values and purpose.")}
			<div class="row">
				<div class="col-lg-10 offset-lg-1 col-sm-12 col-xs-12">
					<div class="row">{three}
					</div>
				</div>
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</div>
	<!-- END MARKETING LIST -->
{marketing_block("md-bio", "&ldquo;Our aim is not to create a successful company, but to create a company that makes a real difference.&rdquo;", P["md_photo"], "Pallavi N - Managing Director, Arshith Group", md)}
{team()}
{hire_us("Want to work with us?", "Find photos, biographies, leadership vision, and executive journeys of Arshith Group leaders and board of directors members.", "Contact us", "contact.html")}
"""
    return page("Executive Biographies | Arshith Group", "Executive biographies of Arshith Group leadership.", "About Us", body)


# ======================================================================= LIFE AT ARSHITH (casestudy order)
def life():
    gallery = ""
    for img, title in [(P["meeting"], "Executive &amp; Cross-Team Synergy"), (P["expert_talk"], "Annual Tech Hackathons"),
                       (P["group_photo"], "Annual Retreats &amp; Celebrations")]:
        gallery += f"""
					<div class="col-lg-4 col-sm-6 col-xs-12 portfolio-item mix">
						<div class="single-gallery">
							<img src="{img}" class="img-fluid" alt="{title}">
							<a href="{img}" class="gallery_enlarge_icon" title="{title}"><i class="ti-eye"></i></a>
							<h4><a href="{img}" class="ag-popup">{title}</a></h4>
						</div>
					</div>"""
    day = ""
    for i, (t, h, p) in enumerate([
        ("09:30 AM", "Coffee &amp; Standup", "Kick off the day with team syncs, coffee catchups, and prioritizing daily sprint goals."),
        ("11:30 AM", "Deep Work Sprint", "Focus hours for building code, designing architecture, or analyzing client solutions."),
        ("01:00 PM", "Team Lunch &amp; Lounge", "Relaxing over catered meals, playing games, or socializing in the employee lounge."),
        ("03:30 PM", "Cross-Company Exchange", "Collaborative brainstorming between InfoTech, Arshith Fresh, and Suntech teams."),
        ("05:30 PM", "Demos &amp; Wrap-up", "Showcasing completed features, celebrating daily wins, and wrapping up smoothly."),
        ("&#10022;", "Gallery Descriptions", "Collaboration: work directly alongside company leaders, product managers, and software architects. Innovation Labs: 24-hour sprints building rapid AI prototypes, microservices, and apps. Community: we celebrate milestones, launches, and achievements with team offsites."),
    ]):
        day += f"""
						<div class="col-lg-6 col-sm-12 col-xs-12 {wow(0.1 + (i % 2) * 0.1)}">
							<div class="single_marketing">
								<div class="marketing_icon_img ag-time">{t}</div>
								<h3>{h}</h3>
								<p>{p}</p>
							</div>
						</div>"""
    body = f"""
{section_top("Life at Arshith Group")}
	<!-- START CASE STUDY TOP CONTENT -->
	<section class="case_content_top_area section-padding">
		<div class="container">
			<div class="row">
				<div class="col-lg-6 col-sm-12 col-xs-12">
					<div class="case_content_top">
						<h2>Where extraordinary talent engineers the future.</h2>
						<p>Where extraordinary talent engineers future technology, sustainable commerce, and global business consulting. Discover a workplace built on creative freedom, trust, and shared success.</p>
						<p><strong>Top Rated Team Culture</strong> &mdash; 98% Employee Happiness &amp; Growth Rating.</p>
						<a class="btn_one" href="internship.html">Explore Open Positions</a> <a class="btn_one" href="aboutceo.html">Meet Leadership</a>
					</div>
				</div><!--- END COL -->
				<div class="col-lg-6 col-sm-12 col-xs-12">
					<div class="case_content_top_img"><img src="assets/img/home-office.png" class="img-fluid" alt="Life at Arshith Group" /></div>
				</div><!--- END COL -->
			</div><!--- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END CASE STUDY TOP CONTENT -->
{counter([(100, "+", "Visionary Teammates"), (98, "%", "Culture &amp; Happiness Rating"), (3, "", "Diversified Companies"), (100, "%", "Hybrid Flexibility")])}
{features([
        ("research.png", "Innovation First", "We encourage bold ideas and calculated risks. Everyone from interns to senior architects has a voice in shaping our solutions."),
        ("envelope.png", "Transparent Leadership", "Open communication, honest feedback loops, and leadership that actively supports your personal career milestones."),
        ("design.png", "Continuous Upskilling", "Dedicated learning stipends, internal hackathons, and direct mentorship from industry veterans across IT, consulting, and produce."),
        ("brand.png", "Work-Life Harmony", "Flexible schedules, mental wellness days, and a supportive environment ensuring you excel at work and recharge outside."),
        ("web.png", "Hybrid &amp; Remote Freedom", "Work from our modern offices or remotely with flexible work hours."),
        ("strategy.png", "Health &amp; Family Insurance", "Comprehensive health coverage for you and your immediate family members."),
        ("sales.png", "Performance Bonuses", "Quarterly rewards, milestone bonuses, and stock options for high impact."),
        ("photo.png", "Learning Allowances", "Sponsorship for cloud certifications, tech courses, and leadership books."),
        ("search.png", "Generous Paid Time Off", "Paid vacation leaves, festive holidays, birthday leave, and parental leave."),
    ], "What Drives Our People", "Our core ethos, perks and benefits &mdash; designed for your growth.", "feature_area section-padding", inner_bg=False)}
	<!-- START PORTFOLIO -->
	<section class="portfolio_area section-padding">
		<div class="container-fluid">
			{stitle("Experience Our Environment", "Inside Arshith Group")}
			<div class="portfolio-grid"><div class="row">{gallery}
			</div></div>
		</div>
	</section>
	<!-- END PORTFOLIO -->
	<!-- MARKETING LIST -->
	<div class="marketing_list_area section-padding">
		<div class="container">
			{stitle("A Day in the Life", "Workplace flow at Arshith Group.")}
			<div class="row"><div class="col-lg-10 offset-lg-1"><div class="row">{day}
			</div></div></div>
		</div>
	</div>
	<!-- END MARKETING LIST -->
{hire_us("Ready to Shape the Future With Us?", "Whether you are an experienced software engineer, business consultant, or eager intern, we have a place for your ambition.", "Explore Open Positions", "internship.html", btn2=("Contact HR Team", "contact.html"))}
"""
    return page("Life at Arshith Group | Culture, Innovation &amp; Work Environment", "Life at Arshith Group.", "Careers", body)


# ======================================================================= NEWS (blog order)
NEWS = [
    ("logos/mallareddy.jpeg", "A Defining Moment for Future Growth and Direction"),
    ("logos/diest%20collage.jpeg", "Marking a New Phase of Progress and Commitment."),
    ("logos/news3.jpeg", "A Moment of Pride and Great Success: Honoring the synergy of institutional collaboration and the spirit of shared achievement"),
    ("logos/students.jpeg", "Empowering minds today for a brighter leadership tomorrow"),
    ("logos/news4.jpeg", "A Step Forward in Strengthening Women Leadership"),
    ("logos/news5.jpeg", "&ldquo;Strengthening Foundations for Future Success&rdquo; &ldquo;Building Momentum Towards a Stronger Tomorrow&rdquo;"),
]
HIGHLIGHTS = [
    "Logistics &amp; Supply Chain Operations", "Field Inspection &amp; Quality Assurance", "Software Engineering Workspaces",
    "Solar Cold Storage Facilities", "Local Grower Network Collaboration", "Corporate Leadership &amp; Operations",
    "Agricultural Technology Deployment", "Multi-Sector Service Execution", "Sustainable Storage &amp; Logistics",
    "Community &amp; Grower Engagement", "Tech Development &amp; Infrastructure", "Field Distribution &amp; Supply Chains",
    "Regional Hub Operations", "E-Commerce Warehouse Logistics", "Quality Standards &amp; Certification",
    "Next-Gen Technology Initiatives", "Strategic Growth &amp; Partnerships", "Operations &amp; Facilities Management",
    "Corporate Events &amp; Milestone Sessions", "Sustainable Innovations &amp; Logistics",
]


def news():
    cards = ""
    for i, (img, h) in enumerate(NEWS):
        cards += f"""
				<div class="col-lg-4 col-sm-6 col-xs-12 {wow(0.1)}">
					<div class="home_single_blog">
						<a href="{img}" class="ag-popup"><img src="{img}" class="img-fluid" alt="News Image {i + 1}" /></a>
						<div class="home_blog_content">
							<div class="blog_title_info">
								<h2><a href="{img}" class="ag-popup">{h}</a></h2>
								<span>Arshith Group</span>
								<span><a href="LatestNews.html">News</a></span>
							</div>
						</div>
					</div>
				</div><!-- END COL -->"""
    gal = ""
    for i, h in enumerate(HIGHLIGHTS):
        img = f"marque/{i + 1:02d}.jpeg"
        gal += f"""
					<div class="col-lg-3 col-sm-6 col-xs-12 portfolio-item mix">
						<div class="single-gallery">
							<img src="{img}" class="img-fluid" alt="Operational Highlight {i + 1}">
							<a href="{img}" class="gallery_enlarge_icon" title="{h}"><i class="ti-eye"></i></a>
							<h4><a href="{img}" class="ag-popup" title="{h}">{h}</a></h4>
						</div>
					</div><!-- End Col -->"""
    careers = ""
    for i, (icon, href, h, p) in enumerate([
        ("sales.png", "internship.html", "Job Opportunities", "Careers"),
        ("brand.png", "aboutceo.html", "Our Values", "Ethos"),
        ("photo.png", "lifeatarshith.html", "Life at Arshith", "Culture"),
        ("research.png", "internship.html", "Internships", "Training"),
    ]):
        careers += f"""
				<div class="col-lg-3 col-sm-6 col-xs-12 {wow(0.1 + i * 0.1)}">
					<div class="single_service">
						<img src="assets/img/icon/{icon}" alt="icon" />
						<h4>{h}</h4>
						<p>{p}</p>
						<a class="btn_one" href="{href}">Know More</a>
					</div>
				</div><!-- END COL -->"""
    body = f"""
{section_top("Latest news &amp; updates")}
	<!-- BLOG -->
	<section class="blog_area section-padding">
		<div class="container">
			<div class="row text-center">{cards}
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END BLOG -->
	<!-- START PORTFOLIO -->
	<section id="portfolio" class="portfolio_area section-padding">
		<div class="container-fluid">
			{stitle("Operational Highlights", "Across logistics, technology, leadership and community.")}
			<div class="portfolio-grid">
				<div class="row">{gal}
				</div>
			</div>
		</div>
	</section>
	<!-- END PORTFOLIO -->
	<!-- SETVICE -->
	<section class="service_area section-padding">
		<div class="container">
			{stitle("Join Us", "Opportunities &amp; Culture")}
			<div class="row text-center">{careers}
			</div>
		</div>
	</section>
	<!-- END SETVICE -->
{contact_form()}
{partners()}
"""
    return page("Latest News | Arshith Group", "Latest news and updates from Arshith Group.", "News", body)


# ======================================================================= INTERNSHIP
ROLES = [
    ("frontend", "hybrid", "web.png", "Web Development Intern", "Bengaluru / Hybrid", "Develop, enhance and maintain responsive websites and web applications while following professional development practices."),
    ("backend", "remote", "strategy.png", "Backend Development Intern", "Remote / Hybrid", "Develop server-side applications, APIs, databases, and backend services for web applications."),
    ("uiux", "hybrid", "design.png", "UI/UX Design Intern", "Remote / Hybrid", "Design interactive user flows, Figma prototypes, design system components, and usability wireframes for web and mobile platforms."),
    ("fullstack", "remote", "brand.png", "Full-Stack Development Intern", "Remote / Hybrid", "Work across frontend, backend and database layers to develop complete web applications."),
    ("qa", "hybrid", "search.png", "Software Testing / QA Intern", "Remote / Hybrid", "Learn software testing, debugging, quality assurance and validation practices for web applications."),
    ("cloud", "hybrid", "research.png", "Cloud &amp; Deployment Intern", "Remote / Hybrid", "Gain practical exposure to application deployment, hosting, version control and basic cloud technologies."),
]


def marketing_list(title, text, items):
    cols = ""
    for i, (icon, h, p) in enumerate(items):
        cols += f"""
						<div class="col-lg-6 col-sm-12 col-xs-12 {wow(0.1 + (i % 4) * 0.1)}">
							<div class="single_marketing">
								<div class="marketing_icon_img"><img src="assets/img/icon/{icon}" alt="icon" /></div>
								<h3>{h}</h3>
								<p>{p}</p>
							</div>
						</div><!-- END COL  -->"""
    return f"""
	<!-- MARKETING LIST -->
	<div class="marketing_list_area section-padding">
		<div class="container">
			{stitle(title, text)}
			<div class="row">
				<div class="col-lg-10 offset-lg-1 col-sm-12 col-xs-12">
					<div class="row">{cols}
					</div>
				</div>
			</div><!-- END ROW -->
		</div><!--- END CONTAINER -->
	</div>
	<!-- END MARKETING LIST -->
"""


def internship(role_js):
    roles = ""
    for key, wt, icon, title, loc, desc in ROLES:
        roles += f"""
				<div class="col-lg-4 col-sm-6 col-xs-12 role-card-portal" data-category="{key}" data-worktype="{wt}">
					<div class="single_service">
						<img src="assets/img/icon/{icon}" alt="icon" />
						<h4>{title}</h4>
						<p class="ag-meta">Internship &middot; Arshith Group &middot; {loc}</p>
						<p>{desc}</p>
						<a class="btn_one" href="apply-internship.html?domain={key}">Apply</a>
						<button type="button" class="btn_one" data-role="{key}">Details</button>
					</div>
				</div><!-- END COL -->"""
    faq_tabs = [
        ("general", "General &amp; Eligibility", [
            ("Who is eligible to apply?", "Pre-final year students, final year undergraduates, postgraduates, and recent graduates in Engineering, MCA, BCA, Design, and Business streams are eligible to apply."),
            ("Is the internship Remote or On-site?", "We offer Remote, Hybrid, and On-site options depending on your location and domain track. Daily standups are conducted via Microsoft Teams and Discord.")]),
        ("certification", "Certification &amp; Career Benefits", [
            ("Do I get a certificate and LOR?", "Yes! Every intern receives an official, digitally verifiable Certificate of Completion. Exceptional performers receive a personalized Executive LOR and PPO interview fast-tracking.")]),
        ("selection", "Selection Process &amp; Timeline", [
            ("What is the selection process timeline?", "After submitting your application form, our talent acquisition team evaluates profiles within 24-48 hours, followed by a short technical assessment task and interview.")]),
    ]
    tabs = ""
    panes = ""
    for ti, (tid, tname, qs) in enumerate(faq_tabs):
        act = " active" if ti == 0 else ""
        tabs += f'<li class="nav-item"><a class="nav-link{act}" id="{tid}-tab" data-bs-toggle="tab" href="#{tid}" role="tab" aria-selected="{"true" if ti == 0 else "false"}">{tname}</a></li>'
        cards = ""
        for qi, (q, a) in enumerate(qs):
            first = qi == 0
            cid = f"c{tid}{qi}"
            cards += f"""
								<div class="card{' active' if first else ''}">
									<div class="card-header" id="h{cid}">
										<h5 class="mb-0"><button class="btn btn-link{'' if first else ' collapsed'}" data-bs-toggle="collapse" data-bs-target="#{cid}" aria-expanded="{'true' if first else 'false'}" aria-controls="{cid}">{q}</button></h5>
									</div>
									<div id="{cid}" class="collapse{' show' if first else ''}" aria-labelledby="h{cid}" data-bs-parent="#acc_{tid}">
										<div class="card-body">{a}</div>
									</div>
								</div>"""
        panes += f"""
							<div class="tab-pane fade{' show active' if ti == 0 else ''}" id="{tid}" role="tabpanel">
								<div class="faq_tab" id="acc_{tid}">{cards}
								</div>
							</div>"""
    stages = [("research.png" if i % 2 == 0 else "strategy.png", f"Stage 0{i + 1} &middot; {h}", p) for i, (h, p) in enumerate([
        ("Apply &amp; Assess", "Submit your application &amp; take our domain assessment test."),
        ("Onboarding", "Executive orientation, tool setup &amp; mentor assignment."),
        ("Project Allocation", "Get assigned to a live project team &amp; repository access."),
        ("Agile Sprints", "Daily standups, code reviews, and weekly milestone demos."),
        ("Capstone Demo", "Present your final project to senior group leadership."),
        ("Cert &amp; Hiring", "Receive Verifiable Certificate, LOR, &amp; PPO evaluation."),
    ])]
    skills = ""
    for i, (h, sub, items) in enumerate([
        ("Frontend &amp; UI Architecture", "Client-side Engineering", ["React.js &amp; Redux Toolkit", "Modern ES6+ JavaScript &amp; TypeScript", "Figma Design Systems &amp; Tokens", "Performance Optimization &amp; Web Vitals"]),
        ("Backend &amp; Data Systems", "Server-side Infrastructure", ["Node.js, Express &amp; Microservices", "RESTful APIs, GraphQL &amp; MongoDB", "OAuth2.0, JWT &amp; OWASP Security"]),
        ("Cloud &amp; DevOps Engineering", "Deployment &amp; Automation", ["AWS Infrastructure (EC2, S3, CloudFront)", "Git Workflows &amp; CI/CD Pipelines", "Docker Containerization Basics"]),
        ("Agile &amp; Executive Leadership", "Professional Competencies", ["Agile/Scrum &amp; Sprint Governance", "Automated Testing &amp; Peer Code Reviews", "Executive Docs &amp; Tech Leadership"]),
    ]):
        li = "".join(f"<li>{x}</li>" for x in items)
        skills += f"""
				<div class="col-lg-3 col-sm-6 col-xs-12 {wow(0.1 + i * 0.1)}">
					<div class="pricingTable blue">
						<div class="pricingTable-header"><div class="price-value"><span class="ag-price-sub">{sub}</span></div></div>
						<div class="pricing-content">
							<h3 class="title">{h}</h3>
							<ul>{li}</ul>
						</div>
					</div>
				</div><!--- END COL -->"""
    modal = """
	<div class="modal fade" id="roleModal" tabindex="-1" role="dialog" aria-labelledby="modalRoleTitle" aria-hidden="true">
		<div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
			<div class="modal-content ag-modal">
				<div class="modal-header">
					<div>
						<small id="modalRoleBadge">INTERNSHIP PROGRAM</small>
						<h3 class="modal-title" id="modalRoleTitle">Role Title</h3>
						<div id="modalRoleMeta" class="ag-modal-meta"></div>
					</div>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<h5>About the Internship</h5><p id="modalAboutText"></p>
					<h5>What You'll Do</h5><ul id="modalWhatYouWillDoList"></ul>
					<h5>Technologies You'll Work With</h5><div id="modalTechStackContainer"></div>
					<h5>What You'll Learn</h5><ul id="modalWhatYouWillLearnList"></ul>
					<h5>Project Experience</h5><p id="modalProjectExpText"></p>
					<h5>Eligibility</h5><p id="modalEligibilityText"></p>
					<h5>Stipend &amp; Fee Policy</h5>
					<p><strong>Online (Remote) Internship: 100% Free ($0 / &#8377;0 Fee)</strong><br />If candidate chooses the <strong>Online / Remote mode</strong>, there is <strong>NO NEED TO PAY ANY AMOUNT</strong>. The online program is completely free of charge ($0 / &#8377;0 fee).</p>
					<p><strong>Offline (In-Office / On-Site) Internship: Nominal Facility Fee</strong><br />If candidate chooses the <strong>Offline / On-Site mode</strong>, a nominal facility and hardware infrastructure training fee applies for in-office dedicated workstation setup, physical laboratory access, dedicated in-person mentorship &amp; enterprise networking.</p>
					<h5>Selection Process</h5><ol id="modalSelectionProcessList"></ol>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn_one" data-bs-dismiss="modal">Close</button>
					<a id="modalApplyBtn" class="btn_one" href="apply-internship.html">Apply Now For This Role</a>
				</div>
			</div>
		</div>
	</div>
"""
    body = f"""
{section_top("Internship Corner")}
	<!-- START CASE STUDY TOP CONTENT -->
	<section class="case_content_top_area section-padding">
		<div class="container">
			<div class="row">
				<div class="col-lg-6 col-sm-12 col-xs-12">
					<div class="case_content_top">
						<h2>Welcome to Arshith Group &#123; Internship Corner &#125;</h2>
						<p><strong>Certified Internship &amp; Training Program.</strong> Launch your career in web development across frontend, backend, and full-stack roles through hands-on enterprise projects, practical learning, and expert executive mentorship.</p>
						<p>A vibrant workspace where innovation, mentorship, and team collaboration come together every day. Experience a hands-on learning environment with real-world impact.</p>
						<a class="btn_one" href="apply-internship.html">Apply for Internship</a> <a class="btn_one" href="#domains">Browse open positions</a>
					</div>
				</div><!--- END COL -->
				<div class="col-lg-6 col-sm-12 col-xs-12">
					<div class="case_content_top_img"><img src="{P["classroom"]}" class="img-fluid" alt="Arshith Group internship session" /></div>
				</div><!--- END COL -->
			</div><!--- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END CASE STUDY TOP CONTENT -->
{counter([(50, "+", "Interns Mentored"), (98, "%", "Career Advancement"), (100, "%", "Real Production Projects"), ("PPO", "", "Fast-Track Pathways")])}
{features([
        ("brand.png", "Multi-Domain Ecosystem", "From E-Commerce (Arshith Fresh) to enterprise IT Services (ArshithInfoTech) and Strategic Business Consulting (Suntech), our multi-industry presence drives cross-sector strength and market resilience."),
        ("web.png", "Real Production Standards", "We don't deal in hypothetical code. We build, deploy, and manage live enterprise software, robust cloud setups, and scalable web solutions that serve real consumers daily."),
        ("research.png", "Future-Ready Tech Stack", "Leveraging modern web stacks, cloud microservices, AI integrations, and responsive UI frameworks to deliver agile digital transformation and competitive advantage."),
        ("strategy.png", "Dedicated Growth &amp; Mentorship", "Structured 1-on-1 executive mentorship and practical guidance empower our team members and interns with direct career pathways, PPO opportunities, and rapid skill acceleration."),
        ("design.png", "Ethics &amp; Client Commitment", "Founded on integrity, transparency, and reliable execution. We build lasting relationships with our clients and employees by consistently delivering on our promises."),
        ("photo.png", "Agile &amp; Collaborative Culture", "We foster an inclusive, supportive hybrid workspace where every team member's voice is valued and work-life balance goes hand in hand with high-velocity execution."),
    ], "Why Choose Arshith Group?", "We combine multi-industry innovation, real production engineering, and an empowering culture to build sustainable digital solutions and accelerate career success.", "feature_area section-padding", inner_bg=False, sid="why-us")}
	<!-- SETVICE -->
	<section id="domains" class="service_area section-padding">
		<div class="container">
			{stitle("Explore Internship Roles &amp; Domains", "Search and filter open positions across group companies by technology stack, category, and work model.")}
			<div class="contact ag-filters">
				<div class="row">
					<div class="form-group col-lg-4 col-md-12"><input type="text" id="roleSearchInput" class="form-control" placeholder="Search roles, technologies, or keywords (e.g. React, Node, UI/UX, Web Dev)..."></div>
					<div class="form-group col-lg-2 col-md-4"><select id="filterDomain" class="form-control"><option value="all">All Categories</option><option value="frontend">Web Development Intern</option><option value="backend">Backend Development Intern</option><option value="uiux">UI/UX Design Intern</option><option value="fullstack">Full-Stack Development Intern</option><option value="qa">Software Testing / QA Intern</option><option value="cloud">Cloud &amp; Deployment Intern</option></select></div>
					<div class="form-group col-lg-2 col-md-4"><select id="filterWorkType" class="form-control"><option value="all">All Locations / Work Types</option><option value="remote">Remote</option><option value="hybrid">Remote / Hybrid</option><option value="onsite">On-Site Bengaluru</option></select></div>
					<div class="form-group col-lg-2 col-md-4"><select id="filterBatch" class="form-control"><option value="all">Education / Batch</option><option value="2027">2027 Freshers</option><option value="2026">2026 Graduates</option><option value="2025">2025 Graduates</option></select></div>
					<div class="form-group col-lg-2 col-md-12"><button type="button" id="clearFilters" class="btn_one">&#10005; Clear Filters</button></div>
				</div>
			</div>
			<div class="row text-center" id="portalRoleGrid">{roles}
			</div>
			<p class="text-center ag-no-results" id="noRoleResults">No roles match your search.</p>
		</div>
	</section>
	<!-- END SETVICE -->
{marketing_list("Benefits of Working With Us", "We provide an environment where you are supported, challenged, and empowered to build real enterprise products.", [
        ("marketing-1.png", "Company Culture", "We believe you thrive when you are supported. Be it work, life, or technical learning &mdash; we've got your back every step of the way."),
        ("envelope.png", "Your Voice Matters", "We know that good ideas come from all levels of our organization and we value that input from our interns from day one."),
        ("web.png", "Remote-First &amp; Hybrid", "We offer flexible remote and hybrid setups, allowing you to learn and build enterprise software without the stress of a commute."),
        ("search.png", "Flexible Schedule", "We recognize you have college commitments and exams &mdash; shift your hours or modify your schedule seamlessly to get work done."),
        ("sales.png", "Professional Growth", "We promote from within. Our structured 1-on-1 mentorship is focused on helping you achieve your career goals and PPO pathways."),
        ("strategy.png", "Teamwork &amp; Mentorship", "When you succeed, we succeed. Our senior engineering leads and consultants are always ready to jump in and pair with you."),
        ("research.png", "Efficiency &amp; Innovation", "Core value: we look for team members who value cultural addition, diversity of thought, and building optimized, clean software solutions."),
        ("design.png", "Simplicity &amp; Impact", "Core value: we strive to create a better world through our work &mdash; delivering simple, elegant tools that solve real business and technical challenges."),
        ("brand.png", "Superior Mentorship &amp; Trust", "Core value: our interns, clients, and executive partners trust us implicitly because there are no secrets or surprises &mdash; only complete transparency and shared success."),
        ("photo.png", "What We Look For", "Growth Mindset, Problem Solver, Team Player and Core Fundamentals. We don't expect you to know everything on Day 1. We value curiosity, drive, and a strong problem-solving mindset."),
    ])}
{features(stages, "Your Internship Journey", "A clear, structured 6-stage roadmap designed to take you from applicant to confident industry professional.", "feature_area section-padding", inner_bg=False, sid="roadmap")}
	<!-- START PRICING TABLE -->
	<div id="skills" class="pricing-table-area section-padding" style="background-image: url(assets/img/bg/pricing-bg.jpg);  background-size:cover;background-position:center;">
		<div class="container">
			{stitle("Master the Technologies", "Acquire high-demand technical capabilities, production frameworks, and agile methodologies valued by global tech leaders.", white=True)}
			<div class="row">{skills}
			</div>
		</div><!--- END CONTAINER -->
	</div>
	<!-- END PRICING TABLE -->
{features([
        ("research.png", "Verifiable Certificate", "Official Certificate of Completion with verifiable serial code for your LinkedIn and CV."),
        ("envelope.png", "Executive LOR", "Personalized Letter of Recommendation signed by senior group directors for top performers."),
        ("sales.png", "PPO Opportunities", "Fast-track evaluation for full-time job offers (Pre-Placement Offers) across Arshith companies."),
        ("web.png", "Flexible Hybrid Model", "Remote and hybrid working schedules tailored to balance your academic commitments."),
        ("strategy.png", "Industry Networking", "Direct exposure to senior leaders, engineering leads, and alumni networks."),
        ("design.png", "Portfolio Work", "Live project contributions that you can showcase on GitHub and in your design portfolio."),
    ], "Internship Benefits &amp; Perks", "Everything you receive when completing an internship program at Arshith Group.", "feature_area section-padding", inner_bg=False)}
	<!-- START FAQ -->
	<section id="faq" class="faq1-area section-padding">
		<div class="container">
			{stitle("Frequently Asked Questions", "Clear answers regarding eligibility, mentorship structure, stipends, and certificate verification.")}
			<div class="row">
				<div class="col-lg-10 offset-lg-1 col-12 {wow(0.3)}">
					<ul class="faq-tab-menus nav nav-tabs" role="tablist">{tabs}</ul>
					<div class="faq-tab-content tab-content">{panes}
					</div>
				</div>
			</div>
		</div>
	</section>
	<!-- END FAQ -->
{testimonials(TESTIMONIALS, "Meet Our Alumni Interns", "Hear directly from past interns who built live features, gained industry confidence, and advanced their careers.", col=4)}
{hire_us("Ready to join our team?", "Launch your career with hands-on enterprise projects, practical learning, and expert executive mentorship.", "Apply for Internship", "apply-internship.html", btn2=("Online Assessment", ASSESSMENT_URL))}
{modal}"""
    js = f"<script>\n\tconst ROLE_DETAILS_DATA = {role_js}\n</script>\n\t<script src=\"assets/js/internship.js\"></script>"
    return page("Internship Program | Arshith Group Careers", "Arshith Group certified internship and training program.", "Careers", body, js)


# ======================================================================= APPLY (contact layout)
def apply(domain_js):
    tabs = "".join(
        f'<li class="filter ag-tab{" active" if k == "frontend" else ""}" data-domain="{k}">{l}</li>'
        for k, l in [("frontend", "Web &amp; Frontend"), ("fullstack", "Full-Stack &amp; Cloud"), ("uiux", "UI/UX Design"),
                     ("marketing", "Digital Marketing"), ("ecommerce", "E-Commerce Tech"), ("consulting", "Business Consulting"),
                     ("general", "General Program")])
    body = f"""
{section_top("Internship Application Portal")}
	<section class="about_page_area ag-apply-top">
		<div class="container">
			<div class="row text-center">
				<div class="offset-lg-1 col-lg-10 col-sm-12 col-xs-12">
					<div class="single_about_content">
						<h2 id="currentDomainTitle">Frontend Web Developer Internship</h2>
						<p id="currentDomainDesc">Build responsive UI components using HTML5, CSS3, JavaScript (ES6+), and React for live Arshith portals.</p>
						<p><strong id="currentDomainCompany">Arshith Group</strong> &middot; Select your specialized domain below. Submit your application details to join Arshith Group's enterprise internship program.</p>
						<div class="portfolio_filter"><ul>{tabs}</ul></div>
					</div>
				</div>
			</div>
		</div>
	</section>
	<!-- CONTACT -->
	<div id="contact" class="contact_area section-padding">
		<div class="container">
			<div class="row">
				<div class="offset-lg-1 col-lg-10 col-sm-12 col-xs-12">
					<div class="contact">
						<form id="domainAppForm">
							<input type="hidden" id="hiddenSelectedDomain" value="Web Development Intern" />
							<h4 class="ag-form-h">1. Personal &amp; Contact Details</h4>
							<div class="row">
								<div class="form-group col-md-6"><input type="text" id="fullName" class="form-control" placeholder="Full Name *" required /></div>
								<div class="form-group col-md-6"><input type="email" id="emailAddr" class="form-control" placeholder="Email Address *" required /></div>
								<div class="form-group col-md-6"><input type="tel" id="phoneNum" class="form-control" placeholder="Phone / WhatsApp Number *" required /></div>
								<div class="form-group col-md-6"><input type="text" id="collegeName" class="form-control" placeholder="College / University / Degree *  (e.g. B.E. Computer Science, VTU)" required /></div>
								<div class="form-group col-md-6"><label for="gradYear">Graduation Year *</label><select id="gradYear" class="form-control" required><option value="2026">2026 Batch</option><option value="2025">2025 Batch</option><option value="2027">2027 Batch</option><option value="Recent Graduate">Recent Graduate</option></select></div>
								<div class="form-group col-md-6"><label for="prefDuration">Preferred Internship Duration *</label><select id="prefDuration" class="form-control" required><option value="3 Months">3 Months</option><option value="6 Months">6 Months</option><option value="Flexible">Flexible</option></select></div>
							</div>
							<h4 class="ag-form-h" id="dynamicSectionHeading">2. Domain Specific Technical Background</h4>
							<div class="row">
								<div class="form-group col-md-12"><label for="dynInput1" id="dynLabel1">Primary Tech Stack / Skills in Web Development *</label><input type="text" id="dynInput1" class="form-control" placeholder="e.g. HTML5, CSS3, JavaScript, React.js" required /></div>
								<div class="form-group col-md-6"><label for="dynInput2" id="dynLabel2">GitHub Repository / Portfolio / Code Link</label><input type="url" id="dynInput2" class="form-control" placeholder="https://github.com/username/project" /></div>
								<div class="form-group col-md-6"><label for="dynInput3" id="dynLabel3">Key Web Project You've Built (Brief Overview)</label><input type="text" id="dynInput3" class="form-control" placeholder="Describe the web app or UI project you created..." /></div>
							</div>
							<h4 class="ag-form-h">3. Resume Link &amp; Motivation</h4>
							<div class="row">
								<div class="form-group col-md-12"><input type="url" id="resumeLink" class="form-control" placeholder="Resume / CV Link (Google Drive / Dropbox / LinkedIn) *" required /></div>
								<div class="form-group col-md-12"><textarea id="coverNote" class="form-control" rows="4" placeholder="Why do you want to intern at Arshith Group?"></textarea></div>
								<div class="col-md-12 text-center"><button type="submit" class="contact_btn">Submit Application For This Domain</button></div>
							</div>
						</form>
						<div id="successFeedback" class="ag-result">
							<h2 class="section-title-white">Application Submitted Successfully!</h2>
							<p class="ag-ref" id="appRefCode">REF-AG-2026-0000</p>
							<p>Thank you for applying for the <strong id="submittedDomainName">Frontend Web Developer Internship</strong> at Arshith Group. Our HR &amp; Domain Technical Leads will evaluate your details and schedule an assessment session shortly.</p>
							<button type="button" class="contact_btn" id="resetDomainForm">Submit Another Application</button>
							<p><a href="internship.html">Back to Internship Portal</a></p>
						</div>
						<div id="noOpeningBanner" class="ag-result">
							<h2 class="section-title-white" id="noOpeningTitle">No Current Openings Available For This Role</h2>
							<p>Applications for this specific role are currently paused or filled for the current cohort. Please check back soon or explore other active internship positions.</p>
							<a class="contact_btn" href="internship.html#domains">Browse Active Internship Roles</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- END CONTACT -->
{partners()}
"""
    js = f"<script>\n\tconst domainConfigs = {domain_js}\n</script>\n\t<script src=\"assets/js/apply.js\"></script>"
    return page("Internship Application Portal | Arshith Group Careers", "Apply for an Arshith Group internship.", "Careers", body, js)


# ======================================================================= CERTIFICATE (contact layout)
def certificate():
    body = f"""
{section_top("Certificate Verification")}
	<!-- CONTACT -->
	<div id="contact" class="contact_area section-padding">
		<div class="container">
			{stitle("Verify an internship certificate issued by our company.", "ARSHITH GROUP &middot; Internship &amp; Career Development", white=True)}
			<div class="row">
				<div class="offset-lg-2 col-lg-8 col-sm-12 col-xs-12 text-center">
					<div class="contact">
						<form id="verifyForm">
							<div class="row">
								<div class="form-group col-md-12">
									<input type="text" id="certificateNumber" class="form-control" placeholder="Enter Certificate Number (Example: AFI/INT/2026/001)" required>
								</div>
								<div class="col-md-12 text-center"><button type="submit" class="contact_btn">Verify Certificate</button></div>
							</div>
						</form>
					</div>
					<section id="result" class="result hidden ag-cert-result" aria-live="polite">
						<h3>Verification Result</h3>
						<div id="resultContent"></div>
					</section>
				</div>
			</div>
		</div>
	</div>
	<!-- END CONTACT -->
{hire_us("Looking for an internship?", "Hands-on industry projects, structured mentorship, and direct campus hiring.", "Back to Internship Page", "internship.html")}
"""
    return page("Certificate Verification | Arshith Group", "Verify an Arshith Group internship certificate.", "Careers",
                body, '\t<script src="certificate-verification.js"></script>')


# ======================================================================= CONTACT (template contact order)
def contact():
    body = f"""
{section_top("Let's Talk")}
	<!-- START ADDRESS -->
	<section class="address_area section-padding">
		<div class="container">
			<div class="row">
				<div class="col-lg-4 col-sm-4 col-xs-12 text-center">
					<div class="single_address">
						<h4>Our Headquarters</h4>
						<p class="mr_20">Bengaluru, Karnataka, <br /> India - 560076</p>
					</div>
				</div><!--- END COL -->
				<div class="col-lg-4 col-sm-4 col-xs-12 text-center">
					<div class="single_address">
						<h4>Get In Touch</h4>
						<p><a href="tel:+918618471424">+91 8618471424</a></p>
						<p><a href="mailto:info@arshithgroup.com">info@arshithgroup.com</a></p>
					</div>
				</div><!--- END COL -->
				<div class="col-lg-4 col-sm-4 col-xs-12 text-center">
					<div class="single_address">
						<h4>Office Hours</h4>
						<p class="mr_20">Mon - Sat: <br /> 9:00 AM - 6:00 PM</p>
					</div>
				</div><!--- END COL -->
			</div><!--- END ROW -->
		</div><!--- END CONTAINER -->
	</section>
	<!-- END ADDRESS -->
	<!-- START MAP -->
	<div class="map">
		<iframe title="Arshith Group, Bengaluru 560076" src="https://maps.google.com/maps?q=Bengaluru%2C%20Karnataka%20560076&amp;z=13&amp;output=embed" loading="lazy" allowfullscreen></iframe>
	</div>
	<!-- END MAP -->
{contact_form("Get in touch.")}
{partners()}
"""
    return page("Contact Us | Arshith Group", "Contact Arshith Group, Bengaluru.", "Contact Us", body)
