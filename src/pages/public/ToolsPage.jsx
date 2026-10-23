import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Blend, Bot, Braces, CircleDot, Code2, Image, LayoutTemplate,
  Link as LinkIcon, Link2, MessageCircle, Minimize2, Network, Palette, QrCode,
  ReceiptText, Scaling, Search, Shapes, ShieldCheck, Sparkles, TextCursorInput,
} from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { TOOLS, TOOLS_CATALOG, TOOLS_TOTAL_COUNT } from "../../data/toolsCatalog";
import { useToolsText } from "../../lib/toolsI18n";

const ICONS = {
  Blend, Bot, Braces, CircleDot, Code2, Image, LayoutTemplate, Link: LinkIcon,
  Link2, MessageCircle, Minimize2, Network, Palette, QrCode, ReceiptText, Scaling, Shapes,
  TextCursorInput,
};

export function ToolsPage() {
  const tt = useToolsText();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const normalizedQuery = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => TOOLS_CATALOG
    .filter((group) => category === "all" || group.slug === category)
    .map((group) => ({
      ...group,
      tools: group.tools.filter((tool) => !normalizedQuery
        || `${tool.name} ${tool.description} ${tt(tool.name)} ${tt(tool.description)}`.toLowerCase().includes(normalizedQuery)),
    }))
    .filter((group) => group.tools.length > 0), [category, normalizedQuery, tt]);

  const popular = TOOLS.filter((tool) => tool.popular).slice(0, 6);

  return (
    <>
      <Seo title={tt("Free Online Tools")} description={tt("Free browser-based image, website, creative, and SEO tools by Isra Anwar.")} path="/tools" />
      <div className="okr__tools-page">
        <section className="okr__section okr__tools-hero">
          <div className="okr__wrap">
            <div className="okr__tools-hero-copy">
              <span className="okr__kicker">{tt("// TOOLS · {count} LIVE", { count: TOOLS_TOTAL_COUNT })}</span>
              <AnimatedHeadline
                text={tt("Useful by design. Private by default.")}
                className="okr__hero-title okr__hero-title--stagger"
                highlightLast={3}
                assembleLetters
              />
              <p className="okr__hero-sub">
                {tt("Convert images, build campaign links, generate metadata, and finish small digital tasks without friction. Every tool shown here works now.")}
              </p>
            </div>

            <div className="okr__tools-command" aria-label={tt("Find a tool")}>
              <Search size={21} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tt("Search tools — try image, QR, sitemap…")}
                aria-label={tt("Search tools")}
              />
              <kbd>{tt("{count} tools", { count: TOOLS_TOTAL_COUNT })}</kbd>
            </div>

            <div className="okr__tools-trust-row">
              <span><ShieldCheck size={17} /> {tt("No account required")}</span>
              <span><Sparkles size={17} /> {tt("Built for real output")}</span>
              <span><Image size={17} /> {tt("Images stay on your device")}</span>
            </div>
          </div>
        </section>

        <section className="okr__section okr__tools-library">
          <div className="okr__wrap">
            {!query && category === "all" && (
              <section className="okr__tools-popular" aria-labelledby="popular-tools-title">
                <div className="okr__tools-section-heading">
                  <div>
                    <span className="okr__tools-overline">{tt("START HERE")}</span>
                    <AnimatedHeadline as="h2" id="popular-tools-title" text={tt("Popular tools")} className="okr__hero-title--stagger" assembleLetters />
                  </div>
                  <p>{tt("Fast, focused, and ready to use.")}</p>
                </div>
                <div className="okr__tools-card-grid okr__tools-card-grid--popular">
                  {popular.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
                </div>
              </section>
            )}

            <div className="okr__tools-filter" aria-label={tt("Tool categories")}>
              <button className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")}>{tt("All tools")}</button>
              {TOOLS_CATALOG.map((group) => (
                <button
                  key={group.slug}
                  className={category === group.slug ? "is-active" : ""}
                  onClick={() => setCategory(group.slug)}
                >
                  {tt(group.name)}
                </button>
              ))}
            </div>

            <div className="okr__tools-groups">
              {visibleGroups.map((group) => (
                <section key={group.slug} id={group.slug} className="okr__tools-category">
                  <div className="okr__tools-section-heading">
                    <div>
                      <span className="okr__tools-overline">{tt("{count} ACTIVE", { count: String(group.tools.length).padStart(2, "0") })}</span>
                      <AnimatedHeadline as="h2" text={tt(group.name)} className="okr__hero-title--stagger" assembleLetters />
                    </div>
                    <p>{tt(group.description)}</p>
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
                <AnimatedHeadline as="h2" text={tt("No tool found")} className="okr__hero-title--stagger" assembleLetters />
                <p>{tt("Try a broader search or browse all categories.")}</p>
                <button className="okr__btn okr__btn--primary" onClick={() => { setQuery(""); setCategory("all"); }}>{tt("Show all tools")}</button>
              </div>
            )}

            <aside className="okr__tools-open-source">
              <div>
                <span className="okr__tools-overline">{tt("OPEN SOURCE FOUNDATION")}</span>
                <AnimatedHeadline as="h2" text={tt("Transparent tools, shaped for IsraAnwar.")} className="okr__hero-title--stagger" assembleLetters />
              </div>
              <p>
                {tt("The utility architecture is informed by the MIT-licensed utils.live project. The interface and product experience are purpose-built for this website.")}
              </p>
              <a href="https://github.com/kranthie/utils.live" target="_blank" rel="noreferrer">{tt("View source inspiration")} <ArrowUpRight size={16} /></a>
            </aside>
          </div>
        </section>
      </div>
    </>
  );
}

function ToolCard({ tool }) {
  const tt = useToolsText();
  const Icon = ICONS[tool.icon] ?? Sparkles;
  return (
    <Link to={`/tools/${tool.slug}`} className="okr__tool-card">
      <span className="okr__tool-card-icon"><Icon size={22} strokeWidth={1.7} /></span>
      <span className="okr__tool-card-copy">
        <span className="okr__tool-card-title">{tt(tool.name)}</span>
        <span className="okr__tool-card-description">{tt(tool.description)}</span>
      </span>
      <ArrowUpRight className="okr__tool-card-arrow" size={19} aria-hidden="true" />
    </Link>
  );
}
