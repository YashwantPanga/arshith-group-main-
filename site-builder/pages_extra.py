# Dedicated pages so every menu/footer link opens its own page: Leadership, Our Journey,
# Awards & Achievements, Our Businesses, and a distinct About page.
from layout import *
from pages import P, JOURNEY, blog_cards


def leader_spotlight(anchor, img, name, role, email, quote, paras, link, reverse=False):
    body = "".join(f"<p>{p}</p>" for p in paras)
    order_img = " order-lg-2" if reverse else ""
    return f"""
	<!-- START LEADER SPOTLIGHT -->
	<section id="{anchor}" class="why_choose_area section-padding ag-spotlight{' ag-soft' if reverse else ''}">
		<div class="container">
			<div class="row align-items-center">
				<div class="col-lg-5 col-sm-12 col-xs-12{order_img} {wow(0.1)}">
					<div class="single_why_choose_img ag-ceo-photo"><img src="{img}" class="img-fluid" alt="{name} - {role}" /></div>
				</div>
				<div class="col-lg-7 col-sm-12 col-xs-12 {wow(0.2)}">
					<div class="single_why_choose ag-spot-text">
						<span class="ag-eyebrow">{role}</span>
						<h2>{name}</h2>
						<blockquote class="ag-spot-quote">&ldquo;{quote}&rdquo;</blockquote>
						{body}
						<p class="ag-spot-mail"><a href="mailto:{email}">{email}</a></p>
						<a class="btn_one" href="{link}">Read Full Biography</a>
					</div>
				</div>
			</div>
		</div>
	</section>
	<!-- END LEADER SPOTLIGHT -->
"""


def leadership():
    body = f"""
{section_top("Leadership")}
	<section class="about_page_area">
		<div class="container">
			<div class="row text-center">
				<div class="offset-lg-1 col-lg-10 col-sm-12 col-xs-12 {wow(0.1)}">
					<div class="single_about_content">
						<h2>Leadership driven by purpose</h2>
						<p>Leadership at Arshith Group is driven by a commitment to innovation, excellence, and sustainable growth. Across Technology &amp; Software, E-Commerce, and Business Consulting &amp; Services, we focus on building businesses that are scalable, resilient, and future-ready.</p>
					</div>
				</div>
			</div>
		</div>
	</section>
{leader_spotlight("ceo", P["ceo_cutout"], "Farook N", "Chief Executive Officer", "ceo@arshithgroup.com",
                  "The best view comes after the hardest climb.",
                  ["Arshith Group is a growing ecosystem of businesses united by one vision &mdash; to build with purpose, innovate with confidence, and create lasting value. Our portfolio spans Technology &amp; Software, E-Commerce, and Business Consulting &amp; Services, bringing together diverse capabilities under one group.",
                   "We are driven by an entrepreneurial mindset and a commitment to excellence &mdash; constantly evolving with changing markets, emerging technologies, and the needs of the businesses we serve."],
                  "aboutceo.html#ceo-bio")}
{leader_spotlight("md", P["md_cutout"], "Pallavi N", "Managing Director", "md@arshithgroup.com",
                  "Our aim is not to create a successful company, but to create a company that makes a real difference.",
                  ["Our leadership philosophy is built on integrity, strategic thinking, continuous innovation, and disciplined execution &mdash; empowering people, strengthening businesses, and creating lasting value.",
                   "We don't just pursue growth. We build the foundation for what comes next."],
                  "aboutceo.html#md-bio", reverse=True)}
{features([
        ("brand.png", "Integrity", "Founded on transparency and reliable execution &mdash; we build lasting relationships by consistently delivering on our promises."),
        ("strategy.png", "Strategic Thinking", "Every business choice is made with long-term value in mind, across technology, commerce and consulting."),
        ("research.png", "Continuous Innovation", "We evolve with changing markets and emerging technologies, turning new ideas into real results."),
        ("sales.png", "Disciplined Execution", "Empowering people and strengthening businesses through focused, accountable delivery."),
        ("envelope.png", "People First", "Real growth comes from trust, continuous learning, and strong connections with our teams and partners."),
        ("web.png", "Learn. Build. Evolve.", "We started by learning, took the step into entrepreneurship, and keep growing across industries."),
    ], "Our Leadership Principles", "The principles that guide how we lead, decide and build.", "feature_area section-padding", inner_bg=False)}
{team(title="Our Executive Team")}
{hire_us("Want to work with our leaders?", "Join a team where visionary minds, innovators, and leaders shape the future of enterprise technology, consulting, and digital commerce.", "Explore Careers", "internship.html", btn2=("Contact Us", "contact.html"))}
"""
    return page("Leadership | Arshith Group", "Leadership at Arshith Group.", "About Us", body)


