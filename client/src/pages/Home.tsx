/**
 * Performance Ledger style reminder: editorial blue-and-ivory composition, the video is
 * an active hero asset, category colors act as indices, and interactions stay precise.
 */
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Flame,
  Goal,
  Menu,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

type ProspectCategory = {
  letter: string;
  title: string;
  shortTitle: string;
  description: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  color: string;
  soft: string;
  icon: "phone" | "team" | "outreach" | "submitted" | "pipeline" | "meeting" | "gcV" | "target";
};

const categories: ProspectCategory[] = [
  {
    letter: "P",
    title: "Phone Prospecting Hours",
    shortTitle: "Phone",
    description: "Time protected for direct conversations with new prospects.",
    unit: "hrs",
    min: 0,
    max: 40,
    step: 1,
    initial: 15,
    color: "#1D5FE9",
    soft: "#E8F0FF",
    icon: "phone",
  },
  {
    letter: "R",
    title: "Strategic Partners",
    shortTitle: "Partners",
    description: "Trusted professionals you are building a shared-value relationship with this week.",
    unit: "partners",
    min: 0,
    max: 10,
    step: 1,
    initial: 1,
    color: "#8A42E8",
    soft: "#F1E9FF",
    icon: "team",
  },
  {
    letter: "O",
    title: "Outreach Contacts",
    shortTitle: "Outreach",
    description: "New prospects added to intentional email and text follow-up.",
    unit: "contacts",
    min: 0,
    max: 150,
    step: 5,
    initial: 40,
    color: "#008A88",
    soft: "#E2F7F4",
    icon: "outreach",
  },
  {
    letter: "S",
    title: "Submitted Applications",
    shortTitle: "Submitted",
    description: "Prospects who have moved from conversation to documents.",
    unit: "applications",
    min: 0,
    max: 20,
    step: 1,
    initial: 4,
    color: "#D66A04",
    soft: "#FFF0DE",
    icon: "submitted",
  },
  {
    letter: "P",
    title: "Prospects Added to Pipeline",
    shortTitle: "Pipeline",
    description: "New appointments scheduled to keep the next weeks active.",
    unit: "appointments",
    min: 0,
    max: 50,
    step: 1,
    initial: 10,
    color: "#CF306C",
    soft: "#FFE7F0",
    icon: "pipeline",
  },
  {
    letter: "E",
    title: "Engagements",
    shortTitle: "Engagements",
    description: "Qualified meetings where an expert proposal is presented.",
    unit: "meetings",
    min: 0,
    max: 30,
    step: 1,
    initial: 6,
    color: "#5D7932",
    soft: "#EEF5E5",
    icon: "meeting",
  },
  {
    letter: "C",
    title: "Closed GCV Goal",
    shortTitle: "Closed",
    description: "The weekly gross commission volume target you choose to plan around.",
    unit: "GCV",
    min: 0,
    max: 50000,
    step: 500,
    initial: 5000,
    color: "#BD8212",
    soft: "#FFF5DB",
    icon: "gcV",
  },
  {
    letter: "T",
    title: "Target New Prospects",
    shortTitle: "Target",
    description: "Fresh names added to your CRM for a thoughtful follow-up path.",
    unit: "prospects",
    min: 0,
    max: 100,
    step: 5,
    initial: 20,
    color: "#2578A9",
    soft: "#E4F3FB",
    icon: "target",
  },
];

const navItems = [
  { label: "Framework", href: "#framework" },
  { label: "12-Month Plan", href: "#plan" },
  { label: "6-Month Journey", href: "#journey" },
  { label: "Set Goals", href: "#weekly-plan" },
  { label: "How It Works", href: "#how-it-works" },
];

function displayValue(category: ProspectCategory, value: number) {
  if (category.icon === "gcV") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return `${value} ${category.unit}`;
}

