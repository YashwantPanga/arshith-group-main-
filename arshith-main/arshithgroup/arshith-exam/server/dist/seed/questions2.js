/**
 * Second question pack: 400+ MEDIUM / HARD questions. Most answers are computed in code (so they are correct by
 * construction); the rest are curated. Idempotent: existing question texts are skipped.
 */
import { randomUUID } from 'node:crypto';
import { prisma } from '../db.js';
let seed = 20261104;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
} return b; };
const sample = (a, n) => shuffle(a).slice(0, n);
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const out = [];
const seen = new Set();
/** Numeric value of an option such as "₹1,200", "45%", "30 seconds" (NaN when the option is not a plain number). */
const parseNum = (s) => {
    const t = s.replace(/[₹,%°]/g, '').replace(/\s*(seconds?|minutes?|hours?|days?|years?|litres?|km\/h|km|kg|m\/s|m|s)\s*$/i, '').trim();
    return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
};
/** Chooses 3 distractors so the correct number lands on a uniformly random rank (smallest … largest): no "it is always in the middle" tell. */
function balancedDistractors(correct, pool) {
    const c = parseNum(correct);
    if (!Number.isFinite(c) || pool.length <= 3 || !pool.every((x) => Number.isFinite(parseNum(x))))
        return shuffle(pool).slice(0, 3);
    const below = shuffle(pool.filter((x) => parseNum(x) < c));
    const above = shuffle(pool.filter((x) => parseNum(x) > c));
    const want = Math.floor(rnd() * 4); // desired rank of the correct answer
    let nb = Math.min(want, below.length);
    let na = 3 - nb;
    if (na > above.length) {
        na = above.length;
        nb = Math.min(below.length, 3 - na);
    }
    const w = [...below.slice(0, nb), ...above.slice(0, na)];
    return w.length === 3 ? w : shuffle(pool).slice(0, 3);
}
function add(cat, topic, sub, text, correct, wrong, explanation, diff) {
    const w = balancedDistractors(correct, [...new Set(wrong.filter((x) => x !== correct))]);
    if (w.length < 3 || seen.has(text))
        return false;
    seen.add(text);
    const opts = shuffle([correct, ...w]);
    out.push({ cat, topic, sub, text, options: opts, correct: opts.indexOf(correct), explanation, diff });
    return true;
}
const near = (c, dec = 0) => {
    const step = Math.max(dec ? 0.5 : 1, Math.round(Math.abs(c) * 0.1 * 10) / 10);
    return [...new Set([c + step, c - step, c + 2 * step, c - 2 * step, c + 3 * step, c - 3 * step, c * 2, Math.round(c / 2)].map((x) => (dec ? Math.round(x * 100) / 100 : Math.round(x))).filter((x) => x > 0 && x !== c))].slice(0, 8);
};
const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
const gen = (n, f) => { let t = 0, m = 0; while (m < n && t++ < n * 40)
    if (f() !== false)
        m++; };
const list = (a) => a.join(', ');
/** Plausible wrong orderings of a sequence. */
const variants = (a) => {
    const v = [];
    for (let k = 0; k < 8 && v.length < 6; k++) {
        const b = [...a];
        const i = ri(0, a.length - 1), j = ri(0, a.length - 1);
        [b[i], b[j]] = [b[j], b[i]];
        v.push(list(b));
    }
    v.push(list([...a].reverse()));
    return v;
};
/* ============================ QUANT (medium / hard) ============================ */
gen(12, () => { const p = pick([1000, 2000, 3000, 5000, 8000, 10000, 20000]); const c = Math.round(p * 1.331 - p); return add('QUANT', 'Compound Interest', '3 years', `Find the compound interest on ${inr(p)} for 3 years at 10% per annum compounded yearly.`, inr(c), near(c).map(inr), `A = ${p} × 1.1³ = ${p * 1.331}; CI = A − P = ${c}.`, 'MEDIUM'); });
gen(12, () => { const m = pick([2000, 2500, 4000, 5000, 8000]); const [d1, d2] = pick([[20, 10], [10, 10], [25, 20], [30, 10], [20, 20], [50, 10]]); const f = m * (1 - d1 / 100) * (1 - d2 / 100); return add('QUANT', 'Profit & Loss', 'Successive discounts', `A TV is marked at ${inr(m)} and sold after successive discounts of ${d1}% and ${d2}%. What is the selling price?`, inr(f), near(f).map(inr), `${m} × ${1 - d1 / 100} × ${1 - d2 / 100} = ${f}.`, 'MEDIUM'); });
gen(10, () => { const a = pick([20000, 30000, 40000, 50000]); const b = pick([30000, 45000, 60000, 80000]); const x = pick([6, 8, 12]); const y = pick([4, 6, 9]); const P = pick([9000, 12000, 18000, 24000]); const ra = a * x, rb = b * y; const sh = (P * ra) / (ra + rb); if (!Number.isInteger(sh))
    return false; return add('QUANT', 'Partnership', 'Time-weighted share', `A invests ${inr(a)} for ${x} months and B invests ${inr(b)} for ${y} months. If the total profit is ${inr(P)}, what is A's share?`, inr(sh), near(sh).map(inr), `Ratio = ${a}×${x} : ${b}×${y} = ${ra}:${rb}; A's share = ${P} × ${ra}/${ra + rb} = ${sh}.`, 'HARD'); });
gen(10, () => { const M = pick([20, 40, 50, 60, 80, 100]); const x = pick([4, 5, 8, 10]); const left = M * (1 - x / M) ** 2; if (!Number.isInteger(left) || x >= M)
    return false; return add('QUANT', 'Mixtures', 'Replacement', `A vessel holds ${M} litres of pure milk. ${x} litres are removed and replaced with water, and the process is repeated once more. How much milk remains?`, `${left} litres`, near(left).map((v) => `${v} litres`), `Milk = ${M} × (1 − ${x}/${M})² = ${left} litres.`, 'HARD'); });
gen(10, () => { const a = pick([12, 15, 20, 24, 30]); const b = pick([20, 30, 40, 60]); const d = pick([2, 3, 4, 5, 6]); const done = d * (1 / a + 1 / b); const rest = (1 - done) * b; const total = d + rest; if (done >= 1 || !Number.isInteger(Math.round(total * 1000) / 1000) || !Number.isInteger(total))
    return false; return add('QUANT', 'Time & Work', 'Worker leaves', `A can finish a job in ${a} days and B in ${b} days. They start together but A leaves after ${d} days. In how many days is the whole job completed?`, `${total} days`, near(total).map((v) => `${v} days`), `Work in ${d} days = ${d}(1/${a}+1/${b}); the remainder is done by B alone, total = ${total} days.`, 'HARD'); });
gen(12, () => { const L1 = pick([100, 120, 150, 180, 200]); const L2 = pick([100, 150, 160, 200, 250]); const s1 = pick([36, 54, 72]); const s2 = pick([36, 54, 72, 90]); const t = (L1 + L2) / (((s1 + s2) * 5) / 18); if (!Number.isInteger(t))
    return false; return add('QUANT', 'Time, Speed & Distance', 'Opposite trains', `Two trains of lengths ${L1} m and ${L2} m run in opposite directions at ${s1} km/h and ${s2} km/h. How many seconds do they take to cross each other completely?`, `${t} seconds`, near(t).map((v) => `${v} seconds`), `Relative speed = ${s1 + s2} km/h = ${((s1 + s2) * 5) / 18} m/s; time = ${L1 + L2}/${((s1 + s2) * 5) / 18} = ${t} s.`, 'MEDIUM'); });
gen(10, () => { const b = pick([8, 10, 12, 15, 18]); const s = pick([2, 3, 4, 5]); return add('QUANT', 'Time, Speed & Distance', 'Boats', `A boat goes ${b + s} km/h downstream and ${b - s} km/h upstream. What is the speed of the stream?`, `${s} km/h`, near(s).map((v) => `${v} km/h`), `Stream = (down − up)/2 = ((${b + s}) − (${b - s}))/2 = ${s} km/h.`, 'MEDIUM'); });
gen(10, () => { const n = pick([8, 10, 12, 15, 20]); const x = pick([2, 3, 4]); const w = pick([40, 45, 50, 55, 60]); const nw = w + n * x; return add('QUANT', 'Averages', 'Replacement', `The average weight of ${n} students increases by ${x} kg when one student weighing ${w} kg is replaced by a new student. What is the weight of the new student?`, `${nw} kg`, near(nw).map((v) => `${v} kg`), `New weight = ${w} + ${n} × ${x} = ${nw} kg.`, 'MEDIUM'); });
gen(14, () => { const a = ri(2, 19); const b = ri(15, 99); return add('QUANT', 'Number System', 'Unit digit', `What is the unit digit of ${a}^${b}?`, String(Number(BigInt(a) ** BigInt(b) % 10n)), [...new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(String))].filter((x) => x !== String(Number(BigInt(a) ** BigInt(b) % 10n))), `Unit digits of powers of ${a % 10} repeat in a cycle; ${b} mod cycle gives ${Number(BigInt(a) ** BigInt(b) % 10n)}.`, 'MEDIUM'); });
gen(10, () => { const N = pick([60, 80, 100, 120]); const a = ri(Math.floor(N * 0.4), Math.floor(N * 0.7)); const b = ri(Math.floor(N * 0.3), Math.floor(N * 0.6)); const both = ri(Math.max(1, a + b - N), Math.min(a, b) - 1); if (a + b - both > N)
    return false; const neither = N - (a + b - both); return add('QUANT', 'Set Theory', 'Venn', `In a group of ${N} students, ${a} play cricket, ${b} play football and ${both} play both. How many play neither game?`, String(neither), near(neither).map(String), `Either = ${a}+${b}−${both} = ${a + b - both}; neither = ${N} − ${a + b - both} = ${neither}.`, 'MEDIUM'); });