JOURNEY_IMG = ["marque/09.jpeg", "marque/19.jpeg", "marque/06.jpeg", "assets/img/arshith-fresh-products.webp", "marque/15.jpeg"]


def journey():
    items = ""
    for i, ((yr, h, p, _), img) in enumerate(zip(JOURNEY, JOURNEY_IMG)):
        side = "ag-left" if i % 2 == 0 else "ag-right"
        items += f"""
				<div class="ag-tl-row {side} {wow(0.1)}">
					<div class="ag-tl-dot"><span>{yr}</span></div>
					<div class="ag-tl-card">
						<div class="ag-tl-img"><img src="{img}" alt="{h}" loading="lazy" /></div>
						<div class="ag-tl-body">
							<span class="ag-eyebrow">{yr}</span>
							<h3>{h}</h3>
							<p>{p}</p>
						</div>
					</div>
				</div>"""
    body = f"""
{section_top("Our Journey")}
	<section class="about_page_area">
		<div class="container">
			<div class="row text-center">
				<div class="offset-lg-1 col-lg-10 col-sm-12 col-xs-12 {wow(0.1)}">
					<div class="single_about_content">
						<h2>Great outcomes are engineered <br /> through complex challenges.</h2>
						<p>From a vision to a diversified group, our journey has been driven by purpose, resilience, and a commitment to creating opportunities that make a difference.</p>
					</div>
				</div>
			</div>
		</div>
	</section>
	<!-- START TIMELINE -->
	<section class="section-padding ag-timeline-area">
		<div class="container">
			{stitle("Milestones That Shaped Us", "2019 to today &mdash; from one company to a diversified group.")}
			<div class="ag-tl">{items}
			</div>
		</div>
	</section>
	<!-- END TIMELINE -->
	<section class="ag-motto-band">
		<div class="container text-center">
			<span class="ag-eyebrow">One Journey. Multiple Businesses. One Shared Vision.</span>
			<h2>LEARN. BUILD. EVOLVE.</h2>
			<p>Arshith Group is not just where we are today. It is the foundation for where we're going tomorrow.</p>
		</div>
	</section>
{counter([(7, "+", "Years of Innovation"), (3, "", "Group Companies"), (100, "+", "Quality Products"), (30, "k+", "Happy Customers")])}
{hire_us("Be part of the next chapter", "Scaling Arshith Info-Tech globally with software, cloud, and digital transformations.", "Explore Careers", "internship.html", btn2=("Our Businesses", "businesses.html"))}
"""
    return page("Our Journey | Arshith Group", "The journey of Arshith Group from 2019 to today.", "About Us", body)


ACHIEVEMENTS = [
    ("logos/news3.jpeg", "A Moment of Pride and Great Success", "Honoring the synergy of institutional collaboration and the spirit of shared achievement."),
    ("logos/mallareddy.jpeg", "A Defining Moment for Future Growth", "A milestone session setting the direction for the road ahead."),
    ("logos/diest%20collage.jpeg", "Marking a New Phase of Progress", "Commitment to progress with our partner institutions."),
    ("logos/news4.jpeg", "Strengthening Women Leadership", "A step forward in strengthening women leadership."),
    ("logos/students.jpeg", "Empowering Minds", "Empowering minds today for a brighter leadership tomorrow."),
    ("logos/news5.jpeg", "Strengthening Foundations", "Building momentum towards a stronger tomorrow."),
    ("marque/02.jpeg", "Felicitation at a Partner Institution", "Recognising collaboration with academic partners."),
    ("marque/20.jpeg", "Pre-Placement Talks", "Connecting students with real career pathways."),
    ("marque/14.jpeg", "Expert Talk Sessions", "Sharing industry experience with the next generation."),
]


