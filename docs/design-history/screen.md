# Screen & System, 1968–2026

The screen era is the first chapter of design history in which the designed object is also the
tool you use to read it. Its movements are short, its patrons are a handful of companies, and its
style changes ship to a billion people overnight. Underneath the swings between rendered and flat
runs a steadier argument: how much an interface should resemble the physical world, and who sets
the rules once millions of designers work inside one platform's system.

A thesis runs through this wiki: that the large platforms absorbed modernist principles so
completely that visual innovation stalled, with Apple's Liquid Glass (2025) as a symptom. The
record supports part of this. Flat design was Swiss Style brought into software, and design
systems are the corporate identity manual rebuilt as code. But the platforms also innovated hard
in *behaviour* (multi-touch, motion as meaning, dynamic colour, conversational input) while their
*visual* language cycled through older ideas. Both readings are set out below.

Movements run roughly in order of first appearance; each figure sits under the movement where
their work counts most.

---

## The GUI and the desktop metaphor {#gui-desktop-metaphor}

**Context.** Before 1968, people used computers through punched cards, teletypes and command
lines. Douglas Engelbart's team at the Stanford Research Institute (SRI) showed another way on
9 December 1968, at the Fall Joint Computer Conference in San Francisco: a mouse, windows,
hypertext links, live video and a collaborative editor in one system, NLS. Xerox's Palo Alto
Research Center (PARC) took those ideas and Alan Kay's Dynabook vision and built the Alto
(first machines 1973), the first computer with a bitmapped display, a mouse and a graphical
interface. Xerox commercialised it as the Star 8010 (April 1981), which brought the full desktop
of icons, folders and documents, at about US$75,000 a system. Steve Jobs and Apple engineers visited
PARC in 1979; Apple shipped the Lisa (19 January 1983, US$9,995) and then the Macintosh (24 January
1984, US$2,495), which brought the GUI to individuals. Windows (1.0 in 1985, then Windows 95)
took it to the mass market. The GUI reacted against the command line, where you had to remember
the right words; the bitmapped display, in which every pixel is addressable, made it possible.

**Principles.**

1. *Direct manipulation.* You point at the thing and act on it rather than typing a command that
   names it. On the Xerox Star (1981) you printed by dragging a document icon onto a printer icon.
2. *The metaphor as a teacher.* A familiar world (desk, folder, trash) lets a novice predict an
   action before trying it. The Macintosh Finder's folders and Trash (1984) made file management
   legible to people who had never seen a directory tree.
3. *What you see is what you get.* The screen shows the printed result. Larry Tesler and Tim
   Mott's Gypsy editor on the Alto (1975) showed formatted text as it would print, and that
   collapsed the gap between encoding a layout and seeing it.
4. *Modelessness.* The same gesture should mean the same thing everywhere. Cut, copy and paste
   as universal commands across Lisa applications (1983) are the canonical case.
5. *Published consistency.* Rules are written down so every application behaves alike. *Human
   Interface Guidelines: The Apple Desktop Interface* (Addison-Wesley, 1987) made the guideline
   document a design artefact in its own right.

**Key works.** NLS demonstration, Douglas Engelbart and the Augmentation Research Center, 1968.
Xerox Alto and Smalltalk, Xerox PARC (Alan Kay, Adele Goldberg, Dan Ingalls and others), 1973
onward. Gypsy, Larry Tesler and Tim Mott, 1975. Xerox Star 8010, Xerox, 1981. Apple Lisa, 1983.
Macintosh system icons and the Chicago typeface, Susan Kare, 1984. MacPaint, Bill Atkinson, 1984.
HyperCard, Bill Atkinson, 1987. Windows 95, Microsoft, 1995.

**Visual vocabulary.** One-bit black and white at 72 dots per inch. Bitmap typefaces with
proportional spacing (Chicago for menus, Geneva for text, Monaco for code). 32 × 32 pixel icons
drawn as silhouettes with one or two interior details. Rectangular windows with title bars,
rounded-rectangle buttons and dialogs, a menu bar fixed to the top edge, and dithered grey
patterns standing in for tone. Composition is overlapping rectangles on a patterned desktop.

**Lineage.** From Ivan Sutherland's Sketchpad (1963), Isotype's idea that a reduced picture can
carry an instruction, and functionalist product design's idea that form should explain use. It fed
skeuomorphism, the early web (whose browsers lived in GUI windows) and every platform since.

**Quotes.** Andy Hertzfeld's account on folklore.org of a May 1981 argument, in which Jobs
pressed Atkinson to add rounded rectangles to QuickDraw, has Jobs saying: "Rectangles with rounded
corners are everywhere! Just look around this room!" (Andy Hertzfeld, "Round Rects Are
Everywhere!", folklore.org; a recollection, not a recording.)

**Remix today.** The GUI made a model of the system visible and manipulable; AI interfaces have
mostly gone back to typed commands. Reapply the GUI's discipline to agents: give the model's state,
memory and pending actions a visible, draggable, undoable form instead of a chat transcript.

### Douglas Engelbart {#douglas-engelbart}

**Context.** An American engineer (1925–2013), shaped by Vannevar Bush's essay "As We May Think".
At SRI he founded the Augmentation Research Center and set out his programme in the 1962 report
*Augmenting Human Intellect: A Conceptual Framework*.

**Principles.** *Augment, don't automate*: computers should amplify human and collective
intellect (the 1962 report). *Co-evolve tools and people*: skills and tools develop together, so
a tool that takes learning, like NLS's five-key chord keyset used alongside the mouse (1968), is
acceptable if it raises the ceiling. *Bootstrapping*: use the system to build the system, so that
gains compound (the ARC team built NLS inside NLS).

**Key works.** *Augmenting Human Intellect*, 1962. The computer mouse, with Bill English,
prototype 1964. The NLS demonstration, 9 December 1968.

**Lineage.** From Bush's memex; it fed Xerox PARC, and through PARC, Apple and Microsoft.

**Remix today.** Augmentation versus automation is the live question of AI design: design for the
expert who gets better with the tool, not only for the novice who wants it done for them.

### Alan Kay {#alan-kay}

**Context.** An American computer scientist (born 1940). At Xerox PARC he led the Learning
Research Group, which built Smalltalk and the overlapping-window interface, and in 1972 he
proposed the Dynabook. He received the Turing Award in 2003.

**Principles.** *The computer is a medium*, not a calculator: a new medium for thought like
print, as he argued with Adele Goldberg in "Personal Dynamic Media" (1977). *Doing with images
makes symbols*: following Jerome Bruner, interfaces should move from action (the mouse) to images
(icons, windows) to symbols (code); this is the reasoning behind the Smalltalk environment of the
1970s. *Design for children of all ages*: if a child can author with it, it is general, which was
the test set in "A Personal Computer for Children of All Ages" (1972).

**Key works.** The Dynabook proposal, 1972. Smalltalk-72, 1972. "Personal Dynamic Media", with
Adele Goldberg, 1977.

**Lineage.** From Sketchpad, Engelbart's NLS, Seymour Papert's Logo and Bruner's learning
theory. It fed the Lisa, the Macintosh and, conceptually, the iPad.

**Quotes.** Kay's best-known line, "The best way to predict the future is to invent it," dates by
his own account to a 1971 PARC meeting.

**Remix today.** Kay's measure was whether ordinary people could *author* with the machine. Apply
it to generative tools: does your product make users into makers who understand what they make?

### Larry Tesler {#larry-tesler}

**Context.** An American computer scientist (1945–2020) who worked at PARC, Apple, Amazon and
Yahoo. His website was nomodes.com and his Twitter handle @nomodes.