gen(12, () => { const a = ri(2, 12), d = ri(2, 9), n = ri(10, 40); return add('QUANT', 'Progressions', 'AP sum', `Find the sum of the first ${n} terms of the AP ${a}, ${a + d}, ${a + 2 * d}, ...`, String((n * (2 * a + (n - 1) * d)) / 2), near((n * (2 * a + (n - 1) * d)) / 2).map(String), `S = n/2 [2a + (n−1)d] = ${n}/2 × (${2 * a} + ${(n - 1) * d}) = ${(n * (2 * a + (n - 1) * d)) / 2}.`, 'MEDIUM'); });
gen(8, () => { const a = pick([1, 2, 3]); const r = pick([2, 3]); const n = ri(5, 8); const s = (a * (r ** n - 1)) / (r - 1); return add('QUANT', 'Progressions', 'GP sum', `Find the sum of the first ${n} terms of the GP ${a}, ${a * r}, ${a * r * r}, ...`, String(s), near(s).map(String), `S = a(rⁿ − 1)/(r − 1) = ${a}(${r}^${n} − 1)/${r - 1} = ${s}.`, 'MEDIUM'); });
gen(10, () => { const R = ri(3, 8), B = ri(3, 8); const num = R * (R - 1), den = (R + B) * (R + B - 1); const g = gcd(num, den); const f = (x, y) => `${x}/${y}`; const c = f(num / g, den / g); return add('QUANT', 'Probability', 'Without replacement', `A bag has ${R} red and ${B} blue balls. Two balls are drawn one after another without replacement. What is the probability that both are red?`, c, [f(R * R / gcd(R * R, (R + B) ** 2), (R + B) ** 2 / gcd(R * R, (R + B) ** 2)), f(R, R + B), f((R - 1), R + B), f(R * B / gcd(R * B, den), den / gcd(R * B, den))], `P = ${R}/${R + B} × ${R - 1}/${R + B - 1} = ${c}.`, 'HARD'); });
gen(10, () => { const w = pick(['LEVEL', 'APPLE', 'BANANA', 'MISSISSIPPI', 'COMMITTEE', 'ARRANGE', 'SUCCESS', 'PEPPER', 'LETTER', 'BALLOON']); const cnt = {}; for (const ch of w)
    cnt[ch] = (cnt[ch] ?? 0) + 1; const c = Object.values(cnt).reduce((a, v) => a / fact(v), fact(w.length)); return add('QUANT', 'Permutation & Combination', 'Repeated letters', `In how many distinct ways can the letters of the word "${w}" be arranged?`, String(c), near(c).map(String).concat([String(fact(w.length))]), `${w.length}! divided by the factorial of each repeated letter's count = ${c}.`, 'HARD'); });
gen(10, () => { const k = pick([2, 3, 4, 5]); const s = pick([8, 10, 12, 15]); const n = ri(3, 10); const f = k * s + 0; void f; const son = ri(8, 25); const fa = son * k; const t = ri(2, 8); const lhs = fa + t; const rhs = son + t; if (lhs % rhs !== 0 && k !== lhs / rhs) { /* ratio changes; ask a different form */ } return add('QUANT', 'Ages', 'Linear', `A father is ${k} times as old as his son. The sum of their ages is ${son + fa} years. What will the father's age be after ${t} years?`, `${fa + t} years`, near(fa + t).map((v) => `${v} years`), `Son = ${son + fa}/${k + 1} = ${son}; father = ${fa}; after ${t} years = ${fa + t}.`, 'MEDIUM'); });
gen(10, () => { const x = pick([10, 20, 25, 30, 40]); const y = pick([10, 20, 25, 50]); const net = x - y - (x * y) / 100; return add('QUANT', 'Percentages', 'Chain', `The price of an item is increased by ${x}% and then decreased by ${y}%. What is the net percentage change?`, `${net > 0 ? '+' : ''}${net}%`, [`${net > 0 ? '+' : ''}${net + 2}%`, `${x - y}%`, `${-net}%`, `${net - 3}%`].map((v) => v.replace('+-', '-')), `Net = ${x} − ${y} − ${x}×${y}/100 = ${net}%.`, 'MEDIUM'); });
gen(10, () => { const [a, b, c] = pick([[6, 8, 12], [12, 15, 20], [4, 6, 10], [8, 12, 18], [9, 12, 15]]); const r = pick([3, 5, 7]); const l = (a * b) / gcd(a, b); const L = (l * c) / gcd(l, c); return add('QUANT', 'Number System', 'LCM with remainder', `What is the smallest number that leaves a remainder of ${r} when divided by ${a}, ${b} and ${c}?`, String(L + r), near(L + r).map(String).concat([String(L)]), `LCM(${a}, ${b}, ${c}) = ${L}; the number is ${L} + ${r} = ${L + r}.`, 'HARD'); });
gen(8, () => { const a = pick([8, 10, 12, 15]); const b = pick([20, 24, 30, 40]); if (b <= a)
    return false; const t = (a * b) / (b - a); if (!Number.isInteger(t))
    return false; return add('QUANT', 'Time & Work', 'Leak', `A tank is filled by a pipe in ${a} hours, but a leak empties the full tank in ${b} hours. If both work together, how long to fill the empty tank?`, `${t} hours`, near(t).map((v) => `${v} hours`), `Net rate = 1/${a} − 1/${b}; time = ${a}×${b}/(${b}−${a}) = ${t} h.`, 'MEDIUM'); });
gen(10, () => { const cp = pick([400, 500, 800, 1000, 1250, 2000]); const p1 = pick([10, 20, 25]); const p2 = pick([5, 10, 15]); const sp = cp * (1 + p1 / 100); const sp2 = cp * (1 + p2 / 100); const diff = sp - sp2; return add('QUANT', 'Profit & Loss', 'Two selling prices', `An article costing ${inr(cp)} is sold at a profit of ${p1}%. Had it been sold at a profit of ${p2}% instead, how much less would the seller have received?`, inr(diff), near(diff).map(inr), `Difference = ${cp} × (${p1} − ${p2})/100 = ${diff}.`, 'MEDIUM'); });
gen(10, () => { const p = pick([4000, 5000, 8000, 10000]); const r = pick([4, 5, 8]); const t1 = ri(2, 4); const t2 = t1 + ri(2, 3); const d = (p * r * (t2 - t1)) / 100; return add('QUANT', 'Simple Interest', 'Extra years', `A sum of ${inr(p)} is lent at ${r}% simple interest. How much more interest is earned in ${t2} years than in ${t1} years?`, inr(d), near(d).map(inr), `Extra interest = ${p} × ${r} × ${t2 - t1}/100 = ${d}.`, 'MEDIUM'); });
gen(10, () => { const x = pick([3, 4, 5, 6, 7]); const y = pick([2, 3, 4]); const a = x * 7 + y * 5; return add('QUANT', 'Algebra', 'Simultaneous', `If 7x + 5y = ${a} and x = ${x}, what is the value of 3y + 2?`, String(3 * y + 2), near(3 * y + 2).map(String), `5y = ${a} − ${7 * x} = ${5 * y}, so y = ${y}; 3y + 2 = ${3 * y + 2}.`, 'MEDIUM'); });
gen(8, () => { const n = pick([6, 8, 9, 10, 12]); const k = pick([2, 3, 4]); const f = fact(n) / (fact(k) * fact(n - k)) * fact(k); void f; const c = fact(n) / (fact(n - k)); return add('QUANT', 'Permutation & Combination', 'Arrangements', `In how many ways can ${k} different prizes be given to ${n} students if a student can receive at most one prize?`, String(c), near(c).map(String), `${n}P${k} = ${n}!/${n - k}! = ${c}.`, 'MEDIUM'); });
/* ============================ LOGICAL (medium / hard) ============================ */
gen(12, () => { const a = ri(2, 9), b = ri(100, 140), da = ri(2, 6), db = ri(3, 9); const s = []; for (let i = 0; i < 6; i++)
    s.push(i % 2 === 0 ? a + (i / 2) * da : b - ((i - 1) / 2) * db); const c = a + 3 * da; return add('LOGICAL', 'Number Series', 'Alternating', `Find the next term: ${list(s)}, ?`, String(c), near(c).map(String), `Two interleaved series: the odd-position terms increase by ${da} (next ${c}) and the even-position terms decrease by ${db}.`, 'HARD'); });