def achievements():
    cards = ""
    for i, (img, h, p) in enumerate(ACHIEVEMENTS):
        cards += f"""
				<div class="col-lg-4 col-sm-6 col-xs-12 {wow(0.1 + (i % 3) * 0.1)}">
					<div class="ag-award">
						<a href="{img}" class="ag-award-img ag-popup" title="{h}"><img src="{img}" alt="{h}" loading="lazy" /><span class="ag-award-badge"><i class="ti-medall"></i></span></a>
						<div class="ag-award-body"><h4>{h}</h4><p>{p}</p></div>
					</div>
				</div>"""
    body = f"""
{section_top("Awards &amp; Achievements")}
	<section class="about_page_area">
		<div class="container">
			<div class="row text-center">
				<div class="offset-lg-1 col-lg-10 col-sm-12 col-xs-12 {wow(0.1)}">
					<div class="single_about_content">
						<h2>Moments that make us proud</h2>
						<p>Recognitions, partnerships and milestone sessions with institutions and communities &mdash; each one a step in building businesses that matter.</p>
					</div>
				</div>
			</div>
		</div>
	</section>
{counter([(7, "+", "Years of Innovation"), (30, "k+", "Happy Customers"), (50, "+", "Interns Mentored"), (100, "+", "Career Openings")])}
	<section class="section-padding ag-awards">
		<div class="container">
			{stitle("Recognition &amp; Milestones", "Highlights from across Arshith Group.")}
			<div class="row">{cards}
			</div>
		</div>
	</section>
{hire_us("Create the next milestone with us", "Hands-on industry projects, structured mentorship, and direct campus hiring.", "Explore Careers", "internship.html", btn2=("Latest News", "LatestNews.html"))}
"""
    return page("Awards &amp; Achievements | Arshith Group", "Awards, recognitions and milestones of Arshith Group.", "About Us", body)


BUSINESS_BLOCKS = [
    ("infotech", "assets/img/bg/2.jpg", "IT Services &amp; IT Consulting", "Arshith InfoTech",
     "Building innovative solutions with modern code, turning ideas into a powerful digital mode, driven by quality, performance, and trust.",
     ["Software development &amp; IT solutions", "Cloud architectures &amp; digital transformation", "Technology projects for organizations"],
     "http://arshithinfotech.com/"),
    ("fresh", "assets/img/arshith-fresh-products.webp", "E-Commerce", "Arshith Fresh",
     "Rooted in nature, grown with care. A direct-to-consumer platform that connects farmers directly with consumers, delivering 100% natural, farm-sourced products.",
     ["Cold-pressed oils, A2 cow ghee &amp; pure honey", "Dry fruits, dals, pickles &amp; spices", "Multi-seller marketplace for partners"],
     "https://arshithfresh.com/"),
    ("suntech", "assets/img/bg/skill-bg.jpg", "Business Consulting &amp; Services", "Suntech Solutions",
     "Empowering businesses with smart digital solutions &mdash; backend operational support, strategic consulting, and business scaling built on trust.",
     ["Backend support &amp; operations management", "Strategic consulting &amp; business scaling", "Digital marketing services"],
     "https://suntechorganization.com/"),
]


def businesses():
    blocks = ""
    for i, (bid, img, tag, name, desc, points, url) in enumerate(BUSINESS_BLOCKS):
        rev = " order-lg-2" if i % 2 else ""
        li = "".join(f"<li>{p}</li>" for p in points)
        blocks += f"""
	<section id="{bid}" class="section-padding ag-biz{' ag-soft' if i % 2 else ''}">
		<div class="container">
			<div class="row align-items-center">
				<div class="col-lg-6 col-sm-12{rev} {wow(0.1)}">
					<div class="ag-biz-img"><img src="{img}" alt="{name}" loading="lazy" /></div>
				</div>
				<div class="col-lg-6 col-sm-12 {wow(0.2)}">
					<div class="ag-biz-text">
						<span class="ag-eyebrow">{tag}</span>
						<h2>{name}</h2>
						<p>{desc}</p>
						<ul class="ag-ticks">{li}</ul>
						<a class="btn_one" href="{url}"{EXT}>Visit Website</a>
					</div>
				</div>
			</div>
		</div>
	</section>"""
    body = f"""
{section_top("Our Businesses")}
	<section class="about_page_area">
		<div class="container">
			<div class="row text-center">
				<div class="offset-lg-1 col-lg-10 col-sm-12 col-xs-12 {wow(0.1)}">
					<div class="single_about_content">
						<h2>One Vision. Three Distinct Strengths.</h2>
						<p>Each business operates with its own expertise and identity, while benefiting from the strength of a shared vision &mdash; combining technology, commerce, strategy, and execution.</p>
					</div>
				</div>
			</div>
		</div>
	</section>
{blocks}
{features([
        ("sales.png", "Multi Sellers", "The Arshith Fresh seller platform for multi-seller inventory and marketplace operations."),
        ("marketing-1.png", "Digital Marketing", "Smart digital solutions that drive growth through innovation and precision."),
        ("research.png", "Internships &amp; Training", "Hands-on industry projects, structured mentorship, and direct campus hiring."),
    ], "More From the Group", "Services that extend our three core businesses.", "feature_area section-padding", inner_bg=False)}
{partners()}
"""
    return page("Our Businesses | Arshith Group", "Arshith InfoTech, Arshith Fresh and Suntech Solutions.", "Businesses", body)


