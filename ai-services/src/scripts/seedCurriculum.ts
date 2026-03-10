/**
 * Seed script — populates Pinecone with sample curriculum content.
 *
 * Usage (from ai-services/):
 *   npx tsx src/scripts/seedCurriculum.ts
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../frontend/.env') });

const COURSE_ID = 'cs101';
const TOPIC_ID = 'topic_binary_search';

const CURRICULUM: { chapterTitle: string; rawText: string }[] = [
  {
    chapterTitle: 'Chapter 5: Searching Algorithms — Binary Search',
    rawText: `
Binary Search is one of the most fundamental and efficient searching algorithms in computer science.
It works on the principle of divide and conquer and requires the input array to be sorted.

How Binary Search Works:
Binary search repeatedly divides the search interval in half. It compares the target value to the
middle element of the array. If the target equals the middle element, the search is complete.
If the target is less than the middle element, the search continues in the left half.
If the target is greater than the middle element, the search continues in the right half.
This process repeats until the target is found or the interval is empty.

Time Complexity:
- Best case: O(1) — target is the middle element on the first comparison.
- Average case: O(log n) — each step halves the remaining elements.
- Worst case: O(log n) — target is at the extreme end or not present.

Space Complexity:
- Iterative implementation: O(1) — no extra space is needed.
- Recursive implementation: O(log n) — due to call stack frames.

Binary Search vs Linear Search:
Linear search checks every element one by one, giving O(n) time complexity.
Binary search is dramatically faster for large sorted datasets.
For example, searching 1,000,000 elements takes at most 20 comparisons with binary search
versus up to 1,000,000 comparisons with linear search.

Preconditions:
Binary search only works correctly if the array is sorted in ascending order.
If the array is unsorted, you must sort it first (at O(n log n) cost) before applying binary search.

Iterative Implementation (Python):
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1  # target not found

Recursive Implementation (Python):
def binary_search_recursive(arr, target, left, right):
    if left > right:
        return -1
    mid = (left + right) // 2
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search_recursive(arr, target, mid + 1, right)
    else:
        return binary_search_recursive(arr, target, left, mid - 1)

Real-World Applications of Binary Search:
1. Dictionary lookup — find a word in a sorted dictionary.
2. Database indexing — B-trees use binary search principles.
3. Git bisect — finding which commit introduced a bug.
4. Finding square roots — binary search over a range of numbers.
5. Debugging with logs — narrowing down the failing test case.

Common Mistakes:
- Off-by-one errors in the left/right boundary updates.
- Integer overflow when computing mid = (left + right) / 2 in languages like Java/C++.
  Use mid = left + (right - left) / 2 instead.
- Applying binary search to an unsorted array, which gives incorrect results.

Variants of Binary Search:
- Lower bound: find the first position where the element is >= target.
- Upper bound: find the first position where the element is > target.
- Rotated array binary search: handles arrays rotated at a pivot point.
`,
  },
  {
    chapterTitle: 'Chapter 4: Sorting Algorithms Overview',
    rawText: `
Sorting algorithms arrange elements of a list in a specific order (ascending or descending).
Understanding sorting is essential because many other algorithms (including binary search)
require sorted input.

Bubble Sort:
Repeatedly swaps adjacent elements if they are in the wrong order.
Time complexity: O(n²) average and worst case.
Simple but very inefficient for large datasets.

Selection Sort:
Finds the minimum element and places it at the beginning, then repeats for the remaining list.
Time complexity: O(n²) in all cases.
Makes fewer swaps than bubble sort.

Insertion Sort:
Builds the sorted list one element at a time by inserting each into its correct position.
Time complexity: O(n²) worst case, O(n) best case (already sorted).
Efficient for small or nearly sorted datasets.

Merge Sort:
A divide and conquer algorithm that splits the array, sorts each half, and merges them.
Time complexity: O(n log n) in all cases.
Space complexity: O(n) — requires auxiliary space.
Stable sort — preserves relative order of equal elements.

Quick Sort:
Picks a pivot, partitions elements around it, and recursively sorts each partition.
Time complexity: O(n log n) average, O(n²) worst case (poor pivot selection).
Space complexity: O(log n) average due to recursion.
Generally the fastest in practice for in-memory sorting.

Heap Sort:
Uses a binary heap data structure to sort elements.
Time complexity: O(n log n) in all cases.
Space complexity: O(1) — in-place.
Not stable.

Choosing the Right Sorting Algorithm:
- Small arrays (< 20 elements): insertion sort.
- General purpose: quick sort or merge sort.
- Need stability: merge sort.
- Memory constrained: heap sort.
- Nearly sorted data: insertion sort.
`,
  },
  {
    chapterTitle: 'Chapter 6: Algorithm Complexity and Big-O Notation',
    rawText: `
Big-O notation describes the upper bound on the growth rate of an algorithm's time or space
requirements as a function of input size n. It helps us compare algorithms independent of hardware.

Common Big-O Complexities (from fastest to slowest):
1. O(1)       — Constant time. Example: array index access.
2. O(log n)   — Logarithmic. Example: binary search.
3. O(n)       — Linear. Example: linear search, single loop.
4. O(n log n) — Linearithmic. Example: merge sort, quick sort (average).
5. O(n²)      — Quadratic. Example: bubble sort, nested loops.
6. O(2^n)     — Exponential. Example: recursive Fibonacci, brute-force subset enumeration.
7. O(n!)      — Factorial. Example: brute-force travelling salesman.

Best, Average, and Worst Case:
- Best case (Ω notation): minimum time for any input of size n.
- Average case (Θ notation): expected time over all possible inputs.
- Worst case (O notation): maximum time for any input of size n.

Space Complexity:
Measures the memory an algorithm uses relative to input size.
Includes both auxiliary space (extra memory used) and input space.

Amortized Analysis:
Some operations are occasionally expensive but cheap on average.
Example: dynamic array (ArrayList) doubling — individual push can be O(n) but
amortized over many operations it is O(1).

Why Big-O Matters:
An O(n²) algorithm on 1,000 elements does ~1,000,000 operations.
An O(n log n) algorithm on 1,000 elements does only ~10,000 operations.
At 1,000,000 elements the difference becomes billions vs millions — critical for production systems.
`,
  },
];

async function ensureIndex(pinecone: import('@pinecone-database/pinecone').Pinecone, name: string) {
  const { indexes } = await pinecone.listIndexes();
  const exists = indexes?.some((idx) => idx.name === name);
  if (exists) {
    console.log(`Index "${name}" already exists — skipping creation\n`);
    return;
  }
  console.log(`Creating index "${name}" (dim=384, cosine, serverless us-east-1)...`);
  await pinecone.createIndex({
    name,
    dimension: 384,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',
      },
    },
  });
  // Wait for the index to become ready
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const desc = await pinecone.describeIndex(name);
    if (desc.status?.ready) { ready = true; break; }
    process.stdout.write('.');
  }
  if (!ready) throw new Error('Index did not become ready in time');
  console.log(`\nIndex "${name}" is ready\n`);
}

async function seedCurriculum() {
  const { default: pinecone } = await import('../config/pinecone');
  const { ingestCurriculum } = await import('../pipelines/ingestCurriculum');

  await ensureIndex(pinecone, 'intellicampus');

  console.log('=== Seeding Curriculum into Pinecone ===\n');
  let total = 0;

  for (const entry of CURRICULUM) {
    process.stdout.write(`Ingesting: "${entry.chapterTitle}" ... `);
    const count = await ingestCurriculum({
      courseId: COURSE_ID,
      topicId: TOPIC_ID,
      chapterTitle: entry.chapterTitle,
      rawText: entry.rawText.trim(),
    });
    console.log(`${count} chunks stored`);
    total += count;
  }

  console.log(`\n✓ Done — ${total} total chunks stored in Pinecone`);
  console.log(`  courseId: ${COURSE_ID} | topicId: ${TOPIC_ID}`);
}

seedCurriculum().catch((err) => {
  console.error('Seed failed:', err.message ?? err);
  process.exit(1);
});
