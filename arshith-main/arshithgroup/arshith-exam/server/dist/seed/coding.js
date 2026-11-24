/**
 * Seeds coding problems. Every problem has a reference solution; expected outputs are produced by RUNNING that
 * solution in the sandbox, so the test data can never disagree with the solution. Idempotent (skips existing titles).
 */
import { prisma } from '../db.js';
import { runPython } from '../lib/codeRunner.js';
const rep = (c, n) => c.repeat(n);
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const lcg = (seed) => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const P = [
    {
        topic: 'Stacks', title: 'Balanced Brackets', diff: 'MEDIUM', func: 'is_balanced', params: ['s'],
        text: 'Given a string s containing only the characters ( ) { } [ ], determine whether the brackets are balanced. A string is balanced when every opening bracket is closed by the same type of bracket, in the correct order.',
        starter: 'def is_balanced(s: str) -> bool:\n    # write your solution here\n    pass\n', constraints: ['1 ≤ s.length ≤ 10^5', 's contains only bracket characters', 'Expected time: O(n)'],
        solution: 'def is_balanced(s):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in s:\n        if ch in "([{":\n            stack.append(ch)\n        elif not stack or stack.pop() != pairs[ch]:\n            return False\n    return len(stack) == 0\n',
        cases: [[['{[()]}']], [['([)]']], [['()[]{}']], [[')'], true, 'Hidden case failed — check an empty-stack edge case.'], [['(('], true, 'Unclosed brackets at the end must make the answer false.'], [[rep('(', 50000) + rep(')', 50000)], true], [['{[}]'], true]],
    },
    {
        topic: 'Arrays', title: 'Two Sum', diff: 'EASY', func: 'two_sum', params: ['nums', 'target'],
        text: 'Given an array of integers nums and an integer target, return the indices [i, j] (with i < j) of the two numbers that add up to target. Exactly one valid pair exists.',
        starter: 'def two_sum(nums: list, target: int) -> list:\n    # return [i, j] with i < j\n    pass\n', constraints: ['2 ≤ nums.length ≤ 10^4', '-10^9 ≤ nums[i] ≤ 10^9', 'Exactly one solution exists'],
        solution: 'def two_sum(nums, target):\n    seen = {}\n    for i, v in enumerate(nums):\n        if target - v in seen:\n            return [seen[target - v], i]\n        seen[v] = i\n',
        cases: [[[2, 7, 11, 15], 9], [[3, 2, 4], 6], [[3, 3], 6], [[-1, -2, -3, -4, -5], -8,], [[0, 4, 3, 0], 0,], [[...range(5000, (i) => i * 10), 3, 4], 7]].map((c, i) => [c, i >= 3]),
    },
    {
        topic: 'Strings', title: 'Reverse Words', diff: 'EASY', func: 'reverse_words', params: ['s'],
        text: 'Given a string s, reverse the order of the words. Words are separated by one or more spaces. The result must contain the words separated by a single space, with no leading or trailing spaces.',
        starter: 'def reverse_words(s: str) -> str:\n    pass\n', constraints: ['1 ≤ s.length ≤ 10^4', 's contains letters, digits and spaces', 'There is at least one word'],
        solution: 'def reverse_words(s):\n    return " ".join(reversed(s.split()))\n',
        cases: [[['the sky is blue']], [['  hello   world  ']], [['a']], [['a good   example'], true], [['  Bob    Loves  Alice   '], true, 'Collapse multiple spaces and trim the ends.']],
    },
    {
        topic: 'Strings', title: 'Valid Palindrome', diff: 'EASY', func: 'is_palindrome', params: ['s'],
        text: 'A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing every non-alphanumeric character, it reads the same forward and backward. Return true if s is a palindrome.',
        starter: 'def is_palindrome(s: str) -> bool:\n    pass\n', constraints: ['1 ≤ s.length ≤ 2 × 10^5', 's consists of printable ASCII characters'],
        solution: 'def is_palindrome(s):\n    t = [c.lower() for c in s if c.isalnum()]\n    return t == t[::-1]\n',
        cases: [[['A man, a plan, a canal: Panama']], [['race a car']], [[' ']], [['0P'], true, 'Digits count as characters too.'], [['.,'], true], [[rep('ab', 50000) + rep('ba', 50000)], true]],
    },
    {
        topic: 'Loops', title: 'FizzBuzz List', diff: 'EASY', func: 'fizz_buzz', params: ['n'],
        text: 'Return a list of strings for the numbers 1..n: "FizzBuzz" if divisible by both 3 and 5, "Fizz" if divisible by 3, "Buzz" if divisible by 5, otherwise the number itself as a string.',
        starter: 'def fizz_buzz(n: int) -> list:\n    pass\n', constraints: ['1 ≤ n ≤ 10^4'],
        solution: 'def fizz_buzz(n):\n    out = []\n    for i in range(1, n + 1):\n        out.append("FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else str(i))\n    return out\n',
        cases: [[[3]], [[5]], [[15]], [[1], true], [[30], true], [[10000], true]],
    },
    {
        topic: 'Dynamic Programming', title: 'Maximum Subarray', diff: 'MEDIUM', wrap1: true, func: 'max_subarray', params: ['nums'],
        text: 'Given an integer array nums, find the contiguous non-empty subarray with the largest sum and return that sum.',
        starter: 'def max_subarray(nums: list) -> int:\n    pass\n', constraints: ['1 ≤ nums.length ≤ 10^5', '-10^4 ≤ nums[i] ≤ 10^4', 'Expected time: O(n)'],
        solution: 'def max_subarray(nums):\n    best = cur = nums[0]\n    for v in nums[1:]:\n        cur = max(v, cur + v)\n        best = max(best, cur)\n    return best\n',
        cases: [[[-2, 1, -3, 4, -1, 2, 1, -5, 4]], [[1]], [[5, 4, -1, 7, 8]], [[-3, -1, -2], true, 'All numbers may be negative.'], [[0, 0, 0], true], [range(100000, (i) => (i % 7) - 3), true]],
    },
    {
        topic: 'Sorting', title: 'Merge Intervals', diff: 'MEDIUM', wrap1: true, func: 'merge_intervals', params: ['intervals'],
        text: 'Given a list of intervals [start, end], merge all overlapping intervals (touching intervals such as [1,4] and [4,5] overlap) and return the merged intervals sorted by start.',
        starter: 'def merge_intervals(intervals: list) -> list:\n    pass\n', constraints: ['1 ≤ intervals.length ≤ 10^4', '0 ≤ start ≤ end ≤ 10^6', 'The input is not necessarily sorted'],
        solution: 'def merge_intervals(intervals):\n    out = []\n    for s, e in sorted(intervals):\n        if out and s <= out[-1][1]:\n            out[-1][1] = max(out[-1][1], e)\n        else:\n            out.append([s, e])\n    return out\n',
        cases: [[[[1, 3], [2, 6], [8, 10], [15, 18]]], [[[1, 4], [4, 5]]], [[[1, 4], [0, 4]]], [[[1, 4], [2, 3]], true, 'One interval can contain another.'], [[[5, 6], [1, 2], [3, 4]], true], [[[2, 3], [4, 5], [6, 7], [8, 9], [1, 10]], true]],
    },
    {
        topic: 'Strings', title: 'Longest Common Prefix', diff: 'EASY', func: 'longest_common_prefix', params: ['strs'],
        text: 'Write a function to find the longest common prefix string amongst a list of strings. If there is no common prefix, return an empty string.',
        starter: 'def longest_common_prefix(strs: list) -> str:\n    pass\n', constraints: ['1 ≤ strs.length ≤ 200', '0 ≤ strs[i].length ≤ 200', 'Lowercase English letters only'],
        solution: 'def longest_common_prefix(strs):\n    prefix = strs[0]\n    for w in strs[1:]:\n        while not w.startswith(prefix):\n            prefix = prefix[:-1]\n    return prefix\n',
        cases: [[[['flower', 'flow', 'flight']]], [[['dog', 'racecar', 'car']]], [[['alone']]], [[['', 'b']], true, 'An empty string means the prefix is empty.'], [[['interview', 'internet', 'interval', 'internal']], true]],
    },
    {
        topic: 'Hashing', title: 'Group Anagrams', diff: 'MEDIUM', func: 'group_anagrams', params: ['strs'],
        text: 'Group the strings that are anagrams of each other. Return a list of groups where each group is sorted alphabetically and the groups themselves are sorted by their first word.',
        starter: 'def group_anagrams(strs: list) -> list:\n    pass\n', constraints: ['1 ≤ strs.length ≤ 10^4', '0 ≤ strs[i].length ≤ 100', 'Lowercase English letters only'],
        solution: 'def group_anagrams(strs):\n    groups = {}\n    for w in strs:\n        groups.setdefault("".join(sorted(w)), []).append(w)\n    return sorted(sorted(g) for g in groups.values())\n',
        cases: [[[['eat', 'tea', 'tan', 'ate', 'nat', 'bat']]], [[['']]], [[['a']]], [[['abc', 'bca', 'cab', 'xyz', 'zyx', 'q']], true], [[['', '', 'a']], true, 'Empty strings are anagrams of each other.']],
    },
    {
        topic: 'Dynamic Programming', title: 'Climbing Stairs', diff: 'EASY', func: 'climb_stairs', params: ['n'],
        text: 'You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you reach the top?',
        starter: 'def climb_stairs(n: int) -> int:\n    pass\n', constraints: ['1 ≤ n ≤ 45'],
        solution: 'def climb_stairs(n):\n    a, b = 1, 1\n    for _ in range(n - 1):\n        a, b = b, a + b\n    return b\n',
        cases: [[[2]], [[3]], [[5]], [[1], true], [[10], true], [[45], true]],
    },
    {
        topic: 'Searching', title: 'Binary Search', diff: 'EASY', func: 'binary_search', params: ['nums', 'target'],
        text: 'Given a sorted array of distinct integers nums and a target, return the index of target, or -1 if it is not present. Your solution must run in O(log n).',
        starter: 'def binary_search(nums: list, target: int) -> int:\n    pass\n', constraints: ['1 ≤ nums.length ≤ 10^5', 'nums is sorted in ascending order with distinct values'],
        solution: 'def binary_search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n',
        cases: [[[-1, 0, 3, 5, 9, 12], 9], [[-1, 0, 3, 5, 9, 12], 2], [[5], 5], [[1, 3], 1,], [[1, 3], 3], [range(100000, (i) => i * 3), 299997]].map((c, i) => [c, i >= 3]),
    },
    {
        topic: 'Arrays', title: 'Rotate Array', diff: 'EASY', func: 'rotate_array', params: ['nums', 'k'],
        text: 'Return a new array with nums rotated to the right by k steps (k may be larger than the length).',
        starter: 'def rotate_array(nums: list, k: int) -> list:\n    pass\n', constraints: ['1 ≤ nums.length ≤ 10^5', '0 ≤ k ≤ 10^9'],
        solution: 'def rotate_array(nums, k):\n    k %= len(nums)\n    return nums[-k:] + nums[:-k] if k else nums[:]\n',
        cases: [[[1, 2, 3, 4, 5, 6, 7], 3], [[-1, -100, 3, 99], 2], [[1], 5], [[1, 2], 0,], [[1, 2, 3], 1000000000,]].map((c, i) => [c, i >= 3]),
    },
    {
        topic: 'Hashing', title: 'First Unique Character', diff: 'EASY', func: 'first_unique_char', params: ['s'],
        text: 'Given a string s, find the index of the first character that does not repeat anywhere in the string. Return -1 if there is none.',
        starter: 'def first_unique_char(s: str) -> int:\n    pass\n', constraints: ['1 ≤ s.length ≤ 10^5', 'Lowercase English letters only'],
        solution: 'def first_unique_char(s):\n    from collections import Counter\n    c = Counter(s)\n    for i, ch in enumerate(s):\n        if c[ch] == 1:\n            return i\n    return -1\n',
        cases: [[['leetcode']], [['loveleetcode']], [['aabb']], [['z'], true], [['abcabcd'], true]],
    },
    {
        topic: 'Strings', title: 'Roman to Integer', diff: 'EASY', func: 'roman_to_int', params: ['s'],
        text: 'Convert a Roman numeral to an integer. Symbols: I=1, V=5, X=10, L=50, C=100, D=500, M=1000. When a smaller value appears before a larger one it is subtracted (e.g. IV = 4, IX = 9, XL = 40, CM = 900).',
        starter: 'def roman_to_int(s: str) -> int:\n    pass\n', constraints: ['1 ≤ s.length ≤ 15', 's is a valid Roman numeral in the range [1, 3999]'],
        solution: 'def roman_to_int(s):\n    v = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}\n    total = 0\n    for i, ch in enumerate(s):\n        if i + 1 < len(s) and v[ch] < v[s[i + 1]]:\n            total -= v[ch]\n        else:\n            total += v[ch]\n    return total\n',
        cases: [[['III']], [['LVIII']], [['MCMXCIV']], [['IV'], true], [['IX'], true], [['MMMCMXCIX'], true]],
    },
    {
        topic: 'Arrays', title: 'Product of Array Except Self', diff: 'MEDIUM', wrap1: true, func: 'product_except_self', params: ['nums'],
        text: 'Return an array answer where answer[i] equals the product of every element of nums except nums[i]. Do it without using division, in O(n) time.',
        starter: 'def product_except_self(nums: list) -> list:\n    pass\n', constraints: ['2 ≤ nums.length ≤ 10^5', '-30 ≤ nums[i] ≤ 30', 'The product of any prefix or suffix fits in a 32-bit integer'],
        solution: 'def product_except_self(nums):\n    n = len(nums)\n    out = [1] * n\n    p = 1\n    for i in range(n):\n        out[i] = p\n        p *= nums[i]\n    p = 1\n    for i in range(n - 1, -1, -1):\n        out[i] *= p\n        p *= nums[i]\n    return out\n',
        cases: [[[1, 2, 3, 4]], [[-1, 1, 0, -3, 3]], [[2, 3]], [[0, 0], true, 'More than one zero makes every product zero.'], [[1, 1, 1, 1], true], [[5, -2, 4, 0, 7], true]],
    },
    {
        topic: 'Sliding Window', title: 'Longest Substring Without Repeating Characters', diff: 'MEDIUM', func: 'length_of_longest_substring', params: ['s'],
        text: 'Return the length of the longest substring of s that contains no repeated characters.',
        starter: 'def length_of_longest_substring(s: str) -> int:\n    pass\n', constraints: ['0 ≤ s.length ≤ 5 × 10^4', 's consists of English letters, digits, symbols and spaces'],
        solution: 'def length_of_longest_substring(s):\n    last = {}\n    start = best = 0\n    for i, ch in enumerate(s):\n        if ch in last and last[ch] >= start:\n            start = last[ch] + 1\n        last[ch] = i\n        best = max(best, i - start + 1)\n    return best\n',
        cases: [[['abcabcbb']], [['bbbbb']], [['pwwkew']], [[''], true, 'An empty string has length 0.'], [['dvdf'], true], [[rep('abcdefghij', 5000)], true]],
    },
    {
        topic: 'Heaps', title: 'Top K Frequent Elements', diff: 'MEDIUM', func: 'top_k_frequent', params: ['nums', 'k'],
        text: 'Return the k most frequent elements of nums. Order them by frequency (highest first); break ties by the smaller value first.',
        starter: 'def top_k_frequent(nums: list, k: int) -> list:\n    pass\n', constraints: ['1 ≤ nums.length ≤ 10^5', '1 ≤ k ≤ number of distinct elements'],
        solution: 'def top_k_frequent(nums, k):\n    from collections import Counter\n    c = Counter(nums)\n    return [v for v, _ in sorted(c.items(), key=lambda x: (-x[1], x[0]))[:k]]\n',
        cases: [[[1, 1, 1, 2, 2, 3], 2], [[1], 1], [[4, 4, 5, 5, 6], 2], [[7, 7, 8, 8, 9, 9, 9], 3,], [[3, 0, 1, 0], 1,]].map((c, i) => [c, i >= 3]),
    },
    {
        topic: 'Math', title: 'Count Primes', diff: 'MEDIUM', func: 'count_primes', params: ['n'],
        text: 'Return the number of prime numbers strictly less than n. Aim for the Sieve of Eratosthenes, O(n log log n).',
        starter: 'def count_primes(n: int) -> int:\n    pass\n', constraints: ['0 ≤ n ≤ 5 × 10^5'],
        solution: 'def count_primes(n):\n    if n < 3:\n        return 0\n    sieve = bytearray([1]) * n\n    sieve[0] = sieve[1] = 0\n    for i in range(2, int(n ** 0.5) + 1):\n        if sieve[i]:\n            sieve[i * i::i] = bytearray(len(range(i * i, n, i)))\n    return sum(sieve)\n',
        cases: [[[10]], [[0]], [[1]], [[2], true], [[100], true], [[200000], true, 'A slow solution will time out here.']],
    },
    {
        topic: 'Two Pointers', title: 'Trapping Rain Water', diff: 'HARD', wrap1: true, func: 'trap_rain_water', params: ['height'],
        text: 'Given n non-negative integers representing an elevation map where each bar has width 1, compute how much water it can trap after raining.',
        starter: 'def trap_rain_water(height: list) -> int:\n    pass\n', constraints: ['1 ≤ height.length ≤ 2 × 10^4', '0 ≤ height[i] ≤ 10^5', 'Expected time: O(n)'],
        solution: 'def trap_rain_water(height):\n    l, r = 0, len(height) - 1\n    lm = rm = water = 0\n    while l < r:\n        if height[l] < height[r]:\n            lm = max(lm, height[l])\n            water += lm - height[l]\n            l += 1\n        else:\n            rm = max(rm, height[r])\n            water += rm - height[r]\n            r -= 1\n    return water\n',
        cases: [[[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], [[4, 2, 0, 3, 2, 5]], [[3, 0, 3]], [[1, 2, 3], true, 'A strictly increasing map traps nothing.'], [[5], true], [range(20000, (i) => (i * 37) % 1000), true]],
    },
    {
        topic: 'Graphs', title: 'Number of Islands', diff: 'HARD', wrap1: true, func: 'num_islands', params: ['grid'],
        text: 'Given a 2D grid of 1s (land) and 0s (water), count the islands. An island is formed by connecting adjacent land cells horizontally or vertically.',
        starter: 'def num_islands(grid: list) -> int:\n    pass\n', constraints: ['1 ≤ rows, cols ≤ 200', 'grid[i][j] is 0 or 1'],
        solution: 'def num_islands(grid):\n    rows, cols = len(grid), len(grid[0])\n    seen = [[False] * cols for _ in range(rows)]\n    count = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == 1 and not seen[r][c]:\n                count += 1\n                stack = [(r, c)]\n                seen[r][c] = True\n                while stack:\n                    x, y = stack.pop()\n                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n                        a, b = x + dx, y + dy\n                        if 0 <= a < rows and 0 <= b < cols and grid[a][b] == 1 and not seen[a][b]:\n                            seen[a][b] = True\n                            stack.append((a, b))\n    return count\n',
        cases: [[[[1, 1, 1, 1, 0], [1, 1, 0, 1, 0], [1, 1, 0, 0, 0], [0, 0, 0, 0, 0]]], [[[1, 1, 0, 0, 0], [1, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 1]]], [[[0]]], [[[1]], true], [[[1, 0, 1], [0, 1, 0], [1, 0, 1]], true, 'Diagonal cells are NOT connected.'], [range(200, (i) => range(200, (j) => ((i + j) % 3 === 0 ? 1 : 0))), true]],
    },
    {
        topic: 'Dynamic Programming', title: 'Coin Change', diff: 'MEDIUM', func: 'coin_change', params: ['coins', 'amount'],
        text: 'Given coin denominations and a target amount, return the fewest number of coins needed to make that amount, or -1 if it is impossible. You have unlimited coins of each type.',
        starter: 'def coin_change(coins: list, amount: int) -> int:\n    pass\n', constraints: ['1 ≤ coins.length ≤ 12', '1 ≤ coins[i] ≤ 2^31 − 1', '0 ≤ amount ≤ 10^4'],
        solution: 'def coin_change(coins, amount):\n    INF = amount + 1\n    dp = [0] + [INF] * amount\n    for a in range(1, amount + 1):\n        for c in coins:\n            if c <= a and dp[a - c] + 1 < dp[a]:\n                dp[a] = dp[a - c] + 1\n    return dp[amount] if dp[amount] != INF else -1\n',
        cases: [[[1, 2, 5], 11], [[2], 3], [[1], 0], [[186, 419, 83, 408], 6249,], [[2, 5, 10, 1], 27,], [[3, 7], 11,]].map((c, i) => [c, i >= 3]),
    },
    {
        topic: 'Dynamic Programming', title: 'Word Break', diff: 'MEDIUM', func: 'word_break', params: ['s', 'words'],
        text: 'Given a string s and a list of words, return true if s can be split into a sequence of one or more dictionary words (words may be reused).',
        starter: 'def word_break(s: str, words: list) -> bool:\n    pass\n', constraints: ['1 ≤ s.length ≤ 300', '1 ≤ words.length ≤ 1000'],
        solution: 'def word_break(s, words):\n    ws = set(words)\n    dp = [True] + [False] * len(s)\n    for i in range(1, len(s) + 1):\n        for j in range(i):\n            if dp[j] and s[j:i] in ws:\n                dp[i] = True\n                break\n    return dp[-1]\n',
        cases: [[['leetcode', ['leet', 'code']]], [['applepenapple', ['apple', 'pen']]], [['catsandog', ['cats', 'dog', 'sand', 'and', 'cat']]], [[rep('a', 60) + 'b', ['a', 'aa', 'aaa', 'aaaa']], true, 'Exponential backtracking will time out; use DP.'], [['aaaa', ['a', 'aa']], true]],
    },
    {
        topic: 'Dynamic Programming', title: 'Edit Distance', diff: 'HARD', func: 'edit_distance', params: ['a', 'b'],
        text: 'Return the minimum number of single-character operations (insert, delete, replace) required to convert string a into string b.',
        starter: 'def edit_distance(a: str, b: str) -> int:\n    pass\n', constraints: ['0 ≤ a.length, b.length ≤ 500', 'Lowercase English letters only'],
        solution: 'def edit_distance(a, b):\n    prev = list(range(len(b) + 1))\n    for i in range(1, len(a) + 1):\n        cur = [i] + [0] * len(b)\n        for j in range(1, len(b) + 1):\n            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] != b[j - 1]))\n        prev = cur\n    return prev[-1]\n',
        cases: [[['horse', 'ros']], [['intention', 'execution']], [['', 'abc']], [['same', 'same'], true], [['abc', ''], true], [[rep('abcde', 80), rep('badce', 80)], true]],
    },
    {
        topic: 'Heaps', title: 'Kth Largest Element', diff: 'MEDIUM', func: 'kth_largest', params: ['nums', 'k'],
        text: 'Return the kth largest element in the array (the kth in sorted order, counting duplicates — not the kth distinct value).',
        starter: 'def kth_largest(nums: list, k: int) -> int:\n    pass\n', constraints: ['1 ≤ k ≤ nums.length ≤ 10^5', '-10^4 ≤ nums[i] ≤ 10^4'],
        solution: 'def kth_largest(nums, k):\n    import heapq\n    return heapq.nlargest(k, nums)[-1]\n',
        cases: [[[3, 2, 1, 5, 6, 4], 2], [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], [[1], 1], [[7, 7, 7], 2,], [[-1, -2, -3], 3,]].map((c, i) => [c, i >= 3]),
    },
    {
        topic: 'Dynamic Programming', title: 'Longest Increasing Subsequence', diff: 'HARD', wrap1: true, func: 'length_of_lis', params: ['nums'],
        text: 'Return the length of the longest strictly increasing subsequence of nums. Aim for O(n log n).',
        starter: 'def length_of_lis(nums: list) -> int:\n    pass\n', constraints: ['1 ≤ nums.length ≤ 2 × 10^4', '-10^4 ≤ nums[i] ≤ 10^4'],
        solution: 'def length_of_lis(nums):\n    import bisect\n    tails = []\n    for v in nums:\n        i = bisect.bisect_left(tails, v)\n        if i == len(tails):\n            tails.append(v)\n        else:\n            tails[i] = v\n    return len(tails)\n',
        cases: [[[10, 9, 2, 5, 3, 7, 101, 18]], [[0, 1, 0, 3, 2, 3]], [[7, 7, 7, 7]], [[1], true], [[5, 4, 3, 2, 1], true], [(() => { const r = lcg(7); return range(20000, () => Math.floor(r() * 20000) - 10000); })(), true]],
    },
    {
        topic: 'Matrix', title: 'Spiral Matrix', diff: 'MEDIUM', wrap1: true, func: 'spiral_order', params: ['matrix'],
        text: 'Return all elements of an m × n matrix in spiral order, starting at the top-left and moving clockwise.',
        starter: 'def spiral_order(matrix: list) -> list:\n    pass\n', constraints: ['1 ≤ m, n ≤ 100', '-100 ≤ matrix[i][j] ≤ 100'],
        solution: 'def spiral_order(matrix):\n    out = []\n    top, bottom, left, right = 0, len(matrix) - 1, 0, len(matrix[0]) - 1\n    while top <= bottom and left <= right:\n        for c in range(left, right + 1):\n            out.append(matrix[top][c])\n        for r in range(top + 1, bottom + 1):\n            out.append(matrix[r][right])\n        if top < bottom and left < right:\n            for c in range(right - 1, left - 1, -1):\n                out.append(matrix[bottom][c])\n            for r in range(bottom - 1, top, -1):\n                out.append(matrix[r][left])\n        top += 1; bottom -= 1; left += 1; right -= 1\n    return out\n',
        cases: [[[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], [[[1]]], [[[1, 2, 3]], true, 'A single row must not be visited twice.'], [[[1], [2], [3]], true], [range(100, (i) => range(100, (j) => i * 100 + j)), true]],
    },
    {
        topic: 'Strings', title: 'Valid Anagram', diff: 'EASY', func: 'is_anagram', params: ['a', 'b'],
        text: 'Return true if string b is an anagram of string a — that is, b uses exactly the same letters with the same counts, in any order.',
        starter: 'def is_anagram(a: str, b: str) -> bool:\n    pass\n', constraints: ['1 ≤ a.length, b.length ≤ 5 × 10^4', 'Lowercase English letters only'],
        solution: 'def is_anagram(a, b):\n    from collections import Counter\n    return Counter(a) == Counter(b)\n',
        cases: [[['anagram', 'nagaram']], [['rat', 'car']], [['a', 'a']], [['ab', 'a'], true, 'Different lengths can never be anagrams.'], [['aacc', 'ccac'], true]],
    },
];
async function main() {
    const cat = await prisma.questionCategory.findUnique({ where: { code: 'CODING' } });
    if (!cat)
        throw new Error('Run `npm run db:seed` first to create the Coding category.');
    const existing = new Set((await prisma.question.findMany({ where: { type: 'CODING' }, select: { title: true } })).map((q) => q.title));
    let added = 0;
    for (const p of P) {
        if (existing.has(p.title))
            continue;
        const results = await runPython(p.solution, p.func, p.cases.map(([args]) => ({ args: (p.wrap1 ? [args] : args), hasExpected: false })));
        const bad = results.findIndex((r) => r.error);
        if (bad >= 0)
            throw new Error(`Reference solution for "${p.title}" failed on case ${bad + 1}: ${results[bad].error}`);
        const hiddenIdx = p.cases.map((c, i) => (c[1] ? i : -1)).filter((i) => i >= 0);
        const flags = p.cases.map((c, i) => (c[1] ?? false) || (!c[1] && i >= 3 && hiddenIdx.length === 0));
        await prisma.question.create({
            data: {
                categoryId: cat.id, type: 'CODING', topic: p.topic, title: p.title, text: p.text, difficulty: p.diff, marks: p.diff === 'EASY' ? 10 : p.diff === 'MEDIUM' ? 15 : 20, negativeMarks: 0,
                funcName: p.func, paramNames: p.params, starterCode: p.starter, solution: p.solution, constraints: p.constraints, status: 'PUBLISHED',
                testCases: { create: p.cases.map((c, i) => ({ position: i, args: (p.wrap1 ? [c[0]] : c[0]), expected: results[i].actual, isHidden: flags[i], hint: c[2] ?? null })) },
            },
        });
        added++;
        console.log(`  ✔ ${p.title} (${p.cases.length} cases, ${flags.filter(Boolean).length} hidden)`);
    }
    console.log(`✔ Coding problems: ${P.length} defined, ${added} added.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