def about_unique():
    quick = [
        ("assets/img/bg/1.jpg", "leadership.html", "Leadership", "People", "Meet the leaders who drive our vision and growth.", "Meet Our Leaders"),
        ("marque/06.jpeg", "journey.html", "Our Journey", "2019 &ndash; Today", "From Suntech Solutions to a diversified group.", "See the Timeline"),
        ("logos/news3.jpeg", "achievements.html", "Awards &amp; Achievements", "Recognition", "Moments of pride with partners and communities.", "View Achievements"),
        ("assets/img/team-collaboration.webp", "lifeatarshith.html", "Life at Arshith", "Culture", "Collaborative workspaces, hackathons and team retreats.", "See Life Here"),
    ]
    body = f"""
{section_top("About Arshith Group")}
	<!-- ABOUT PAGE -->
	<section id="story" class="about_page_area">
		<div class="container">
			<div class="row text-center">
				<div class="offset-lg-1 col-lg-10 col-sm-12 col-xs-12 {wow(0.1)}">
					<div class="single_about_content">
						<h2>Architecting Growth Across <br /> 3 Core Pillars</h2>
						<p><strong>Arshith Group</strong> is a high-growth corporate ecosystem built on innovation, digital transformation, and sustainable business solutions. Through our three key entities &mdash; <a href="businesses.html#infotech">Arshith InfoTech</a> (IT &amp; Software Solutions), <a href="businesses.html#fresh">Arshith Fresh</a> (Sustainable Agri &amp; E-Commerce) and <a href="businesses.html#suntech">SunTech Solutions</a> (Business Consulting &amp; Services) &mdash; we empower enterprises to scale, innovate, and succeed across global markets.</p>
						<p>Founded in <strong>2019</strong> with the inception of <strong>SunTech Solutions</strong>, all business divisions were consolidated under the unified identity of <strong>Arshith Group</strong> in <strong>2023</strong>. In <strong>2025</strong>, the group incorporated <strong>Arshith Fresh India Pvt Ltd</strong>, and today <strong>Arshith InfoTech</strong> engineers software solutions, cloud architectures, and digital transformations for enterprises worldwide.</p>
					</div>
				</div>
			</div>
		</div>
	</section>
	<!-- END ABOUT PAGE -->
	<!-- MISSION VISION VALUES -->
	<section class="section-padding ag-mvv">
		<div class="container">
			{stitle("What We Stand For", "The purpose behind every business we build.")}
			<div class="row">
				<div class="col-lg-4 col-sm-12 {wow(0.1)}"><div class="ag-mvv-card"><span class="ag-mvv-icon"><i class="ti-eye"></i></span><h4>Our Vision</h4><p>To build with purpose, innovate with confidence, and create lasting value &mdash; businesses that matter and value that endures.</p></div></div>
				<div class="col-lg-4 col-sm-12 {wow(0.2)}"><div class="ag-mvv-card ag-mvv-featured"><span class="ag-mvv-icon"><i class="ti-target"></i></span><h4>Our Mission</h4><p>By uniting technology, sustainability, and trust, we are building a future where innovation benefits everyone.</p></div></div>
				<div class="col-lg-4 col-sm-12 {wow(0.3)}"><div class="ag-mvv-card"><span class="ag-mvv-icon"><i class="ti-heart"></i></span><h4>Our Values</h4><p>People First &middot; Driven by Innovation &middot; Built on Trust &middot; Focused on Growth.</p></div></div>
			</div>
		</div>
	</section>
{counter([(7, "+", "Years of Experience"), (10, "+", "Services &amp; Solutions"), (100, "+", "Quality Products"), (30, "k+", "Happy Customers")])}
	<!-- EXPLORE MORE -->
	<section class="blog_area section-padding">
		<div class="container">
			{stitle("Explore Arshith Group", "Discover the people, milestones and culture behind our businesses.")}
			<div class="row text-center">{blog_cards(quick)}
			</div>
		</div>
	</section>
{partners()}
"""
    return page("About Arshith Group | Our Ecosystem &amp; Pillars", "About Arshith Group - story, vision, mission and values.", "About Us", body)
