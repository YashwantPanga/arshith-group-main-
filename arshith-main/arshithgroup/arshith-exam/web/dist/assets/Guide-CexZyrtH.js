import{A as e,K as t,W as n,Y as r,d as i}from"./ui-B2rmLTVJ.js";import{P as a}from"./index-DAorzRx6.js";var o=r(t(),1),s=`# Admin guide — Arshith Group Online Assessment\r
\r
This guide is for people using the system for the first time. You do not need to be technical. Follow the steps in order.\r
\r
## 1. What this system does\r
\r
You prepare an exam, give candidates a link, and watch it live. When it ends, the system marks everything automatically and gives you a ranked Excel sheet (highest marks first).\r
\r
- **Candidates** (students) never create accounts. They open the link, type their **name, email and mobile**, wait for the start time, and take the exam.\r
- **You (admin)** sign in with a Login ID and password, on the website or in the phone app.\r
\r
## 2. Words you will see\r
\r
- **Question bank** — all questions. Each question has a category, topic, difficulty and the correct answer.\r
- **Assessment** — the exam paper design: how many questions per section, marks, negative marks, duration, proctoring rules.\r
- **Paper set (A, B, C)** — three different question papers for the same assessment. No question is repeated between sets. Candidates are given A, B, C in turn so neighbours get different papers.\r
- **Exam** — an assessment with a **date, start time and end time**. Candidates can only start between those times.\r
- **Open entry** — lets anyone with the link register themselves (name, email, mobile). Turn it off if you want to add candidates yourself.\r
- **Proctoring** — automatic watching for cheating: leaving the exam tab, leaving full-screen, copy/paste, developer tools, a second screen. No camera is used.\r
- **Warnings** — each violation uses one warning. When the warnings run out, the exam is submitted automatically.\r
\r
## 3. Sign in and set your own ID and password\r
\r
**On the website:** open the admin address, for example \`https://exam.arshithgroup.com/admin\`, and sign in.\r
\r
**On the phone app:** install the APK. The first time it asks for a **Server address**.\r
\r
> **What is the server address?** The app is only a window. The exam data lives on the server (a computer that is always on). The address tells the app which server to talk to — it is the same address you type in a browser, for example \`https://exam.arshithgroup.com\`. You type it **once**; the app remembers it. Your IT person gives you this address. If your app was built with the address already inside, you will not see this box.\r
\r
**Change your Login ID and password:** open the menu → **Account**. Enter a new Login ID and/or password, then your **current password**, and press **Save changes**. Do this on your first day.\r
\r
**Forgot your password?** Press *Forgot password* on the sign-in page. If e-mail is not set up, ask the technical person to run: \`npm --prefix server run admin:reset -- <loginId> <newPassword>\`.\r
\r
## 4. The whole process in 6 steps\r
\r
1. **Questions** — make sure the question bank has what you need (it already contains about 1,460 MCQs and 27 coding problems).\r
2. **Assessment** — create it, then fill Sets A, B and C. *(The Arshith Group Online Assessment is already created: 20 aptitude + 20 reasoning + 20 coding MCQs, 45 minutes, 3 sets.)*\r
3. **Exam** — set the date and time, then press **Publish**.\r
4. **Share the link** — copy the student link from the exam page and send it, or put it on the website's Exam page.\r
5. **During the exam** — watch **Live proctoring**; pause, extend time or warn if needed.\r
6. **After** — download the ranked Excel (highest % first) and PDFs. Students never see marks; they only see a “Congratulations” screen after submitting.\r
\r
## 5. Questions (menu: Question bank)\r
\r
- **New MCQ** — type the question, four options, tick the correct one, choose category, topic, difficulty and marks. Save.\r
- **Import MCQs** — download the Excel template, fill it, upload it. Rows with mistakes are listed and skipped; the rest are added.\r
- **New coding problem** — for programs students must write (Python). You give a statement, starter code, a reference solution and test cases. Use **Fill expected from solution** and **Validate with solution** before saving.\r
- Use the search box and filters (category, topic, difficulty) to find questions. Use **Preview** (eye icon) to see a question as students see it.\r
- A question that is already used in an exam with attempts cannot be edited or deleted. Mark it **Draft** instead.\r
\r
## 6. Assessments and paper sets (menu: Assessments)\r
\r
1. Press **New assessment**. Give it a name, duration and pass percentage. Add sections (for example Quantitative Aptitude 20 questions, 4 marks each, 1 negative).\r
2. Open the assessment → tab **Paper sets**. Choose **Set A**, press **Auto-fill randomly**, then **Save**. Repeat for B and C.\r
   - Auto-fill spreads topics evenly and follows an easy / medium / hard mix, and avoids questions already used in other sets.\r
   - Use **Add from bank** to pick questions by hand, and **Preview paper** to read the whole set with answers.\r
3. Tab **Rules & proctoring** — choose what to watch and the **warning limit** (default 3).\r
4. Press **Publish assessment**. It can only be published when every section of at least one set is full.\r
\r
## 7. Scheduling an exam (menu: Exams)\r
\r
1. Press **Schedule exam**.\r
2. Choose the assessment. For the paper choose **Rotate complete sets across students** (recommended) or one fixed set.\r
3. Set **Start** and **End**. The **window** (start to end) must be at least as long as the **duration** (45 minutes). A candidate who starts late still gets the full duration, but never beyond the end time.\r
4. **Open entry via public link** — leave it on for candidates who register themselves.\r
5. Write instructions for candidates, then **Create exam**.\r
6. Open the exam and press **Publish exam**. Until you publish, candidates cannot see it.\r
\r
**Sharing:** on the exam page, copy the **Student entry link** and send it by WhatsApp / e-mail, or use it on the website.\r
\r
**Statuses:** *Draft* (not published) · *Upcoming* (published, waiting for start) · *Live* · *Paused* · *Ended* · *Cancelled*.\r
\r
## 8. During the exam (Exams page and Live proctoring)\r
\r
On the exam page:\r
- **Pause** stops everyone; their timers stop and they see a pause screen. **Resume** gives the paused time back.\r
- **Extend time** adds minutes for everyone, including people already writing.\r
- **Close now** ends the exam immediately and submits everyone.\r
- **Cancel** ends it and tells all candidates.\r
- If a candidate was cut off by violations, press **+1 attempt** next to their name so they can start again.\r
\r
Menu **Live proctoring** (refreshes every few seconds):\r
- See who is writing, who is online, violations and a risk score.\r
- **Warn** shows a message on the candidate's screen. **Terminate** ends their exam.\r
- **Incident review** lists everyone who broke rules, highest risk first, with a full timeline.\r
\r
## 9. After the exam (menus: Exams, Results & reports)\r
\r
- Students do not see their marks. After submitting they see a “Congratulations” screen and can never start the same exam again — only a new exam you schedule allows another attempt.\r
- **Ranked marks · Excel** — one row per candidate, highest marks first, with marks for every section. You can download it even while the exam is running.\r
- **Consolidated PDF** — the whole exam in one printable sheet. A single candidate's PDF is on their row.\r
- **Results & reports** — filter by exam, batch, pass/fail, date; sort by marks; **Merit list** tab shows ranks.\r
- **Analytics** — pass rate, section performance, top and lowest performers, difficult questions.\r
- **Audit & emails** — a record of everything admins did and every e-mail sent.\r
\r
## 10. Candidates (menu: Candidates)\r
\r
- Candidates who registered through the link appear here automatically (college and branch stay empty for them).\r
- **Add student** or **Import** (Excel/CSV) if you prefer to add them yourself; a password is e-mailed to them.\r
- Create **Batches** and assign candidates to them. You can assign a whole batch to an exam from the exam page (**Assign**).\r
- Switch a candidate off to block them.\r
\r
## 11. Using the phone app\r
\r
Everything above works in the app. Tips:\r
- Use **Wi-Fi or mobile data** — the app needs internet to reach the server.\r
- Downloads (Excel, PDF) open the phone's share sheet: save them, open them, or send them on WhatsApp.\r
- Android may warn that the app is from an "unknown developer" because it is not from the Play Store. Choose **Install anyway**.\r
\r
## 12. Exam-day checklist\r
\r
- [ ] The exam shows **Upcoming** or **Live** (not Draft) and the date / time is right.\r
- [ ] You tried the student link yourself on a phone and a laptop.\r
- [ ] The server computer is on, awake, plugged in and online.\r
- [ ] You know your Login ID and password.\r
- [ ] Candidates were told: use a laptop/desktop, Chrome or Edge, stay in full-screen, do not switch tabs.\r
- [ ] After the exam: download the Excel and take a database backup.\r
\r
## 13. Problems and answers\r
\r
- **"No exam is open for registration"** — the exam is still Draft, Open entry is off, or the end time has passed. Open the exam and check.\r
- **Candidate sees "not started yet"** — they are early. The exam page shows a countdown to the start time.\r
- **Candidate says "all attempts used"** — press **+1 attempt** on the exam page.\r
- **Candidate's exam ended suddenly** — they used all warnings (switched tabs, left full-screen). See Live proctoring → Incident review, then give **+1 attempt** if you agree.\r
- **The page does not load** — the server may be off. Check that the server computer is running.\r
- **App says it cannot reach the server** — check the address has no dot or space at the end, the phone has internet, and the server is on.\r
- **A question is wrong** — edit it in the Question bank (not possible once attempts exist; mark it Draft and tell the technical person).\r
\r
## 14. Quick start in simple Telugu\r
\r
1. **Sign in:** Admin address lo Login ID + password tho login avvandi. Menu lo **Account** lo mee ID, password maarchukondi.\r
2. **Question bank:** Questions anni already unnayi. Kotha vi kavalante *New MCQ* leda *Import MCQs*.\r
3. **Assessments:** Exam paper design idi. *Paper sets* lo A, B, C ki *Auto-fill randomly* nokki *Save* cheyyandi.\r
4. **Exams:** *Schedule exam* lo date, start, end, 45 min petti save cheyyandi. Tarvata exam open chesi **Publish exam** nokkandi.\r
5. **Link:** Exam page lo *Student entry link* copy chesi students ki pampandi. Students peru, email, mobile ichi start time ki exam start chestaru.\r
6. **Live:** *Live proctoring* lo evaru raasthunnaro, violations chudochu. Avasaram aite *Pause* / *Extend time*.\r
7. **Results:** Exam aipoyaka *Results* page lo *Ranked list · Excel* download cheyyandi (high % nundi low ki). Students ki marks kanipinchavu.\r
`,c=n();function l(e){return e.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g).filter(Boolean).map((e,t)=>e.startsWith(`**`)?(0,c.jsx)(`strong`,{className:`font-semibold text-ink`,children:e.slice(2,-2)},t):e.startsWith("`")?(0,c.jsx)(`code`,{className:`rounded bg-cream-300 px-1.5 py-0.5 font-mono text-[13px] text-brand-800`,children:e.slice(1,-1)},t):e.startsWith(`*`)?(0,c.jsx)(`em`,{children:e.slice(1,-1)},t):(0,c.jsx)(o.Fragment,{children:e},t))}var u=e=>e.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-|-$/g,``);function d(e){let t=[],n=``,r=[],i=()=>{r.length&&(t.push({t:`p`,text:r.join(` `)}),r=[])};for(let a of e.split(/\r?\n/)){let e=a.trimEnd();if(!e.trim()){i();continue}if(e.startsWith(`# `)){i(),n=e.slice(2);continue}if(e.startsWith(`## `)){i(),t.push({t:`h2`,text:e.slice(3),id:u(e.slice(3))});continue}if(e.startsWith(`### `)){i(),t.push({t:`h3`,text:e.slice(4),id:u(e.slice(4))});continue}if(e.startsWith(`> `)){i();let n=t[t.length-1];n?.t===`quote`?n.text+=` ${e.slice(2)}`:t.push({t:`quote`,text:e.slice(2)});continue}let o=/^(\s*)(?:(-\s\[[ x]\])|(-)|(\d+)\.)\s+(.*)$/.exec(e);if(o){i();let e=Math.floor(o[1].length/3),n={text:o[5],depth:e,kind:o[2]?`check`:o[4]?`num`:`bullet`,n:o[4]?Number(o[4]):void 0},r=t[t.length-1];r?.t===`list`?r.items.push(n):t.push({t:`list`,items:[n]})}else r.push(e.trim())}return i(),{title:n,blocks:t}}function f(){let{title:t,blocks:n}=(0,o.useMemo)(()=>d(s),[]),r=n.filter(e=>e.t===`h2`),u=e=>document.getElementById(e)?.scrollIntoView({behavior:`smooth`,block:`start`});return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(i,{title:`Help & guide`,subtitle:t.replace(`Admin guide — `,``)}),(0,c.jsxs)(`div`,{className:`grid gap-6 lg:grid-cols-[250px_1fr]`,children:[(0,c.jsx)(`nav`,{"aria-label":`Guide sections`,className:`lg:sticky lg:top-6 lg:self-start`,children:(0,c.jsxs)(`div`,{className:`rounded-2xl border border-cream-300 bg-white p-3 shadow-card`,children:[(0,c.jsxs)(`div`,{className:`label-caps flex items-center gap-2 px-2 pb-2 pt-1`,children:[(0,c.jsx)(a,{className:`h-3.5 w-3.5`}),`Contents`]}),(0,c.jsx)(`ul`,{className:`space-y-0.5`,children:r.map(e=>(0,c.jsx)(`li`,{children:(0,c.jsx)(`button`,{onClick:()=>u(e.id),className:`w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-soft hover:bg-brand-50 hover:text-brand-800`,children:e.text})},e.id))})]})}),(0,c.jsx)(`article`,{className:`min-w-0 rounded-2xl border border-cream-300 bg-white px-6 py-7 shadow-card sm:px-9`,children:n.map((t,n)=>t.t===`h2`?(0,c.jsx)(`h2`,{id:t.id,className:`mb-3 mt-9 scroll-mt-6 font-sans text-[22px] font-semibold normal-case tracking-normal text-brand-800 first:mt-0`,children:t.text},n):t.t===`h3`?(0,c.jsx)(`h3`,{id:t.id,className:`mb-2 mt-6 scroll-mt-6 font-sans text-[17px] font-semibold normal-case tracking-normal`,children:t.text},n):t.t===`quote`?(0,c.jsx)(`div`,{className:`my-4 rounded-xl border-l-4 border-gold-500 bg-gold-400/10 px-4 py-3 text-[15px] leading-relaxed text-ink-soft`,children:l(t.text)},n):t.t===`p`?(0,c.jsx)(`p`,{className:`my-3 text-[15px] leading-relaxed text-ink-soft`,children:l(t.text)},n):(0,c.jsx)(`ul`,{className:`my-3 space-y-1.5`,children:t.items.map((t,n)=>(0,c.jsxs)(`li`,{className:e(`flex gap-2.5 text-[15px] leading-relaxed text-ink-soft`,t.depth>0&&`ml-6`),children:[(0,c.jsx)(`span`,{className:e(`mt-[3px] shrink-0 text-brand-600`,t.kind===`num`&&`w-5 text-right font-semibold`),children:t.kind===`num`?`${t.n}.`:t.kind===`check`?`☐`:t.depth>0?`–`:`•`}),(0,c.jsx)(`span`,{className:`min-w-0`,children:l(t.text)})]},n))},n))})]})]})}export{f as default};