gen(10, () => { const k = pick([2, 3]); const c0 = pick([-1, 1, 2]); const a = ri(1, 4); const s = [a]; for (let i = 1; i < 5; i++)
    s.push(s[i - 1] * k + c0); const nx = s[4] * k + c0; return add('LOGICAL', 'Number Series', 'Multiply and add', `What comes next in the series: ${list(s)}, ?`, String(nx), near(nx).map(String), `Each term = previous × ${k} ${c0 >= 0 ? '+' : '−'} ${Math.abs(c0)}; next = ${nx}.`, 'HARD'); });
gen(8, () => { const n0 = ri(1, 4); const sgn = pick([1, -1]); const s = Array.from({ length: 5 }, (_, i) => (n0 + i) ** 3 + sgn * (n0 + i)); const nx = (n0 + 5) ** 3 + sgn * (n0 + 5); return add('LOGICAL', 'Number Series', 'Cubes', `Complete the series: ${list(s)}, ?`, String(nx), near(nx).map(String), `Terms are n³ ${sgn > 0 ? '+' : '−'} n for n = ${n0}, ${n0 + 1}, …; next n = ${n0 + 5} gives ${nx}.`, 'HARD'); });
{
    const names = ['Asha', 'Bhanu', 'Chitra', 'Dinesh', 'Eswar', 'Farah', 'Gopal', 'Hema', 'Ishaan', 'Jaya'];
    gen(14, () => {
        const p = sample(names, 5);
        return add('LOGICAL', 'Seating Arrangement', 'Linear', `Five friends ${p.slice().sort().join(', ')} sit in a row facing north. ${p[0]} sits at the extreme left. ${p[1]} sits immediately to the right of ${p[0]}. ${p[4]} sits at the extreme right and ${p[3]} sits immediately to the left of ${p[4]}. Who sits in the middle?`, p[2], p.filter((x) => x !== p[2]).slice(0, 3), `Order from left: ${p.join(', ')}, so ${p[2]} is in the middle.`, 'MEDIUM');
    });
}
gen(10, () => { const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]]); const extra = ri(1, 6); const dir = pick([['north', 'east', 'south'], ['east', 'south', 'west']]); void dir; const n1 = a + extra; return add('LOGICAL', 'Direction Sense', 'Three legs', `A person walks ${n1} km north, then ${b} km east, then ${extra} km south. How far is he from the starting point?`, `${Math.hypot(a, b)} km`, [`${a + b} km`, `${Math.hypot(n1, b).toFixed(1)} km`, `${c + 1} km`, `${b} km`].filter((x) => x !== `${Math.hypot(a, b)} km`), `Net north = ${n1} − ${extra} = ${a} km, east = ${b} km; distance = √(${a}² + ${b}²) = ${c} km.`, 'MEDIUM'); });
gen(12, () => { const w = pick(['CAB', 'BAG', 'FACE', 'DEAF', 'HEAD', 'BEAD', 'CHEF', 'GLAD', 'JADE', 'BIKE', 'FIG', 'HEN']); const v = [...w].reduce((a, ch) => a + ch.charCodeAt(0) - 64, 0); return add('LOGICAL', 'Coding-Decoding', 'Alphabet values', `If A = 1, B = 2, C = 3, … Z = 26, what is the sum of the letter values of the word "${w}"?`, String(v), near(v).map(String), `${[...w].map((c) => `${c}=${c.charCodeAt(0) - 64}`).join(', ')} → ${v}.`, 'MEDIUM'); });
gen(12, () => { const y = ri(1950, 2030), m = ri(0, 11), d = ri(1, 28); const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; const c = days[new Date(Date.UTC(y, m, d)).getUTCDay()]; const ms = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; return add('LOGICAL', 'Calendar', 'Day of date', `On which day of the week did ${d} ${ms[m]} ${y} fall?`, c, days.filter((x) => x !== c).slice(0, 3), `Counting odd days from a reference date gives ${c}.`, 'HARD'); });
gen(10, () => { const l = ri(4, 20), r = ri(4, 20); return add('LOGICAL', 'Ranking', 'Total from both ends', `In a row of students, Ravi is ${l}th from the left end and ${r}th from the right end. How many students are in the row?`, String(l + r - 1), near(l + r - 1).map(String).concat([String(l + r)]), `Total = ${l} + ${r} − 1 = ${l + r - 1}.`, 'MEDIUM'); });
gen(8, () => { const n = ri(3, 9); return add('LOGICAL', 'Analogy', 'Number', `${n} : ${n ** 3} :: ${n + 2} : ?`, String((n + 2) ** 3), near((n + 2) ** 3).map(String).concat([String((n + 2) ** 2)]), `The second number is the cube of the first: ${n + 2}³ = ${(n + 2) ** 3}.`, 'MEDIUM'); });
gen(10, () => { const a = ri(2, 9), b = ri(2, 9); const s = [a, b]; for (let i = 2; i < 7; i++)
    s.push(s[i - 1] + s[i - 2]); return add('LOGICAL', 'Number Series', 'Fibonacci-type', `Find the next term: ${list(s)}, ?`, String(s[6] + s[5]), near(s[6] + s[5]).map(String), `Each term is the sum of the previous two; next = ${s[6]} + ${s[5]} = ${s[6] + s[5]}.`, 'MEDIUM'); });
