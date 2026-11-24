/**
 * Seeds the question bank with 600+ questions. Aptitude/reasoning/verbal questions are generated from
 * parameterised templates with computed answers; technical questions are curated.
 * Idempotent: questions whose text already exists are skipped. Safe to run many times.
 */
import { randomUUID } from 'node:crypto';
import { prisma } from '../db.js';
// deterministic RNG so reruns generate the same set
let seed = 20261103;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
} return b; };
const sample = (a, n) => shuffle(a).slice(0, n);
const gcd = (x, y) => (y ? gcd(y, x % y) : x);
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
/** Numeric distractors around the right answer. */
function near(c, dec = 0) {
    const step = Math.max(dec ? 0.5 : 1, Math.round(Math.abs(c) * 0.1 * 10) / 10);
    const cands = [c + step, c - step, c + 2 * step, c - 2 * step, c + 3 * step, c - 3 * step, c * 2, Math.round(c / 2)].map((x) => (dec ? Math.round(x * 100) / 100 : Math.round(x)));
    return [...new Set(cands.filter((x) => x > 0 && x !== c))].slice(0, 8);
}
const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
const gen = (n, f) => { let tries = 0, made = 0; while (made < n && tries++ < n * 30)
    if (f() !== false)
        made++; };
/* ============================ QUANTITATIVE ============================ */
gen(14, () => { const p = pick([5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 60, 75]); const v = pick([80, 120, 160, 200, 240, 320, 400, 480, 600, 800, 1200, 1500]); const c = (p * v) / 100; return add('QUANT', 'Percentages', 'Basic percentage', `What is ${p}% of ${v}?`, String(c), near(c).map(String), `${p}% of ${v} = ${p}/100 × ${v} = ${c}.`, 'EASY'); });
gen(10, () => { const a = pick([200, 250, 400, 500, 800, 1000]); const p = pick([10, 20, 25, 30, 40, 50]); const c = a + (a * p) / 100; return add('QUANT', 'Percentages', 'Increase', `A salary of ${inr(a)} is increased by ${p}%. What is the new salary?`, inr(c), near(c).map(inr), `New = ${a} × (1 + ${p}/100) = ${c}.`, 'EASY'); });
gen(10, () => { const a = pick([40, 50, 60, 80, 120, 150]); const b = pick([10, 20, 25, 40, 50]); const target = (a * b) / 100; const c = Math.round((target / a) * 100); return add('QUANT', 'Percentages', 'Percentage of', `${target} is what percent of ${a}?`, `${c}%`, near(c).map((x) => `${x}%`), `(${target}/${a}) × 100 = ${c}%.`, 'EASY'); });
gen(12, () => { const cp = pick([400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500]); const p = pick([10, 20, 25, 30, 40]); const sp = cp + (cp * p) / 100; return add('QUANT', 'Profit & Loss', 'Selling price', `An article bought for ${inr(cp)} is sold at a profit of ${p}%. Find the selling price.`, inr(sp), near(sp).map(inr), `SP = CP × (100 + ${p})/100 = ${sp}.`, 'EASY'); });
gen(10, () => { const cp = pick([500, 800, 1000, 1500, 2000, 2400]); const l = pick([10, 20, 25, 30]); const sp = cp - (cp * l) / 100; return add('QUANT', 'Profit & Loss', 'Loss', `A trader sells an item for ${inr(sp)} incurring a loss of ${l}%. What was the cost price?`, inr(cp), near(cp).map(inr), `CP = SP × 100/(100 − ${l}) = ${cp}.`, 'MEDIUM'); });
gen(12, () => { const m = pick([500, 800, 1000, 1200, 1500, 2000, 2500]); const d = pick([10, 20, 25, 30, 40]); const sp = m - (m * d) / 100; return add('QUANT', 'Profit & Loss', 'Discount', `The marked price of a shirt is ${inr(m)}. A discount of ${d}% is offered. What is the price paid?`, inr(sp), near(sp).map(inr), `Price = ${m} × (1 − ${d}/100) = ${sp}.`, 'EASY'); });
gen(12, () => { const p = pick([1000, 2000, 2500, 4000, 5000, 8000]); const r = pick([5, 8, 10, 12]); const t = pick([2, 3, 4, 5]); const si = (p * r * t) / 100; return add('QUANT', 'Simple & Compound Interest', 'Simple interest', `Find the simple interest on ${inr(p)} at ${r}% per annum for ${t} years.`, inr(si), near(si).map(inr), `SI = P×R×T/100 = ${p}×${r}×${t}/100 = ${si}.`, 'EASY'); });
gen(10, () => { const p = pick([1000, 2000, 3000, 4000, 5000, 8000, 10000]); const ci = Math.round(p * 0.21); return add('QUANT', 'Simple & Compound Interest', 'Compound interest', `Find the compound interest on ${inr(p)} at 10% per annum for 2 years, compounded annually.`, inr(ci), near(ci).map(inr), `A = ${p} × 1.1² = ${p * 1.21}; CI = A − P = ${ci}.`, 'MEDIUM'); });
gen(8, () => { const p = pick([2000, 4000, 5000, 8000, 10000]); const si = (p * 10 * 2) / 100; const ci = p * 0.21; const d = ci - si; return add('QUANT', 'Simple & Compound Interest', 'Difference CI-SI', `What is the difference between CI and SI on ${inr(p)} at 10% per annum for 2 years?`, inr(d), near(d).map(inr), `CI = ${ci}, SI = ${si}; difference = ${d}. (Shortcut: P(R/100)² = ${d}).`, 'MEDIUM'); });
const workPairs = [[12, 6], [20, 30], [15, 10], [18, 9], [24, 8], [30, 15], [40, 10], [12, 4], [36, 18], [60, 20], [45, 15], [20, 5], [30, 20], [16, 16], [28, 7], [10, 15], [25, 100 / 3]].filter((p) => Number.isInteger((p[0] * p[1]) / (p[0] + p[1])));
workPairs.slice(0, 14).forEach(([a, b]) => { const c = (a * b) / (a + b); add('QUANT', 'Time & Work', 'Combined work', `A can finish a job in ${a} days and B in ${b} days. Working together, in how many days will they finish it?`, `${c} days`, near(c).map((x) => `${x} days`), `Combined rate = 1/${a} + 1/${b} = ${a + b}/${a * b}. Time = ${a * b}/${a + b} = ${c} days.`, 'MEDIUM'); });
workPairs.slice(2, 10).forEach(([a, b]) => { const c = (a * b) / (a + b); add('QUANT', 'Time & Work', 'Pipes and cisterns', `Pipe A fills a tank in ${a} hours and pipe B in ${b} hours. If both are opened together, how long to fill the empty tank?`, `${c} hours`, near(c).map((x) => `${x} hours`), `Rate = 1/${a} + 1/${b}; time = ${a * b}/${a + b} = ${c} h.`, 'MEDIUM'); });
gen(10, () => { const s = pick([30, 40, 45, 50, 60, 72, 80]); const t = pick([2, 3, 4, 5, 6]); const c = s * t; return add('QUANT', 'Time, Speed & Distance', 'Distance', `A car travels at ${s} km/h for ${t} hours. How far does it travel?`, `${c} km`, near(c).map((x) => `${x} km`), `Distance = speed × time = ${s} × ${t} = ${c} km.`, 'EASY'); });
[[40, 60, 48], [30, 60, 40], [20, 30, 24], [60, 90, 72], [30, 45, 36], [50, 75, 60], [40, 120, 60], [20, 60, 30], [10, 15, 12], [25, 75, 37.5]].forEach(([x, y, c]) => add('QUANT', 'Time, Speed & Distance', 'Average speed', `A man travels a certain distance at ${x} km/h and returns the same way at ${y} km/h. What is his average speed for the round trip?`, `${c} km/h`, near(c, 1).map((v) => `${v} km/h`), `Average speed = 2xy/(x+y) = 2×${x}×${y}/${x + y} = ${c} km/h.`, 'MEDIUM'));
gen(14, () => { const v = pick([36, 54, 72, 90, 108]); const ms = (v * 5) / 18; const L = ms * pick([6, 8, 10, 12, 15]); const t = L / ms; return add('QUANT', 'Time, Speed & Distance', 'Trains', `A train ${L} m long runs at ${v} km/h. How many seconds will it take to pass a signal pole?`, `${t} seconds`, near(t).map((x) => `${x} seconds`), `Speed = ${v} × 5/18 = ${ms} m/s; time = ${L}/${ms} = ${t} s.`, 'MEDIUM'); });
gen(14, () => { const ms = pick([10, 15, 20, 25]); const t1 = pick([6, 8, 10, 12]); const L = ms * t1; const P = pick([100, 150, 200, 250, 300, 360, 400]); const t = (L + P) / ms; if (!Number.isInteger(t))
    return false; return add('QUANT', 'Time, Speed & Distance', 'Trains', `A train ${L} m long passes a pole in ${t1} seconds. How long will it take to completely cross a platform ${P} m long at the same speed?`, `${t} seconds`, near(t).map((x) => `${x} seconds`), `Speed = ${L}/${t1} = ${ms} m/s. Distance = ${L}+${P} = ${L + P} m. Time = ${t} s.`, 'MEDIUM'); });