function CategoryIcon({ kind }: { kind: ProspectCategory["icon"] }) {
  const className = "h-4 w-4";
  if (kind === "phone") return <Clock3 className={className} aria-hidden="true" />;
  if (kind === "team") return <Users className={className} aria-hidden="true" />;
  if (kind === "outreach") return <ArrowRight className={className} aria-hidden="true" />;
  if (kind === "submitted") return <Check className={className} aria-hidden="true" />;
  if (kind === "pipeline") return <Plus className={className} aria-hidden="true" />;
  if (kind === "meeting") return <Users className={className} aria-hidden="true" />;
  if (kind === "gcV") return <CircleDollarSign className={className} aria-hidden="true" />;
  return <Target className={className} aria-hidden="true" />;
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup" aria-label="Prospect Accountability Coach">
      <span className="brand-mark" aria-hidden="true">
        <span>P</span>
        <i />
      </span>
      {!compact && (
        <span className="brand-type">
          <strong>PROSPECT</strong>
          <small>ACCOUNTABILITY <b>COACH</b></small>
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, signIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [goals, setGoals] = useState<Record<string, number>>(() =>
    Object.fromEntries(categories.map((category) => [category.title, category.initial])),
  );

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const gcvGoal = goals["Closed GCV Goal"] ?? 0;
  const annualPlanningEstimate = useMemo(() => gcvGoal * 52, [gcvGoal]);
  const activityScore = useMemo(() => {
    const nonGcvCategories = categories.filter((category) => category.icon !== "gcV");
    const achieved = nonGcvCategories.reduce(
      (total, category) => total + ((goals[category.title] ?? 0) / category.max) * 100,
      0,
    );
    return Math.round(achieved / nonGcvCategories.length);
  }, [goals]);

  const scrollTo = (selector: string) => {
    setMenuOpen(false);
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openSecurePlanner = () => {
    if (isAuthenticated) {
      window.location.href = "/app";
      return;
    }
    signIn();
  };

  const savePlan = () => openSecurePlanner();

  return (
    <div className="prospect-app">
      <header className={`site-header ${hasScrolled ? "site-header--scrolled" : ""}`}>
        <div className="site-shell header-inner">
          <a className="brand-link" href="#top" onClick={() => scrollTo("#top")}>
            <BrandMark />
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} onClick={() => scrollTo(item.href)}>
                {item.label}
              </a>
            ))}
          </nav>
          <button
            className="header-action"
            onClick={openSecurePlanner}
            type="button"
          >
            {isAuthenticated ? "My Workspace" : "Secure Sign In"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <div className="site-shell mobile-menu-inner">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} onClick={() => scrollTo(item.href)}>
                  {item.label}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-heading">
          <div className="hero-grid-overlay" aria-hidden="true" />
          <div className="site-shell hero-layout">
            <div className="hero-copy">
              <div className="eyebrow eyebrow--light">
                <span /> Weekly sales accountability
              </div>
              <h1 id="hero-heading">
                Build the week.<br />
                <em>See the pattern.</em>
              </h1>
              <p className="hero-intro">
                PROSPECT gives your sales activity a clear, repeatable weekly rhythm—so the actions that create a healthier pipeline never get lost in the noise.
              </p>
              <div className="hero-actions">
                <button className="button button--gold" type="button" onClick={() => scrollTo("#weekly-plan")}>
                  {isAuthenticated ? "Open my workspace" : "Set this week&apos;s goals"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button className="text-link" type="button" onClick={() => scrollTo("#framework")}>
                  Explore the framework <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="hero-proof">
                <span className="hero-proof-icon"><ShieldCheck className="h-4 w-4" /></span>
                <span>Eight activity signals. One clear weekly plan.</span>
              </div>
            </div>

            <div className="hero-video-wrap">
              <div className="hero-video-label"><Play className="h-3.5 w-3.5 fill-current" /> Watch the method</div>
              <div className="hero-video-frame">
                <video
                  className="hero-video"
                  src="/media/prospect-explainer-v4.mp4"
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="Prospect Accountability Coach explainer video"
                >
                  Your browser does not support the video tag.
                </video>
                <div className="video-corner video-corner--top" aria-hidden="true" />
                <div className="video-corner video-corner--bottom" aria-hidden="true" />
              </div>
              <p className="hero-video-caption"><span>01</span> A deliberate rhythm for goals, reflection, and next actions.</p>
            </div>
          </div>

          <div className="site-shell signal-rail-wrap">
            <div className="signal-rail" aria-label="The eight PROSPECT activity categories">
              {categories.map((category, index) => (
                <button
                  type="button"
                  className="signal-tab"
                  style={{ "--signal": category.color, "--signal-soft": category.soft } as CSSProperties}
                  key={`${category.title}-${index}`}
                  onClick={() => scrollTo("#weekly-plan")}
                  aria-label={`Plan ${category.title}`}
                >
                  <b>{category.letter}</b>
                  <span>{category.shortTitle}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="intro-section" id="framework" aria-labelledby="framework-heading">
          <div className="site-shell intro-layout">
            <div className="section-side-label">
              <span>01</span>
              <p>The Framework</p>
            </div>
            <div className="intro-content">
              <div className="eyebrow"><span /> The PROSPECT method</div>
              <h2 id="framework-heading">Eight visible measures.<br /><em>One focused rhythm.</em></h2>
              <div className="intro-split">
                <p>
                  The PROSPECT framework gives every meaningful weekly activity a place to be seen. It is a practical planning tool for setting intentions, tracking the work, and choosing what to protect next week.
                </p>
                <div className="framework-callout">
                  <Sparkles className="h-5 w-5" />
                  <p>Use the colored cards as your weekly activity index—one category, one measurable commitment.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="site-shell framework-grid">
            {categories.map((category, index) => (
              <article
                className="framework-card"
                key={category.title}
                style={{ "--card-accent": category.color, "--card-soft": category.soft } as CSSProperties}
              >
                <div className="card-index"><span>{String(index + 1).padStart(2, "0")}</span><CategoryIcon kind={category.icon} /></div>
                <div className="framework-letter">{category.letter}</div>
                <div className="framework-card-copy">
                  <p className="framework-kicker">{category.shortTitle}</p>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                </div>
                <button className="card-arrow" type="button" aria-label={`Set a ${category.title} goal`} onClick={() => scrollTo("#weekly-plan")}>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="plan-section" id="plan" aria-labelledby="plan-heading">
          <div className="site-shell plan-layout">
            <div className="plan-copy">
              <div className="eyebrow eyebrow--gold"><span /> The planning habit</div>
              <h2 id="plan-heading">A good week starts<br />with a <em>visible plan.</em></h2>
              <p>
                Start with the activities you can control. Then translate that intention into weekly targets that are easy to revisit, discuss, and refine.
              </p>
              <ul className="ledger-list">
                <li><span>01</span><p><strong>Plan deliberately.</strong> Choose the number that reflects a realistic, focused week.</p></li>
                <li><span>02</span><p><strong>Work visibly.</strong> Keep your activity categories in one shared weekly view.</p></li>
                <li><span>03</span><p><strong>Reflect honestly.</strong> Review the gap, name the next action, and begin again.</p></li>
              </ul>
            </div>
            <div className="plan-board" aria-label="Weekly planning board preview">
              <div className="plan-board-heading">
                <div>
                  <span className="micro-label">Planning window</span>
                  <strong>Monday → Friday</strong>
                </div>
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="plan-board-rule" />
              <div className="plan-board-metric">
                <span>PRIMARY FOCUS</span>
                <strong>Protect prospecting time</strong>
                <p>Set the first non-negotiable action before you open the week.</p>
              </div>
              <div className="plan-board-footer"><Flame className="h-4 w-4" /><span>One focused rhythm, every week.</span></div>
            </div>
          </div>
        </section>

        <section className="weekly-section" id="weekly-plan" aria-labelledby="weekly-heading">
          <div className="site-shell weekly-heading-row">
            <div>
              <div className="eyebrow"><span /> Set your weekly goals</div>
              <h2 id="weekly-heading">Your <em>planning board.</em></h2>
            </div>
            <p>Move each marker to create a practical weekly plan. Your selections stay on this device when saved.</p>
          </div>

          <div className="site-shell weekly-layout">
            <div className="goal-editor" aria-label="Weekly goal settings">
              <div className="editor-topline">
                <div><span className="micro-label">Week of</span><strong>Choose your focus</strong></div>
                <span className="editor-note">8 activity categories</span>
              </div>
              <div className="goal-list">
                {categories.map((category) => {
                  const value = goals[category.title] ?? category.initial;
                  const percentage = ((value - category.min) / (category.max - category.min)) * 100;
                  return (
                    <div
                      className="goal-row"
                      key={category.title}
                      style={{ "--goal-color": category.color, "--goal-soft": category.soft, "--range-progress": `${percentage}%` } as CSSProperties}
                    >
                      <div className="goal-row-identity">
                        <span className="goal-letter">{category.letter}</span>
                        <div><strong>{category.shortTitle}</strong><small>{category.unit === "GCV" ? "Weekly planning target" : category.title}</small></div>
                      </div>
                      <label className="range-wrap">
                        <span className="sr-only">{category.title}</span>
                        <input
                          type="range"
                          min={category.min}
                          max={category.max}
                          step={category.step}
                          value={value}
                          onChange={(event) => setGoals((current) => ({ ...current, [category.title]: Number(event.target.value) }))}
                        />
                      </label>
                      <output className="goal-value">{displayValue(category, value)}</output>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="weekly-summary" aria-live="polite">
              <div className="summary-index"><span>Weekly plan</span><Goal className="h-4 w-4" /></div>
              <p className="summary-eyebrow">Activity signal mix</p>
              <div className="summary-score"><strong>{activityScore}</strong><span>%<br />set</span></div>
              <p className="summary-copy">A quick read on how much of your controllable weekly activity has been defined.</p>
              <div className="summary-line" />
              <div className="summary-number">
                <span>Closed GCV goal</span>
                <strong>{displayValue(categories[6], gcvGoal)}</strong>
              </div>
              <div className="summary-number summary-number--soft">
                <span>Annualized planning view</span>
                <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(annualPlanningEstimate)}</strong>
              </div>
              <p className="summary-disclaimer">A simple 52-week planning estimate based on your selected GCV goal. It is not a promise or forecast of earnings.</p>
              <button type="button" className="button button--blue button--full" onClick={savePlan}>
                Save my weekly plan <ArrowRight className="h-4 w-4" />
              </button>
            </aside>
          </div>
        </section>

        <section className="journey-section" id="journey" aria-labelledby="journey-heading">
          <div className="site-shell journey-head">
            <div className="section-side-label section-side-label--light"><span>06</span><p>Month Journey</p></div>
            <div>
              <div className="eyebrow eyebrow--light"><span /> The review cadence</div>
              <h2 id="journey-heading">Make progress <em>legible.</em></h2>
              <p>Each check-in turns an unstructured week into an observable pattern. Focus on the next controllable move—not a perfect score.</p>
            </div>
          </div>
          <div className="site-shell cadence-grid">
            {[
              { no: "01", title: "Set", copy: "Choose measurable activity targets before the week begins.", icon: CalendarDays },
              { no: "02", title: "Work", copy: "Use the PROSPECT index to keep the right inputs visible.", icon: Target },
              { no: "03", title: "Reflect", copy: "Review the result, keep the lesson, and commit to the next action.", icon: BarChart3 },
            ].map((step) => {
              const Icon = step.icon;
              return <article className="cadence-card" key={step.no}>
                <span>{step.no}</span>
                <Icon className="h-5 w-5" />
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>;
            })}
          </div>
        </section>

        <section className="process-section" id="how-it-works" aria-labelledby="process-heading">
          <div className="site-shell process-layout">
            <div className="process-copy">
              <div className="eyebrow"><span /> The weekly rhythm</div>
              <h2 id="process-heading">Small actions.<br /><em>Clearer decisions.</em></h2>
            </div>
            <div className="process-steps">
              <div className="process-step"><span>01</span><div><h3>Set your weekly goals</h3><p>Choose the activity numbers that define the week you want to build.</p></div><ArrowRight className="h-5 w-5" /></div>
              <div className="process-step"><span>02</span><div><h3>Record what happened</h3><p>Use the same categories to compare intention with visible activity.</p></div><ArrowRight className="h-5 w-5" /></div>
              <div className="process-step"><span>03</span><div><h3>Choose the next action</h3><p>Turn your review into one focused commitment for the week ahead.</p></div><ArrowRight className="h-5 w-5" /></div>
            </div>
          </div>
        </section>

        <section className="closing-section">
          <div className="site-shell closing-panel">
            <div className="closing-mark"><BrandMark compact /></div>
            <div><span className="micro-label">Your next planning moment</span><h2>Put the next<br /><em>week on paper.</em></h2></div>
            <button className="button button--gold" type="button" onClick={() => scrollTo("#weekly-plan")}>Create my plan <ArrowRight className="h-4 w-4" /></button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-shell footer-inner">
          <BrandMark />
          <p>Designed to make weekly sales activity more visible, more intentional, and easier to discuss.</p>
          <a href="#top" onClick={() => scrollTo("#top")}>Back to top <ArrowUp className="h-3.5 w-3.5" /></a>
        </div>
      </footer>

      <div className="page-navigator" aria-label="Quick page navigation">
        <button type="button" onClick={() => window.scrollBy({ top: -window.innerHeight * 0.82, behavior: "smooth" })} aria-label="Scroll up">
          <ArrowUp className="h-4 w-4" />
          <span>Up</span>
        </button>
        <div aria-hidden="true" />
        <button type="button" onClick={() => window.scrollBy({ top: window.innerHeight * 0.82, behavior: "smooth" })} aria-label="Scroll down">
          <ArrowDown className="h-4 w-4" />
          <span>Down</span>
        </button>
      </div>
    </div>
  );
}
