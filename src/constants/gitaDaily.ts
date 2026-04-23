export type GitaChapter = {
  chapter: number;
  name: string;
  slokaCount: number;
  theme: string;
};

export const gitaChapters: GitaChapter[] = [
  { chapter: 1, name: "Arjuna Vishada Yoga", slokaCount: 47, theme: "Arjuna's grief and moral confusion." },
  { chapter: 2, name: "Sankhya Yoga", slokaCount: 72, theme: "Steady wisdom, duty, and detached action." },
  { chapter: 3, name: "Karma Yoga", slokaCount: 43, theme: "Selfless action as the path to growth." },
  { chapter: 4, name: "Jnana Karma Sanyasa Yoga", slokaCount: 42, theme: "Knowledge, action, and divine purpose." },
  { chapter: 5, name: "Karma Sanyasa Yoga", slokaCount: 29, theme: "Renunciation through right understanding." },
  { chapter: 6, name: "Dhyana Yoga", slokaCount: 47, theme: "Meditation and mastery of the mind." },
  { chapter: 7, name: "Jnana Vijnana Yoga", slokaCount: 30, theme: "Knowing the Supreme deeply." },
  { chapter: 8, name: "Akshara Brahma Yoga", slokaCount: 28, theme: "The eternal reality and remembrance." },
  { chapter: 9, name: "Raja Vidya Raja Guhya Yoga", slokaCount: 34, theme: "The royal knowledge and devotion." },
  { chapter: 10, name: "Vibhuti Yoga", slokaCount: 42, theme: "Divine manifestations in all existence." },
  { chapter: 11, name: "Vishwarupa Darshana Yoga", slokaCount: 55, theme: "The universal cosmic form." },
  { chapter: 12, name: "Bhakti Yoga", slokaCount: 20, theme: "The path of loving devotion." },
  { chapter: 13, name: "Kshetra Kshetrajna Vibhaga Yoga", slokaCount: 35, theme: "Body, soul, and true knowledge." },
  { chapter: 14, name: "Gunatraya Vibhaga Yoga", slokaCount: 27, theme: "Three gunas and inner freedom." },
  { chapter: 15, name: "Purushottama Yoga", slokaCount: 20, theme: "The supreme person and life's root." },
  { chapter: 16, name: "Daivasura Sampad Vibhaga Yoga", slokaCount: 24, theme: "Divine and demonic tendencies." },
  { chapter: 17, name: "Shraddhatraya Vibhaga Yoga", slokaCount: 28, theme: "Faith shaped by nature." },
  { chapter: 18, name: "Moksha Sanyasa Yoga", slokaCount: 78, theme: "Liberation through surrender and wisdom." }
];

export const TOTAL_GITA_SLOKAS = gitaChapters.reduce((total, chapter) => total + chapter.slokaCount, 0);

export type GitaSlokaReference = {
  chapter: number;
  sloka: number;
  reference: string;
  chapterName: string;
  theme: string;
};

export function getChapterMeta(chapterNumber: number) {
  return gitaChapters.find((chapter) => chapter.chapter === chapterNumber);
}

export function getSlokaReferenceByGlobalIndex(globalIndex: number): GitaSlokaReference {
  const safeIndex = ((globalIndex % TOTAL_GITA_SLOKAS) + TOTAL_GITA_SLOKAS) % TOTAL_GITA_SLOKAS;
  let cursor = safeIndex;

  for (const chapter of gitaChapters) {
    if (cursor < chapter.slokaCount) {
      const sloka = cursor + 1;
      return {
        chapter: chapter.chapter,
        sloka,
        reference: `Bhagavad Gita ${chapter.chapter}.${sloka}`,
        chapterName: chapter.name,
        theme: chapter.theme
      };
    }
    cursor -= chapter.slokaCount;
  }

  const fallback = gitaChapters[0];
  return {
    chapter: fallback.chapter,
    sloka: 1,
    reference: `Bhagavad Gita ${fallback.chapter}.1`,
    chapterName: fallback.name,
    theme: fallback.theme
  };
}

export function getDailySlokaReference(date = new Date()) {
  const dayIndex = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return getSlokaReferenceByGlobalIndex(dayIndex);
}