gen(8, () => { const b = pick([10, 12, 15, 18, 20]); const s = pick([2, 3, 4, 5]); const t = pick([2, 3, 4, 5]); const d = (b + s) * t; return add('QUANT', 'Time, Speed & Distance', 'Boats and streams', `A boat's speed in still water is ${b} km/h and the stream flows at ${s} km/h. How long will it take to travel ${d} km downstream?`, `${t} hours`, near(t).map((x) => `${x} hours`), `Downstream speed = ${b}+${s} = ${b + s} km/h; time = ${d}/${b + s} = ${t} h.`, 'MEDIUM'); });
gen(10, () => { const [a, b] = pick([[2, 3], [3, 5], [4, 5], [3, 7], [5, 7], [1, 4], [2, 5], [3, 4]]); const k = pick([100, 120, 150, 200, 240, 300]); const N = k * (a + b); const big = k * Math.max(a, b); return add('QUANT', 'Ratio & Proportion', 'Sharing', `${inr(N)} is divided between two people in the ratio ${a}:${b}. What is the larger share?`, inr(big), near(big).map(inr), `Total parts = ${a + b}; one part = ${k}; larger share = ${Math.max(a, b)} × ${k} = ${big}.`, 'EASY'); });
gen(10, () => { const [a, b] = pick([[3, 5], [4, 7], [2, 3], [5, 6], [3, 4]]); const k = pick([2, 3, 4, 5, 6]); const S = (a + b) * k; return add('QUANT', 'Ratio & Proportion', 'Ages', `The ages of two brothers are in the ratio ${a}:${b} and their ages sum to ${S} years. What is the age of the elder brother?`, `${Math.max(a, b) * k} years`, near(Math.max(a, b) * k).map((x) => `${x} years`), `One part = ${S}/${a + b} = ${k}; elder = ${Math.max(a, b)} × ${k} = ${Math.max(a, b) * k}.`, 'MEDIUM'); });
gen(10, () => { const n = pick([4, 5, 6, 8]); const base = pick([10, 12, 15, 20, 25, 30]); const nums = Array.from({ length: n }, (_, i) => base + i * 2); const avg = nums.reduce((a, b) => a + b, 0) / n; return add('QUANT', 'Averages', 'Arithmetic mean', `Find the average of ${nums.join(', ')}.`, String(avg), near(avg, 1).map(String), `Sum = ${nums.reduce((a, b) => a + b, 0)}; average = sum/${n} = ${avg}.`, 'EASY'); });
gen(8, () => { const n = pick([5, 6, 8, 10]); const avg = pick([20, 25, 30, 40]); const nw = pick([10, 15, 18, 25]); const newAvg = (n * avg + nw) / (n + 1); if (!Number.isInteger(newAvg))
    return false; return add('QUANT', 'Averages', 'Adding a value', `The average of ${n} numbers is ${avg}. When one more number, ${nw}, is included, what is the new average?`, String(newAvg), near(newAvg).map(String), `New sum = ${n}×${avg}+${nw} = ${n * avg + nw}; ÷${n + 1} = ${newAvg}.`, 'MEDIUM'); });
gen(12, () => { const [a, b] = pick([[12, 18], [8, 12], [15, 20], [14, 21], [16, 24], [18, 24], [9, 15], [20, 30], [10, 25], [21, 35]]); const g = gcd(a, b); const l = (a * b) / g; return add('QUANT', 'Number System', 'HCF and LCM', `Find the LCM of ${a} and ${b}.`, String(l), near(l).map(String), `HCF = ${g}; LCM = (${a}×${b})/${g} = ${l}.`, 'EASY'); });
gen(8, () => { const [a, b] = pick([[24, 36], [48, 72], [30, 45], [60, 84], [54, 90], [42, 70], [36, 60], [28, 42]]); const g = gcd(a, b); return add('QUANT', 'Number System', 'HCF and LCM', `What is the HCF of ${a} and ${b}?`, String(g), near(g).map(String), `Common factors of ${a} and ${b} give HCF = ${g}.`, 'EASY'); });
gen(8, () => { const n = pick([6, 7, 8, 9, 10]); const r = pick([2, 3]); const f = (x) => (x <= 1 ? 1 : x * f(x - 1)); const c = f(n) / (f(r) * f(n - r)); return add('QUANT', 'Permutation & Combination', 'Combinations', `In how many ways can a committee of ${r} be chosen from ${n} people?`, String(c), near(c).map(String), `nCr = ${n}!/(${r}!×${n - r}!) = ${c}.`, 'MEDIUM'); });
gen(6, () => { const n = pick([4, 5, 6, 7]); const f = (x) => (x <= 1 ? 1 : x * f(x - 1)); return add('QUANT', 'Permutation & Combination', 'Arrangements', `In how many ways can ${n} different books be arranged on a shelf?`, String(f(n)), near(f(n)).map(String), `${n}! = ${f(n)}.`, 'EASY'); });
gen(8, () => { const x = pick([12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 25]); return add('QUANT', 'Number System', 'Squares and roots', `What is the value of √${x * x}?`, String(x), near(x).map(String), `${x} × ${x} = ${x * x}.`, 'EASY'); });
gen(8, () => { const a = pick([24, 36, 48, 60, 72, 84]); const b = pick([8, 12, 15, 16, 18, 20]); const c = pick([12, 20, 30]); const t = (b * 10 * c * 2) / a; if (!Number.isInteger(t))
    return false; return add('QUANT', 'Ratio & Proportion', 'Direct proportion', `If ${a} workers make ${b * 10} items, how many items will ${c * 2} workers make at the same rate?`, String((b * 10 * c * 2) / a), near((b * 10 * c * 2) / a).map(String), `Items per worker = ${b * 10}/${a}; × ${c * 2} workers = ${(b * 10 * c * 2) / a}.`, 'MEDIUM'); });
