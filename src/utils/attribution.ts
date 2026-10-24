export type LeadAttribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  landing_page: string;
  source: string;
};

export const ATTRIBUTION_STORAGE_KEY = "prestige-lead-attribution";

const EMPTY_ATTRIBUTION: LeadAttribution = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  landing_page: "",
  source: "",
};

const UTM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function readStoredAttribution(targetWindow: Window): LeadAttribution | null {
  try {
    const stored = targetWindow.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<LeadAttribution>;
    return Object.fromEntries(
      Object.keys(EMPTY_ATTRIBUTION).map((key) => [
        key,
        typeof parsed[key as keyof LeadAttribution] === "string"
          ? parsed[key as keyof LeadAttribution]
          : "",
      ]),
    ) as LeadAttribution;
  } catch {
    return null;
  }
}

function isMetaPaidSocial(attribution: LeadAttribution) {
  const source = attribution.utm_source.trim().toLowerCase();
  return (
    attribution.utm_medium.trim().toLowerCase() === "paid_social" ||
    ["facebook", "instagram", "fb", "ig"].includes(source)
  );
}

/** Capture the first scheduling-page URL, replacing it when a new tagged ad visit arrives. */
export function captureAttribution(targetWindow: Window): LeadAttribution {
  const existing = readStoredAttribution(targetWindow);
  const params = new URLSearchParams(targetWindow.location.search);
  const incoming = Object.fromEntries(
    UTM_FIELDS.map((field) => [field, params.get(field)?.trim() ?? ""]),
  ) as Pick<LeadAttribution, (typeof UTM_FIELDS)[number]>;
  const hasIncomingUtm = UTM_FIELDS.some((field) => incoming[field] !== "");

  const attribution: LeadAttribution = {
    ...EMPTY_ATTRIBUTION,
    ...(existing ?? {}),
    ...(hasIncomingUtm ? incoming : {}),
    landing_page:
      hasIncomingUtm || !existing?.landing_page
        ? targetWindow.location.href
        : existing.landing_page,
  };

  if (isMetaPaidSocial(attribution)) attribution.source = "Meta Ads";

  try {
    targetWindow.sessionStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(attribution),
    );
  } catch {
    // Keep the current-page attribution available even if browser storage is disabled.
  }

  return attribution;
}

/** Add captured attribution to the external calendar URL so its form can receive it. */
export function appendAttributionToUrl(
  baseUrl: string,
  attribution: LeadAttribution,
) {
  try {
    const url = new URL(baseUrl);
    UTM_FIELDS.forEach((field) => {
      if (attribution[field]) url.searchParams.set(field, attribution[field]);
    });
    if (attribution.landing_page) {
      url.searchParams.set("landing_page", attribution.landing_page);
    }
    if (attribution.source) url.searchParams.set("source", attribution.source);
    return url.toString();
  } catch {
    return baseUrl;
  }
}