gen(8, () => { const k = ri(2, 6); const s = Array.from({ length: 6 }, (_, i) => (i + 1) ** 2 + k); return add('LOGICAL', 'Number Series', 'Squares plus constant', `What is the next number: ${list(s)}, ?`, String(49 + k), near(49 + k).map(String), `Terms are n² + ${k}; for n = 7 → ${49 + k}.`, 'MEDIUM'); });
[
    ['Statements: Some books are pens. All pens are pencils. No pencil is a rubber.\nConclusions: I. Some books are pencils. II. Some books are not rubbers. III. No pen is a rubber.', 'All of I, II and III follow', ['Only I and II follow', 'Only I and III follow', 'Only II follows'], 'Books∩pens ⊂ pencils, so I; pencils exclude rubbers so III; those books are not rubbers so II.'],
    ['Statements: All roses are flowers. Some flowers are red. No red thing is cheap.\nConclusions: I. Some roses are red. II. Some flowers are not cheap.', 'Only II follows', ['Only I follows', 'Both follow', 'Neither follows'], 'Red flowers exist and none is cheap → II. Roses being red is not guaranteed.'],
    ['Statements: Some A are B. All B are C. Some C are D.\nConclusions: I. Some A are C. II. Some A are D.', 'Only I follows', ['Only II follows', 'Both follow', 'Neither follows'], 'A∩B ⊂ C gives I; the link to D is not guaranteed.'],
    ['Statements: No tree is a stone. All stones are hard. Some hard things are green.\nConclusions: I. No tree is hard. II. Some stones are green.', 'Neither follows', ['Only I follows', 'Only II follows', 'Both follow'], 'Trees may still be hard through other routes; stones being green is not forced.'],
].forEach(([t, c, w, e]) => add('LOGICAL', 'Syllogism', 'Three statements', t, c, w, e, 'HARD'));
[
    ['P is the brother of Q. Q is the sister of R. R is the father of S. How is P related to S?', 'Uncle', ['Father', 'Grandfather', 'Brother'], 'P and R are siblings, so P is the uncle of S.'],
    ['A is the mother of B. B is the sister of C. C is the son of D. How is D related to A?', 'Husband', ['Father', 'Brother', 'Son'], 'A and D are the parents of B and C, so D is A\'s husband.'],
    ['Pointing to a woman, Rahul said, "Her mother is the only daughter of my mother." How is the woman related to Rahul?', 'Niece... daughter of sister', ['Mother', 'Sister', 'Cousin'], 'Rahul\'s mother\'s only daughter is his sister; her daughter is his niece.'],
    ['X says, "That boy is the son of the only son of my grandfather." How is the boy related to X?', 'Son (or nephew... if X is not the only son)', ['Father', 'Uncle', 'Brother'], 'The only son of X\'s grandfather is X\'s father, so the boy is X\'s brother.'],
].slice(0, 2).forEach(([t, c, w, e]) => add('LOGICAL', 'Blood Relations', 'Chains', t, c, w, e, 'MEDIUM'));
/* ============================ VERBAL (medium / hard) ============================ */
[
    ['Doctor : Hospital :: Teacher : ?', 'School', ['Book', 'Student', 'Exam']], ['Pen : Write :: Knife : ?', 'Cut', ['Sharp', 'Kitchen', 'Steel']], ['Bird : Nest :: Bee : ?', 'Hive', ['Honey', 'Sting', 'Flower']],
    ['Hot : Cold :: Ascend : ?', 'Descend', ['Climb', 'Fall', 'Rise']], ['Author : Novel :: Sculptor : ?', 'Statue', ['Chisel', 'Museum', 'Marble']], ['Fear : Phobia :: Obsession : ?', 'Mania', ['Habit', 'Anger', 'Love']],
    ['Lion : Pride :: Wolf : ?', 'Pack', ['Herd', 'Flock', 'Swarm']], ['Thermometer : Temperature :: Barometer : ?', 'Pressure', ['Humidity', 'Speed', 'Weight']], ['Calf : Cow :: Foal : ?', 'Horse', ['Donkey', 'Mare', 'Goat']],
    ['Eclipse : Moon :: Drought : ?', 'Rain', ['Sun', 'Famine', 'Heat']], ['Gold : Ductile :: Glass : ?', 'Brittle', ['Transparent', 'Hard', 'Fragile mineral']], ['Painter : Canvas :: Poet : ?', 'Verse', ['Pen', 'Audience', 'Rhyme scheme']],
    ['Soldier : Army :: Sailor : ?', 'Navy', ['Ship', 'Sea', 'Port']], ['Mason : Wall :: Weaver : ?', 'Cloth', ['Loom', 'Thread', 'Dress']], ['Verbose : Concise :: Generous : ?', 'Stingy', ['Kind', 'Rich', 'Lavish']],
    ['Cacophony : Harmony :: Chaos : ?', 'Order', ['Noise', 'Anarchy', 'Disorder']], ['Telescope : Stars :: Microscope : ?', 'Cells', ['Lens', 'Doctor', 'Light']], ['Surgeon : Scalpel :: Farmer : ?', 'Plough', ['Field', 'Crop', 'Tractor driver']],
    ['Ornithologist : Birds :: Entomologist : ?', 'Insects', ['Fish', 'Rocks', 'Plants']], ['Famine : Food :: Drought : ?', 'Water', ['Heat', 'Crops', 'Rain clouds']],
].forEach(([t, c, w], i) => add('VERBAL', 'Analogies', 'Word pairs', `Choose the pair that completes the analogy.\n${t}`, c, w, `The relationship in the first pair is repeated: the answer is ${c}.`, i % 3 === 0 ? 'HARD' : 'MEDIUM'));
[
    ['Choose the grammatically correct sentence.', 'Had I known about the delay, I would have left earlier.', ['If I would have known about the delay, I would have left earlier.', 'Had I knew about the delay, I would have left earlier.', 'If I had known about the delay, I will have left earlier.'], 'Third conditional uses "had + past participle … would have + past participle".'],
    ['Choose the grammatically correct sentence.', 'Neither the manager nor the employees were aware of the change.', ['Neither the manager nor the employees was aware of the change.', 'Neither the manager or the employees were aware of the change.', 'Neither the manager nor the employees is aware of the change.'], 'With "neither … nor" the verb agrees with the nearer subject (employees → were).'],
    ['Choose the grammatically correct sentence.', 'The committee has submitted its report.', ['The committee have submitted its report.', 'The committee has submitted their report.', 'The committee have submitted it\'s report.'], 'A collective noun acting as one unit takes a singular verb and "its".'],
    ['Choose the grammatically correct sentence.', 'Hardly had he reached the station when the train left.', ['Hardly he had reached the station when the train left.', 'Hardly had he reached the station than the train left.', 'Hardly did he reach the station when the train left.'], '"Hardly had … when" is the correct inverted structure.'],
    ['Choose the grammatically correct sentence.', 'She is one of the students who have passed with distinction.', ['She is one of the students who has passed with distinction.', 'She is one of the student who have passed with distinction.', 'She is one of the students who have pass with distinction.'], '"Who" refers to "students" (plural), so "have".'],
    ['Choose the grammatically correct sentence.', 'Each of the candidates must submit his or her form by Friday.', ['Each of the candidates must submit their forms by Friday.', 'Each of the candidates must submits his form by Friday.', 'Each of the candidate must submit his form by Friday.'], '"Each" is singular and takes singular pronouns.'],
    ['Choose the grammatically correct sentence.', 'The more you practise, the better you become.', ['The more you practise, the best you become.', 'More you practise, better you become.', 'The more you practise, the more better you become.'], 'The "the + comparative … the + comparative" pattern.'],
    ['Choose the grammatically correct sentence.', 'He suggested that the meeting be postponed.', ['He suggested that the meeting is postponed.', 'He suggested that the meeting was postponed.', 'He suggested that the meeting to be postponed.'], 'After "suggest that", the subjunctive uses the base form.'],
    ['Choose the grammatically correct sentence.', 'I wish I were taller.', ['I wish I was taller.', 'I wish I am taller.', 'I wish I would be taller.'], 'Hypothetical wishes take "were".'],
    ['Choose the grammatically correct sentence.', 'Scarcely had she sat down when the phone rang.', ['Scarcely she had sat down when the phone rang.', 'Scarcely had she sat down than the phone rang.', 'Scarcely did she sit down when the phone rang.'], '"Scarcely … when" pairs correctly.'],
    ['Choose the sentence with correct punctuation.', 'Although it was raining, we decided to walk; the park was only five minutes away.', ['Although it was raining we decided to walk the park, was only five minutes away.', 'Although it was raining, we decided to walk, the park was only five minutes away.', 'Although, it was raining we decided to walk; the park was only five minutes away.'], 'A comma after the introductory clause and a semicolon joining related clauses.'],
    ['Choose the correctly used word: "The new policy will ___ all employees."', 'affect', ['effect', 'affects to', 'effects on'], '"Affect" is a verb meaning to influence; "effect" is usually a noun.'],
    ['Choose the correctly used word: "She gave me some good ___."', 'advice', ['advise', 'advices', 'advised'], '"Advice" is the (uncountable) noun; "advise" is the verb.'],
    ['Choose the correctly used word: "The company will ___ the new rules next month."', 'implement', ['complement', 'compliment', 'implant'], '"Implement" means to put into effect.'],
    ['Choose the correctly used word: "Her argument was ___ by the evidence."', 'corroborated', ['collaborated', 'corrugated', 'cooperated'], '"Corroborate" means to support with evidence.'],
    ['Select the word that best completes: "His ___ remarks offended everyone in the room."', 'caustic', ['cautious', 'candid', 'causal'], '"Caustic" means sarcastic and bitingly critical.'],
    ['Select the word that best completes: "The speaker\'s ___ delivery put the audience to sleep."', 'monotonous', ['melodious', 'meticulous', 'momentous'], '"Monotonous" means dull and unvarying.'],
    ['Select the word that best completes: "A ___ person always thinks before acting."', 'prudent', ['prodigal', 'profound', 'prudish'], '"Prudent" means careful and sensible.'],
    ['Select the word that best completes: "The witness gave a ___ account of the incident, leaving out no detail."', 'meticulous', ['mediocre', 'miserly', 'malicious'], '"Meticulous" means extremely careful and thorough.'],
].forEach(([t, c, w, e], i) => add('VERBAL', i < 11 ? 'Grammar' : 'Usage', i < 11 ? 'Sentence correction' : 'Word choice', t, c, w, e, i % 2 ? 'HARD' : 'MEDIUM'));
const hardSyn = [['Obstreperous', 'Unruly', ['Obedient', 'Silent', 'Gentle']], ['Ubiquitous', 'Omnipresent', ['Rare', 'Ancient', 'Hidden']], ['Equivocal', 'Ambiguous', ['Clear', 'Honest', 'Balanced']], ['Sagacious', 'Wise', ['Foolish', 'Sad', 'Timid']], ['Ephemeral', 'Fleeting', ['Eternal', 'Heavy', 'Bright']], ['Perfunctory', 'Cursory', ['Thorough', 'Enthusiastic', 'Hostile']], ['Capricious', 'Unpredictable', ['Steady', 'Careful', 'Cheerful']], ['Intrepid', 'Fearless', ['Timid', 'Tired', 'Curious']], ['Loquacious', 'Talkative', ['Silent', 'Rude', 'Clever']], ['Magnanimous', 'Generous', ['Petty', 'Powerful', 'Ancient']], ['Pernicious', 'Harmful', ['Helpful', 'Tasty', 'Weak']], ['Quixotic', 'Idealistic', ['Practical', 'Angry', 'Funny']], ['Recalcitrant', 'Defiant', ['Obedient', 'Forgetful', 'Quiet']], ['Taciturn', 'Reserved', ['Talkative', 'Angry', 'Weak']], ['Fastidious', 'Meticulous', ['Careless', 'Hungry', 'Quick']], ['Gregarious', 'Sociable', ['Shy', 'Greedy', 'Noisy']], ['Venerable', 'Respected', ['Despised', 'Poisonous', 'Young']], ['Zealot', 'Fanatic', ['Moderate', 'Sceptic', 'Beginner']], ['Ostentatious', 'Showy', ['Modest', 'Rude', 'Hidden']], ['Parsimonious', 'Miserly', ['Generous', 'Wise', 'Quiet']]];
hardSyn.forEach(([w, c, wr]) => add('VERBAL', 'Vocabulary', 'Advanced synonyms', `Choose the word closest in meaning to "${w}".`, c, wr, `"${w}" means ${c.toLowerCase()}.`, 'HARD'));
[
    ['Alleviate', 'Aggravate'], ['Benevolent', 'Malevolent'], ['Candid', 'Deceitful'], ['Diffident', 'Confident'], ['Fortuitous', 'Planned'], ['Gullible', 'Sceptical'], ['Impeccable', 'Flawed'], ['Lethargic', 'Energetic'], ['Meticulous', 'Careless'], ['Nefarious', 'Virtuous'],
].forEach(([w, c], i, all) => add('VERBAL', 'Vocabulary', 'Advanced antonyms', `Choose the word opposite in meaning to "${w}".`, c, sample(all.filter((_, j) => j !== i).map((x) => x[1]), 3), `The opposite of "${w}" is "${c.toLowerCase()}".`, 'HARD'));
const passages = [
    ['Passage: Urban farming has grown rapidly in cities over the last decade. Rooftop gardens and vertical farms use unused space to grow vegetables close to consumers, cutting transport costs and emissions. However, critics note that high start-up costs and energy-intensive lighting can offset the environmental benefits unless renewable power is used.', [
            ['According to the passage, what is a key advantage of urban farming?', 'It reduces transport costs and emissions', ['It requires no energy', 'It is cheaper to start than traditional farming', 'It replaces rural farming completely']],
            ['What do critics say could reduce the benefits of urban farming?', 'High costs and energy-hungry lighting', ['Lack of consumers', 'Poor soil', 'Government bans']],
            ['Which condition does the passage suggest for urban farms to be truly eco-friendly?', 'Use of renewable power', ['Larger rooftops', 'Selling at higher prices', 'Using chemical fertilisers']]
        ]],
    ['Passage: The printing press, introduced to Europe in the fifteenth century, made books cheaper and more widely available. Literacy rates rose gradually, and ideas spread faster than ever before. Some rulers feared this new freedom and tried to control what could be printed, but the flow of information proved difficult to stop.', [
            ['What was the main effect of the printing press mentioned in the passage?', 'Books became cheaper and ideas spread faster', ['Rulers gained more power', 'Literacy fell', 'Handwritten books increased']],
            ['How did some rulers react?', 'They tried to control printing', ['They banned reading entirely', 'They encouraged all printing', 'They ignored it']],
            ['The phrase "proved difficult to stop" suggests that', 'information continued to circulate despite control', ['control was successful', 'printing ended soon', 'rulers were popular']]
        ]],
    ['Passage: Sleep researchers have found that students who sleep fewer than six hours a night perform worse on memory tasks than those who sleep eight hours. Interestingly, extra weekend sleep does not fully repair the damage caused by a week of poor rest. Experts therefore recommend a consistent sleep schedule rather than occasional long sleeps.', [
            ['What does the research find about students sleeping fewer than six hours?', 'They perform worse on memory tasks', ['They perform better', 'They are unaffected', 'They sleep deeper']],
            ['What is said about weekend sleep?', 'It does not fully repair the damage', ['It fully repairs the damage', 'It is harmful', 'It is unnecessary']],
            ['What do experts recommend?', 'A consistent sleep schedule', ['Sleeping only at weekends', 'Less than six hours', 'Avoiding naps']]
        ]],
    ['Passage: Electric vehicles produce no exhaust emissions, but their overall environmental impact depends on how the electricity is generated and how batteries are manufactured and recycled. A car charged on coal-fired power may be cleaner than a petrol car only marginally, whereas one charged on solar power offers a dramatic improvement.', [
            ['The passage mainly argues that', 'the benefit of electric vehicles depends on the source of electricity', ['electric cars are always cleaner', 'petrol cars are cleaner', 'batteries are harmless']],
            ['According to the passage, charging on coal-fired power makes an electric car', 'only marginally cleaner than a petrol car', ['far cleaner', 'dirtier by far', 'free of emissions']],
            ['Which factor is NOT mentioned as affecting the impact?', 'Vehicle colour', ['Battery recycling', 'Battery manufacture', 'Electricity generation']]
        ]],
];
passages.forEach(([p, qs]) => qs.forEach(([q, c, w]) => add('VERBAL', 'Reading Comprehension', 'Short passage', `${p}\n\nQuestion: ${q}`, c, w, 'Answer directly supported by the passage.', 'MEDIUM')));
[
    ['Arrange the sentences to form a coherent paragraph.\nP. This led to a sharp rise in online learning.\nQ. The pandemic closed schools worldwide.\nR. Teachers had to adapt to new tools quickly.\nS. Many students found the transition difficult.', 'QPRS', ['PQRS', 'QRPS', 'RQPS'], 'The cause (Q) leads to the effect (P), then the adaptation (R) and difficulty (S).'],
    ['Arrange the sentences to form a coherent paragraph.\nP. As a result, prices began to fall.\nQ. New factories increased production.\nR. Supply exceeded demand.\nS. Consumers benefited from cheaper goods.', 'QRPS', ['QPRS', 'RQPS', 'SQRP'], 'Production → oversupply → falling prices → consumer benefit.'],
    ['Arrange the sentences to form a coherent paragraph.\nP. He studied hard for months.\nQ. Ravi wanted to crack the placement test.\nR. His efforts paid off when the results were announced.\nS. He also took many mock tests.', 'QPSR', ['PQSR', 'QSPR', 'QPRS'], 'Goal (Q), effort (P, S), result (R).'],
    ['Arrange the sentences to form a coherent paragraph.\nP. The seeds were then planted.\nQ. First, the farmer prepared the soil.\nR. Within weeks, tiny shoots appeared.\nS. He watered them every morning.', 'QPSR', ['QSPR', 'PQSR', 'QPRS'], 'Chronological order of the process.'],
].forEach(([t, c, w, e]) => add('VERBAL', 'Para Jumbles', 'Sentence order', t, c, w, e, 'HARD'));
/* ============================ TECHNICAL (computed) ============================ */
const fifo = (ref, f) => { const q = []; let n = 0; for (const p of ref)
    if (!q.includes(p)) {
        n++;
        if (q.length === f)
            q.shift();
        q.push(p);
    } return n; };