gen(8, () => { const k = pick([2, 3, 4, 5, 6]); const x = pick([5, 8, 10, 12]); const rhs = k * x + pick([3, 7, 9]); const c = x; const add2 = rhs - k * x; return add('QUANT', 'Algebra', 'Linear equations', `Solve for x: ${k}x + ${add2} = ${rhs}.`, String(c), near(c).map(String), `${k}x = ${rhs} − ${add2} = ${k * x}, so x = ${c}.`, 'EASY'); });
[
    ['What is the probability of getting a 6 when a fair die is rolled once?', '1/6', ['1/3', '1/2', '5/6'], 'One favourable outcome out of 6.'],
    ['What is the probability of getting an odd number when a fair die is rolled?', '1/2', ['1/3', '2/3', '1/6'], 'Odd numbers 1, 3, 5 → 3/6 = 1/2.'],
    ['Two fair coins are tossed. What is the probability of getting two heads?', '1/4', ['1/2', '1/3', '3/4'], 'Outcomes HH, HT, TH, TT → 1/4.'],
    ['A bag has 3 red and 5 blue balls. One ball is drawn at random. What is the probability it is red?', '3/8', ['5/8', '1/3', '3/5'], '3 red out of 8 balls.'],
    ['A card is drawn from a standard deck of 52. What is the probability it is a king?', '1/13', ['1/52', '1/4', '4/13'], '4 kings out of 52 cards = 1/13.'],
    ['Two dice are rolled. What is the probability that the sum is 7?', '1/6', ['1/12', '5/36', '7/36'], '6 favourable pairs out of 36 = 1/6.'],
].forEach(([t, c, w, e]) => add('QUANT', 'Probability', 'Basic probability', t, c, w, e, 'EASY'));
/* ============================ LOGICAL REASONING ============================ */
gen(14, () => { const a = pick([2, 3, 5, 7, 10, 11]); const d = pick([3, 4, 5, 6, 7, 9]); const s = Array.from({ length: 5 }, (_, i) => a + i * d); const c = a + 5 * d; return add('LOGICAL', 'Number Series', 'Arithmetic', `Find the next number: ${s.join(', ')}, ?`, String(c), near(c).map(String), `Common difference is ${d}; next = ${s[4]} + ${d} = ${c}.`, 'EASY'); });
gen(10, () => { const a = pick([1, 2, 3, 4, 5]); const r = pick([2, 3, 4]); const s = Array.from({ length: 4 }, (_, i) => a * r ** i); const c = a * r ** 4; return add('LOGICAL', 'Number Series', 'Geometric', `What comes next: ${s.join(', ')}, ?`, String(c), near(c).map(String), `Each term is multiplied by ${r}; next = ${s[3]} × ${r} = ${c}.`, 'MEDIUM'); });
gen(8, () => { const n = pick([2, 3, 4, 5, 6, 7]); const s = Array.from({ length: 4 }, (_, i) => (n + i) ** 2); const c = (n + 4) ** 2; return add('LOGICAL', 'Number Series', 'Squares', `Complete the series: ${s.join(', ')}, ?`, String(c), near(c).map(String), `Squares of consecutive numbers: ${n}², ${n + 1}², ... next is ${n + 4}² = ${c}.`, 'EASY'); });
gen(10, () => { const a = pick([1, 2, 3, 5]); const s = [a]; for (let i = 1; i < 6; i++)
    s.push(s[i - 1] + i + 1); const c = s[5] + 7; return add('LOGICAL', 'Number Series', 'Differences', `Find the missing term: ${s.join(', ')}, ?`, String(c), near(c).map(String), `Differences increase by 1 each time (2,3,4,5,6,…); next difference is 7 → ${c}.`, 'MEDIUM'); });
gen(10, () => { const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const st = pick([0, 1, 2, 3, 4]); const k = pick([2, 3]); const s = Array.from({ length: 4 }, (_, i) => L[st + i * k]); const c = L[st + 4 * k]; return add('LOGICAL', 'Letter Series', 'Skip pattern', `Find the next letter: ${s.join(', ')}, ?`, c, sample(L.split('').filter((x) => x !== c), 3), `Letters advance by ${k} positions each time, so next is ${c}.`, 'EASY'); });
gen(14, () => { const w = pick(['CAT', 'DOG', 'BAT', 'MAN', 'SUN', 'PEN', 'BOX', 'CUP', 'HAT', 'KEY']); const k = pick([1, 2, 3]); const sh = (s, n) => s.split('').map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + n) % 26) + 65)).join(''); const w2 = pick(['FAN', 'RED', 'MAP', 'TOP', 'JAR', 'BED']); return add('LOGICAL', 'Coding-Decoding', 'Letter shift', `If ${w} is written as ${sh(w, k)}, how will ${w2} be written in the same code?`, sh(w2, k), [sh(w2, k + 1), sh(w2, k - 1 + 26), sh(w2, k + 2)], `Each letter is shifted forward by ${k}. ${w2} → ${sh(w2, k)}.`, 'MEDIUM'); });
gen(8, () => { const w = pick(['PLAN', 'WORK', 'TEAM', 'CODE', 'FILE', 'DATA']); return add('LOGICAL', 'Coding-Decoding', 'Reversal', `In a certain code, ${w} is written as ${w.split('').reverse().join('')}. How is ${w === 'PLAN' ? 'STAR' : 'PLAN'} written?`, (w === 'PLAN' ? 'STAR' : 'PLAN').split('').reverse().join(''), ['STRA', 'RATS ', 'ALNP'].map((x) => x.trim()).concat(['NLAP']), 'The code reverses the letters of the word.', 'EASY'); });
gen(10, () => { const m = pick([3, 4, 5, 6, 7, 9]); const nums = [m * 2, m * 4, m * 6, m * 7 + 1 === m * 7 ? m * 7 + 2 : m * 7 + 1].map((x) => x); const odd = nums[3]; return add('LOGICAL', 'Odd One Out', 'Numbers', `Which number does not belong to the group? ${shuffle(nums).join(', ')}`, String(odd), nums.slice(0, 3).map(String), `All the others are multiples of ${m}; ${odd} is not.`, 'EASY'); });
gen(10, () => { const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15], [12, 16, 20], [7, 24, 25], [15, 20, 25]]); const dir = pick([['north', 'east'], ['south', 'west'], ['east', 'south'], ['west', 'north']]); return add('LOGICAL', 'Direction Sense', 'Distance', `A man walks ${a} km ${dir[0]}, then turns and walks ${b} km ${dir[1]}. How far is he from the starting point?`, `${c} km`, near(c).map((x) => `${x} km`).concat([`${a + b} km`]), `The two legs are perpendicular: √(${a}² + ${b}²) = ${c} km.`, 'MEDIUM'); });
gen(10, () => { const n = pick([40, 45, 50, 60, 36, 48]); const r = pick([5, 8, 12, 15, 17, 20]); const c = n - r + 1; return add('LOGICAL', 'Ranking', 'Position from bottom', `In a class of ${n} students, Anil's rank from the top is ${r}. What is his rank from the bottom?`, String(c), near(c).map(String), `Rank from bottom = total − rank from top + 1 = ${n} − ${r} + 1 = ${c}.`, 'EASY'); });
{
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    gen(12, () => { const s = pick([0, 1, 2, 3, 4, 5, 6]); const k = pick([10, 15, 20, 30, 45, 60, 100, 45, 75]); const c = days[(s + k) % 7]; return add('LOGICAL', 'Calendar', 'Day calculation', `If today is ${days[s]}, what day of the week will it be after ${k} days?`, c, sample(days.filter((d) => d !== c), 3), `${k} mod 7 = ${k % 7}; ${days[s]} + ${k % 7} day(s) = ${c}.`, 'MEDIUM'); });
}
gen(10, () => { const h = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]); const a = Math.min(h * 30, 360 - h * 30); return add('LOGICAL', 'Clocks', 'Angle between hands', `What is the angle between the hour hand and the minute hand at ${h}:00?`, `${a}°`, near(a).map((x) => `${x}°`).concat(['90°']), `Each hour is 30°. At ${h}:00 the angle is ${h} × 30 = ${h * 30}° (smaller angle ${a}°).`, 'EASY'); });
gen(8, () => { const x = pick([3, 4, 5, 6, 7, 8]); const y = pick([2, 3, 4]); return add('LOGICAL', 'Mathematical Reasoning', 'Symbol operation', `If a ★ b = 2a + b, what is ${x} ★ ${y}?`, String(2 * x + y), near(2 * x + y).map(String), `2×${x} + ${y} = ${2 * x + y}.`, 'EASY'); });
gen(8, () => { const x = pick([4, 5, 6, 7, 8, 9]); const y = pick([2, 3]); return add('LOGICAL', 'Mathematical Reasoning', 'Symbol operation', `If a # b = a² − b², find ${x} # ${y}.`, String(x * x - y * y), near(x * x - y * y).map(String), `${x}² − ${y}² = ${x * x} − ${y * y} = ${x * x - y * y}.`, 'MEDIUM'); });
[
    ['All cats are animals. All animals are living beings.', 'All cats are living beings.', ['Some living beings are not cats', 'No cat is an animal', 'All living beings are cats'], 'Syllogism: A⊂B, B⊂C ⇒ A⊂C.'],
    ['All pens are books. Some books are pencils.', 'No definite relation between pens and pencils', ['All pens are pencils', 'Some pens are pencils', 'No pen is a pencil'], 'The middle term is only partly distributed, so nothing definite follows.'],
    ['Some doctors are teachers. All teachers are honest.', 'Some doctors are honest', ['All doctors are honest', 'No doctor is honest', 'All honest are doctors'], 'The doctors who are teachers must be honest.'],
    ['No rose is blue. All blue things are flowers.', 'Some flowers are not roses', ['All roses are flowers', 'No flower is a rose', 'All flowers are blue'], 'Blue things are flowers and none is a rose, so some flowers are not roses.'],
    ['All metals conduct electricity. Copper is a metal.', 'Copper conducts electricity', ['Copper does not conduct electricity', 'Only copper conducts electricity', 'Some metals are copper only'], 'Direct application of a universal statement.'],
    ['Some fruits are sweet. All sweet things are tasty.', 'Some fruits are tasty', ['All fruits are tasty', 'No fruit is tasty', 'All tasty things are fruits'], 'The sweet fruits are tasty.'],
].forEach(([p, c, w, e]) => add('LOGICAL', 'Syllogism', 'Conclusions', `Statements: ${p}\nWhich conclusion follows?`, c, w, e, 'MEDIUM'));
[
    ['Pointing to a photograph, Ravi said, "She is the daughter of my father\'s only son." How is the girl related to Ravi?', 'Niece', ['Sister', 'Cousin', 'Aunt'], 'My father\'s only son is Ravi himself, so she is Ravi\'s daughter... which makes her his daughter.', 'Daughter'],
    ['A is the brother of B. B is the sister of C. C is the father of D. How is A related to D?', 'Uncle', ['Father', 'Brother', 'Grandfather'], 'A and C are siblings, so A is the paternal uncle of D.'],
    ['P is the mother of Q. Q is the sister of R. R is the son of S. How is S related to P?', 'Husband', ['Brother', 'Son', 'Father'], 'P and S are the parents of Q and R, so S is P\'s husband.'],
    ['Pointing to a man, Sita says "His mother is the only daughter of my mother". How is the man related to Sita?', 'Son', ['Brother', 'Nephew', 'Cousin'], 'Only daughter of Sita\'s mother is Sita; so the man\'s mother is Sita and he is her son.'],
    ['If A is the father of B and B is the mother of C, how is A related to C?', 'Grandfather', ['Father', 'Uncle', 'Brother'], 'A is the father of C\'s mother, i.e. maternal grandfather.'],
].forEach(([t, c, w, e, fix]) => { if (fix)
    return add('LOGICAL', 'Blood Relations', 'Relationships', t, fix, ['Niece', 'Sister', 'Cousin'], e, 'MEDIUM'); return add('LOGICAL', 'Blood Relations', 'Relationships', t, c, w, e, 'MEDIUM'); });
