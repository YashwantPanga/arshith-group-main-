-- A question may have at most one correct option (enforced by the database, not only the API)
CREATE UNIQUE INDEX "question_options_one_correct" ON "question_options" ("questionId") WHERE "isCorrect" = true;

-- Sanity checks
ALTER TABLE "questions" ADD CONSTRAINT "questions_marks_positive" CHECK ("marks" > 0 AND "negativeMarks" >= 0);
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_window_valid" CHECK ("endAt" > "startAt" AND "durationMin" > 0 AND "maxAttempts" >= 1);
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_pass_percent" CHECK ("passPercent" >= 0 AND "passPercent" <= 100 AND "durationMin" > 0);
