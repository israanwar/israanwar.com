import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Blend, Bot, Braces, CircleDot, Code2, Image, LayoutTemplate,
  Link as LinkIcon, Link2, MessageCircle, Minimize2, Network, Palette, QrCode,
  ReceiptText, Scaling, Search, Shapes, ShieldCheck, Sparkles, TextCursorInput,
} from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { SunBackground } from "../../components/hero/SunBackground";
import { TOOLS, TOOLS_CATALOG, TOOLS_TOTAL_COUNT } from "../../data/toolsCatalog";

const ICONS = {
  Blend, Bot, Braces, CircleDot, Code2, Image, LayoutTemplate, Link: LinkIcon,
  Link2, MessageCircle, Minimize2, Network, Palette, QrCode, ReceiptText, Scaling, Shapes,
  TextCursorInput,
};

const DESCRIPTION =
  "Free browser-based image, website, creative, and SEO tools by Isra Anwar.";

export function ToolsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const normalizedQuery = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => TOOLS_CATALOG
    .filter((group) => category === "all" || group.slug === category)
    .map((group) => ({
      ...group,
      tools: group.tools.filter((tool) => !normalizedQuery
        || `${tool.name} ${tool.description}`.toLowerCase().includes(normalizedQuery)),
    }))
    .filter((group) => group.tools.length > 0), [category, normalizedQuery]);

  const popular = TOOLS.filter((tool) => tool.popular).slice(0, 6);

  return (
    <>
      <Seo title="Free Online Tools" description={DESCRIPTION} path="/tools" />
      <main className="okr__tools-page">
        <section className="okr__section okr__tools-hero">
          <SunBackground />
          <div className="okr__wrap">
            <div className="okr__tools-hero-copy">
              <span className="okr__kicker">// TOOLS · {TOOLS_TOTAL_COUNT} LIVE</span>
              <AnimatedHeadline
                text="Useful by design. Private by default."
                className="okr__hero-title okr__hero-title--stagger"
                highlightLast={3}
                assembleLetters
              />
              <p className="okr__hero-sub">
                Convert images, build campaign links, generate metadata, and finish small digital tasks without friction. Every tool shown here works now.
              </p>
            </div>

            <div className="okr__tools-command" aria-label="Find a tool">
              <Search size={21} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools — try image, QR, sitemap…"
                aria-label="Search tools"
              />
              <kbd>{TOOLS_TOTAL_COUNT} tools</kbd>
            </div>

            <div className="okr__tools-trust-row">
              <span><ShieldCheck size={17} /> No account required</span>
              <span><Sparkles size={17} /> Built for real output</span>
              <span><Image size={17} /> Images stay on your device</span>
            </div>
          </div>
        </section>

        <section className="okr__section okr__tools-library">
          <div className="okr__wrap">
            {!query && category === "all" && (
              <section className="okr__tools-popular" aria-labelledby="popular-tools-title">
                <div className="okr__tools-section-heading">
                  <div>
                    <span className="okr__tools-overline">START HERE</span>
                    <AnimatedHeadline as="h2" id="popular-tools-title" text="Popular tools" className="okr__hero-title--stagger" assembleLetters />
                  </div>
                  <p>Fast, focused, and ready to use.</p>
                </div>
                <div className="okr__tools-card-grid okr__tools-card-grid--popular">
                  {popular.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
                </div>
              </section>
            )}

            <div className="okr__tools-filter" aria-label="Tool categories">
              <button className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")}>All tools</button>
              {TOOLS_CATALOG.map((group) => (
                <button
                  key={group.slug}
                  className={category === group.slug ? "is-active" : ""}
                  onClick={() => setCategory(group.slug)}
                >
                  {group.name}
                </button>
              ))}
            </div>

            <div className="okr__tools-groups">
              {visibleGroups.map((group) => (
                <section key={group.slug} id={group.slug} className="okr__tools-category">
                  <div className="okr__tools-section-heading">
                    <div>
                      <span className="okr__tools-overline">{String(group.tools.length).padStart(2, "0")} ACTIVE</span>
                      <AnimatedHeadline as="h2" text={group.name} className="okr__hero-title--stagger" assembleLetters />
                    </div>
                    <p>{group.description}</p>
                  </div>
                  <div className="okr__tools-card-grid">
                    {group.tools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
                  </div>
                </section>
              ))}
            </div>

            {visibleGroups.length === 0 && (
              <div className="okr__tools-empty">
                <Search size={30} />
                <AnimatedHeadline as="h2" text="No tool found" className="okr__hero-title--stagger" assembleLetters />
                <p>Try a broader search or browse all categories.</p>
                <button className="okr__btn okr__btn--primary" onClick={() => { setQuery(""); setCategory("all"); }}>Show all tools</button>
              </div>
            )}

            <aside className="okr__tools-open-source">
              <div>
                <span className="okr__tools-overline">OPEN SOURCE FOUNDATION</span>
                <AnimatedHeadline as="h2" text="Transparent tools, shaped for IsraAnwar." className="okr__hero-title--stagger" assembleLetters />
              </div>
              <p>
                The utility architecture is informed by the MIT-licensed utils.live project. The interface and product experience are purpose-built for this website.
              </p>
              <a href="https://github.com/kranthie/utils.live" target="_blank" rel="noreferrer">View source inspiration <ArrowUpRight size={16} /></a>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function ToolCard({ tool }) {
  const Icon = ICONS[tool.icon] ?? Sparkles;
  return (
    <Link to={`/tools/${tool.slug}`} className="okr__tool-card">
      <span className="okr__tool-card-icon"><Icon size={22} strokeWidth={1.7} /></span>
      <span className="okr__tool-card-copy">
        <span className="okr__tool-card-title">{tool.name}</span>
        <span className="okr__tool-card-description">{tool.description}</span>
      </span>
      <ArrowUpRight className="okr__tool-card-arrow" size={19} aria-hidden="true" />
    </Link>
  );
}