**Principles.** *No modes*: an action should always do the same thing, as it did in the Gypsy
editor (1975). *Conservation of complexity* (Tesler's Law): some complexity can't be removed,
only moved, and the question is whether the user or the designer carries it. *Test with real
users*: Gypsy was built for and tested with editors at Ginn & Co., Xerox's publishing subsidiary
(1975).

**Key works.** Gypsy, with Tim Mott, 1975. Apple Lisa, 1983. The Apple Newton, 1993.

**Lineage.** From PARC's Smalltalk group; it fed the Lisa and Mac interaction model and, through
cut, copy and paste, every editor since.

**Remix today.** Chat interfaces are full of hidden modes: the same prompt behaves differently
depending on context the user can't see. Tesler's rule is a good audit for AI products.

### Jef Raskin {#jef-raskin}

**Context.** An American interface designer (1943–2005) who started and led the Macintosh project
at Apple in 1979, conceiving it as a cheap, text-centred appliance, before Jobs took it over in
1981.

**Principles.** *The information appliance*: a computer should feel single-purpose and be ready to
use, as the Canon Cat (1987) was. *Design for habit*: people form habits, so an interface should
be modeless and "monotonous" (one way to do each thing) so their habits never betray them (*The
Humane Interface*, 2000).

**Key works.** The Macintosh project, 1979. Canon Cat, 1987. *The Humane Interface*, 2000.

**Remix today.** Habituation argues against redesign churn: each platform-wide overhaul (2013,
2025) taxes every existing user's habits, and that cost belongs in the design case.

### Bill Atkinson {#bill-atkinson}

**Context.** An American programmer (1951–2025) and Apple employee number 51. He was the
principal designer of the Lisa's GUI and wrote QuickDraw, MacPaint and HyperCard, inventing the
menu bar, the lasso, marching ants and fast rounded rectangles along the way. He co-founded
General Magic in 1990, later became a nature photographer, and died on 5 June 2025.

**Principles.** *Speed is a design property*: an interface only feels direct if it draws
instantly, which is why he worked out a way to draw round rectangles with only addition and
subtraction (QuickDraw, 1981). *Tools you can see working*: selection and zoom are made visible
(marching ants and FatBits in MacPaint, 1984). *Authoring for everyone*: cards, buttons and a
plain-English script let non-programmers build their own software (HyperCard, 1987).

**Key works.** QuickDraw, 1984. MacPaint, 1984. HyperCard, 1987. *Within the Stone* (photographs),
2004.

**Remix today.** HyperCard is the clearest ancestor of today's prompt-to-app tools, and of a better
version of them: one in which the user can open the stack and see how it works.

### Susan Kare {#susan-kare}

**Context.** An American artist and designer (born 1954), trained in fine art (PhD, New York
University, 1978), who was hired onto the Macintosh team in January 1983 after Andy Hertzfeld
asked her to draw icons. She had no experience in computer graphics. She drew her icons on
graph paper, drawing on needlepoint and mosaic, then became creative director at NeXT and later
designed the card deck for Solitaire in Windows 3.0 (1990).

**Principles.** *Icons as road signs*: an icon has to be read instantly, so it is reduced to the
single silhouette that carries the meaning (the Mac's Trash, Paintbrush and Scissors, 1984).
*Meaning in a 32 × 32 grid*: every pixel is a decision, and the constraint produces both clarity
and warmth (her 1983 notebooks, acquired by MoMA in 2015). *Wit makes the machine human*: the
smiling Happy Mac at startup (1984) and Clarus the Dogcow made a clerical machine feel friendly.

**Key works.** The original Macintosh icon set, 1984. Chicago, 1984. Geneva, 1984. The Windows 3.0
Solitaire card deck, 1990.

**Lineage.** From the pictogram traditions of Isotype and international signage, and from
mosaic and needlework. It fed every icon system since, and the pixel-art revival.

**Remix today.** Kare's discipline was finding the one image that carries a meaning. AI image
models produce a thousand images and no meaning, so her method (reduce, then add one human detail)
is the editing skill they leave to the designer.

### Bruce Tognazzini {#bruce-tognazzini}

**Context.** An American interaction designer (born 1945), hired in June 1978 as Apple's first
applications software engineer. In September 1978 he published the first Apple Human Interface
Guidelines (for the Apple II) and went on to write seven more editions. He later worked at Sun
and WebMD and became a partner in Nielsen Norman Group.

**Principles.** *The guideline as contract*: consistency across applications is a promise to the
user, so it is written down (the Apple Human Interface Guidelines, 1978). *Fitts's law at the
edge*: a target at the edge of the screen is effectively infinitely deep, so the most-used commands
belong there (the Macintosh menu bar pinned to the top edge, 1984, a principle Tog championed).
*First principles over fashion*: anticipation, low latency and visible state outlast any look
(*Tog on Interface*, 1992).

**Key works.** Apple Human Interface Guidelines, first edition, 1978. *Human Interface
Guidelines: The Apple Desktop Interface*, 1987. *Tog on Interface*, 1992.

**Remix today.** The HIG is the founding text of design systems. Liquid Glass's floating,
shrinking controls break a Fitts's-law instinct Apple's own guidelines taught, which makes it a
useful case study in what breaking a written rule costs.

### Steve Jobs {#steve-jobs}

**Context.** An American entrepreneur (1955–2011) who co-founded Apple and NeXT. He was not a
designer, but he acted as the most consequential *patron* of interface design in the period: he
commissioned, edited and vetoed work by others, as the Medicis did. He credited his insistence on
proportional fonts to a calligraphy class he audited at Reed College.

**Principles.** *Look at the world*: ground interface forms in everyday objects, as when he
pushed Atkinson to make QuickDraw draw round rectangles (May 1981). *Typography belongs in
computing*: the Macintosh's proportional bitmap fonts (1984). *Integrate and edit*: control
hardware and software together and cut hard, as the iPhone did by dropping the hardware keyboard
for multi-touch glass (2007).

**Key works.** Macintosh, 1984. NeXT Computer, 1988. iMac G3, 1998. iPhone, 2007. The open letter
"Thoughts on Flash", 2010.

**Quotes.** On Aqua in January 2000, as widely reported: "one of the design goals was when you saw
it you wanted to lick it" (quoted in *Fortune*, January 2000).

**Remix today.** Jobs's lesson for design leaders is about patronage: one person with taste and
authority, editing hard. Whether the platforms still have someone in that role, rather than
committees and metrics, is a real part of the "stalled innovation" debate.

---

## Computational design {#computational-design}

**Context.** A parallel line ran alongside the commercial GUI: designers who treated code itself as
their material. Muriel Cooper moved from directing design at MIT Press to founding MIT's Visible
Language Workshop (VLW) in the mid-1970s, and her group's *Information Landscapes* demo at TED5
(1994) showed type moving in navigable 3D space. John Maeda's Aesthetics + Computation Group at the
MIT Media Lab trained designers who code. His students Casey Reas and Ben Fry began Processing in
2001, a "sketchbook" language that put programming in the hands of designers and artists. The line
continued through Flash, creative coding (openFrameworks, p5.js), generative identities and data
visualisation. It reacted against the static page and the shrink-wrapped tool.

**Principles.**

1. *Code is the material.* The designer writes the rule that produces the form, and changing a
   parameter is a design decision. John Maeda, *Design By Numbers* (1999).
2. *Type in space and time.* Hierarchy is expressed through depth, scale and focus as the reader
   flies through text. Muriel Cooper and the VLW, *Information Landscapes* (1994).
3. *A sketchbook for programmers.* The tool should be small and immediate enough to sketch with.
   Processing, Reas and Fry (2001).
4. *Rules plus chance.* Constrained randomness gives a family of related outputs, so the system is
   the signature. Joshua Davis, praystation.com (Golden Nica, 2001).

**Key works.** *Information Landscapes*, Muriel Cooper and the VLW, 1994. *Design By Numbers*,
John Maeda, 1999. Processing, Casey Reas and Ben Fry, 2001. praystation.com, Joshua Davis, 2001.
*The Laws of Simplicity*, John Maeda, 2006.

**Visual vocabulary.** Translucent layered type receding into depth, thin vector lines,
particle fields, grids that deform under rules, monochrome canvases with a single accent colour,
and output in series rather than as single pieces.

**Lineage.** From the Bauhaus preliminary course and Swiss Style's systematic grids (Cooper's 1969
MIT Press *Bauhaus* book is the bridge). It fed the Flash era, generative branding and, directly,
the conceptual ground of generative AI design.

**Remix today.** Computational design asked designers to own the generator. Prompting a model
gives that up. The remix is to build small, inspectable generators (and to fine-tune and
constrain models) so that the system, and not the vendor's latent space, is your signature.

### Muriel Cooper {#muriel-cooper}

**Context.** An American designer (1925–1994), the first design director of MIT Press, where she
designed its seven-bar colophon, the MIT Press edition of *Bauhaus* (1969) and the first edition of
*Learning from Las Vegas* (1972). She then founded the Visible Language Workshop and co-founded
the MIT Media Lab. She died in May 1994, shortly after presenting *Information Landscapes*.

**Principles.** *Information as landscape*: hierarchy can be spatial depth instead of page order
(*Information Landscapes*, 1994). *Designers must build the tools*: if design moves onto screens,
designers have to work inside the computer, which was the founding brief of the VLW in the
mid-1970s. *Modernist rigour, radical variation*: Bauhaus discipline pushed into new forms (*Learning
from Las Vegas*, 1972).

**Key works.** *Bauhaus* (MIT Press), 1969. *Learning from Las Vegas*, first edition, 1972.
*Information Landscapes*, 1994.

**Remix today.** Spatial computing (Vision Pro, 2024) arrived with windows floating in rooms, when
Cooper had shown text that *was* the space. Her demo is still a richer brief than most headset UI.

### John Maeda {#john-maeda}

**Context.** An American designer and technologist (born 1966) who studied computer science at
MIT, was drawn to Paul Rand and Muriel Cooper, earned a design PhD at Tsukuba, and taught at the
MIT Media Lab for twelve years. He was president of RISD from 2008 to 2013 and later held design
and AI leadership roles in industry, including at Microsoft.

**Principles.** *Learn the material by coding* (*Design By Numbers*, 1999). *Laws of simplicity*:
reduce, organise, save time (*The Laws of Simplicity*, 2006). *Computational design as a
business force*: name it as its own design category and track it (the annual *Design in Tech
Report*, from 2015).

**Key works.** *Design By Numbers*, 1999. *The Laws of Simplicity*, 2006. *Design in Tech Report*,
2015 onward.

**Remix today.** Maeda's career suggests the designers who shape AI products will be those who
understand the material, not those who only prompt it.

---

## Early web and Web 1.0 {#early-web}

**Context.** Tim Berners-Lee's World Wide Web went public in 1991, written on a NeXT machine at
CERN. NCSA Mosaic (version 1.0, April 1993) was the first popular browser to show images inline
with text, and that turned the web page into a graphic surface. Netscape, GeoCities (November
1994) and free hosting brought millions of amateur authors. The medium had almost no layout
controls. Designers forced tables, single-pixel spacer GIFs and frames into service as a grid,
until CSS Level 1 (W3C Recommendation, 17 December 1996) and, later, browser support for it gave
them real typography and layout. In parallel, net.art (JODI, Vuk Ćosić, Olia Lialina, Alexei
Shulgin, Heath Bunting) treated the browser itself as the material. The early web reacted against
the closed, published CD-ROM and the corporate GUI, and what made it possible was HTTP, HTML and
the dial-up modem.

**Principles.**

1. *The link is the layout.* Structure lives in connections between pages, shown as blue
   underlined words. Berners-Lee's first public website at CERN (1991).
2. *Image inline with text.* Once a picture could sit inside the text flow, the page became a
   composition. NCSA Mosaic 1.0 (1993).
3. *Hack the medium.* Tools never meant for layout were bent into a grid, and the constraint
   became a style. David Siegel's *Creating Killer Web Sites* (1996) and its single-pixel GIF.
4. *Vernacular authorship.* Amateurs publishing with counters, MIDI files, starfield backgrounds
   and "under construction" signs created an aesthetic of their own. GeoCities, from 1994.
5. *The browser as subject.* Artists exposed frames, source and error states. Olia Lialina's *My
   Boyfriend Came Back from the War* (1996) told a story through progressively split frames.

**Key works.** NCSA Mosaic, 1993. GeoCities, 1994. *My Boyfriend Came Back from the War*, Olia
Lialina, 1996. The CSS Level 1 Recommendation, Håkon Wium Lie and Bert Bos, 1996. CSS Zen Garden,
Dave Shea, 2003, which showed that one HTML document could take on wildly different designs
through CSS alone.

**Visual vocabulary.** Times and Arial at browser defaults, grey (#C0C0C0) backgrounds, blue
and purple links, tiled backgrounds, animated GIFs, beveled table borders, 468 × 60 banner ads,
web-safe 216-colour palettes, and centred everything.

**Lineage.** From the GUI (the browser is a window) and, in net.art, from Dada's attack on its own
medium. Some 1990s commercial web design borrowed the layered, distressed type of
grunge and deconstruction. It fed the Flash era, responsive design, and decades later the
neubrutalist revival of "raw" HTML.

**Remix today.** The early web's virtue was that anyone could view source and copy it. In an era
when interfaces are generated, a designer can bring back that legibility: show the prompt, the
components and the reasoning behind a generated screen, as the early web showed its markup.

---

## The Flash era {#flash-era}

**Context.** FutureSplash Animator, a small vector animation tool, was acquired by Macromedia in
December 1996 and released as Flash 1.0. Over the next decade the Flash plug-in became the way
designers escaped HTML's limits, with timeline animation, vector type, sound, physics and
eventually video (YouTube's early player ran on Flash). A global scene of designer-coders formed
around portfolio sites, forums and award shows, including Joshua Davis's praystation.com and
dreamless.org in New York, Yugo Nakamura's work in Tokyo, and many studios elsewhere. The era
reacted against the static, grey document web, and broadband made it possible. It ended for
practical reasons. Jobs's open letter "Thoughts on Flash" (April 2010) explained why the iPhone
would not run it, HTML5 and CSS3 absorbed most of its capabilities, and Adobe ended Flash Player
support on 31 December 2020.

**Principles.**

1. *Motion as the primary medium.* The site is a timeline, and easing and choreography carry the
   brand. Macromedia Flash 1.0's keyframe timeline (1996).
2. *Physics instead of buttons.* Elements behave like springs, fluids and swarms, so interacting
   with them feels like handling a material. Yugo Nakamura, *ecotonoha* for NEC (2004).
3. *Open the source.* Sharing working files makes the community the school. praystation.com
   (2001).
4. *Time as content.* A perpetual loop becomes the experience and a reason to keep the page open.
   Yugo Nakamura, UNIQLOCK for Uniqlo (2007).

**Key works.** Macromedia Flash 1.0, 1996. praystation.com, Joshua Davis, Prix Ars Electronica
Golden Nica 2001. *ecotonoha*, Yugo Nakamura for NEC, 2004 (Cannes Cyber Lions Grand Prix).
UNIQLOCK, Yugo Nakamura for Uniqlo, 2007. "Thoughts on Flash", Steve Jobs, 2010.

**Visual vocabulary.** Pixel fonts at small sizes (designers used bitmap faces built for Flash
to keep them crisp), thin hairline vectors, techno-grey and acid accents, preloaders with
percentage counters, full-window "experiences", sound on rollover, and generative, physics-driven
compositions.

**Lineage.** From the early web and computational design, with typographic attitude borrowed from
the Emigre generation of digital type. It fed motion design, the interaction craft of the iPhone
era (in which physics and easing became native), and creative coding.

**Remix today.** Flash proved that motion and physics can *be* the interface. Today's platform UIs
use motion mainly as transitions. The remix is to give generated interfaces real behaviour, so
that an element pushes back or settles with weight, instead of only fading in.

### Joshua Davis {#joshua-davis}

**Context.** An American designer and generative artist (born 1971) who left Pratt Institute to
work in the new field of design technology. His site praystation.com won the 2001 Prix Ars
Electronica Golden Nica for Net Vision / Net Excellence, and he hosted the dreamless.org forum
(1999–2001).

**Principles.** *Program the composition*: rules and randomness produce families of images
(praystation.com, 2001). *Give away the source*: praystation was one of the first sites to publish
its Flash source files (2001), which made the community the school.

**Key works.** dreamless.org, 1999. praystation.com, Golden Nica 2001.

**Remix today.** Davis treated randomness as a collaborator inside strict rules, which is a sound
model for working with generative models: you design the constraints and curate what comes out.

### Yugo Nakamura {#yugo-nakamura}

**Context.** A Japanese designer (born 1970 in Nara) who trained in civil engineering at the
University of Tokyo, worked on bridge design, moved into interactive design in 1998 and founded the
studio tha ltd. in 2004. He co-wrote *New Masters of Flash* (2000), and in 2023 he directed the
game *HUMANITY* with Tetsuya Mizuguchi.

**Principles.** *Behaviour modelled on nature*: the maths of springs, growth and flow make
interaction feel familiar without instructions (*ecotonoha*, 2004). *Loop as experience*: a
music-timed perpetual loop turns a utility into a ritual (UNIQLOCK, 2007).

**Key works.** *ecotonoha*, 2004. UNIQLOCK, 2007. *HUMANITY*, 2023.

**Remix today.** Nakamura's engineering-led restraint fits the AI era. Use computation to give a
few elements convincing behaviour rather than generating many elements with none.

---

## Y2K aesthetic {#y2k-aesthetic}

**Context.** Around the millennium, consumer technology and graphics shared a techno-optimist
look: translucent coloured plastics, liquid chrome, blobby 3D renders, and dense pseudo-technical
graphics. Apple's iMac G3 (1998) in translucent Bondi Blue polycarbonate made the computer a
friendly object, and the Aqua interface previewed at Macworld in January 2000 carried the
same "lickable" gloss onto the screen. In graphic design, Sheffield's The Designers Republic set a
techno-graphic language in work such as the *Wipeout* game graphics (1995–96). It reacted
against beige boxes and grey interfaces. The name is retrospective: the Consumer Aesthetics
Research Institute codified it, and Gen Z revived it in the 2020s. CARI's Sofi Xian also named
its successor, "Frutiger Aero" (glossy nature-meets-tech imagery of the mid-2000s), in 2018.

**Principles.**

1. *Translucency as candour.* Seeing into the machine makes it friendly. The iMac G3 (1998).
2. *Liquid and chrome.* Glossy, reflective, bulbous surfaces signal a rendered, digital future.
   The Aqua preview (2000).
3. *Techno-graphic density.* Codes, marks and logotypes are layered as decoration. The Designers
   Republic, *Wipeout 2097* (1996).

**Key works.** iMac G3, Jony Ive and Apple Industrial Design, 1998. Aqua, Apple, introduced 2000.
*Wipeout* and *Wipeout 2097* graphics, The Designers Republic, 1995–96.

**Visual vocabulary.** Ice blues, silvers, bubblegum pinks and lime, translucent gradients,
chrome type, lens flares, blobs and droplets, and futuristic extended sans-serifs.

**Lineage.** It followed Memphis's playful colour and the psychedelic interest in fluid form, with
some New Wave layering. It fed skeuomorphism (Aqua), Frutiger Aero, and, by Apple's own account of
its sources, Liquid Glass.

**Remix today.** The Y2K look was sincerely optimistic about technology, which is rare now. A
designer can borrow the sincerity (warmth, play, visible insides) without the chrome clichés.

---

## Skeuomorphism {#skeuomorphism}

**Context.** "Skeuomorph" is an archaeological term for a form that keeps the cues of an older
material, like pottery with imitation rivets. In software it names interfaces rendered to
look like physical objects. Aqua (Mac OS X 10.0, 2001) made gloss and gel the Mac's default.
The iPhone (announced 9 January 2007) made rendering functional: on a sheet of glass with no keys,
a rendered slider or button told your finger what could be pressed. Under Steve Jobs, and with
iOS software chief Scott Forstall widely reported as its strongest advocate, iOS apps took on
literal materials: a yellow legal pad in Notes, green felt in Game Center, stitched leather in
Find My Friends and the Mac's iCal, a wooden bookshelf in iBooks, and a reel-to-reel tape deck in
Podcasts (2012). Microsoft's Windows Vista Aero (2006–07) ran a parallel glass aesthetic. The
style reacted against the abstraction of earlier GUIs, and it was enabled by GPUs, high-resolution
displays and the need to teach touch to hundreds of millions of first-time smartphone users. It
ended at Apple after Forstall's departure in October 2012, when Jony Ive took responsibility for
software design.

**Principles.**

1. *Familiarity through imitation.* A new function wears the look of the object it replaces.
   iPhone OS 1.0's Notes on a yellow legal pad (2007).
2. *Light and material as hierarchy.* Gloss, bevel and shadow say what is pressable. Aqua's gel
   buttons and pinstriped windows (Mac OS X 10.0, 2001).
3. *Touch needs affordance.* On glass, rendered depth substitutes for physical feedback. The
   iPhone's slide-to-unlock (2007).
4. *Craft as brand.* Lavish rendering signals care, especially on a store where apps compete.
   Apple's Podcasts tape deck (iOS 6, 2012).

**Key works.** Mac OS X 10.0 Aqua, 2001. iPhone OS 1.0, 2007. Windows Vista Aero, 2007. iPad
(announced 27 January 2010) with iBooks' wooden shelf. iOS 6, 2012.

**Visual vocabulary.** Glossy gel and lozenge buttons, linen and leather textures, stitching,
torn-paper edges, brushed metal, wood grain, inner shadows and bevels, Lucida Grande and
Helvetica in embossed type, and photographic icons with reflections.

**Lineage.** From the GUI's desktop metaphor (itself a skeuomorph), the Y2K appetite for
materials, and industrial design's attention to finish. Flat design was a direct reaction against
it. Its affordance argument returned in Material's shadows, in the 2019 neumorphism trend, and in
Liquid Glass.

**Remix today.** Skeuomorphism's real insight was about *affordance*, not texture: show what can be
touched. Nielsen Norman Group's later research on flat UIs, which found weaker signifiers and more
uncertainty, supports that point. Take the affordance and leave the leather.

### Scott Forstall {#scott-forstall}

**Context.** An American software engineer (born 1969) who joined NeXT out of Stanford, came to
Apple with the NeXT acquisition, and led iPhone software from its creation, as senior vice
president of iOS from 2007 to October 2012. Reporting at the time described his skeuomorphic
style as strongly backed by Jobs and divisive within Apple's design team. He left after the Apple
Maps launch, and he has since produced Broadway shows, including *Fun Home*.

**Principles.** *Familiarity first*: new users learn faster when apps look like the objects
they replace (iPhone OS 1.0's Notes, Calculator and Clock, 2007). *The platform is the product*:
open the device to third-party apps under shared frameworks (the iPhone SDK and App Store, 2008).

**Key works.** iPhone OS 1.0, 2007. iPhone SDK and App Store, 2008. iOS 6, 2012.

**Remix today.** A visual style is a decision about *who the user is*; in 2007 it was a
first-time touchscreen owner. Ask the same of first-time AI users.

---

## Flat design {#flat-design}

**Context.** Microsoft got there first. Its Media Center and Zune interfaces (2006–09) led to
the Metro design language unveiled with Windows Phone 7 in 2010: large lower-case Segoe type,
flat colour tiles, content over chrome, and a stated debt to transit signage and Swiss graphic
design. Windows 8 (2012) took Metro to the PC. Indie apps such as Loren Brichter's *Letterpress*
(2012) were already flat on iOS. Apple's turn came at WWDC on 10 June 2013 with iOS 7, a
redesign credited to a team led by Jony Ive: thin Helvetica Neue, flat icons on bright gradients,
borderless text buttons, and blurred translucent layers for depth. OS X Yosemite (2014) brought
it to the Mac. Google's Holo (Android 4.0, 2011) and then Material Design followed the same
direction. Flat design reacted against skeuomorphism's ornament, and it was enabled by Retina
displays (fine type no longer needed rendering crutches) and by users who no longer needed
touch explained to them. Critics, including Jakob Nielsen in 2013 and later Nielsen Norman Group
studies, documented its cost: without signifiers, people struggled to tell what was clickable.

**Principles.**

1. *Authentically digital.* Stop imitating physical objects; the screen should behave like a
   screen. "Authentically digital" was one of Metro's stated principles, first seen in Windows
   Phone 7 (2010).
2. *Content over chrome.* Frames and bars shrink so that content becomes the interface. Windows
   Phone 7's panorama hubs, whose oversized headings run off the edge of the screen (2010).
3. *Type as hierarchy.* Scale and weight of one sans-serif do the structural work that bevels did.
   iOS 7 in Helvetica Neue Light (2013).
4. *Depth through layers, not texture.* Blur, translucency and parallax give spatial order
   without simulated materials. iOS 7's Control Center (2013).

**Key works.** Zune HD interface, Microsoft, 2009. Windows Phone 7, Microsoft (design team led by
Albert Shum), 2010. *Letterpress*, Loren Brichter, 2012. Windows 8, Microsoft, 2012. iOS 7, Apple
(Jony Ive and team), 2013.

**Visual vocabulary.** Solid saturated fills, flush-left lower-case sans-serif type (Segoe,
Helvetica Neue, later San Francisco and Roboto), outline glyph icons, ample white space, edge-to-edge
colour tiles, and depth carried only by blur and layering.

**Lineage.** This is the clearest case of modernism absorbed by the platforms. Metro's makers
cited Swiss graphic design and transit signage, and the flat icon descends from Isotype's
pictograms and from corporate-identity reduction. Flat design fed Material Design, the
"Corporate Memphis" illustration style (Facebook's Alegria, 2017), design systems, and the backlash
movements of neubrutalism and glassmorphism.

**Quotes.** Jony Ive, on iOS 7: "There is a profound and enduring beauty in simplicity, in
clarity, in efficiency. True simplicity is derived from so much more than just the absence of
clutter and ornamentation – it's about bringing order to complexity." (Apple press release,
10 June 2013.)

**Remix today.** Flat design took Swiss Style's surface (sans-serif, flat colour, white space)
more readily than its deeper method: the strict typographic grid and the objective, information-led
image. A designer in 2026 can go back to the method, with real grids, real typographic scales
and real information design, rather than to the surface, which is now the default.

### Jony Ive {#jony-ive}

**Context.** A British-American industrial designer (born 1967) who joined Apple in 1992, led
industrial design from the iMac G3 (1998) through the iPod, iPhone and iPad, took over human
interface design in 2012, and was chief design officer from 2015 until he left in 2019. He then
founded LoveFrom. In May 2025 OpenAI announced it would acquire io, his AI hardware venture.

**Principles.** *Simplicity is order*, not the absence of ornament (iOS 7, 2013). *Deference to
content*: the interface steps back (iOS 7's translucent bars and borderless buttons, 2013).
*Materials lead form*: the form follows how a material is worked (the iMac G3's translucent
polycarbonate, 1998).

**Key works.** iMac G3, 1998. iPod, 2001. iPhone, 2007. iOS 7, 2013. Apple Watch, 2015.

**Lineage.** From Dieter Rams and functionalist product design, and from the Ulm school's
reduction; it fed the whole flat era.

**Remix today.** iOS 7 applied industrial-design reduction to software but lost the button's
affordance, which comes from shape and travel. Borrow the reduction; restore the signifier.

### Albert Shum {#albert-shum}

**Context.** A Microsoft design executive who led the design team behind Windows Phone 7 (2010),
the first mass-market phone interface built on Metro. Its typographic flatness preceded iOS 7 by
three years and was widely seen as the visual case for flat design. (His birth year and full
career dates are not reliably documented in public sources.)

**Principles.** *Authentically digital*: drop simulated materials (Windows Phone 7, 2010).
*Signage, not simulation*: borrow transit wayfinding's big type and flat colour fields (Live
Tiles, 2010).

**Key works.** Windows Phone 7, 2010.

**Remix today.** Metro arrived first and lost the market, while its style won. A design language
can succeed without its product doing so; Windows Phone shows that to design leaders.

### Loren Brichter {#loren-brichter}

**Context.** An American developer (born 1984) who worked at Apple on the iPhone, then built
Tweetie (bought by Twitter in 2010) and the word game *Letterpress* (2012).

**Principles.** *The gesture is the button*: fold the command into the content's own motion
(pull-to-refresh in Tweetie 2, 2009). *Colour as state*: flat colour fields encode ownership and
game state more clearly than texture does (*Letterpress*, 2012).

**Key works.** Tweetie 2, 2009. *Letterpress*, 2012.

**Remix today.** Pull-to-refresh became universal without any guideline: one person's interaction
can still become a platform convention.

---

## Responsive web design {#responsive-design}

**Context.** By 2010 the iPhone and its imitators meant one website had to work on screens from
320 pixels to 2,560. The usual answer, a separate "m." mobile site, didn't scale. Ethan
Marcotte's article "Responsive Web Design" in *A List Apart* (issue 306, 25 May 2010) proposed one
layout built from fluid grids, flexible images and CSS3 media queries, and borrowed the idea of
responsive architecture, in which structures adapt to the people inside them. His book followed
in 2011, as did the responsive *Boston Globe* site built with Filament Group. Luke Wroblewski's
*Mobile First* (2011) set the method, and later CSS Flexbox and Grid Layout (shipping widely in
2017) made "intrinsic" layouts possible. Jen Simmons, of the CSS Working Group, coined "intrinsic
web design" for that approach. The movement reacted against fixed 960-pixel layouts and separate
mobile sites. Media queries and mobile WebKit made it possible.

**Principles.**

1. *The fluid grid.* Columns are proportions, not pixels. Marcotte, *A List Apart* (2010).
2. *Breakpoints from content.* Change the layout where the content breaks, not at device widths.
   *The Boston Globe* (2011).
3. *Mobile first.* Design the most constrained version first, which forces priorities.
   Wroblewski, *Mobile First* (2011).
4. *Intrinsic layout.* Let elements size from their content using grid and flex. CSS Grid Layout in
   major browsers (2017).

**Key works.** "Responsive Web Design", Ethan Marcotte, 2010. *Responsive Web Design* (A Book
Apart), Ethan Marcotte, 2011. *The Boston Globe* website, 2011.

**Visual vocabulary.** Single-column stacks that open into multi-column grids, hamburger menus,
fluid images, relative type units, and generous tap targets.

**Lineage.** From Swiss Style's modular grid (made fluid) and the early web's flexible, liquid
layouts. It fed design systems, which have to work at every breakpoint, and today's
container-query components.

**Quotes.** Ethan Marcotte: "Rather than tailoring disconnected designs to each of an
ever-increasing number of web devices, we can treat them as facets of the same experience."
("Responsive Web Design", *A List Apart*, 2010.)

**Remix today.** Responsive design made the grid a set of rules rather than a fixed page, which is
the right mental model for generated interfaces too. Define the rules (ratios, content priorities,
breakpoints) and let a model or a runtime fill them in.

### Ethan Marcotte {#ethan-marcotte}

**Context.** An American web designer and writer who coined "responsive web design" in 2010 and
defined it in its canonical three-part form. (His birth year is not reliably documented in public
sources.)

**Principles.** *One design, many facets*: treat devices as facets of one experience (*A List
Apart*, 2010). *Proportion over pixels*: target ÷ context = result, the formula he used for fluid
widths (*Responsive Web Design*, 2011). *Learn from architecture*: structure and inhabitant
shape each other (*A List Apart*, 2010).

**Key works.** "Responsive Web Design", 2010. *Responsive Web Design*, 2011. *The Boston Globe*
website, with Filament Group, 2011.

**Remix today.** Marcotte named a practice that already existed in pieces. Naming it gave it
power. Designers in the AI era who are working out new patterns should name them, define them
tightly and publish them.

---

## Material Design {#material-design}

**Context.** Google announced Material Design (codenamed Quantum Paper) at Google I/O on 25 June
2014, led by Matías Duarte. Android was visually inconsistent and Google's web products were
fragmented, so it needed one language across phone, web and later watch and car. Material's
answer was neither skeuomorphic nor flat. It invented a single digital material, sheets of "paper"
with thickness, which cast real-time shadows, stack in z-space and carry ink. Motion explained
cause and effect (ripples from the touch point, shared-element transitions). Material Design 2
(2018) added brand customisation and rounded corners. Material You (Material Design 3, announced
at Google I/O in May 2021 with Android 12) extracted colour palettes from the user's wallpaper.
Material 3 Expressive (announced May 2025, shipped on Pixel phones from September 2025) made
shape, size, colour and springy motion more emotional. Google says it came out of 46 research
studies with over 18,000 participants. Material reacted against both iOS's skeuomorphism and
Metro's austerity, and GPU compositing on Android made it possible.

**Principles.**

1. *Material is the metaphor.* One invented physical material gives consistent rules for depth and
   shadow without imitating any real object. Material Design guidelines (2014).
2. *Motion provides meaning.* Transitions show continuity and cause. Android 5.0 Lollipop's ripple
   and shared-element transitions (2014).
3. *Bold, graphic, intentional.* Print-design methods (grid, baseline, type scale, saturated
   colour) drive hierarchy. The 2014 spec's 8dp grid and Roboto type scale.
4. *Personal by default.* The system takes its colours from the person. Material You's dynamic
   colour (Android 12, 2021).
5. *Expressive and tested.* Emotional design choices are validated with research. Material 3
   Expressive (2025).

**Key works.** Material Design guidelines, 2014. Android 5.0 Lollipop, 2014. Material You /
Material Design 3, 2021. Material 3 Expressive, 2025.

**Visual vocabulary.** Roboto (later Google Sans), an 8dp baseline grid, cards with elevation
shadows, the floating action button, bold primary and accent colours, and radial ink ripples. In
Material You: tonal palettes generated from a seed colour and large rounded shapes. In
Expressive: varied corner shapes, larger and more colourful components, and spring physics.

**Lineage.** From flat design, from Swiss and print typography (Google explicitly invoked print
design), and from skeuomorphism's concern with affordance, kept but abstracted. It fed design
systems, as the first widely copied public system, and set the template for how a platform ships
a design language as documentation plus code.

**Quotes.** Matías Duarte, on the 2014 launch: "unlike real paper, our digital material expands
and reforms intelligently. Material has physical surfaces and edges. Seams and shadows provide
meaning about what you can touch." (As quoted in contemporary coverage of the launch.) And Google
in 2025: "Material 3 Expressive is the most researched update to Google's design system, ever."
(Google Design, "Expressive Design: Google's UX Research", 2025.)

**Remix today.** Material's best idea is that a designer can *invent* a material with
consistent physics rather than copy a real one. It is the most promising response to the "stall":
define a new material for AI-era interfaces (how generated content arrives, settles and shows
its confidence) and give it rules as rigorous as Material's paper and ink.

### Matías Duarte {#matias-duarte}

**Context.** A Chilean-American interface designer who led design on Danger's Hiptop (T-Mobile
Sidekick, 2002) and Palm's webOS (introduced at CES 2009), then joined Google in May 2010 to lead
Android user experience and later Material Design. He is a Google VP and Google Fellow. (His birth
year is not reliably documented in public sources.)

**Principles.** *Cards for multitasking*: running apps as cards you flick away make concurrency
graspable (webOS card view, 2009). *A material, not an imitation* (Material Design, 2014).
*Between literal and abstract*: Android's Holo (2011) was framed against both iOS's skeuomorphism
and what he reportedly called Windows Phone's "airport lavatory signage".

**Key works.** Danger Hiptop, 2002. Palm webOS, 2009. Android 4.0 Holo, 2011. Material Design,
2014.

**Remix today.** The webOS card became the multitasking model on both iOS and Android. Duarte
shows that the most durable screen ideas are behavioural (cards, stacks, gestures), not stylistic.

---

## Design systems {#design-systems}

**Context.** The corporate standards manual (NASA's 1975 *Graphics Standards Manual*, or the
identity programmes of the 1960s) came back as code. Twitter engineers Mark Otto and Jacob
Thornton open-sourced Bootstrap on 19 August 2011. It was a free kit of grid, type and components,
and soon a large share of the web looked like it. Brad Frost's "Atomic Design" post (10 June 2013)
gave teams a vocabulary of components built from atoms up to pages. Salesforce's Lightning Design
System (2015), IBM's Carbon (2015), Shopify's Polaris (public in April 2017), Atlassian's guidelines,
GOV.UK's design system and Material's public components made "the system" a product, with its own
team, roadmap, versioning and adoption metrics. Sketch (2010) and above all Figma (public release
27 September 2016) let libraries live in a shared, multiplayer canvas, and design tokens linked
design files to code. Design systems reacted against inconsistent products built by fast-growing
teams, and component frameworks such as React (2013) made them possible.

**Principles.**

1. *Systems, not pages.* Compose reusable components instead of designing pages one by one. Brad
   Frost, "Atomic Design" (2013).
2. *Tokens as the single source.* Colour, spacing and type are named variables shared by design and
   code. Salesforce Lightning Design System (2015).
3. *The system is a product.* A dedicated team versions, documents and supports it. Shopify
   Polaris (2017).
4. *Defaults democratise.* A free, good-enough kit lets non-designers ship coherent UI, at the cost
   of sameness. Bootstrap (2011).
5. *Shared canvas.* Libraries live in a multiplayer, browser-based tool. Figma (2016).

**Key works.** Bootstrap, Mark Otto and Jacob Thornton, 2011. "Atomic Design", Brad Frost, 2013.
Carbon Design System, IBM, 2015. Lightning Design System, Salesforce, 2015. *Atomic Design*
(book), Brad Frost, 2016. Figma, Dylan Field and Evan Wallace, 2016. Polaris, Shopify, 2017.

**Visual vocabulary.** The system's look depends on its owner, but the family resemblance is
strong. Neutral sans-serifs (Inter, IBM Plex, Roboto, SF), 4- or 8-point spacing scales, a
modest radius, a primary brand colour plus semantic red, amber and green, outlined icon sets,
and documentation sites with live code samples.

**Lineage.** Corporate identity's standards manual and the Ulm school's systematic thinking,
Swiss grids, and Material Design as the first public platform system. It fed the sameness critique
that drove neubrutalism, and it is now the guardrail layer for generative AI design.

**Quotes.** Frost opened "Atomic Design" with a line from Stephen Hay: "We're not designing pages,
we're designing systems of components."

**Remix today.** Design systems are the most direct inheritance of modernism, as the thesis says,
and also the infrastructure AI generation needs. The open question for 2026 is expression: a
system that encodes *rules for variation* (as Material You's colour engine does) rather than one
fixed look.

### Brad Frost {#brad-frost}

**Context.** An American web designer and consultant whose 2013 blog post and 2016 book *Atomic
Design* became the standard method for building interface design systems; with Dave Olsen he made
Pattern Lab, a tool for living pattern libraries. (His birth year is not reliably documented in
public sources.)

**Principles.** *Atoms to pages*: move between abstract parts and concrete screens ("Atomic
Design", 2013). *A living pattern library*: the components live as working code, not a PDF
(Pattern Lab, 2013). *Maintain it like a product*: people, process and governance (*Atomic Design*,
2016).

**Key works.** "Atomic Design", 2013. Pattern Lab, 2013. *Atomic Design*, 2016.

**Remix today.** Frost's chemistry metaphor maps directly onto how models assemble UI from parts.
The designer's job moves up a level, to curating the atoms and the rules for combining them.

---

## Neubrutalism {#neubrutalism}

**Context.** "Brutalist web design" first named a deliberately raw, often pre-CSS-looking style
collected on Pascal Deville's brutalistwebsites.com (online by 2015). Its stated rationale was
that brutalism "can be seen as a reaction by a younger generation to the lightness, optimism, and
frivolity of today's web design." Around 2020–21 a more colourful, orderly variant, "neubrutalism"
or "neobrutalism", spread through product and brand design. Nielsen Norman Group defined it in 2025
by high contrast, blocky layouts, bold colours, thick borders and "unpolished" elements, and cited
Gumroad and Figma's brand refresh as examples. It reacted against the polished sameness of
design-system UI and Corporate Memphis illustration. It is easy to make with flat CSS, and it suits
creator-economy brands that want to look independent.

**Principles.**

1. *Show the structure.* Borders, boxes and the grid are drawn rather than hidden.
   brutalistwebsites.com (by 2015).
2. *Hard shadow, no blur.* Depth is a solid offset block, a printmaker's shadow rather than a
   renderer's (patterns surveyed by NN/g, 2025).
3. *Clash on purpose.* Two or three loud flat colours against black and white. Gumroad (cited by
   NN/g, 2025).
4. *Anti-polish as voice.* Roughness signals independence from big-tech sameness. Figma's brand
   refresh (cited by NN/g, 2025).

**Key works.** brutalistwebsites.com, Pascal Deville, 2015. "Neobrutalism: Definition and Best
Practices", Hayat Sheikh, Nielsen Norman Group, 2025.

**Visual vocabulary.** 2–4 pixel black outlines, solid black offset drop shadows, saturated flat
fills (acid yellow, electric blue, hot pink, mint), chunky grotesque or quirky display type paired
with a neutral body face, visible grid lines, and retro OS window chrome and monospace type.

**Lineage.** From the raw early web, punk's do-it-yourself attitude, Swiss Style's visible
structure and the Y2K revival. It is a reaction to design systems, and it can be built easily
with them.

**Quotes.** brutalistwebsites.com's tagline: "In its ruggedness and lack of concern to look
comfortable or easy, Brutalism can be seen as a reaction by a younger generation to the lightness,
optimism, and frivolity of today's web design."

**Remix today.** Neubrutalism has itself become a template. Its durable lesson is to make
structure visible and let the grid, the box and the edge show. That remixes well with Swiss
discipline and doesn't need the stock yellow-and-black kit.

---

## Liquid Glass {#liquid-glass}

**Context.** Apple announced Liquid Glass at WWDC on 9 June 2025. It was the first design language
shared across all of Apple's platforms (iOS 26, iPadOS 26, macOS Tahoe 26, watchOS 26, tvOS 26 and
visionOS 26) and its largest visual change since iOS 7. iOS 26 shipped on 15 September 2025. The
"material" is a real-time GPU-rendered translucent layer that refracts and reflects what lies
behind it, carries specular highlights that respond to device motion, and changes shape with
context. Controls became floating capsules above the content, and tab bars shrink as you scroll.
Apple named its sources as Aqua, iOS 7's real-time blur, the iPhone X's motion, the Dynamic
Island and visionOS's glass windows (Vision Pro shipped 2 February 2024). The background was the
"glassmorphism" trend, named by Michal Malewicz in 2020 as macOS Big Sur and Microsoft's Fluent
Acrylic shipped; critics also saw Windows Aero in it.

**Reception, even-handedly.** Some reviewers praised the optical craft, and Apple described
prototyping real glass in its industrial design studios to match the effect. The overall reception
was mixed to negative. Nielsen Norman Group's Raluca Budiu ("Liquid Glass Is Cracked, and Usability
Suffers in iOS 26", 10 October 2025) documented low contrast from transparency, text over text,
motion without meaning, smaller and more crowded tap targets, and controls that appear and
disappear unpredictably. Apple raised opacity across the 2025 betas. According to Wikipedia's
summary of the announcement, at WWDC 2026 it reduced default transparency further for iOS 27 and
added a user slider from clear to tinted glass. Alan Dye, who led the design, left Apple for Meta
in December 2025. Whether Liquid Glass was a misstep or a first draft is still open. What can be
said is that its novelty was in *rendering* (live refraction), not in a new organising idea, and
that its usability costs were predictable from established findings on text over images.

**Principles.**

1. *A digital material.* Controls are made of one simulated substance with optical behaviour.
   Liquid Glass (WWDC, 2025).
2. *Controls float above content.* Navigation is a separate layer of floating capsules. The iOS 26
   tab bar collapses as you scroll in Apple Music (2025).
3. *Concentricity.* Corner radii nest inside window and hardware radii. macOS Tahoe 26 windows and
   toolbars (2025).
4. *One language across devices.* The same material spans phone, desktop, watch, TV and headset.
   The 2025 OS releases.

**Key works.** visionOS glass windows, 2024. Liquid Glass across iOS 26 and siblings, Alan Dye and
Apple Human Interface Design, 2025. "Liquid Glass Is Cracked, and Usability Suffers in iOS 26",
Raluca Budiu, NN/g, 2025. The Liquid Glass revision with a transparency control for iOS 27, 2026.

**Visual vocabulary.** Translucent capsule and pill controls with lensing edges, specular rims,
colour picked up from the content behind, motion-reactive highlights, layered and "clear" app
icons, concentric rounded corners, and San Francisco type over moving backgrounds.

**Lineage.** From skeuomorphism (simulated material), flat design's blur layers, Material's
"invented material" idea, Y2K and Aqua gloss, and the glassmorphism trend. What it will feed is
not yet clear. The fast WWDC 2026 correction suggests the platforms will now ship looks and then
tune them in public.

**Quotes.** Alan Dye, at the announcement: "This is our broadest software design update ever."
(Apple Newsroom, 9 June 2025.) Raluca Budiu's summary: "iOS 26's visual language obscures content
instead of letting it take the spotlight." (NN/g, 10 October 2025.)

**Remix today.** Liquid Glass returns to an idea Material had in 2014, that a designer can invent
a material, and then asks the material to be beautiful rather than to explain. The remix is to
invent a material and give it *semantic* physics: let translucency, refraction or thickness mean
something (confidence, recency, ownership) instead of being decoration over content.

### Alan Dye {#alan-dye}

**Context.** An American designer, a Syracuse University graduate (1997), who came from Ogilvy &
Mather's Brand Integration Group and Kate Spade. He joined Apple in 2006 to work on packaging,
contributed to iOS 7, and from 2015 led Apple's Human Interface design team: Apple Watch, the
iPhone X interface, the Dynamic Island (2022), visionOS and Liquid Glass. He resigned in December
2025 to become chief design officer at Meta, and Stephen Lemay succeeded him at Apple. (His birth
year is not reliably documented in public sources.)

**Principles.** *Interface as material*: UI as a substance with optics (Liquid Glass, 2025).
*Hardware and software as one shape*: the interface adopts and disguises the hardware (the Dynamic
Island, iPhone 14 Pro, 2022).

**Key works.** Apple Watch interface, 2015. iPhone X gesture interface, 2017. Dynamic Island, 2022.
Liquid Glass, 2025.

**Remix today.** The Dynamic Island, a hardware cutout turned into an expressive status surface,
may outlast Liquid Glass as proof that constraint-driven invention still happens inside platforms.

---

## Generative AI design {#generative-ai-design}

**Context.** OpenAI announced DALL·E in January 2021 and DALL·E 2 in April 2022. Midjourney opened its
beta through Discord on 12 July 2022, and Stable Diffusion was released in August 2022. In 2022
a Midjourney image, Jason Allen's *Théâtre D'opéra Spatial*, won the digital art category at the
Colorado State Fair, and the authorship debate went mainstream. ChatGPT (30
November 2022) made conversation a mass interface. By 2025 models generated working interfaces and
code from descriptions: Andrej Karpathy coined "vibe coding" in February 2025 (Collins named it Word
of the Year), and Figma launched Figma Make at Config in May 2025. The movement reacts against
nothing so much as the cost of making. Its enabling technology is large diffusion and language
models trained on the visual and textual record, including the whole history in this wiki.

**Principles.**

1. *Describe, then select.* The designer writes intent and curates among many outputs. Midjourney
   (2022).
2. *Conversation as interface.* A text box and a thread replace menus; the command line returns in
   natural language. ChatGPT (2022).
3. *Latent style.* Every historical style can be called up by name, so originality has to come
   from the brief and the edit. *Théâtre D'opéra Spatial* (2022).
4. *Prompt to product.* Interfaces and code are generated and refined by feedback, which collapses
   design and build. Karpathy's "vibe coding" (2025).
5. *The system constrains the model.* Design systems become the guardrails that keep generated UI
   coherent. Figma Make (2025).

**Key works.** DALL·E 2, OpenAI, 2022. Midjourney, David Holz and team, 2022. Stable Diffusion,
Stability AI and collaborators, 2022. ChatGPT, OpenAI, 2022. Figma Make, Figma, 2025.

**Visual vocabulary.** Still forming. The recognisable defaults are hyper-smooth rendered imagery
with cinematic lighting, centred subjects and painterly pastiche; in UI, the chat column, the
streaming text cursor, suggestion chips, sparkle icons as the sign for "AI", and gradient "glow"
borders on AI features. Generated product UI tends to converge on the design-system median
(rounded cards, neutral sans, purple gradients).

**Lineage.** From computational design (rules generating form), design systems (components and
tokens as the vocabulary models assemble) and, as an interaction model, the command line that the
GUI replaced. It draws on every movement in every slice, because its training data is the archive.

**Quotes.** Andrej Karpathy described vibe coding as a mode in which you "fully give in to the
vibes, embrace exponentials, and forget that the code even exists" (post on X, February 2025).

**Remix today.** This is the thesis's opportunity. A model reproduces styles easily, but it
can't tell which *principles* produced them or which to combine. A designer who knows that
Metro's flatness came from transit signage, that Material's shadows came from an invented
physics, and that Kare's icons came from needlepoint can direct a model toward new combinations
(Swiss grid with Flash-era physics, or Isotype reduction with Material's semantic depth) and away
from the average.

### Bret Victor {#bret-victor}

**Context.** An American interface designer and researcher. He worked as a human interface
inventor at Apple from 2007 to 2011, including on early iPad concepts. He wrote influential essays
and gave the talks "Inventing on Principle" (2012) and "The Future of Programming" (2013). He then
founded Dynamicland in Oakland, a lab for computing embodied in physical space. (His birth year is
not reliably documented in public sources.)

**Principles.** *Immediate connection*: creators need to see the effect of every change at once
("Inventing on Principle", 2012). *Information software is graphic design*: most software is for
learning, so its core problem is showing, not interacting ("Magic Ink", 2006). *Beyond pictures
under glass*: hands and bodies can do far more than tap glass ("A Brief Rant on the Future of
Interaction Design", 2011). He describes today's computers as "really fast paper emulators."

**Key works.** "Magic Ink", 2006. "A Brief Rant on the Future of Interaction Design", 2011.
"Inventing on Principle", 2012. Dynamicland, from 2017.

**Remix today.** Victor is the counterweight to prompt-and-wait design. His immediate-connection
principle asks AI tools to show live, manipulable results while you think, not finished artefacts
after you ask.

---

## Reading the arc

Laid end to end, the screen era swings between two poles roughly once a decade: *rendered* (the
GUI's desktop, Aqua, iOS 6, Material's shadows, Liquid Glass) and *reduced* (Metro, iOS 7, flat,
neubrutalism). Each swing is justified by the failure of the last: rendering grows ornamental,
reduction loses its signifiers. That pattern supports the thesis that visual innovation has
stalled. Liquid Glass is in large part Aqua plus visionOS, rendered with 2025 GPUs, and Apple
named those sources itself.

The same record complicates the thesis in three ways. First, the large companies did not only
absorb modernism; at times they extended it. Material's invented material, Material You's colour
engine and the webOS card are new ideas that no print-era modernist could have had. Second, the
most important innovations of the period were in behaviour, not style: direct manipulation,
multi-touch, motion as explanation, pull-to-refresh, responsive layout. A history told only through
looks will undercount them. Third, the platforms now research expressiveness openly (Material 3
Expressive) and fix public missteps fast (Liquid Glass at WWDC 2026). That reads less like a stall
than like a shift from authorship to iteration.

What the history gives a designer in the AI era is not a style to copy but a set of separable
principles, each with a known source and a known cost. The movements that lasted, such as the GUI,
Material and responsive design, invented a *rule* (a metaphor, a material, a fluid grid). The
movements that passed mostly invented a *surface*. A designer remixing the past with a generative
model should aim to invent rules.

---

## Sources

- Wikipedia articles consulted (October 2026): The Mother of All Demos; Xerox Alto; Xerox Star;
  Apple Lisa; Macintosh 128K; Dynabook; Sketchpad; NeXTSTEP; NCSA Mosaic; CSS; Adobe Flash;
  Net.art; GeoCities; Y2K aesthetic; Frutiger Aero; Aqua (user interface); Skeuomorph; Windows
  Aero; Flat design; Metro (design language); iOS 7; Holo (design language); Material Design;
  Responsive web design; Bootstrap (front-end framework); Carbon Design System; Design system;
  Sketch (software); Figma; Fluent Design System; Glassmorphism; Neumorphism; Corporate Memphis;
  Liquid Glass; iOS 26; visionOS; Apple Vision Pro; Midjourney; DALL-E; Stable Diffusion; ChatGPT;
  Vibe coding; Processing; HyperCard; MacPaint; Chicago (typeface). https://en.wikipedia.org/
- Wikipedia biographies: Douglas Engelbart, Alan Kay, Larry Tesler, Jef Raskin, Bill Atkinson,
  Andy Hertzfeld, Susan Kare, Bruce Tognazzini, Steve Jobs, Muriel Cooper, John Maeda, Joshua Davis
  (designer), Yugo Nakamura, Jony Ive, Scott Forstall, Matías Duarte, Loren Brichter,
  Jen Simmons, Alan Dye, Bret Victor, Ivan Sutherland.
- Japanese Wikipedia, 中村勇吾 (Yugo Nakamura), https://ja.wikipedia.org/wiki/中村勇吾
- Andy Hertzfeld, "Round Rects Are Everywhere!", folklore.org,
  https://www.folklore.org/Round_Rects_Are_Everywhere.html
- Andy Hertzfeld, *Revolution in the Valley: The Insanely Great Story of How the Mac Was Made*,
  O'Reilly, 2004.
- Douglas Engelbart, *Augmenting Human Intellect: A Conceptual Framework*, SRI, 1962.
- Alan Kay, "A Personal Computer for Children of All Ages", 1972; Alan Kay and Adele Goldberg,
  "Personal Dynamic Media", 1977.
- Apple Computer, *Human Interface Guidelines: The Apple Desktop Interface*, Addison-Wesley, 1987.
- Bruce Tognazzini, *Tog on Interface*, Addison-Wesley, 1992.
- Jef Raskin, *The Humane Interface*, Addison-Wesley, 2000.
- John Maeda, *Design By Numbers*, MIT Press, 1999; *The Laws of Simplicity*, MIT Press, 2006.
- Ethan Marcotte, "Responsive Web Design", *A List Apart* no. 306, 25 May 2010,
  https://alistapart.com/article/responsive-web-design/
- Luke Wroblewski, *Mobile First*, A Book Apart, 2011.
- Brad Frost, "Atomic Design", 10 June 2013, https://bradfrost.com/blog/post/atomic-web-design/ ;
  *Atomic Design*, 2016, https://atomicdesign.bradfrost.com/chapter-2/
- Apple Newsroom, "Apple introduces a delightful and elegant new software design", 9 June 2025,
  https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/
- Raluca Budiu, "Liquid Glass Is Cracked, and Usability Suffers in iOS 26", Nielsen Norman Group,
  10 October 2025, https://www.nngroup.com/articles/liquid-glass/
- Hayat Sheikh, "Neobrutalism: Definition and Best Practices", Nielsen Norman Group, 11 April
  2025, https://www.nngroup.com/articles/neobrutalism/
- Megan Brown, "Glassmorphism: Definition and Best Practices", Nielsen Norman Group, 7 June 2024,
  https://www.nngroup.com/articles/glassmorphism/
- Kate Moran, "Flat Design: Its Origins, Its Problems, and Why Flat 2.0 Is Better for Users",
  Nielsen Norman Group, 27 September 2015, https://www.nngroup.com/articles/flat-design/
- Google Design, "Expressive Design: Google's UX Research", 2025,
  https://design.google/library/expressive-material-design-google-research
- Brutalist Websites, https://brutalistwebsites.com/ (earliest Internet Archive capture
  13 August 2015).
- GitHub repository metadata for twbs/bootstrap, salesforce-ux/design-system, Shopify/polaris and
  carbon-design-system/carbon (creation dates).
- Bret Victor, "Magic Ink", 2006, https://worrydream.com/MagicInk/ ; "A Brief Rant on the Future
  of Interaction Design", 2011,
  https://worrydream.com/ABriefRantOnTheFutureOfInteractionDesign/