const lru = (ref, f) => { const q = []; let n = 0; for (const p of ref) {
    const i = q.indexOf(p);
    if (i >= 0) {
        q.splice(i, 1);
        q.push(p);
    }
    else {
        n++;
        if (q.length === f)
            q.shift();
        q.push(p);
    }
} return n; };
gen(14, () => { const f = pick([3, 4]); const ref = Array.from({ length: 12 }, () => ri(0, 6)); const c = fifo(ref, f); return add('TECHNICAL', 'Operating Systems', 'FIFO page replacement', `Reference string: ${ref.join(' ')} with ${f} frames. How many page faults occur under FIFO replacement (initially empty frames)?`, String(c), near(c).map(String), `Simulating FIFO with ${f} frames gives ${c} faults.`, 'MEDIUM'); });
gen(14, () => { const f = pick([3, 4]); const ref = Array.from({ length: 12 }, () => ri(0, 6)); const c = lru(ref, f); return add('TECHNICAL', 'Operating Systems', 'LRU page replacement', `Reference string: ${ref.join(' ')} with ${f} frames. How many page faults occur under LRU replacement (initially empty frames)?`, String(c), near(c).map(String), `Simulating LRU with ${f} frames gives ${c} faults.`, 'HARD'); });
gen(10, () => { const head = ri(10, 90); const req = Array.from({ length: 5 }, () => ri(0, 99)); let pos = head, t = 0; for (const r of req) {
    t += Math.abs(r - pos);
    pos = r;
} return add('TECHNICAL', 'Operating Systems', 'Disk scheduling FCFS', `A disk head is at cylinder ${head}. Requests arrive in the order ${req.join(', ')}. What is the total head movement under FCFS?`, String(t), near(t).map(String), `Sum of absolute differences from ${head} through the requests = ${t}.`, 'MEDIUM'); });
gen(10, () => { const head = ri(10, 90); const req = [...new Set(Array.from({ length: 6 }, () => ri(0, 99)))]; const rest = [...req]; let pos = head, t = 0; while (rest.length) {
    rest.sort((a, b) => Math.abs(a - pos) - Math.abs(b - pos) || a - b);
    const r = rest.shift();
    t += Math.abs(r - pos);
    pos = r;
} return add('TECHNICAL', 'Operating Systems', 'Disk scheduling SSTF', `A disk head is at cylinder ${head}. Pending requests: ${req.join(', ')}. What is the total head movement under SSTF (ties go to the lower cylinder)?`, String(t), near(t).map(String), `Always serve the closest pending request; total = ${t}.`, 'HARD'); });
const avg2 = (n) => (Math.round(n * 100) / 100).toFixed(2);
gen(12, () => { const b = Array.from({ length: 4 }, () => ri(2, 12)); let w = 0, acc = 0; for (const x of b) {
    w += acc;
    acc += x;
} const c = w / b.length; return add('TECHNICAL', 'Operating Systems', 'FCFS average waiting', `Four processes arrive together at time 0 in the order P1..P4 with burst times ${b.join(', ')} ms. What is the average waiting time under FCFS?`, avg2(c), near(c, 2).map(avg2), `Waiting times accumulate: total ${w} ms / 4 = ${avg2(c)} ms.`, 'MEDIUM'); });
gen(12, () => { const b = Array.from({ length: 4 }, () => ri(2, 12)); const s = [...b].sort((x, y) => x - y); let w = 0, acc = 0; for (const x of s) {
    w += acc;
    acc += x;
} const c = w / b.length; return add('TECHNICAL', 'Operating Systems', 'SJF average waiting', `Four processes arrive together at time 0 with burst times ${b.join(', ')} ms. What is the average waiting time under non-preemptive SJF?`, avg2(c), near(c, 2).map(avg2), `Run in order ${s.join(', ')}; total waiting ${w} ms / 4 = ${avg2(c)} ms.`, 'MEDIUM'); });
gen(10, () => { const q = pick([2, 3, 4]); const b = Array.from({ length: 3 }, () => ri(3, 10)); const rem = [...b]; const fin = [0, 0, 0]; let t = 0; while (rem.some((x) => x > 0))
    for (let i = 0; i < 3; i++)
        if (rem[i] > 0) {
            const d = Math.min(q, rem[i]);
            t += d;
            rem[i] -= d;
            if (!rem[i])
                fin[i] = t;
        } const w = fin.reduce((a, f, i) => a + f - b[i], 0) / 3; return add('TECHNICAL', 'Operating Systems', 'Round robin', `Three processes arrive at time 0 with burst times ${b.join(', ')} ms. With Round Robin (quantum = ${q} ms), what is the average waiting time?`, avg2(w), near(w, 2).map(avg2), `Simulating RR gives completion times ${fin.join(', ')}; waiting = completion − burst, average ${avg2(w)} ms.`, 'HARD'); });
