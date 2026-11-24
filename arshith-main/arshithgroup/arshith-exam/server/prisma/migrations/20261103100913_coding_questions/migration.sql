-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'CODING');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "constraints" JSONB,
ADD COLUMN     "funcName" TEXT,
ADD COLUMN     "paramNames" JSONB,
ADD COLUMN     "solution" TEXT,
ADD COLUMN     "starterCode" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'MCQ';

-- AlterTable
ALTER TABLE "student_answers" ADD COLUMN     "code" TEXT;

-- CreateTable
CREATE TABLE "question_test_cases" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "args" JSONB NOT NULL,
    "expected" JSONB NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hint" TEXT,

    CONSTRAINT "question_test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_submissions" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "passed" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "ratio" DOUBLE PRECISION NOT NULL,
    "results" JSONB NOT NULL,
    "runtimeMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memoryKb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_test_cases_questionId_position_key" ON "question_test_cases"("questionId", "position");

-- CreateIndex
CREATE INDEX "code_submissions_attemptId_questionId_createdAt_idx" ON "code_submissions"("attemptId", "questionId", "createdAt");

-- AddForeignKey
ALTER TABLE "question_test_cases" ADD CONSTRAINT "question_test_cases_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_submissions" ADD CONSTRAINT "code_submissions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_submissions" ADD CONSTRAINT "code_submissions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
