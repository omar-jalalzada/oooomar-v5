# Project brief — personal site

> Captured 2026-06-11 from Omar's original planning doc. Source of truth for goals, audience, content pillars, and MVP scope.

### 1) Problem statement

- I want to build a website + process that helps me cement the next chapter of my professional career.
- I want a system that lets me publish and iterate over: writing, reflections, design leadership thinking, experiments, and past work.

### 2) Goals (what success looks like)

- Showcase my high craft bar and taste
- Become a better design leader (not just a doer)
    - Amplify my ideas through people
    - Identify and nurture strong talent; help them do their best work
    - Set a high quality bar
    - People management: “manage work not manage people”
        - Work with high agency, IQ and EQ
        - Be a midfielder/play-maker vs a coach yelling from the sideline
        - Set clear expectations on outcomes
        - Provide tactical frameworks to achieve them
        - Make sense of complexity via systems
    - Org design: how startups should shape design teams for success
- Become a design expert in Cybersecurity
- Get involved early as a design advisor in more cybersecurity start ups
- Build an online brand (start with the end in mind)
    - Find my niche + authentic voice; stand out from the noise (authenticity over mediocrity)
    - Become an AI native creative; experiment and learn by doing; share what I learn

### 3) Audience & key questions (the “why me” section)

- Why would an investor in cybersecurity introduce me to their cybersecurity startup to advise?
- Why would a very talented creative choose to come work for me?
- Why would a founder reach out to me directly to work with me?
- Why would design podcasters reach out to interview me?

### 4) Content pillars (what the site will contain)

- Writings / Blog
    - Design Leadership
        - Sublime-based “on the ground” learnings
        - Business outcomes
        - Design ops
        - People management
    - Reflections (Meditations)
        - Systems-oriented approach to life; frameworks; maturity + calmness
        - Mindfulness, life stories, philosophies
- Lab (visually captivating, highly creative, pushing boundaries)
    - Solo
    - For later: Collaborations / co-creations (“remixes” / “b2b sets”)
- Work (past experiences and products, )
    - A portfolio that suited for a head of design.,
    - Sublime: Cybersecurity, going from 0 to Series D, org design, outcome for success
    - Kin: starting a company, raising money, building a founding team
    - Alto: complex healthcare system
    - Coatue: complex financial systems

### 5) Process (how I’ll produce + iterate)

1. Capture raw thoughts in Notion (mobile or desktop). 
    1. Later, I’ll connect the notion MCP.
2. Maintain a structure for: thoughts, ideas, inspirations, aspirations, etc., so I can later write content from it
3. Create/publish at a sustainable cadence
    - Ideal: weekly writing or prototype
    - Realistic: every two weeks or once a month
4. Start manual; add automation only when volume rises

### 6) Technical implementation (v1 assumptions)

- Mabye Vite for site structure, or suggest a better solution
    - I want to build the front end with react
- Prototypes may pull in different libraries but mostly static
- GH Pages for hosting (potentially)
- Make publishing extremely easy
    - MD files for written content
    - Static HTML pages for AI-enabled prototypes
    - Everything easily tagged with content type
    - Each item has a distinct URL so it’s easy to share outside
- Optimize for getting started + iterating vs polish
- Distribution
    - I own all the content; everything lives in my database
    - Cross-share blog content to places like Substack or Medium
- SEO (later)
    - Show up for “design in cyber security”
    - Show up for “design leadership”

### 7) Brand / visual direction

- This is for later, for now, I just need a basic wireframe.
- Brand: Uniquely and unmistakably Omar
- Voice: factual observations based on lived experience; not here to preach
- Vibe: a joy to experience and interact
- Interactions
    - Need a cinematic entrance
    - Possible UI: a grid that loads with a variety of content; categories on top sort cards

### 8) UX / IA requirements (wireframe-ready)

**Primary navigation / sections**

- Home (overview + latest highlights + entry into categories)
- Writing
    - Design Leadership
    - Reflections
- Labs
- Work (case studies)
    - About (bio + “why me” + focus areas)
- Contact / Collaborate (lightweight)

**Core objects**

- Post (writing, leadership, reflection)
- Post Experiment / Lab (prototype, demo, interactive)
- Quick summary of background/portoflio and a way to contact me

**Content metadata (needed for filtering + browsing)**

- Content type (Writing, Lab, Work)
- Writing topics / tags (e.g., cyber security, people management, craft, AI-native creativity)
- Date
- Status (Draft / Published)
- Format (Article / Prototype / Case study / Note)

**Key pages & components**

- Home
    - Category tiles / filters
    - featured experiments
    - Recent writing
- Category landing pages
    - Sort + filter
    - Card grid
- Detail pages
    - Clean reading experience for MD content
    - Dedicated page frame for experiments (embed/host HTML prototypes)
- Work / case study template structure
    - Context → Role → Constraints → Process → Decisions → Outcomes → Learnings

### 9) MVP scope (what “done” means for first ship)

- A functioning site with:
    - A home page
    - Category landing pages (at least 3)
    - 2 sample writings
    - 2 sample lab page
- A lightweight authoring + publishing workflow (MD + static HTML)
- A clean system for tagging and generating routes/URLs

### 10) Open questions / decisions for Claude to resolve

- Final hosting: GH Pages vs alternatives (Netlify/Vercel) and why
- Best content pipeline: Notion as source of truth vs markdown repo vs hybrid
- How labs are hosted + routed (static HTML, iframe, build step, etc.)
- SEO approach (what’s necessary in v1 vs later)
- Analytics (if any) and privacy stance