const templates = [
    (a, b, c) => ({ tokens: `${a} ${b} + ${c} *`, value: (a + b) * c }), (a, b, c) => ({ tokens: `${a} ${b} ${c} * +`, value: a + b * c }),
    (a, b, c, d) => ({ tokens: `${a} ${b} + ${c} ${d} - *`, value: (a + b) * (c - d) }), (a, b, c, d) => ({ tokens: `${a} ${b} * ${c} ${d} * +`, value: a * b + c * d }),
    (a, b, c, d) => ({ tokens: `${a} ${b} ${c} + * ${d} -`, value: a * (b + c) - d }), (a, b, c, d) => ({ tokens: `${a} ${b} - ${c} ${d} + *`, value: (a - b) * (c + d) }),
];
gen(14, () => { const t = pick(templates)(ri(3, 9), ri(2, 8), ri(2, 9), ri(1, 6)); return add('TECHNICAL', 'Data Structures', 'Postfix evaluation', `Evaluate the postfix expression: ${t.tokens}`, String(t.value), near(t.value).map(String), `Evaluate with a stack: the result is ${t.value}.`, 'MEDIUM'); });
class Node2 {
    v;
    l;
    r;
    constructor(v) {
        this.v = v;
    }
}
const insert = (n, v) => { if (!n)
    return new Node2(v); if (v < n.v)
    n.l = insert(n.l, v);
else
    n.r = insert(n.r, v); return n; };
const height = (n) => (n ? 1 + Math.max(height(n.l), height(n.r)) : -1);
const pre = (n) => (n ? [n.v, ...pre(n.l), ...pre(n.r)] : []);
const post = (n) => (n ? [...post(n.l), ...post(n.r), n.v] : []);
const ino = (n) => (n ? [...ino(n.l), n.v, ...ino(n.r)] : []);
const seqs = () => sample(Array.from({ length: 30 }, (_, i) => i + 1), 7);
gen(10, () => { const s = seqs(); let r; for (const v of s)
    r = insert(r, v); const h = height(r); return add('TECHNICAL', 'Data Structures', 'BST height', `Keys ${s.join(', ')} are inserted into an empty BST in this order. What is the height of the tree (a single node has height 0)?`, String(h), [0, 1, 2, 3, 4, 5, 6].map(String).filter((x) => x !== String(h)), `Build the BST step by step; the longest root-to-leaf path has ${h} edges.`, 'MEDIUM'); });
gen(10, () => { const s = seqs(); let r; for (const v of s)
    r = insert(r, v); const c = pre(r); return add('TECHNICAL', 'Data Structures', 'BST preorder', `Keys ${s.join(', ')} are inserted into an empty BST. What is the preorder traversal?`, list(c), variants(c), `Build the BST and traverse root, left, right: ${list(c)}.`, 'HARD'); });
gen(10, () => { const s = seqs(); let r; for (const v of s)
    r = insert(r, v); const c = post(r); return add('TECHNICAL', 'Data Structures', 'BST postorder', `Keys ${s.join(', ')} are inserted into an empty BST. What is the postorder traversal?`, list(c), variants(c), `Build the BST and traverse left, right, root: ${list(c)}.`, 'HARD'); });
gen(8, () => { const s = seqs(); let r; for (const v of s)
    r = insert(r, v); const c = ino(r); return add('TECHNICAL', 'Data Structures', 'BST inorder', `Keys ${s.join(', ')} are inserted into an empty BST. What is the inorder traversal?`, list(c), variants(c), 'Inorder traversal of a BST is always sorted.', 'MEDIUM'); });
