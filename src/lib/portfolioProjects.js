const AKRAGA_TV_CONSULTING_PROJECT = {
  year: "2024-Now",
  role: "YouTube Sports Channel Consultant",
  org: "Akraga TV",
  desc: "Sports YouTube channel strategy, content direction, channel optimization, monetization, and audience growth.",
};

const MCP_ADVANCED_CERTIFICATE = {
  name: "Model Context Protocol: Advanced topics",
  url: "https://academy.claude.com/verify/55d81b130e33164c2fa55fdc36e86237",
};

function normalizeOrgName(value) {
  const org = String(value ?? "").trim();
  if (org === "Investoft" || org === "Investoft.com") return "R24 Studio";
  if (/^akraga\s*tv$/i.test(org)) return "Akraga TV";
  return org;
}

export function normalizePortfolioProjects(page) {
  if (!page) return page;

  const consulting = Array.isArray(page.consulting) ? page.consulting : [];
  const normalizedConsulting = consulting.map((item) => ({
    ...item,
    org: normalizeOrgName(item.org),
  }));

  const hasAkragaTv = normalizedConsulting.some((item) => normalizeOrgName(item.org) === "Akraga TV");
  const nextConsulting = hasAkragaTv
    ? normalizedConsulting
    : [...normalizedConsulting, AKRAGA_TV_CONSULTING_PROJECT];

  return {
    ...page,
    consulting: nextConsulting,
    // Include this credential when portfolio data comes from an older saved page.
    certifications: Array.isArray(page.certifications)
      ? page.certifications.map((provider) => {
        if (provider.slug !== "anthropic") return provider;
        const items = Array.isArray(provider.items) ? provider.items : [];
        if (items.some((item) => item.url === MCP_ADVANCED_CERTIFICATE.url)) return provider;
        return { ...provider, items: [...items, { ...MCP_ADVANCED_CERTIFICATE }] };
      })
      : page.certifications,
  };
}