gen(8, () => { const names = ['Asha', 'Bala', 'Charu', 'Dev', 'Esha']; const order = shuffle(names); return add('LOGICAL', 'Ordering', 'Tallest person', `${order[0]} is taller than ${order[1]}. ${order[1]} is taller than ${order[2]}. ${order[2]} is taller than ${order[3]}. Who is the shortest among these four?`, order[3], [order[0], order[1], order[2]], `The chain gives ${order.slice(0, 4).join(' > ')}, so ${order[3]} is shortest.`, 'EASY'); });
/* ============================ VERBAL ABILITY ============================ */
const syn = [['Abundant', 'Plentiful'], ['Brief', 'Concise'], ['Candid', 'Frank'], ['Diligent', 'Hardworking'], ['Eminent', 'Distinguished'], ['Frugal', 'Thrifty'], ['Genuine', 'Authentic'], ['Hostile', 'Unfriendly'], ['Ignite', 'Kindle'], ['Jovial', 'Cheerful'], ['Keen', 'Eager'], ['Lucid', 'Clear'], ['Meagre', 'Scanty'], ['Novice', 'Beginner'], ['Obsolete', 'Outdated'], ['Prudent', 'Cautious'], ['Rapid', 'Swift'], ['Serene', 'Calm'], ['Tranquil', 'Peaceful'], ['Vivid', 'Bright'], ['Zealous', 'Enthusiastic'], ['Ample', 'Sufficient'], ['Conceal', 'Hide'], ['Mitigate', 'Alleviate'], ['Ephemeral', 'Short-lived'], ['Benevolent', 'Kind'], ['Pragmatic', 'Practical'], ['Reluctant', 'Unwilling'], ['Scrutinise', 'Examine'], ['Tedious', 'Boring'], ['Vacant', 'Empty'], ['Fatigue', 'Exhaustion'], ['Peculiar', 'Odd'], ['Resilient', 'Flexible'], ['Verbose', 'Wordy']];
syn.forEach(([w, s], i) => add('VERBAL', 'Vocabulary', 'Synonyms', `Choose the word closest in meaning to "${w}".`, s, sample(syn.filter((_, j) => j !== i).map((x) => x[1]), 3), `"${w}" means ${s.toLowerCase()}.`, i % 3 === 0 ? 'MEDIUM' : 'EASY'));
const ant = [['Ancient', 'Modern'], ['Brave', 'Cowardly'], ['Generous', 'Stingy'], ['Expand', 'Contract'], ['Victory', 'Defeat'], ['Rigid', 'Flexible'], ['Scarce', 'Plentiful'], ['Optimistic', 'Pessimistic'], ['Transparent', 'Opaque'], ['Arrogant', 'Humble'], ['Permanent', 'Temporary'], ['Include', 'Exclude'], ['Diligent', 'Lazy'], ['Hostile', 'Friendly'], ['Increase', 'Decrease'], ['Accept', 'Reject'], ['Ascend', 'Descend'], ['Cautious', 'Reckless'], ['Fragile', 'Sturdy'], ['Genuine', 'Fake'], ['Innocent', 'Guilty'], ['Majority', 'Minority'], ['Mature', 'Immature'], ['Praise', 'Criticise'], ['Public', 'Private'], ['Rapid', 'Slow'], ['Simple', 'Complex'], ['Success', 'Failure'], ['Urban', 'Rural'], ['Wise', 'Foolish'], ['Zenith', 'Nadir'], ['Benefit', 'Harm'], ['Candid', 'Evasive'], ['Frequent', 'Rare'], ['Vague', 'Precise']];
ant.forEach(([w, a], i) => add('VERBAL', 'Vocabulary', 'Antonyms', `Choose the word opposite in meaning to "${w}".`, a, sample(ant.filter((_, j) => j !== i).map((x) => x[1]), 3), `The opposite of "${w}" is "${a.toLowerCase()}".`, i % 4 === 0 ? 'MEDIUM' : 'EASY'));
[
    ['One who loves books', 'Bibliophile'], ['A person who can speak two languages', 'Bilingual'], ['One who eats no meat', 'Vegetarian'], ['A government by the people', 'Democracy'], ['Fear of heights', 'Acrophobia'],
    ['A person who walks in sleep', 'Somnambulist'], ['A place where birds are kept', 'Aviary'], ['One who knows everything', 'Omniscient'], ['A study of ancient things', 'Archaeology'], ['Incapable of being read', 'Illegible'],
    ['That which cannot be avoided', 'Inevitable'], ['A speech made without preparation', 'Extempore'], ['One who looks on the bright side', 'Optimist'], ['A life story written by oneself', 'Autobiography'], ['Medicine that works against poison', 'Antidote'],
    ['One who lives for others', 'Altruist'], ['Government by a few', 'Oligarchy'], ['A fixed income paid after retirement', 'Pension'], ['Easily broken', 'Fragile'], ['A person new to a field', 'Novice'],
].forEach(([d, w], i, all) => add('VERBAL', 'Vocabulary', 'One-word substitution', `Choose the one word that best replaces: "${d}".`, w, sample(all.filter((_, j) => j !== i).map((x) => x[1]), 3), `${w} means "${d.toLowerCase()}".`, 'EASY'));
[
    ['Accommodation', ['Accomodation', 'Acommodation', 'Accommodetion']], ['Necessary', ['Neccessary', 'Necesary', 'Necessery']], ['Separate', ['Seperate', 'Separete', 'Seprate']], ['Occurrence', ['Occurence', 'Ocurrence', 'Occurrance']],
    ['Definitely', ['Definately', 'Definitly', 'Defenitely']], ['Embarrass', ['Embarass', 'Embarras', 'Embarress']], ['Environment', ['Enviroment', 'Enviornment', 'Environmant']], ['Government', ['Goverment', 'Governmant', 'Govermment']],
    ['Maintenance', ['Maintainance', 'Maintenence', 'Maintanance']], ['Recommend', ['Reccomend', 'Recomend', 'Recommed']], ['Receive', ['Recieve', 'Receeve', 'Receve']], ['Privilege', ['Priviledge', 'Privelege', 'Previlege']],
    ['Conscience', ['Consciense', 'Conscence', 'Concience']], ['Millennium', ['Millenium', 'Milenium', 'Millennum']], ['Parallel', ['Paralel', 'Parralel', 'Parallell']],
].forEach(([c, w]) => add('VERBAL', 'Spelling', 'Correct spelling', 'Choose the correctly spelt word.', c, w, `The correct spelling is "${c}".`, 'MEDIUM'));
[
    ['She ___ to school every day.', 'goes', ['go', 'going', 'gone'], 'Third-person singular present takes "goes".', 'EASY'],
    ['Neither of the two boys ___ present.', 'was', ['were', 'are', 'have been'], '"Neither" takes a singular verb.', 'MEDIUM'],
    ['He has been working here ___ 2019.', 'since', ['for', 'from', 'by'], '"Since" marks a starting point in time.', 'EASY'],
    ['I look forward to ___ you soon.', 'seeing', ['see', 'saw', 'seen'], '"Look forward to" is followed by a gerund.', 'MEDIUM'],
    ['The committee ___ divided in its opinion.', 'is', ['are', 'were', 'have'], 'A collective noun acting as one unit takes a singular verb.', 'MEDIUM'],
    ['If I ___ you, I would accept the offer.', 'were', ['was', 'am', 'be'], 'The subjunctive mood uses "were" in hypothetical conditions.', 'MEDIUM'],
    ['She is senior ___ me by two years.', 'to', ['than', 'from', 'over'], '"Senior" is followed by "to", not "than".', 'MEDIUM'],
    ['The teacher, along with her students, ___ going on a trip.', 'is', ['are', 'were', 'have been'], 'The verb agrees with "teacher", the main subject.', 'HARD'],
    ['He is good ___ mathematics.', 'at', ['in', 'on', 'with'], 'The standard phrase is "good at".', 'EASY'],
    ['I prefer tea ___ coffee.', 'to', ['than', 'over', 'from'], '"Prefer" is followed by "to".', 'EASY'],
    ['Each of the players ___ given a medal.', 'was', ['were', 'are', 'have been'], '"Each" takes a singular verb.', 'MEDIUM'],
    ['By the time we arrived, the film ___ started.', 'had', ['has', 'have', 'was'], 'Past perfect shows the earlier past action.', 'MEDIUM'],
    ['He suggested that she ___ a doctor.', 'consult', ['consults', 'consulted', 'consulting'], 'After "suggested that", the subjunctive base form is used.', 'HARD'],
    ['The news ___ very encouraging.', 'was', ['were', 'are', 'have been'], '"News" is uncountable and singular.', 'MEDIUM'],
    ['She asked me where ___.', 'I lived', ['did I live', 'do I live', 'I do live'], 'In reported questions the order is subject + verb.', 'MEDIUM'],
    ['Choose the correct sentence.', 'He doesn\'t know anything about it.', ['He don\'t know nothing about it.', 'He doesn\'t knows anything about it.', 'He not know anything about it.'], 'Avoid double negatives; "doesn\'t" takes the base verb.', 'EASY'],
    ['Choose the correct sentence.', 'The number of applicants is increasing.', ['The number of applicants are increasing.', 'The numbers of applicant is increasing.', 'A number of applicants is increasing.'], '"The number of" takes a singular verb.', 'HARD'],
    ['Choose the correct sentence.', 'I have lived here for five years.', ['I am living here since five years.', 'I live here since five years.', 'I have lived here since five years.'], '"For" is used with a period of time in the present perfect.', 'MEDIUM'],
    ['Fill in the blank: He apologised ___ being late.', 'for', ['of', 'about', 'to'], 'We apologise "for" something.', 'EASY'],
    ['Fill in the blank: The bridge is ___ than it looks.', 'longer', ['more long', 'longest', 'most long'], 'The comparative of a short adjective adds -er.', 'EASY'],
    ['The idiom "break the ice" means to', 'start a conversation in a social setting', ['end a relationship', 'cause damage', 'refuse to speak'], '"Break the ice" means to ease initial tension.', 'MEDIUM'],
    ['The idiom "once in a blue moon" means', 'very rarely', ['very often', 'at night', 'without reason'], 'It describes something that happens very rarely.', 'EASY'],
    ['The idiom "a piece of cake" means', 'something very easy', ['something sweet', 'a small share', 'a celebration'], 'It means a task that is very easy.', 'EASY'],
    ['The idiom "spill the beans" means to', 'reveal a secret', ['waste food', 'make a mess', 'cook quickly'], 'It means to disclose confidential information.', 'EASY'],
    ['The idiom "hit the nail on the head" means to', 'be exactly right', ['work with tools', 'hurt oneself', 'delay work'], 'It means to describe something exactly.', 'MEDIUM'],
].forEach(([t, c, w, e, d]) => add('VERBAL', t.startsWith('The idiom') ? 'Idioms' : 'Grammar', t.startsWith('The idiom') ? 'Meanings' : 'Usage', t, c, w, e, d));
[
    ['Rearrange to form a sentence: (P) is important (Q) honesty (R) in life (S) very', 'QSPR', ['PQRS', 'SPQR', 'RQPS'], 'Honesty is very important in life → Q S P R.'],
    ['Rearrange to form a sentence: (P) the meeting (Q) was postponed (R) due to rain (S) yesterday\'s', 'SPQR', ['PQRS', 'QRSP', 'RSPQ'], 'Yesterday\'s meeting was postponed due to rain → S P Q R.'],
    ['Rearrange to form a sentence: (P) learns (Q) a wise man (R) from (S) mistakes', 'QPRS', ['PQRS', 'SRQP', 'RPQS'], 'A wise man learns from mistakes → Q P R S.'],
].forEach(([t, c, w, e]) => add('VERBAL', 'Sentence Arrangement', 'Jumbled words', t, c, w, e, 'MEDIUM'));
const tech = [
    ['Data Structures', 'Stacks', 'Which data structure follows the LIFO principle?', 'Stack', ['Queue', 'Linked list', 'Heap'], 'Last In First Out is the behaviour of a stack.', 'EASY'],
    ['Data Structures', 'Queues', 'Which data structure follows the FIFO principle?', 'Queue', ['Stack', 'Tree', 'Graph'], 'A queue serves elements in the order they arrived.', 'EASY'],
    ['Data Structures', 'Arrays', 'What is the time complexity of accessing an array element by index?', 'O(1)', ['O(n)', 'O(log n)', 'O(n log n)'], 'Array indexing computes the address directly.', 'EASY'],
    ['Data Structures', 'Linked Lists', 'What is the time complexity of inserting at the head of a singly linked list?', 'O(1)', ['O(n)', 'O(log n)', 'O(n²)'], 'Only pointers at the head change.', 'EASY'],
    ['Data Structures', 'Linked Lists', 'To delete a given node in a singly linked list in O(1) when only that node pointer is known (and it is not the tail), we', 'copy the next node\'s data into it and unlink the next node', ['traverse from the head', 'reverse the list', 'it cannot be done'], 'Overwriting with the next node\'s data then removing next gives O(1).', 'HARD'],
    ['Data Structures', 'Trees', 'The maximum number of nodes in a binary tree of height h (root at height 0) is', '2^(h+1) − 1', ['2^h', '2h + 1', 'h²'], 'A perfect binary tree has 2^(h+1) − 1 nodes.', 'MEDIUM'],
    ['Data Structures', 'Trees', 'Which traversal of a binary search tree gives elements in sorted order?', 'Inorder', ['Preorder', 'Postorder', 'Level order'], 'Inorder visits left, root, right which yields ascending order in a BST.', 'EASY'],
    ['Data Structures', 'Trees', 'What is the worst-case time complexity of searching in an unbalanced BST with n nodes?', 'O(n)', ['O(log n)', 'O(1)', 'O(n log n)'], 'A skewed tree degenerates to a linked list.', 'MEDIUM'],
    ['Data Structures', 'Heaps', 'In a binary min-heap, the smallest element is at the', 'root', ['last leaf', 'left child of root', 'middle'], 'The heap property puts the minimum at the root.', 'EASY'],
    ['Data Structures', 'Heaps', 'Time complexity of building a binary heap from n elements is', 'O(n)', ['O(n log n)', 'O(log n)', 'O(n²)'], 'Bottom-up heapify runs in linear time.', 'HARD'],
    ['Data Structures', 'Hashing', 'A collision in a hash table occurs when', 'two keys map to the same index', ['the table is empty', 'a key is deleted', 'the hash function is O(1)'], 'Different keys hashing to one slot is a collision.', 'EASY'],
    ['Data Structures', 'Hashing', 'Average-case time to look up a key in a well-designed hash table is', 'O(1)', ['O(n)', 'O(log n)', 'O(n log n)'], 'With a good hash function and load factor, lookups are constant time on average.', 'EASY'],
    ['Data Structures', 'Graphs', 'Which algorithm finds the shortest path in a graph with non-negative edge weights?', 'Dijkstra\'s algorithm', ['Kruskal\'s algorithm', 'Prim\'s algorithm', 'Topological sort'], 'Dijkstra\'s greedy algorithm solves single-source shortest paths for non-negative weights.', 'MEDIUM'],
    ['Data Structures', 'Graphs', 'Which data structure is used by BFS?', 'Queue', ['Stack', 'Heap', 'Hash set only'], 'BFS explores level by level using a queue.', 'EASY'],
    ['Data Structures', 'Graphs', 'Which data structure is typically used by iterative DFS?', 'Stack', ['Queue', 'Priority queue', 'Deque only'], 'DFS backtracks using a stack (or recursion).', 'EASY'],
    ['Data Structures', 'Graphs', 'A spanning tree of a connected graph with n vertices has how many edges?', 'n − 1', ['n', 'n + 1', '2n'], 'A tree on n vertices has n − 1 edges.', 'MEDIUM'],
    ['Data Structures', 'Graphs', 'Which algorithm can detect negative-weight cycles?', 'Bellman-Ford', ['Dijkstra', 'Prim', 'Kruskal'], 'Bellman-Ford relaxes edges V−1 times and then checks for further improvement.', 'HARD'],
    ['Algorithms', 'Sorting', 'Which sorting algorithm has the best worst-case time complexity among these?', 'Merge sort', ['Quick sort', 'Bubble sort', 'Insertion sort'], 'Merge sort is O(n log n) in the worst case.', 'MEDIUM'],
    ['Algorithms', 'Sorting', 'Average-case time complexity of quicksort is', 'O(n log n)', ['O(n²)', 'O(n)', 'O(log n)'], 'Balanced partitions on average give n log n.', 'EASY'],
    ['Algorithms', 'Sorting', 'Which of the following sorting algorithms is stable?', 'Merge sort', ['Quick sort (typical)', 'Heap sort', 'Selection sort (typical)'], 'Merge sort preserves the relative order of equal keys.', 'MEDIUM'],
    ['Algorithms', 'Sorting', 'Best-case time complexity of bubble sort with an early-exit flag is', 'O(n)', ['O(n²)', 'O(n log n)', 'O(1)'], 'An already-sorted array needs a single pass.', 'MEDIUM'],
    ['Algorithms', 'Searching', 'Binary search can be applied only on', 'a sorted collection', ['any array', 'a linked list only', 'a hash table'], 'It relies on ordering to discard half each step.', 'EASY'],
    ['Algorithms', 'Searching', 'Time complexity of binary search on n sorted elements is', 'O(log n)', ['O(n)', 'O(1)', 'O(n log n)'], 'The search space halves every step.', 'EASY'],
    ['Algorithms', 'Greedy', 'Which problem is solved optimally by a greedy algorithm?', 'Fractional knapsack', ['0/1 knapsack', 'Travelling salesman', 'Longest common subsequence'], 'Choosing items by value/weight ratio is optimal for the fractional version.', 'MEDIUM'],
    ['Algorithms', 'Dynamic Programming', 'Dynamic programming is mainly applicable when a problem has', 'overlapping subproblems and optimal substructure', ['only random inputs', 'no recursion', 'sorted inputs'], 'These two properties let us reuse stored subresults.', 'MEDIUM'],
    ['Algorithms', 'Recursion', 'The time complexity of the naive recursive Fibonacci is', 'O(2^n)', ['O(n)', 'O(log n)', 'O(n²)'], 'Each call spawns two further calls, giving exponential growth.', 'MEDIUM'],
    ['Algorithms', 'Complexity', 'Which is the fastest-growing function?', '2^n', ['n²', 'n log n', 'n³'], 'Exponential growth dominates polynomial growth.', 'EASY'],
    ['Algorithms', 'Complexity', 'The time complexity of the following loop: for(i=1;i<n;i*=2) is', 'O(log n)', ['O(n)', 'O(n²)', 'O(1)'], 'i doubles each iteration so it runs log₂n times.', 'MEDIUM'],
    ['Algorithms', 'Complexity', 'The time complexity of two nested loops each running n times is', 'O(n²)', ['O(n)', 'O(2n)', 'O(log n)'], 'n × n iterations.', 'EASY'],
    ['Database', 'SQL', 'Which SQL clause is used to filter groups after aggregation?', 'HAVING', ['WHERE', 'GROUP BY', 'ORDER BY'], 'WHERE filters rows; HAVING filters groups.', 'EASY'],
    ['Database', 'SQL', 'Which keyword removes duplicate rows from a SELECT result?', 'DISTINCT', ['UNIQUE', 'DIFFERENT', 'REMOVE'], 'SELECT DISTINCT returns unique rows.', 'EASY'],
    ['Database', 'SQL', 'Which JOIN returns all rows from the left table and matching rows from the right?', 'LEFT JOIN', ['INNER JOIN', 'RIGHT JOIN', 'CROSS JOIN'], 'LEFT JOIN keeps unmatched left rows with NULLs on the right.', 'EASY'],
    ['Database', 'SQL', 'Which command removes all rows from a table quickly and cannot normally be rolled back in many systems?', 'TRUNCATE', ['DELETE', 'DROP COLUMN', 'UPDATE'], 'TRUNCATE deallocates the data pages of the whole table.', 'MEDIUM'],
    ['Database', 'SQL', 'What does a PRIMARY KEY guarantee?', 'Unique, non-null identification of each row', ['Only non-null values', 'Only sorted values', 'Duplicates allowed'], 'A primary key is unique and cannot be NULL.', 'EASY'],
    ['Database', 'SQL', 'A FOREIGN KEY is used to', 'enforce referential integrity between tables', ['speed up sorting', 'encrypt data', 'delete duplicates'], 'It links a column to the primary key of another table.', 'EASY'],
    ['Database', 'Normalization', 'A relation is in 2NF if it is in 1NF and', 'has no partial dependency of a non-key attribute on part of the key', ['has no transitive dependency', 'has only one column', 'has no primary key'], '2NF removes partial dependencies.', 'MEDIUM'],
    ['Database', 'Normalization', 'Which normal form removes transitive dependencies?', '3NF', ['1NF', '2NF', 'None'], '3NF forbids non-key attributes depending on other non-key attributes.', 'MEDIUM'],
    ['Database', 'Transactions', 'In ACID, the letter "I" stands for', 'Isolation', ['Integrity', 'Indexing', 'Inheritance'], 'Isolation keeps concurrent transactions from interfering.', 'EASY'],
    ['Database', 'Transactions', 'In ACID, "Atomicity" means', 'a transaction is all-or-nothing', ['data is always sorted', 'queries are fast', 'tables are linked'], 'Either all operations of a transaction apply or none do.', 'EASY'],
    ['Database', 'Indexing', 'The main purpose of a database index is to', 'speed up data retrieval', ['reduce storage always', 'encrypt data', 'avoid backups'], 'Indexes allow faster lookups at the cost of extra writes/storage.', 'EASY'],
    ['Operating Systems', 'Scheduling', 'Which CPU scheduling algorithm can cause starvation?', 'Priority scheduling', ['Round robin', 'FCFS', 'None of these'], 'Low priority processes may wait indefinitely.', 'MEDIUM'],
    ['Operating Systems', 'Scheduling', 'Round Robin scheduling uses', 'a fixed time quantum', ['priorities only', 'shortest job first', 'random order'], 'Each process runs for one quantum before being pre-empted.', 'EASY'],
    ['Operating Systems', 'Deadlock', 'Which is NOT a necessary condition for deadlock?', 'Pre-emption', ['Mutual exclusion', 'Hold and wait', 'Circular wait'], 'No pre-emption (not pre-emption) is a condition.', 'MEDIUM'],
    ['Operating Systems', 'Memory', 'Thrashing occurs when', 'the system spends more time paging than executing', ['CPU is idle', 'disk is full', 'there is too much RAM'], 'Excessive page faults degrade performance.', 'MEDIUM'],
    ['Operating Systems', 'Memory', 'Which page replacement algorithm can suffer Belady\'s anomaly?', 'FIFO', ['LRU', 'Optimal', 'None'], 'More frames can paradoxically cause more faults with FIFO.', 'HARD'],
    ['Operating Systems', 'Processes', 'A process in the "ready" state is waiting for', 'the CPU', ['I/O completion', 'memory deallocation', 'a child process'], 'Ready processes are queued for CPU allocation.', 'EASY'],
    ['Operating Systems', 'Synchronization', 'A semaphore is used for', 'process synchronization', ['file compression', 'memory allocation', 'disk formatting'], 'Semaphores control access to shared resources.', 'EASY'],
    ['Operating Systems', 'Synchronization', 'A race condition occurs when', 'the outcome depends on the timing of concurrent accesses to shared data', ['a process finishes early', 'memory is full', 'CPU is overclocked'], 'Unsynchronised shared access yields unpredictable results.', 'MEDIUM'],
    ['Networks', 'OSI', 'Which OSI layer is responsible for routing packets?', 'Network layer', ['Transport layer', 'Data link layer', 'Session layer'], 'Layer 3 (network) handles logical addressing and routing.', 'EASY'],
    ['Networks', 'OSI', 'How many layers does the OSI model have?', '7', ['4', '5', '6'], 'Physical, Data link, Network, Transport, Session, Presentation, Application.', 'EASY'],
    ['Networks', 'Protocols', 'Which protocol is connection-oriented and reliable?', 'TCP', ['UDP', 'IP', 'ICMP'], 'TCP establishes connections and guarantees delivery.', 'EASY'],
    ['Networks', 'Protocols', 'Which port is used by HTTPS by default?', '443', ['80', '21', '25'], 'HTTPS uses TCP port 443.', 'EASY'],
    ['Networks', 'Protocols', 'DNS is used to', 'translate domain names into IP addresses', ['encrypt traffic', 'assign MAC addresses', 'route packets'], 'DNS maps names to addresses.', 'EASY'],
    ['Networks', 'HTTP', 'Which HTTP status code means "Not Found"?', '404', ['200', '500', '301'], '404 indicates the resource does not exist.', 'EASY'],
    ['Networks', 'HTTP', 'Which HTTP method is idempotent and typically used to retrieve data?', 'GET', ['POST', 'PATCH', 'CONNECT'], 'GET fetches a representation without side effects.', 'EASY'],
    ['Networks', 'IP', 'How many bits are there in an IPv4 address?', '32', ['64', '128', '16'], 'IPv4 addresses are 32 bits.', 'EASY'],
    ['Networks', 'IP', 'How many usable host addresses are in a /24 IPv4 subnet?', '254', ['256', '255', '252'], '2^8 − 2 = 254 (excluding network and broadcast).', 'MEDIUM'],
    ['OOP', 'Concepts', 'Which OOP principle hides internal implementation details?', 'Encapsulation', ['Inheritance', 'Polymorphism', 'Recursion'], 'Encapsulation bundles data and restricts direct access.', 'EASY'],
    ['OOP', 'Concepts', 'Method overriding is an example of', 'runtime polymorphism', ['compile-time polymorphism', 'encapsulation', 'abstraction only'], 'The overridden method is chosen at run time based on the object.', 'MEDIUM'],
    ['OOP', 'Concepts', 'Method overloading means', 'same method name with different parameter lists', ['same signature in a subclass', 'hiding data', 'creating two objects'], 'Overloads are resolved at compile time by parameters.', 'EASY'],
    ['OOP', 'Concepts', 'An abstract class', 'cannot be instantiated directly', ['must have no methods', 'cannot be inherited', 'must be final'], 'It is meant to be subclassed.', 'EASY'],
    ['OOP', 'Concepts', 'Which keyword is used in Java to inherit a class?', 'extends', ['implements', 'inherits', 'super'], '"extends" creates a subclass; "implements" is for interfaces.', 'EASY'],
    ['Programming', 'Python', 'What is the output of print(type([]))?', "<class 'list'>", ["<class 'tuple'>", "<class 'dict'>", "<class 'set'>"], '[] is a list literal.', 'EASY'],
    ['Programming', 'Python', 'What is the output of print(2 ** 3 ** 2)?', '512', ['64', '36', '128'], 'Exponentiation is right-associative: 3**2 = 9, 2**9 = 512.', 'HARD'],
    ['Programming', 'Python', 'What does len({1, 2, 2, 3}) return?', '3', ['4', '2', '1'], 'A set removes duplicates.', 'EASY'],
    ['Programming', 'Python', 'Which of these is immutable in Python?', 'tuple', ['list', 'dict', 'set'], 'Tuples cannot be changed after creation.', 'EASY'],
    ['Programming', 'Python', 'What is the output of print("abc"[::-1])?', 'cba', ['abc', 'bca', 'error'], 'A step of -1 reverses the string.', 'EASY'],
    ['Programming', 'Python', 'What is the output of print(bool("False"))?', 'True', ['False', 'Error', 'None'], 'Any non-empty string is truthy.', 'MEDIUM'],
    ['Programming', 'C', 'What is the size of an int on most 32/64-bit systems?', '4 bytes', ['2 bytes', '8 bytes', '1 byte'], 'int is typically 32 bits.', 'EASY'],
    ['Programming', 'C', 'Which operator is used to get the address of a variable in C?', '&', ['*', '->', '%'], '& is the address-of operator.', 'EASY'],
    ['Programming', 'C', 'What is the value of 7 / 2 in C when both operands are int?', '3', ['3.5', '4', '2'], 'Integer division truncates.', 'EASY'],
    ['Programming', 'C', 'What does the expression 5 % 3 evaluate to?', '2', ['1', '3', '0'], 'The remainder of 5 ÷ 3 is 2.', 'EASY'],
    ['Programming', 'Java', 'Which of these is not a primitive type in Java?', 'String', ['int', 'boolean', 'char'], 'String is a class.', 'EASY'],
    ['Programming', 'Java', 'Which keyword prevents a method from being overridden?', 'final', ['static', 'abstract', 'private only'], 'A final method cannot be overridden.', 'MEDIUM'],
    ['Programming', 'JavaScript', 'What is the output of typeof null in JavaScript?', 'object', ['null', 'undefined', 'number'], 'A long-standing quirk of the language.', 'MEDIUM'],
    ['Programming', 'JavaScript', 'What does "3" + 4 evaluate to in JavaScript?', '"34"', ['7', 'NaN', 'Error'], 'The + operator concatenates when one operand is a string.', 'MEDIUM'],
    ['Programming', 'JavaScript', 'Which method adds an element to the end of an array in JavaScript?', 'push()', ['pop()', 'shift()', 'unshift()'], 'push() appends to the end.', 'EASY'],
    ['Software Engineering', 'SDLC', 'Which SDLC model is best suited when requirements are well understood and fixed?', 'Waterfall', ['Spiral', 'Agile', 'Prototype'], 'Waterfall is sequential and suits stable requirements.', 'EASY'],
    ['Software Engineering', 'Testing', 'Testing individual units of code in isolation is called', 'Unit testing', ['Integration testing', 'System testing', 'Acceptance testing'], 'Unit tests verify the smallest testable parts.', 'EASY'],
    ['Software Engineering', 'Version Control', 'Which Git command creates a copy of a remote repository?', 'git clone', ['git init', 'git commit', 'git merge'], 'git clone downloads the repository with its history.', 'EASY'],
    ['Software Engineering', 'Design', 'Which design pattern ensures a class has only one instance?', 'Singleton', ['Factory', 'Observer', 'Adapter'], 'Singleton restricts instantiation to a single object.', 'EASY'],
    ['Software Engineering', 'Design', 'The Observer pattern is used when', 'many objects must be notified of a state change', ['one object must be created once', 'algorithms must be interchangeable', 'objects must be copied'], 'Observers subscribe to a subject.', 'MEDIUM'],
    ['Computer Organisation', 'Memory', 'Which memory is the fastest?', 'Registers', ['Cache', 'RAM', 'Hard disk'], 'Registers sit inside the CPU.', 'EASY'],
    ['Computer Organisation', 'Number Systems', 'The binary equivalent of decimal 10 is', '1010', ['1100', '1001', '1110'], '8 + 2 = 10 → 1010.', 'EASY'],
    ['Computer Organisation', 'Number Systems', 'The hexadecimal number FF equals which decimal value?', '255', ['256', '127', '15'], '15 × 16 + 15 = 255.', 'EASY'],
    ['Security', 'Web', 'SQL injection is best prevented by', 'using parameterised queries', ['hiding the database', 'using longer URLs', 'disabling JavaScript'], 'Parameters keep data separate from SQL code.', 'MEDIUM'],
    ['Security', 'Cryptography', 'Which of these is a symmetric encryption algorithm?', 'AES', ['RSA', 'ECC', 'Diffie-Hellman'], 'AES uses the same key to encrypt and decrypt.', 'MEDIUM'],
    ['Security', 'Web', 'XSS (cross-site scripting) allows an attacker to', 'run malicious scripts in a victim\'s browser', ['crash the database server', 'sniff Wi-Fi only', 'change DNS records'], 'Unescaped user input is executed as script.', 'MEDIUM'],
];
tech.forEach(([topic, sub, text, c, w, e, d]) => add('TECHNICAL', topic, sub, text, c, w, e, d));
gen(14, () => { const a = pick([12, 25, 40, 60, 77, 90, 100, 255]); const b = pick([5, 9, 12, 21, 30, 45, 63]); const op = pick(['&', '|', '^']); const c = op === '&' ? a & b : op === '|' ? a | b : a ^ b; return add('TECHNICAL', 'Programming', 'Bitwise operators', `What is the value of ${a} ${op} ${b} in C/Java?`, String(c), near(c).map(String), `Applying ${op} bitwise on ${a.toString(2)} and ${b.toString(2)} gives ${c.toString(2)} = ${c}.`, 'MEDIUM'); });
gen(10, () => { const a = pick([1, 2, 3, 5, 7]); const k = pick([1, 2, 3, 4]); return add('TECHNICAL', 'Programming', 'Shift operators', `What is the value of ${a} << ${k}?`, String(a * 2 ** k), near(a * 2 ** k).map(String), `Left shift by ${k} multiplies by 2^${k} = ${2 ** k}.`, 'EASY'); });
gen(10, () => { const n = pick([5, 9, 13, 18, 22, 27, 33, 40, 45, 50, 57, 64]); return add('TECHNICAL', 'Number Systems', 'Decimal to binary', `What is the binary representation of decimal ${n}?`, n.toString(2), [(n + 1).toString(2), (n - 1).toString(2), (n + 2).toString(2)], `Repeated division by 2 gives ${n.toString(2)}.`, 'EASY'); });
gen(8, () => { const n = pick([17, 26, 42, 75, 100, 128, 170, 200, 250]); return add('TECHNICAL', 'Number Systems', 'Decimal to hexadecimal', `What is the hexadecimal representation of decimal ${n}?`, n.toString(16).toUpperCase(), [(n + 1).toString(16).toUpperCase(), (n - 1).toString(16).toUpperCase(), (n + 16).toString(16).toUpperCase()], `${n} = ${n.toString(16).toUpperCase()} in base 16.`, 'MEDIUM'); });
gen(8, () => { const k = pick([3, 4, 5, 6, 7, 8, 9, 10]); const n = 2 ** k - 1; return add('TECHNICAL', 'Algorithms', 'Binary search', `What is the maximum number of comparisons binary search needs on a sorted array of ${n} elements?`, String(k), near(k).map(String), `log₂(${n + 1}) = ${k} comparisons in the worst case.`, 'MEDIUM'); });
gen(8, () => { const n = pick([10, 20, 50, 100, 200]); return add('TECHNICAL', 'Algorithms', 'Complexity', `A loop \`for (i = 0; i < ${n}; i++) for (j = 0; j < ${n}; j++)\` executes its body how many times?`, String(n * n), near(n * n).map(String), `${n} × ${n} = ${n * n} iterations.`, 'EASY'); });
gen(6, () => { const n = pick([7, 10, 15, 31, 63]); return add('TECHNICAL', 'Data Structures', 'Trees', `A complete binary tree has ${n} nodes. What is its height (root at level 0)?`, String(Math.floor(Math.log2(n))), near(Math.floor(Math.log2(n))).map(String), `Height = ⌊log₂ ${n}⌋ = ${Math.floor(Math.log2(n))}.`, 'MEDIUM'); });
/* ============================ write ============================ */
async function main() {
    const cats = new Map((await prisma.questionCategory.findMany()).map((c) => [c.code, c.id]));
    if (cats.size < 4)
        throw new Error('Run `npm run db:seed` first to create categories.');
    const existing = new Set((await prisma.question.findMany({ select: { text: true } })).map((q) => q.text));
    const fresh = out.filter((q) => !existing.has(q.text));
    const questions = fresh.map((q) => ({ id: randomUUID(), q }));
    await prisma.$transaction(async (tx) => {
        await tx.question.createMany({
            data: questions.map(({ id, q }) => ({ id, categoryId: cats.get(q.cat), topic: q.topic, subtopic: q.sub, text: q.text, explanation: q.explanation, difficulty: q.diff, marks: 1, negativeMarks: 0.25, status: 'PUBLISHED' })),
        });
        await tx.questionOption.createMany({
            data: questions.flatMap(({ id, q }) => q.options.map((text, i) => ({ questionId: id, position: i, text, isCorrect: i === q.correct }))),
        });
    }, { timeout: 120000 });
    const by = (c) => out.filter((q) => q.cat === c).length;
    console.log(`✔ Generated ${out.length} (Technical ${by('TECHNICAL')}, Quant ${by('QUANT')}, Logical ${by('LOGICAL')}, Verbal ${by('VERBAL')}); inserted ${fresh.length} new.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