gen(10, () => { const m = pick([7, 11]); const keys = sample(Array.from({ length: 40 }, (_, i) => i + 5), 5); const t = Array(m).fill(null); let idx = 0; for (const k of keys) {
    let i = k % m;
    while (t[i] !== null)
        i = (i + 1) % m;
    t[i] = k;
    idx = i;
} return add('TECHNICAL', 'Data Structures', 'Hash table probing', `A hash table of size ${m} uses h(k) = k mod ${m} with linear probing. Keys ${keys.join(', ')} are inserted in order. At which index is the last key (${keys[4]}) stored?`, String(idx), [...Array(m).keys()].map(String).filter((x) => x !== String(idx)), `Simulating insertions with linear probing places ${keys[4]} at index ${idx}.`, 'HARD'); });
gen(8, () => { const s = sample(Array.from({ length: 20 }, (_, i) => i + 1), 5); const h = []; for (const v of s) {
    h.push(v);
    let i = h.length - 1;
    while (i > 0 && h[(i - 1) >> 1] > h[i]) {
        [h[(i - 1) >> 1], h[i]] = [h[i], h[(i - 1) >> 1]];
        i = (i - 1) >> 1;
    }
} return add('TECHNICAL', 'Data Structures', 'Min-heap insertion', `Values ${s.join(', ')} are inserted one by one into an initially empty binary min-heap. What is the array representation of the heap?`, list(h), variants(h), `Each insertion bubbles the new value up until the parent is smaller: ${list(h)}.`, 'HARD'); });
gen(10, () => { const n = pick([20, 22, 24, 26, 27, 28]); return add('TECHNICAL', 'Computer Networks', 'Subnetting', `How many usable host addresses does an IPv4 /${n} network provide?`, String(2 ** (32 - n) - 2), [String(2 ** (32 - n)), String(2 ** (32 - n) - 1), String(2 ** (33 - n) - 2)], `2^(32−${n}) − 2 = ${2 ** (32 - n) - 2}.`, 'MEDIUM'); });
gen(8, () => { const n = ri(16, 24), m = ri(n + 2, 28); return add('TECHNICAL', 'Computer Networks', 'Subnetting', `A /${n} network is divided into /${m} subnets. How many subnets are created?`, String(2 ** (m - n)), [String(2 ** (m - n - 1)), String(2 ** (m - n + 1)), String(m - n)], `2^(${m}−${n}) = ${2 ** (m - n)}.`, 'MEDIUM'); });
const fibCalls = (n) => (n <= 1 ? 1 : 1 + fibCalls(n - 1) + fibCalls(n - 2));
gen(6, () => { const n = ri(4, 8); return add('TECHNICAL', 'Algorithms', 'Recursion calls', `For \`int fib(int n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }\`, how many calls (including the first) are made by fib(${n})?`, String(fibCalls(n)), near(fibCalls(n)).map(String), `calls(n) = 1 + calls(n−1) + calls(n−2) → ${fibCalls(n)}.`, 'HARD'); });
gen(8, () => { const n = ri(5, 12); const f = (x) => (x <= 0 ? 0 : x + f(x - 2)); return add('TECHNICAL', 'Algorithms', 'Recursion output', `What does f(${n}) return?\n\`int f(int n) { if (n <= 0) return 0; return n + f(n - 2); }\``, String(f(n)), near(f(n)).map(String), `Sum n + (n−2) + … while positive = ${f(n)}.`, 'MEDIUM'); });
gen(12, () => {
    const N = ri(4, 12);
    const kind = ri(0, 3);
    let c = 0;
    if (kind === 0)
        for (let i = 0; i < N; i++)
            for (let j = i; j < N; j++)
                c++;
    else if (kind === 1)
        for (let i = 0; i < N; i++)
            for (let j = 0; j < i; j++)
                c++;
    else if (kind === 2)
        for (let i = 1; i < N * 8; i *= 2)
            c++;
    else
        for (let i = 0; i < N; i++)
            for (let j = 0; j < N; j += 2)
                c++;
    const code = ['for (i = 0; i < N; i++)\n  for (j = i; j < N; j++) count++;', 'for (i = 0; i < N; i++)\n  for (j = 0; j < i; j++) count++;', 'for (i = 1; i < N*8; i *= 2) count++;', 'for (i = 0; i < N; i++)\n  for (j = 0; j < N; j += 2) count++;'][kind];
    return add('TECHNICAL', 'Algorithms', 'Loop counting', `With N = ${N}, how many times is count++ executed?\n${code}`, String(c), near(c).map(String), `Counting iterations exactly gives ${c}.`, 'MEDIUM');
});
gen(10, () => { const x = ri(20, 250); const pc = (v) => v.toString(2).split('').filter((b) => b === '1').length; return add('TECHNICAL', 'Programming', 'Bit tricks', `How many iterations does this loop run for x = ${x}?\n\`while (x) { x &= (x - 1); count++; }\``, String(pc(x)), near(pc(x)).map(String).concat(['1', '0']), `x & (x−1) clears the lowest set bit each time, so it runs popcount(${x}) = ${pc(x)} times.`, 'HARD'); });
gen(8, () => { const x = ri(10, 200); return add('TECHNICAL', 'Programming', 'Bit tricks', `What is the value of \`${x} & -${x}\` in two's complement arithmetic?`, String(x & -x), [String(x), String(x & (x - 1)), String(x ^ (x >> 1)), '1'], `x & −x isolates the lowest set bit: ${x & -x}.`, 'HARD'); });
gen(8, () => { const x = ri(5, 120); return add('TECHNICAL', 'Programming', 'Bit tricks', `What is \`${x} ^ (${x} >> 1)\` (the Gray code of ${x})?`, String(x ^ (x >> 1)), near(x ^ (x >> 1)).map(String), `${x} XOR ${x >> 1} = ${x ^ (x >> 1)}.`, 'HARD'); });
const adjOf = () => { const n = 6; const e = new Set(); while (e.size < 7) {
    const a = ri(0, n - 1), b = ri(0, n - 1);
    if (a !== b)
        e.add(a < b ? `${a}-${b}` : `${b}-${a}`);
} const adj = Array.from({ length: n }, () => []); for (const k of e) {
    const [a, b] = k.split('-').map(Number);
    adj[a].push(b);
    adj[b].push(a);
} adj.forEach((l) => l.sort((x, y) => x - y)); return { adj, edges: [...e] }; };
gen(8, () => { const { adj, edges } = adjOf(); const seenN = new Set([0]); const q = [0]; const order = []; while (q.length) {
    const v = q.shift();
    order.push(v);
    for (const w of adj[v])
        if (!seenN.has(w)) {
            seenN.add(w);
            q.push(w);
        }
} return add('TECHNICAL', 'Data Structures', 'BFS order', `An undirected graph has edges ${edges.join(', ')} (vertices 0–5). Visiting neighbours in ascending order, what is the BFS order from vertex 0 (reachable vertices only)?`, list(order), variants(order), `BFS with a queue visits level by level: ${list(order)}.`, 'MEDIUM'); });
gen(8, () => { const { adj, edges } = adjOf(); const seenN = new Set(); const order = []; const dfs = (v) => { seenN.add(v); order.push(v); for (const w of adj[v])
    if (!seenN.has(w))
        dfs(w); }; dfs(0); return add('TECHNICAL', 'Data Structures', 'DFS order', `An undirected graph has edges ${edges.join(', ')} (vertices 0–5). Visiting neighbours in ascending order, what is the DFS (recursive) order from vertex 0 (reachable vertices only)?`, list(order), variants(order), `DFS goes as deep as possible before backtracking: ${list(order)}.`, 'MEDIUM'); });
