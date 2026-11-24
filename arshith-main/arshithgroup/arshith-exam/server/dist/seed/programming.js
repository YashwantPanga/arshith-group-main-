/**
 * "Programming (Python, Java, Web)" MCQ pack: 90+ questions.
 * "What is the output?" questions are answered by RUNNING the snippet (Python via the sandbox, Java via `java Main.java`,
 * JavaScript via node), so the key is correct by construction. Conceptual questions are curated.
 * Idempotent: existing question texts are skipped.
 */
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prisma } from '../db.js';
import { runPython } from '../lib/codeRunner.js';
import { JAVA_HARD, JS_HARD, PY_HARD } from './programming-hard.js';
let seed = 77123;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
} return b; };
/* ------------------------------- computed "output" questions ------------------------------- */
const PY = [
    { kind: 'py', sub: 'Output', diff: 'EASY', code: 'print(len(set([1, 2, 2, 3, 3, 3])))', wrong: ['6', '2', 'Error'], why: 'A set keeps only distinct values: {1, 2, 3}.' },
    { kind: 'py', sub: 'Output', diff: 'EASY', code: 'a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)', wrong: ['[1, 2, 3]', '[4]', 'Error'], why: 'b and a refer to the same list object.' },
    { kind: 'py', sub: 'Output', diff: 'EASY', code: 'print("ab" * 2 + "c")', wrong: ['abc', 'ab2c', 'ababcc'], why: 'Repeat first, then concatenate.' },
    { kind: 'py', sub: 'Comprehensions', diff: 'MEDIUM', code: 'print([i * i for i in range(1, 6) if i % 2])', wrong: ['[1, 4, 9, 16, 25]', '[4, 16]', '[1, 3, 5]'], why: 'Only odd i (1, 3, 5) are squared.' },
    { kind: 'py', sub: 'Dictionaries', diff: 'MEDIUM', code: 'd = {"a": 1, "b": 2}\nd["c"] = d.get("a", 0) + d.get("z", 5)\nprint(d)', wrong: ["{'a': 1, 'b': 2, 'c': 1}", "{'a': 1, 'b': 2, 'c': 5}", 'KeyError'], why: 'd.get("z", 5) returns the default 5; 1 + 5 = 6.' },
    { kind: 'py', sub: 'Mutable default argument', diff: 'HARD', code: 'def f(n, acc=[]):\n    acc.append(n)\n    return acc\nprint(f(1), f(2))', wrong: ['[1] [2]', '[1] [1, 2]', '[1, 2] [2]'], why: 'The default list is created once and shared; both calls return the same list.' },
    { kind: 'py', sub: 'Operators', diff: 'HARD', code: 'print(type(3 / 2).__name__, 7 // 2, -7 // 2, 7 % 3)', wrong: ['int 3 -3 1', 'float 3 -3 1', 'float 3.5 -3.5 1'], why: '/ is true division; // floors (−3.5 → −4).' },
    { kind: 'py', sub: 'Strings', diff: 'MEDIUM', code: 'print("Hello World".swapcase()[:5])', wrong: ['HELLO', 'Hello', 'hello'], why: 'swapcase flips every letter, then the first five characters are taken.' },
    { kind: 'py', sub: 'Truthiness', diff: 'MEDIUM', code: 'print(any([0, "", None]), all([]))', wrong: ['False False', 'True True', 'True False'], why: 'any() of falsy values is False; all() of an empty iterable is True.' },
    { kind: 'py', sub: 'Tuples', diff: 'HARD', code: 't = (1, 2, [3])\nt[2].append(4)\nprint(t)', wrong: ['TypeError', '(1, 2, [3])', '(1, 2, 3, 4)'], why: 'The tuple is immutable but the list inside it is not.' },
    { kind: 'py', sub: 'Functional', diff: 'MEDIUM', code: 'print(list(map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, range(7)))))', wrong: ['[0, 1, 4, 9, 16, 25, 36]', '[1, 9, 25]', '[4, 16, 36]'], why: 'filter keeps 0, 2, 4, 6; map squares them.' },
    { kind: 'py', sub: 'Scope', diff: 'EASY', code: 'x = 10\ndef f():\n    x = 5\nf()\nprint(x)', wrong: ['5', '15', 'Error'], why: 'The assignment inside f creates a local x.' },
    { kind: 'py', sub: 'Generators', diff: 'MEDIUM', code: 'def gen():\n    for i in range(3):\n        yield i * 2\nprint(sum(gen()), next(iter(gen())))', wrong: ['3 0', '6 2', '0 6'], why: 'gen yields 0, 2, 4 (sum 6); a fresh generator starts at 0.' },
    { kind: 'py', sub: 'Slicing', diff: 'EASY', code: 's = "python"\nprint(s[::-1], s[1:4], s[-2:])', wrong: ['python yth on', 'nohtyp pyt on', 'nohtyp yth yp'], why: '[::-1] reverses; [1:4] is "yth"; [-2:] is "on".' },
];
const JAVA = [
    { kind: 'java', sub: 'Output', diff: 'MEDIUM', code: 'System.out.println(10 + 20 + "30" + 40 + 50);', wrong: ['102030405', '150', '30305040'], why: '10 + 20 = 30 (int) first, then string concatenation: "30" + "30" + "40" + "50".' },
    { kind: 'java', sub: 'Strings', diff: 'MEDIUM', code: 'String a = "hi";\nString b = new String("hi");\nSystem.out.println((a == b) + " " + a.equals(b));', wrong: ['true true', 'false false', 'true false'], why: '== compares references; equals compares content.' },
    { kind: 'java', sub: 'Operators', diff: 'HARD', code: 'int x = 5;\nx += x++ * 2;\nSystem.out.println(x);', wrong: ['16', '10', '11'], why: 'x = 5 + (5 × 2) = 15; the increment is overwritten by the assignment.' },
    { kind: 'java', sub: 'Types', diff: 'EASY', code: "char c = 'A';\nc += 2;\nSystem.out.println(c);", wrong: ['67', 'A2', 'Compilation error'], why: 'Compound assignment casts back to char: A + 2 = C.' },
    { kind: 'java', sub: 'Arithmetic', diff: 'EASY', code: 'System.out.println(7 / 2 + " " + 7 % 3 + " " + (double) 7 / 2);', wrong: ['3.5 1 3.5', '3 1 3', '3 2 3.5'], why: 'Integer division gives 3; 7 % 3 = 1; the cast makes the last division 3.5.' },
    { kind: 'java', sub: 'Arrays', diff: 'EASY', code: 'int[] a = {1, 2, 3};\nint[] b = a;\nb[0] = 9;\nSystem.out.println(a[0]);', wrong: ['1', 'Error', '0'], why: 'Arrays are objects; b references the same array.' },
    { kind: 'java', sub: 'StringBuilder', diff: 'MEDIUM', code: 'StringBuilder sb = new StringBuilder("abc");\nsb.reverse().append(1);\nSystem.out.println(sb);', wrong: ['abc1', '1cba', 'cba'], why: 'reverse() mutates to "cba", then append(1).' },
    { kind: 'java', sub: 'Overflow', diff: 'MEDIUM', code: 'System.out.println(Integer.MAX_VALUE + 1);', wrong: ['2147483648', '0', 'Exception'], why: 'int overflow wraps around to Integer.MIN_VALUE.' },
    { kind: 'java', sub: 'Integer cache', diff: 'HARD', code: 'Integer p = 127, q = 127, r = 128, s = 128;\nSystem.out.println((p == q) + " " + (r == s));', wrong: ['true true', 'false false', 'false true'], why: 'Integers in −128..127 are cached, so == is true only for them.' },
    { kind: 'java', sub: 'Strings', diff: 'MEDIUM', code: 'System.out.println("Java".substring(1, 3).toUpperCase() + "Java".charAt(0));', wrong: ['AVJa', 'avJ', 'VAJ'], why: 'substring(1,3) = "av" → "AV", plus the first char "J".' },
    { kind: 'java', sub: 'try / finally', diff: 'HARD', extra: 'static int f() {\n    try { return 1; } finally { System.out.print("F "); }\n}', code: 'System.out.println(f());', wrong: ['1 F', '1', 'F'], why: 'finally runs before the method actually returns.' },
    { kind: 'java', sub: 'Operators', diff: 'HARD', code: 'int i = 0;\ni = i++ + ++i;\nSystem.out.println(i);', wrong: ['1', '3', '0'], why: 'i++ yields 0 (i becomes 1); ++i yields 2; 0 + 2 = 2.' },
    { kind: 'java', sub: 'Output', diff: 'EASY', code: 'System.out.println(1 + 2 + "A" + 1 + 2);', wrong: ['12A12', '3A3', '12A3'], why: '1 + 2 = 3 before the first string appears; after that everything concatenates.' },
];
const JS = [
    { kind: 'js', sub: 'Types', diff: 'MEDIUM', code: 'console.log(typeof null, typeof undefined, typeof NaN);', wrong: ['null undefined NaN', 'object object number', 'object undefined undefined'], why: 'typeof null is "object" (a legacy quirk); NaN is a number.' },
    { kind: 'js', sub: 'Coercion', diff: 'HARD', code: 'console.log([1, 2, 3] + [4, 5]);', wrong: ['[1,2,3,4,5]', '1,2,3,4,5', 'NaN'], why: 'Both arrays become strings ("1,2,3" and "4,5") and are concatenated.' },
    { kind: 'js', sub: 'Coercion', diff: 'MEDIUM', code: 'console.log(1 + "2" - 1);', wrong: ['2', '12', 'NaN'], why: '1 + "2" = "12", then "12" − 1 = 11.' },
    { kind: 'js', sub: 'Event loop', diff: 'HARD', code: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');", wrong: ['A B C D', 'A D B C', 'A C D B'], why: 'Synchronous code first (A, D), then microtasks (C), then timers (B).' },
    { kind: 'js', sub: 'Closures', diff: 'HARD', code: 'for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);', wrong: ['0 1 2', '0 0 0', 'undefined undefined undefined'], why: 'var is function-scoped: all callbacks see the final i = 3.' },
    { kind: 'js', sub: 'Closures', diff: 'MEDIUM', code: 'for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);', wrong: ['3 3 3', '0 0 0', '1 2 3'], why: 'let creates a new binding per iteration.' },
    { kind: 'js', sub: 'Spread', diff: 'MEDIUM', code: 'console.log([..."abc"].map((c, i) => c + i).join(""));', wrong: ['abc012', 'a1b2c3', '0a1b2c'], why: 'Each character is joined with its index.' },
    { kind: 'js', sub: 'Truthiness', diff: 'HARD', code: 'console.log(!!"0", !!"", [] == false);', wrong: ['false false true', 'true true false', 'true false false'], why: '"0" is truthy, "" is falsy, and [] == false is true after coercion.' },
    { kind: 'js', sub: 'References', diff: 'EASY', code: 'const o = { a: 1 };\nconst p = o;\np.a = 2;\nconsole.log(o.a, o === p);', wrong: ['1 true', '2 false', '1 false'], why: 'Objects are assigned by reference.' },
    { kind: 'js', sub: 'Parsing', diff: 'MEDIUM', code: 'console.log(parseInt("42px"), Number("42px"), +"  7 ");', wrong: ['42 42 7', 'NaN NaN 7', '42 NaN NaN'], why: 'parseInt reads the leading digits; Number() is strict; unary + trims spaces.' },
];
/* ------------------------------- curated concept questions ------------------------------- */
const C = (lang, sub, diff, text, correct, wrong, why) => ({ lang, sub, diff, text, correct, wrong, why });
const CONCEPTS = [
    /* ---- Python ---- */
    C('Python', 'Data types', 'EASY', 'Which data type cannot be modified after it is created?', 'tuple', ['list', 'dict', 'set'], 'Tuples are immutable sequences.'),
    C('Python', 'Operators', 'MEDIUM', 'In Python, what is the difference between `a == b` and `a is b`?', '`==` compares values; `is` compares object identity', ['`==` compares identity; `is` compares values', 'They are identical', '`is` can only be used with numbers'], '`is` checks whether both names refer to the very same object.'),
    C('Python', 'Generators', 'MEDIUM', 'What does the `yield` keyword do inside a function?', 'Makes it a generator that produces values lazily', ['Ends the function and discards its state', 'Raises an exception', 'Declares an asynchronous function'], 'A function containing yield returns a generator object.'),
    C('Python', 'Generators', 'MEDIUM', 'What is `(x * 2 for x in range(3))`?', 'A generator expression', ['A tuple', 'A list', 'A syntax error'], 'Round brackets around a comprehension create a generator.'),
    C('Python', 'Lists', 'EASY', 'Which list method adds every item of another iterable to the end of the list?', 'extend()', ['append()', 'insert()', 'add()'], 'append adds one item; extend adds each element.'),
    C('Python', 'Complexity', 'MEDIUM', 'What is the average time complexity of `x in my_set`?', 'O(1)', ['O(n)', 'O(log n)', 'O(n log n)'], 'Sets are hash tables.'),
    C('Python', 'Complexity', 'EASY', 'What is the time complexity of `x in my_list` in the worst case?', 'O(n)', ['O(1)', 'O(log n)', 'O(n²)'], 'A list is scanned linearly.'),
    C('Python', 'Functions', 'MEDIUM', 'What does `*args` allow a function to accept?', 'Any number of positional arguments, collected in a tuple', ['Any number of keyword arguments', 'Exactly one argument', 'Only integer arguments'], '**kwargs collects keyword arguments.'),
    C('Python', 'Exceptions', 'EASY', 'Which keyword pair is used to handle exceptions in Python?', 'try / except', ['try / catch', 'begin / rescue', 'handle / error'], 'Python uses try/except/finally.'),
    C('Python', 'Decorators', 'MEDIUM', 'What is a decorator in Python?', 'A function that wraps another function to extend its behaviour', ['A comment style for documentation', 'A kind of class constructor', 'A built-in data type'], 'Used with the @name syntax.'),
    C('Python', 'Files', 'EASY', 'Which statement guarantees that a file is closed automatically after use?', 'with open(path) as f:', ['open(path).close', 'file.auto_close()', 'try open(path)'], 'The with statement uses a context manager.'),
    C('Python', 'Modules', 'MEDIUM', 'What does `if __name__ == "__main__":` do?', 'Runs the block only when the file is executed directly, not when imported', ['Runs the block every time the file is imported', 'Declares the main class', 'Prevents the file from being run'], '__name__ is "__main__" only for the entry-point script.'),
    C('Python', 'Concurrency', 'HARD', 'What does the Global Interpreter Lock (GIL) in CPython ensure?', 'Only one thread executes Python bytecode at a time', ['Every thread gets its own interpreter', 'Programs can never deadlock', 'Memory is never garbage collected'], 'CPU-bound threads do not run in parallel in CPython.'),
    C('Python', 'Copying', 'HARD', 'Which call makes an independent copy of a nested list of lists?', 'copy.deepcopy(x)', ['x.copy()', 'copy.copy(x)', 'y = x'], 'Shallow copies still share the inner lists.'),
    C('Python', 'Truthiness', 'EASY', 'What does `bool([])` return?', 'False', ['True', 'None', 'An error'], 'Empty containers are falsy.'),
    C('Python', 'Functions', 'EASY', 'Which is the correct way to give a function parameter a default value?', 'def f(x=10):', ['def f(x==10):', 'def f(x:=10):', 'function f(x=10):'], 'Default values use a single = in the signature.'),
    C('Python', 'Style', 'EASY', 'What is PEP 8?', 'The style guide for Python code', ['The package manager', 'A web framework', 'The Python interpreter'], 'It defines naming, indentation and layout conventions.'),
    C('Python', 'Environments', 'MEDIUM', 'Which tool creates an isolated environment for a project\'s dependencies?', 'venv', ['pip freeze', 'setup.py', 'requirements.txt'], '`python -m venv` creates a virtual environment.'),
    /* ---- Java ---- */
    C('Java', 'Platform', 'EASY', 'Which component of Java executes compiled bytecode?', 'JVM', ['JDK', 'javac', 'JavaDoc'], 'The Java Virtual Machine runs bytecode.'),
    C('Java', 'Platform', 'EASY', 'What is the difference between the JDK and the JRE?', 'The JDK includes development tools (such as the compiler) on top of the JRE', ['The JRE includes the compiler, the JDK does not', 'They are identical', 'The JDK only runs on Linux'], 'Developers need the JDK; users need only the JRE.'),
    C('Java', 'Keywords', 'EASY', 'Which keyword prevents a class from being subclassed?', 'final', ['static', 'abstract', 'sealed only'], 'A final class cannot be extended.'),
    C('Java', 'Interfaces', 'MEDIUM', 'Since Java 8, an interface can contain', 'abstract methods plus default and static methods', ['Only abstract methods', 'Only constants', 'Constructors'], 'default and static methods were added in Java 8.'),
    C('Java', 'OOP', 'EASY', 'What is method overloading?', 'Several methods with the same name but different parameter lists', ['A subclass redefining a superclass method', 'Calling a method too many times', 'Making a method private'], 'Overloading is resolved at compile time.'),
    C('Java', 'Collections', 'EASY', 'Which collection does not allow duplicate elements?', 'HashSet', ['ArrayList', 'LinkedList', 'Vector'], 'A Set stores unique values.'),
    C('Java', 'Exceptions', 'MEDIUM', 'Which exceptions must be declared or caught at compile time?', 'Checked exceptions such as IOException', ['RuntimeException subclasses', 'Errors such as OutOfMemoryError', 'No exceptions'], 'Unchecked exceptions need no declaration.'),
    C('Java', 'Basics', 'EASY', 'What is the default value of an int instance variable?', '0', ['null', '-1', 'Undefined'], 'Numeric fields default to zero.'),
    C('Java', 'Basics', 'EASY', 'Which method is the entry point of a standard Java application?', 'public static void main(String[] args)', ['public void start()', 'static int main()', 'void run(String[] args)'], 'The JVM looks for this exact signature.'),
    C('Java', 'Objects', 'HARD', 'If two objects are equal according to equals(), what does the contract require?', 'They must return the same hashCode()', ['They must be the same object', 'They must have different hashCodes', 'Nothing is required'], 'Violating it breaks HashMap and HashSet.'),
    C('Java', 'Collections', 'MEDIUM', 'How do ArrayList and LinkedList compare for random access `get(i)`?', 'ArrayList is O(1); LinkedList is O(n)', ['Both are O(1)', 'ArrayList is O(n); LinkedList is O(1)', 'Both are O(n)'], 'ArrayList is backed by an array.'),
    C('Java', 'Access', 'EASY', 'Which of these is NOT a Java access modifier?', 'friend', ['public', 'protected', 'private'], 'Java has no friend keyword.'),
    C('Java', 'Keywords', 'EASY', 'What does the `static` keyword on a method mean?', 'It belongs to the class and can be called without an object', ['It cannot be called at all', 'It runs only once per object', 'It is always private'], 'Static members are shared by all instances.'),
    C('Java', 'Strings', 'EASY', 'Which statement about java.lang.String is true?', 'Its objects are immutable', ['Its objects can be modified in place', 'It is a primitive type', 'It cannot be compared'], 'Operations like concat return new strings.'),
    C('Java', 'Types', 'MEDIUM', 'What is autoboxing?', 'Automatic conversion between a primitive and its wrapper class (int ↔ Integer)', ['Compressing objects automatically', 'Boxing a method call', 'Casting a class to an interface'], 'e.g. Integer x = 5;'),
    C('Java', 'Concurrency', 'MEDIUM', 'Which interface does a class implement so it can be passed to `new Thread(...)`?', 'Runnable', ['Serializable', 'Comparable', 'Cloneable'], 'Runnable defines run().'),
    C('Java', 'Language', 'MEDIUM', 'Which Java 8 feature provides functional-style operations on collections?', 'The Streams API', ['JDBC', 'Reflection', 'Serialization'], 'Stream pipelines with map, filter and collect.'),
    C('Java', 'Exceptions', 'EASY', 'What is the purpose of the `finally` block?', 'It runs whether or not an exception occurs (cleanup code)', ['It runs only when an exception occurs', 'It catches all exceptions', 'It ends the program'], 'Typically used to release resources.'),
    /* ---- Web development ---- */
    C('Web Development', 'HTML', 'EASY', 'Which HTML element is the most important (largest) heading?', '<h1>', ['<head>', '<heading>', '<h6>'], 'h1 to h6 define headings, h1 the highest level.'),
    C('Web Development', 'HTML', 'EASY', 'Which semantic element should hold the main navigation links?', '<nav>', ['<section>', '<aside>', '<footer>'], '<nav> exposes the links to assistive technology.'),
    C('Web Development', 'HTML', 'EASY', 'Which attribute opens a link in a new browser tab?', 'target="_blank"', ['rel="new"', 'href="new"', 'open="tab"'], 'Pair it with rel="noopener" for safety.'),
    C('Web Development', 'HTML', 'EASY', 'What is the purpose of the `alt` attribute on an <img>?', 'Alternative text for screen readers and when the image fails to load', ['The image tooltip colour', 'The image file path', 'The image size'], 'It is essential for accessibility.'),
    C('Web Development', 'HTML', 'MEDIUM', 'Which input type gives built-in email format validation?', '<input type="email">', ['<input type="mail">', '<input validate="email">', '<email>'], 'The browser validates the value on submit.'),
    C('Web Development', 'CSS', 'MEDIUM', 'What does `box-sizing: border-box` do?', 'Width and height include padding and border', ['Width excludes padding and border', 'It draws a border around the box', 'It removes margins'], 'It makes layout sizing predictable.'),
    C('Web Development', 'CSS', 'MEDIUM', 'Which has the highest specificity?', 'An inline style', ['An id selector', 'A class selector', 'An element selector'], 'Inline styles beat ids, classes and elements (except !important).'),
    C('Web Development', 'CSS', 'EASY', 'In a flex container with default settings, which direction is the main axis?', 'Horizontal (row)', ['Vertical (column)', 'Diagonal', 'It has no main axis'], 'flex-direction defaults to row.'),
    C('Web Development', 'CSS', 'MEDIUM', 'An element with `position: absolute` is positioned relative to', 'its nearest positioned ancestor', ['the browser window always', 'its previous sibling', 'the <body> only'], 'Without a positioned ancestor it uses the initial containing block.'),
    C('Web Development', 'CSS', 'MEDIUM', 'What is `1rem` relative to?', 'The font size of the root (html) element', ['The parent element font size', 'The viewport width', 'The element\'s own font size'], 'em is relative to the parent; rem to the root.'),
    C('Web Development', 'CSS', 'MEDIUM', 'How does `visibility: hidden` differ from `display: none`?', 'The element keeps its space in the layout', ['It removes the element from the layout', 'It deletes the element', 'There is no difference'], 'display:none removes the box entirely.'),
    C('Web Development', 'CSS', 'EASY', 'What are CSS media queries mainly used for?', 'Applying styles based on screen size or device features', ['Playing audio and video', 'Loading images faster', 'Sending form data'], 'They enable responsive design.'),
    C('Web Development', 'JavaScript', 'EASY', 'What happens if you reassign a variable declared with `const`?', 'A TypeError is thrown', ['It silently changes', 'It becomes undefined', 'Nothing, the line is ignored'], 'const bindings cannot be reassigned.'),
    C('Web Development', 'JavaScript', 'EASY', 'What is the difference between `==` and `===`?', '`===` compares value and type without coercion', ['`===` only compares types', '`==` is stricter', 'They behave the same'], 'Prefer === to avoid coercion surprises.'),
    C('Web Development', 'JavaScript', 'MEDIUM', 'What does an `async` function always return?', 'A Promise', ['undefined', 'A callback', 'A generator'], 'await unwraps the promise inside.'),
    C('Web Development', 'JavaScript', 'MEDIUM', 'How do cookies differ from localStorage?', 'Cookies are sent to the server with each request; localStorage is not', ['localStorage is sent with every request', 'Cookies can store gigabytes', 'localStorage expires after a session by default'], 'localStorage stays in the browser until cleared.'),
    C('Web Development', 'JavaScript', 'EASY', 'What does `Array.prototype.map` return?', 'A new array with the callback applied to each element', ['The original array modified', 'The first matching element', 'A single reduced value'], 'map does not mutate the original.'),
    C('Web Development', 'JavaScript', 'HARD', 'How do arrow functions handle `this`?', 'They use the `this` of the enclosing scope', ['They create their own `this`', '`this` is always window', '`this` is always undefined'], 'Arrow functions have lexical this.'),
    C('Web Development', 'HTTP', 'EASY', 'Which HTTP status code means the resource was not found?', '404', ['200', '301', '500'], '404 Not Found.'),
    C('Web Development', 'HTTP', 'MEDIUM', 'Which status code is the usual response when a new resource is created by POST?', '201 Created', ['200 OK', '204 No Content', '304 Not Modified'], '201 signals creation.'),
    C('Web Development', 'REST', 'MEDIUM', 'What does "stateless" mean in REST?', 'Each request carries all the information the server needs', ['The server stores each client\'s session in memory', 'Requests must be sent in order', 'No database is allowed'], 'Servers do not keep client state between requests.'),
    C('Web Development', 'React', 'MEDIUM', 'Which hook adds local state to a React function component?', 'useState', ['useEffect', 'useRef only', 'useContext'], 'const [value, setValue] = useState(initial).'),
    C('Web Development', 'React', 'MEDIUM', 'Why does React need a `key` prop when rendering lists?', 'To identify items so updates are efficient and correct', ['To style each item', 'To make items clickable', 'To sort the items'], 'Keys help the diffing algorithm.'),
    C('Web Development', 'React', 'HARD', 'When does `useEffect(fn, [])` run `fn`?', 'Once, after the first render', ['After every render', 'Before the first render', 'Never'], 'An empty dependency array means "on mount".'),
    C('Web Development', 'Browser', 'MEDIUM', 'What is the purpose of CORS?', 'It controls which origins may make cross-origin requests to a server', ['It compresses responses', 'It encrypts cookies', 'It caches images'], 'The browser enforces the same-origin policy; CORS relaxes it safely.'),
];
/* ------------------------------- runners ------------------------------- */
const indent = (s) => s.split('\n').map((l) => `    ${l}`).join('\n');
async function runCode(r) {
    let raw = '';
    if (r.kind === 'py') {
        const res = await runPython(`def f():\n    exec(${JSON.stringify(r.code)}, {})\n`, 'f', [{ args: [], hasExpected: false }]);
        if (res[0].error)
            throw new Error(`Python snippet failed: ${res[0].error}\n${r.code}`);
        raw = res[0].out;
    }
    else if (r.kind === 'js') {
        const p = spawnSync(process.execPath, ['-e', r.code], { encoding: 'utf8', timeout: 10000 });
        if (p.status !== 0)
            throw new Error(`JS snippet failed: ${p.stderr}\n${r.code}`);
        raw = p.stdout;
    }
    else {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jq-'));
        fs.writeFileSync(path.join(dir, 'Main.java'), `public class Main {\n${r.extra ?? ''}\npublic static void main(String[] args) {\n${r.code}\n}\n}\n`);
        const p = spawnSync('java', ['Main.java'], { cwd: dir, encoding: 'utf8', timeout: 60000 });
        fs.rmSync(dir, { recursive: true, force: true });
        if (p.status !== 0)
            throw new Error(`Java snippet failed: ${p.stderr}\n${r.code}`);
        raw = p.stdout;
    }
    return raw.trim().split(/\r?\n/).map((l) => l.trim()).join(' ');
}
async function main() {
    const cat = await prisma.questionCategory.findUnique({ where: { code: 'PROGRAMMING' } });
    if (!cat)
        throw new Error('Run `npm run db:seed` first to create the Programming category.');
    const built = [];
    const langName = { py: 'Python', java: 'Java', js: 'JavaScript' };
    for (const [list, topic] of [[[...PY, ...PY_HARD], 'Python'], [[...JAVA, ...JAVA_HARD], 'Java'], [[...JS, ...JS_HARD], 'Web Development']]) {
        for (const r of list) {
            const truth = await runCode(r);
            if (r.wrong.includes(truth))
                throw new Error(`A wrong option equals the real output (${truth}) for:\n${r.code}`);
            const opts = shuffle([truth, ...r.wrong]);
            const shown = r.extra ? `${r.extra}\n\n${r.code}` : r.code;
            built.push({ text: `What is the output of the following ${langName[r.kind]} code?\n\n${shown}`, options: opts, correct: opts.indexOf(truth), topic, sub: r.sub, why: `${r.why} (Output: ${truth})`, diff: r.diff });
        }
        console.log(`  ✔ ${topic}: ${list.length} output questions computed`);
    }
    for (const c of CONCEPTS) {
        const opts = shuffle([c.correct, ...c.wrong]);
        built.push({ text: c.text, options: opts, correct: opts.indexOf(c.correct), topic: c.lang, sub: c.sub, why: c.why, diff: c.diff });
    }
    const existing = new Set((await prisma.question.findMany({ select: { text: true } })).map((q) => q.text));
    const fresh = built.filter((b) => !existing.has(b.text));
    const rows = fresh.map((b) => ({ id: randomUUID(), b }));
    await prisma.$transaction(async (tx) => {
        await tx.question.createMany({ data: rows.map(({ id, b }) => ({ id, categoryId: cat.id, topic: b.topic, subtopic: b.sub, text: b.text, explanation: b.why, difficulty: b.diff, marks: 4, negativeMarks: 1, status: 'PUBLISHED' })) });
        await tx.questionOption.createMany({ data: rows.flatMap(({ id, b }) => b.options.map((text, i) => ({ questionId: id, position: i, text, isCorrect: i === b.correct }))) });
    }, { timeout: 120000 });
    const by = (t) => built.filter((b) => b.topic === t).length;
    const d = (x) => built.filter((b) => b.diff === x).length;
    console.log(`✔ Programming MCQs: ${built.length} (Python ${by('Python')}, Java ${by('Java')}, Web ${by('Web Development')}) — Easy ${d('EASY')}, Medium ${d('MEDIUM')}, Hard ${d('HARD')}; inserted ${fresh.length} new.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
