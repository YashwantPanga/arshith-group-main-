const r2 = (n) => Math.round(n * 100) / 100;
/** Pure evaluation: Total = Σ correct marks − Σ negative marks for incorrect answers. */
export function evaluate(questions, answers, codeRatios, opts) {
    const sections = new Map();
    let total = 0, obtained = 0, correct = 0, incorrect = 0, unattempted = 0;
    for (const q of questions) {
        const s = sections.get(q.sectionId) ?? {
            sectionId: q.sectionId, name: q.sectionName, total: 0, obtained: 0, correct: 0, incorrect: 0, unattempted: 0, questions: 0,
        };
        s.questions++;
        s.total += q.marks;
        total += q.marks;
        if (q.kind === 'CODING') {
            // partial credit by share of test cases passed in the last submitted solution; wrong code is never penalised
            const ratio = codeRatios.get(q.questionId);
            if (ratio === undefined) {
                s.unattempted++;
                unattempted++;
            }
            else if (ratio >= 1) {
                s.correct++;
                correct++;
                s.obtained += q.marks;
                obtained += q.marks;
            }
            else {
                s.incorrect++;
                incorrect++;
                s.obtained += q.marks * ratio;
                obtained += q.marks * ratio;
            }
            sections.set(q.sectionId, s);
            continue;
        }
        const sel = answers.get(q.questionId);
        if (!sel) {
            s.unattempted++;
            unattempted++;
        }
        else if (sel === q.correctOptionId) {
            s.correct++;
            correct++;
            s.obtained += q.marks;
            obtained += q.marks;
        }
        else {
            s.incorrect++;
            incorrect++;
            const neg = opts.negativeMarking ? q.negativeMarks : 0;
            s.obtained -= neg;
            obtained -= neg;
        }
        sections.set(q.sectionId, s);
    }
    const attempted = correct + incorrect;
    const percentage = total > 0 ? (obtained / total) * 100 : 0;
    return {
        totalQuestions: questions.length,
        correct, incorrect, unattempted,
        totalMarks: r2(total),
        obtainedMarks: r2(obtained),
        percentage: r2(percentage),
        accuracy: attempted > 0 ? r2((correct / attempted) * 100) : 0,
        passed: percentage >= opts.passPercent,
        sectionScores: [...sections.values()].map((s) => ({ ...s, total: r2(s.total), obtained: r2(s.obtained) })),
    };
}