[
    ['What is the time complexity of finding the kth smallest element using a min-heap built from n elements?', 'O(n + k log n)', ['O(n log n)', 'O(k)', 'O(n²)'], 'Heapify costs O(n); k extractions cost O(k log n).', 'HARD'],
    ['The recurrence T(n) = 2T(n/2) + n has solution', 'Θ(n log n)', ['Θ(n)', 'Θ(n²)', 'Θ(log n)'], 'By the Master theorem (a = 2, b = 2, f(n) = n) it is Θ(n log n).', 'MEDIUM'],
    ['The recurrence T(n) = T(n/2) + 1 has solution', 'Θ(log n)', ['Θ(n)', 'Θ(n log n)', 'Θ(1)'], 'Each step halves the input at constant cost.', 'MEDIUM'],
    ['The recurrence T(n) = 3T(n/2) + n² has solution', 'Θ(n²)', ['Θ(n^1.58)', 'Θ(n² log n)', 'Θ(n³)'], 'a = 3 < b^d = 4 so the n² term dominates.', 'HARD'],
    ['What is the worst-case time complexity of quicksort with the first element as pivot on a sorted array?', 'O(n²)', ['O(n log n)', 'O(n)', 'O(log n)'], 'Every partition is maximally unbalanced.', 'MEDIUM'],
    ['Which data structure gives O(log n) insertion, deletion and minimum lookup in the worst case?', 'Balanced BST / heap-based priority queue', ['Unsorted array', 'Singly linked list', 'Hash table'], 'Balanced trees and heaps guarantee logarithmic bounds.', 'MEDIUM'],
    ['The number of edges in a complete graph with n vertices is', 'n(n − 1)/2', ['n²', 'n − 1', '2n'], 'Each pair of vertices is joined by one edge.', 'EASY'],
    ['Which traversal of a binary tree can be used to copy the tree?', 'Preorder', ['Inorder', 'Level order only', 'None'], 'Preorder visits a node before its children, allowing reconstruction.', 'MEDIUM'],
    ['The minimum number of nodes in an AVL tree of height 4 (height of a single node = 1) is', '12', ['10', '15', '20'], 'N(h) = N(h−1) + N(h−2) + 1: 1, 2, 4, 7, 12.', 'HARD'],
    ['A binary tree has 10 leaf nodes and every internal node has exactly 2 children. How many nodes are in the tree?', '19', ['20', '21', '18'], 'Full binary tree: internal = leaves − 1 = 9; total = 19.', 'MEDIUM'],
    ['Which sorting algorithm needs the fewest swaps (writes) to sort an array?', 'Selection sort', ['Bubble sort', 'Insertion sort', 'Quick sort'], 'Selection sort performs at most n − 1 swaps.', 'HARD'],
    ['Dijkstra\'s algorithm with a binary heap on a graph with V vertices and E edges runs in', 'O((V + E) log V)', ['O(V²) always', 'O(E)', 'O(V log E)'], 'Each edge relaxation may update the heap in O(log V).', 'HARD'],
    ['Which of the following problems is NP-complete?', 'Travelling salesman (decision version)', ['Sorting', 'Binary search', 'Shortest path with positive weights'], 'TSP decision is a classic NP-complete problem.', 'MEDIUM'],
    ['In a hash table with chaining, the expected cost of an unsuccessful search with load factor α is', 'Θ(1 + α)', ['Θ(log n)', 'Θ(n)', 'Θ(α²)'], 'Compute the hash and scan a chain of expected length α.', 'HARD'],
    ['The Floyd–Warshall algorithm solves the all-pairs shortest path problem in', 'O(V³)', ['O(V²)', 'O(V E)', 'O(E log V)'], 'Three nested loops over vertices.', 'MEDIUM'],
    ['SELECT COUNT(*) FROM t WHERE x IS NULL returns the number of rows where', 'x has no value', ['x equals 0', 'x equals empty string', 'x is not null'], 'IS NULL matches missing values only.', 'MEDIUM'],
    ['Which SQL query returns the second highest salary from Emp(salary)?', 'SELECT MAX(salary) FROM Emp WHERE salary < (SELECT MAX(salary) FROM Emp)', ['SELECT MIN(salary) FROM Emp', 'SELECT salary FROM Emp ORDER BY salary LIMIT 2', 'SELECT MAX(salary) - 1 FROM Emp'], 'The inner query finds the maximum; the outer finds the maximum below it.', 'MEDIUM'],
    ['A relation R(A, B, C, D) has FDs A → B, B → C. Which is a candidate key?', 'AD', ['A', 'B', 'AB'], 'AD determines B and C through the chain and itself covers D.', 'HARD'],
    ['If R(A, B, C) has FDs A → B and B → C, the highest normal form of R is', '2NF', ['1NF', '3NF', 'BCNF'], 'The transitive dependency A → B → C violates 3NF, but there is no partial dependency.', 'HARD'],
    ['In SQL, which join returns rows with matches in both tables plus unmatched rows from both?', 'FULL OUTER JOIN', ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN'], 'FULL OUTER keeps unmatched rows from each side.', 'MEDIUM'],
    ['Two-phase locking guarantees', 'conflict serialisability', ['deadlock freedom', 'recoverability only', 'no cascading aborts'], '2PL schedules are conflict serialisable, but deadlocks can occur.', 'HARD'],
    ['Which isolation level prevents dirty reads but allows non-repeatable reads?', 'Read committed', ['Read uncommitted', 'Repeatable read', 'Serializable'], 'Read committed only reads committed data.', 'MEDIUM'],
    ['A deadlock-prevention technique that requires processes to request all resources at once breaks which condition?', 'Hold and wait', ['Mutual exclusion', 'No pre-emption', 'Circular wait'], 'A process never holds some resources while waiting for others.', 'MEDIUM'],
    ['With a page size of 4 KB and a 32-bit virtual address, how many bits form the page offset?', '12', ['10', '20', '32'], '4 KB = 2^12 bytes.', 'MEDIUM'],
    ['A system uses a 2-level page table with 32-bit addresses and 4 KB pages, 10 bits for the outer index. How many bits index the inner table?', '10', ['12', '8', '20'], '32 − 12 (offset) − 10 (outer) = 10.', 'HARD'],
    ['Belady\'s anomaly can occur with which page replacement algorithm?', 'FIFO', ['LRU', 'Optimal', 'LFU always'], 'Adding frames can increase FIFO faults.', 'MEDIUM'],
    ['Which scheduling algorithm is provably optimal for minimising average waiting time (non-preemptive, all arrive at 0)?', 'Shortest Job First', ['FCFS', 'Round robin', 'Priority'], 'SJF minimises average waiting time.', 'MEDIUM'],
    ['A semaphore initialised to 1 and used for mutual exclusion is called', 'a binary semaphore (mutex)', ['a counting semaphore only', 'a monitor', 'a spinlock'], 'Values 0/1 enforce exclusive access.', 'EASY'],
    ['In TCP, the three-way handshake consists of', 'SYN, SYN-ACK, ACK', ['SYN, ACK, FIN', 'ACK, SYN, ACK', 'SYN, FIN, ACK'], 'The client sends SYN, the server replies SYN-ACK, the client ACKs.', 'MEDIUM'],
    ['Which protocol resolves an IP address to a MAC address on a LAN?', 'ARP', ['DNS', 'DHCP', 'ICMP'], 'ARP maps IP addresses to link-layer addresses.', 'MEDIUM'],
    ['The maximum size of a TCP window with the standard 16-bit window field (no scaling) is', '65535 bytes', ['1024 bytes', '16383 bytes', '4 GB'], '2^16 − 1 bytes.', 'HARD'],
    ['Which HTTP status code indicates that the resource has been permanently moved?', '301', ['302', '304', '404'], '301 Moved Permanently.', 'MEDIUM'],
    ['In public-key cryptography, a digital signature is created using', 'the sender\'s private key', ['the receiver\'s private key', 'the sender\'s public key', 'a shared secret'], 'Only the signer\'s private key can produce a signature others verify with the public key.', 'MEDIUM'],
    ['What is printed by `System.out.println(10 + 20 + "30" + 40 + 50);` in Java?', '30304050', ['102030405', '150', '3030405'], '10+20 = 30 (int), then string concatenation: "30" + "30" + "40" + "50".', 'HARD'],
    ['What is the output of `print(len(set("mississippi")))` in Python?', '4', ['11', '5', '3'], 'The distinct letters are m, i, s, p.', 'MEDIUM'],
    ['What is the output of `print([i*i for i in range(5) if i % 2 == 0])` in Python?', '[0, 4, 16]', ['[0, 1, 4, 9, 16]', '[1, 9]', '[0, 2, 4]'], 'Even i in 0..4: 0, 2, 4 → squares 0, 4, 16.', 'MEDIUM'],
    ['What is the output of `a = [1, 2, 3]; b = a; b.append(4); print(len(a))` in Python?', '4', ['3', '1', 'Error'], 'b and a reference the same list.', 'MEDIUM'],
    ['In C, what is the value of `sizeof(char)`?', '1', ['2', '4', 'Implementation defined'], 'sizeof(char) is defined to be 1.', 'MEDIUM'],
    ['What does `int x = 5; printf("%d", x++ + ++x);` evaluate to in typical compilers (ignoring undefined behaviour concerns)?', 'Undefined behaviour', ['12', '11', '10'], 'Modifying x twice without a sequence point is undefined behaviour.', 'HARD'],
    ['What will `console.log(0.1 + 0.2 === 0.3)` print in JavaScript?', 'false', ['true', 'NaN', 'undefined'], 'Floating-point rounding makes the sum 0.30000000000000004.', 'MEDIUM'],
    ['What does `[1, 2, 3].map(parseInt)` return in JavaScript?', '[1, NaN, NaN]', ['[1, 2, 3]', '[NaN, NaN, NaN]', '[1, 2, NaN]'], 'map passes (value, index): parseInt(2, 1) and parseInt(3, 2) are NaN.', 'HARD'],
    ['Which design principle states that a class should have only one reason to change?', 'Single Responsibility Principle', ['Open/Closed Principle', 'Liskov Substitution Principle', 'Dependency Inversion Principle'], 'The "S" of SOLID.', 'MEDIUM'],
    ['Which of these is NOT a guarantee of the CAP theorem trade-off for a partitioned distributed system?', 'Having consistency, availability and partition tolerance simultaneously', ['Choosing consistency over availability', 'Choosing availability over consistency', 'Tolerating network partitions'], 'During a partition you must trade consistency against availability.', 'HARD'],
    ['In Git, which command combines the commits of one branch into the current branch creating a merge commit?', 'git merge', ['git rebase -i', 'git cherry-pick', 'git reset --hard'], 'git merge joins histories with a merge commit.', 'EASY'],
].forEach(([t, c, w, e, d]) => add('TECHNICAL', 'Concepts & Output', 'Advanced', t, c, w, e, d));
async function main() {
    const cats = new Map((await prisma.questionCategory.findMany()).map((c) => [c.code, c.id]));
    if (!cats.has('TECHNICAL'))
        throw new Error('Run `npm run db:seed` first.');
    const existing = new Set((await prisma.question.findMany({ select: { text: true } })).map((q) => q.text));
    const fresh = out.filter((q) => !existing.has(q.text));
    const rows = fresh.map((q) => ({ id: randomUUID(), q }));
    await prisma.$transaction(async (tx) => {
        await tx.question.createMany({ data: rows.map(({ id, q }) => ({ id, categoryId: cats.get(q.cat), topic: q.topic, subtopic: q.sub, text: q.text, explanation: q.explanation, difficulty: q.diff, marks: 1, negativeMarks: 0.25, status: 'PUBLISHED' })) });
        await tx.questionOption.createMany({ data: rows.flatMap(({ id, q }) => q.options.map((text, i) => ({ questionId: id, position: i, text, isCorrect: i === q.correct }))) });
    }, { timeout: 120000 });
    const by = (c) => out.filter((q) => q.cat === c).length;
    const d = (x) => out.filter((q) => q.diff === x).length;
    console.log(`✔ Generated ${out.length} (Technical ${by('TECHNICAL')}, Quant ${by('QUANT')}, Logical ${by('LOGICAL')}, Verbal ${by('VERBAL')}) — Easy ${d('EASY')}, Medium ${d('MEDIUM')}, Hard ${d('HARD')}; inserted ${fresh.length} new.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
