const SMALL_NUMBERS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

const SECTION_LABELS =
  /^(ingredients?|instructions?|steps?|directions?|method|preparation|step-by-step instructions?)$/;

function numberToWords(n: number): string {
  if (n >= 0 && n < SMALL_NUMBERS.length) {
    return SMALL_NUMBERS[n];
  }
  return String(n);
}

/** e.g. "2-3" → "two to three", "1/2" → "half" */
function speakNumbersInPhrase(text: string): string {
  return text
    .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, (_, num, den) => {
      const n = Number(num);
      const d = Number(den);
      if (n === 1 && d === 2) return "half";
      if (n === 1 && d === 4) return "a quarter";
      return `${numberToWords(n)} ${den === "2" ? "half" : `over ${numberToWords(d)}`}`;
    })
    .replace(/\b(\d+)\s*[-–—]\s*(\d+)\b/g, (_, a, b) => {
      return `${numberToWords(Number(a))} to ${numberToWords(Number(b))}`;
    })
    .replace(/\b(\d+)\b/g, (match) => numberToWords(Number(match)));
}

function cleanInlineMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\\([*_`#[\]])/g, "$1")
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSectionLabel(text: string): boolean {
  const label = text.replace(/[:.!?]+$/g, "").trim().toLowerCase();
  return SECTION_LABELS.test(label);
}

function flushIngredientList(items: string[]): string {
  const normalized = items
    .map((item) => speakNumbersInPhrase(cleanInlineMarkdown(item)))
    .filter(Boolean);
  if (normalized.length === 0) return "";
  if (normalized.length > 6) {
    const head = normalized.slice(0, 4).join(", ");
    return `You'll need ${head}, and a few more ingredients.`;
  }
  if (normalized.length === 1) return `You'll need ${normalized[0]}.`;
  const last = normalized.pop()!;
  return `You'll need ${normalized.join(", ")}, and ${last}.`;
}

const STEP_ORDINALS = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
];

function flushStepList(items: string[]): string[] {
  return items
    .map((item, index) => {
      const step = speakNumbersInPhrase(cleanInlineMarkdown(item));
      if (!step) return "";
      const lead = STEP_ORDINALS[index] ?? "Next";
      let sentence = step.endsWith(".") ? step.slice(0, -1) : step;
      sentence = sentence.charAt(0).toLowerCase() + sentence.slice(1);
      return `${lead}, ${sentence}.`;
    })
    .filter(Boolean);
}

function takeFirstSentences(text: string, maxSentences: number): string {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!parts || parts.length <= maxSentences) return text.trim();
  return parts.slice(0, maxSentences).join(" ").trim();
}

function asSentence(phrase: string): string {
  const trimmed = phrase.replace(/:+$/, "").trim();
  if (!trimmed) return "";
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

/**
 * Converts an assistant reply into natural speech for Piper TTS.
 * Strips markdown, formats lists, and speaks numbers/ranges naturally.
 */
export function toSpokenText(text: string): string {
  const source = text.trim();
  if (!source) return source;

  const lines = source.split("\n");
  const spokenParts: string[] = [];
  let ingredientItems: string[] = [];
  let stepItems: string[] = [];

  const flushIngredients = () => {
    const spoken = flushIngredientList(ingredientItems);
    if (spoken) spokenParts.push(spoken);
    ingredientItems = [];
  };

  const flushSteps = () => {
    spokenParts.push(...flushStepList(stepItems));
    stepItems = [];
  };

  const flushAllLists = () => {
    flushIngredients();
    flushSteps();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushAllLists();
      continue;
    }

    const bullet = line.match(/^[*\-+•]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);

    if (bullet) {
      flushSteps();
      ingredientItems.push(bullet[1]);
      continue;
    }

    if (numbered) {
      flushIngredients();
      stepItems.push(numbered[1]);
      continue;
    }

    flushAllLists();

    const cleaned = cleanInlineMarkdown(line);
    if (!cleaned || isSectionLabel(cleaned)) continue;

    spokenParts.push(asSentence(speakNumbersInPhrase(cleaned)));
  }

  flushAllLists();

  let spoken = spokenParts.join(" ").replace(/\s+/g, " ").trim();

  if (spoken.length > 700) {
    spoken = takeFirstSentences(spoken, 5);
    if (!spoken.endsWith(".")) spoken += ".";
    spoken += " Ask if you'd like me to go into more detail.";
  }

  return spoken;
}
