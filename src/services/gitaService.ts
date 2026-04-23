export type GitaSlokaContent = {
  slok: string;
  transliteration: string;
  meaning: string;
};

type ApiPayload = {
  slok?: string;
  transliteration?: string;
  tej?: unknown;
  siva?: unknown;
  purohit?: unknown;
  chinmay?: unknown;
  gambir?: unknown;
};

const BASE_URL = "https://vedicscriptures.github.io/slok";

function pickMeaning(payload: ApiPayload) {
  // Prefer translators that provide English text keys ("et"/"ec").
  return payload.siva ?? payload.purohit ?? payload.gambir ?? payload.tej ?? payload.chinmay ?? "";
}

function toText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;

  if (typeof record.et === "string") {
    return record.et;
  }

  if (typeof record.ec === "string") {
    return record.ec;
  }

  if (typeof record.en === "string") {
    return record.en;
  }

  if (typeof record.translation === "string") {
    return record.translation;
  }

  // Avoid Hindi fallback fields when user wants English.
  for (const [key, nested] of Object.entries(record)) {
    if (key === "ht" || key === "hc") continue;
    if (typeof nested === "string") {
      return nested;
    }
  }

  return "";
}

export const gitaService = {
  async getSloka(chapter: number, sloka: number): Promise<GitaSlokaContent> {
    const response = await fetch(`${BASE_URL}/${chapter}/${sloka}`);
    if (!response.ok) {
      throw new Error(`Unable to load sloka (${response.status}).`);
    }

    const payload = (await response.json()) as ApiPayload;
    return {
      slok: toText(payload.slok),
      transliteration: toText(payload.transliteration),
      meaning: toText(pickMeaning(payload))
    };
  }
};
