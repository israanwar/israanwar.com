// Owner-confirmed facts about Isra Anwar — the one place the About page (React
// and prerendered HTML) and the Person/Organization JSON-LD read from, so the
// entity facts can't drift between them. Only facts supplied by the site owner
// belong here; do not add clients, figures or results that haven't been
// confirmed (see docs/seo-fix-notes.md for the items awaiting confirmation).

import { PAGES_SEED } from "./pagesSeed.js";

export const PROFILE = {
  name: "Isra Anwar",
  alternateNames: ["Okka", "Okka Rhys"],
  jobTitle: "Digital Consultant",
  // Locations as supplied by the owner (Jakarta and Makassar, Indonesia).
  locations: ["Jakarta", "Makassar"],
  country: { name: "Indonesia", code: "ID" },
  experienceYears: 15,
  // Degree in progress — NOT a completed credential, so it is shown as text
  // only and deliberately kept out of alumniOf / hasCredential.
  education: {
    degree: "Magister Manajemen",
    school: "ITB Nobel Indonesia",
    status: "sedang berjalan",
  },
  knowsAbout: [
    "Web Development",
    "Search Engine Optimization (SEO)",
    "Answer Engine Optimization (AEO)",
    "Generative Engine Optimization (GEO)",
    "AI Workflow",
    "Content Strategy",
    "Google Analytics",
    "Google AdSense",
    "Digital Branding",
  ],
  // Official profiles.
  sameAs: [
    "https://www.linkedin.com/in/israanwarr/",
    "https://github.com/israanwar/",
  ],
  profileLinks: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/israanwarr/" },
    { label: "GitHub", url: "https://github.com/israanwar/" },
  ],
};

// Certification groups named by the owner: Google, Meta and the IBM Data
// Analyst Professional Certificate. Google/Meta entries reuse the verifiable
// certificate names already listed on the Portfolio page.
const seedProvider = (slug) =>
  PAGES_SEED.portfolio.certifications.find((c) => c.slug === slug)?.items ?? [];

export const CREDENTIALS = [
  ...seedProvider("google").map((c) => ({ name: c.name, url: c.url, issuer: "Google" })),
  ...seedProvider("meta").map((c) => ({ name: c.name, url: c.url, issuer: "Meta" })),
  { name: "IBM Data Analyst Professional Certificate", url: null, issuer: "IBM" },
];

export const CERTIFICATION_SUMMARY = ["Google", "Meta", "IBM Data Analyst Professional Certificate"];

// The CMS "Experience" stat can lag behind the owner's confirmed figure
// (it was seeded as "+13 years"). Keep the About stat in step with PROFILE.
export function withProfileExperience(stats, lang = "id") {
  if (!Array.isArray(stats)) return stats;
  const value = lang === "id" ? `${PROFILE.experienceYears}+ tahun` : `${PROFILE.experienceYears}+ years`;
  return stats.map((stat) =>
    /^(experience|pengalaman)$/i.test(String(stat.label ?? "").trim()) ? { ...stat, value } : stat,
  );
}

const STRINGS = {
  id: {
    heading: "Profil",
    name: "Nama",
    aka: "Dikenal juga sebagai",
    role: "Peran",
    roleValue: "Digital Consultant — web development, SEO, AEO & GEO, AI workflow, dan strategi konten",
    location: "Lokasi",
    experience: "Pengalaman",
    experienceValue: (years) => `${years}+ tahun`,
    certifications: "Sertifikasi",
    education: "Pendidikan",
    educationValue: (e) => `${e.degree}, ${e.school} (${e.status})`,
    profiles: "Profil resmi",
    locationValue: (p) => `${p.locations.join(" / ")}, ${p.country.name}`,
  },
  en: {
    heading: "Profile",
    name: "Name",
    aka: "Also known as",
    role: "Role",
    roleValue: "Digital Consultant — web development, SEO, AEO & GEO, AI workflow, and content strategy",
    location: "Location",
    experience: "Experience",
    experienceValue: (years) => `${years}+ years`,
    certifications: "Certifications",
    education: "Education",
    educationValue: (e) => `Master of Management, ${e.school} (in progress)`,
    profiles: "Official profiles",
    locationValue: (p) => `${p.locations.join(" / ")}, ${p.country.name}`,
  },
};

// Label/value rows for the About page "Profile" block. Values are plain
// strings except `links`, which are rendered as anchors by the caller.
export function getProfileRows(lang = "id") {
  const s = STRINGS[lang] ?? STRINGS.id;
  return [
    { key: "name", label: s.name, value: PROFILE.name },
    { key: "aka", label: s.aka, value: PROFILE.alternateNames.join(", ") },
    { key: "role", label: s.role, value: s.roleValue },
    { key: "location", label: s.location, value: s.locationValue(PROFILE) },
    { key: "experience", label: s.experience, value: s.experienceValue(PROFILE.experienceYears) },
    { key: "certifications", label: s.certifications, value: CERTIFICATION_SUMMARY.join(", ") },
    { key: "education", label: s.education, value: s.educationValue(PROFILE.education) },
    { key: "profiles", label: s.profiles, links: PROFILE.profileLinks },
  ];
}

export function getProfileHeading(lang = "id") {
  return (STRINGS[lang] ?? STRINGS.id).heading;
}
