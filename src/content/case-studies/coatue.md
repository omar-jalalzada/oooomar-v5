---
title: Mosaic
summary: One platform for Coatue's investors and analysts to research ideas, manage portfolios, build dashboards and run their daily workflows, on the web, iPad and iPhone.
facts:
  - label: Role
    value: Sole Product Designer
  - label: Team
    value: 16-person product team
  - label: Platforms
    value: Web, iPad, iPhone
  - label: Outcome
    value: 4× adoption across platforms
status: draft
laneLabels:
  web: Mosaic Web
# The overlays are placed at the dashboard's own scale: each width is its pixel width over the
# dashboard's 4000px, so the dialogs sit on the screen at the size they were designed.
showcases:
  - lane: web
    device: imac
    screens:
      - label: Performance
        src: ./coatue/web-dashboard-performance.png
        alt: "The Mosaic performance dashboard: portfolio exposure, exposure history, P&L by industry, longs and shorts"
        hotspots:
          - &manage-hotspot
            label: Manage dashboards
            x: 11.65
            y: 6.67
            reveals:
              - { src: ./coatue/web-dashboard-manage.png, alt: "Managing dashboards: folders of dashboards and the widgets in each", x: 8.5, y: 10.5, w: 21.9 }
              - { src: ./coatue/web-smartlist-manage.png, alt: "Managing Smartlists: tabs, the content filed under each, and its saved views", x: 22.3, y: 21, w: 33 }
          - &add-hotspot
            label: Add a dashboard and a widget
            x: 90.58
            y: 2.22
            reveals:
              - { src: ./coatue/web-dashboard-create.png, alt: "Creating a dashboard from a layout template", x: 71.5, y: 6, w: 17.8 }
              - { src: ./coatue/web-widget-library.png, alt: "Adding a widget from the shared library", x: 26, y: 9, w: 41.2 }
          - &search-hotspot
            label: Global search
            x: 86.83
            y: 2.22
            reveals:
              - { src: ./coatue/web-search.png, alt: "Global search across stocks, Smartlists and contacts", x: 58, y: 6, w: 28 }
          - label: Open a stock
            x: 35.9
            y: 44.9
            reveals:
              - { src: ./coatue/web-stock-detail.png, alt: "Stock detail: thesis, risk, market data and positions for one company", x: 4, y: 8, w: 92 }
      - label: Analyst
        src: ./coatue/web-dashboard-analyst.png
        alt: "The Mosaic analyst dashboard: team performance, alpha versus index, agenda, tasks and research documents"
        # Same toolbar as the performance dashboard, so the same controls in the same places.
        hotspots: [*manage-hotspot, *add-hotspot, *search-hotspot]
      - label: Smartlists
        src: ./coatue/web-smartlists.png
        alt: "A Mosaic Smartlist: a portfolio's longs grouped by theme, with each team's sizing, scores and links"
        # The Smartlist toolbar is laid out differently, so its controls sit elsewhere.
        hotspots:
          - label: Manage dashboards
            x: 25.8
            y: 8
            reveals:
              - { src: ./coatue/web-dashboard-manage.png, alt: "Managing dashboards: folders of dashboards and the widgets in each", x: 22.65, y: 12, w: 21.9 }
              - { src: ./coatue/web-smartlist-manage.png, alt: "Managing Smartlists: tabs, the content filed under each, and its saved views", x: 36.45, y: 22.5, w: 33 }
          - label: Add a dashboard and a widget
            x: 88.8
            y: 2.8
            reveals:
              - { src: ./coatue/web-dashboard-create.png, alt: "Creating a dashboard from a layout template", x: 69.7, y: 6.5, w: 17.8 }
              - { src: ./coatue/web-widget-library.png, alt: "Adding a widget from the shared library", x: 26, y: 9.5, w: 41.2 }
          - label: Global search
            x: 84.2
            y: 2.8
            reveals:
              - { src: ./coatue/web-search.png, alt: "Global search across stocks, Smartlists and contacts", x: 55.4, y: 6.5, w: 28 }
          - label: Edit the Smartlist
            x: 98.2
            y: 8
            reveals:
              - { src: ./coatue/web-smartlist-details.png, alt: "Editing a Smartlist: its template, conditional filters and manually added names", x: 78.5, y: 11, w: 20, surface: true }
# The same feature on both devices, chapter by chapter. The iPad's cropped dialogs pop up over
# the screen they were taken from, so their chapter repeats that screen rather than pushing.
handhelds:
  label: Mosaic iPad and iPhone
  chapters:
    - label: Channels
      ipad: { src: ./coatue/ipad-channel-feed.png, alt: "iPad: a channel's feed of research and notes, with channels as tabs" }
      iphone: { src: ./coatue/iphone-channels.png, alt: "iPhone: a channel of research, notes and meeting files" }
    - label: Navigation
      ipad: { src: ./coatue/ipad-navigation.jpg, alt: "iPad: the menu of channels, meetings and bookmarked research" }
      iphone: { src: ./coatue/iphone-navigation.png, alt: "iPhone: the menu of channels" }
    - label: Search
      ipad: { src: ./coatue/ipad-search.png, alt: "iPad: searching research and notes by type, ticker and hashtag" }
      iphone: { src: ./coatue/iphone-search-start.jpg, alt: "iPhone: starting a search from content types and stock filters" }
    - label: Filters and suggestions
      ipad: { src: ./coatue/ipad-search-filter.png, alt: "iPad: search with a saved research filter applied" }
      iphone: { src: ./coatue/iphone-search-autocomplete.jpg, alt: "iPhone: search suggestions across research, notes, hashtags, tickers and Smartlists" }
    - label: Results
      ipad: { src: ./coatue/ipad-search-results.png, alt: "iPad: search results narrowed by a filter, a hashtag and a ticker" }
      iphone: { src: ./coatue/iphone-search-results.jpg, alt: "iPhone: search results filtered to top firms' upgrades and downgrades" }
    - label: Reading research
      ipad: { src: ./coatue/ipad-research.jpg, alt: "iPad: reading an equity research report" }
      iphone: { src: ./coatue/iphone-research.png, alt: "iPhone: reading a research report" }
    - label: Inside a document
      ipad: { src: ./coatue/ipad-note.png, alt: "iPad: reading an analyst's note with its attachments" }
      iphone: { src: ./coatue/iphone-find-in-document.jpg, alt: "iPhone: finding a keyword inside a research report" }
    - label: Sharing and alerts
      ipad:
        src: ./coatue/ipad-note.png
        alt: "iPad: an analyst's note"
        overlay: { src: ./coatue/ipad-slack.png, alt: "iPad: sharing research to a Slack channel", w: 56 }
      iphone: { src: ./coatue/iphone-alerts.png, alt: "iPhone: alerts on channels and positions" }
    - label: A stock at a glance
      iphone: { src: ./coatue/iphone-stock-detail.jpg, alt: "iPhone: stock detail with company info, chart and news" }
gallery:
  - { src: ./coatue/web-dashboard-performance.png, kind: web, alt: "Performance dashboard: exposure, exposure history, P&L by industry, longs and shorts" }
  - { src: ./coatue/web-dashboard-analyst.png, kind: web, alt: "Analyst dashboard: agenda, research, tasks and charts" }
  - { src: ./coatue/web-smartlists.png, kind: web, alt: "Smartlists: screens of stocks with each team's scores and fields" }
  - { src: ./coatue/web-stock-detail.png, kind: web, alt: "Stock detail: thesis, risk, market data and positions for one company" }
  - { src: ./coatue/web-widget-library.png, kind: web, alt: "Adding a widget from the shared library" }
  - { src: ./coatue/web-widget-research.png, kind: web, alt: "Research widget with a document preview" }
  - { src: ./coatue/web-smartlist-manage.png, kind: web, alt: "Managing Smartlists" }
  - { src: ./coatue/web-widget-performance.png, kind: web, alt: "Team performance widget" }
  - { src: ./coatue/web-widget-alpha.png, kind: web, alt: "Alpha versus index chart widget" }
  - { src: ./coatue/web-widget-agenda.png, kind: web, alt: "Agenda widget" }
  - { src: ./coatue/web-widget-short-size.png, kind: web, alt: "Short position size chart widget" }
  - { src: ./coatue/web-widget-tasks.png, kind: web, alt: "Task list widget" }
  - { src: ./coatue/web-dashboard-create.png, kind: web, alt: "Creating a dashboard" }
  - { src: ./coatue/web-dashboard-manage.png, kind: web, alt: "Managing dashboards" }
  - { src: ./coatue/web-smartlist-details.png, kind: web, alt: "Smartlist details" }
  - { src: ./coatue/web-search.png, kind: web, alt: "Global search" }
  - { src: ./coatue/ipad-search.png, kind: ipad, alt: "iPad: search across content types, tickers and hashtags" }
  - { src: ./coatue/ipad-slack.png, kind: ipad, alt: "iPad: sharing research to Slack" }
  - { src: ./coatue/ipad-offline.png, kind: ipad, alt: "iPad: downloading a channel for offline reading" }
  - { src: ./coatue/ipad-channel-properties.png, kind: ipad, alt: "iPad: channel properties and filters" }
  - { src: ./coatue/ipad-navigation.jpg, kind: ipad, alt: "iPad: the menu of channels, meetings and bookmarked research" }
  - { src: ./coatue/ipad-channel-feed.png, kind: ipad, alt: "iPad: a channel's feed of research and notes, with channels as tabs" }
  - { src: ./coatue/ipad-search-filter.png, kind: ipad, alt: "iPad: search with a saved research filter applied" }
  - { src: ./coatue/ipad-search-results.png, kind: ipad, alt: "iPad: search results narrowed by a filter, a hashtag and a ticker" }
  - { src: ./coatue/ipad-note.png, kind: ipad, alt: "iPad: reading an analyst's note with its attachments" }
  - { src: ./coatue/ipad-research.jpg, kind: ipad, alt: "iPad: reading an equity research report" }
  - { src: ./coatue/iphone-channels.png, kind: iphone, alt: "iPhone: the main channel view" }
  - { src: ./coatue/iphone-navigation.png, kind: iphone, alt: "iPhone: navigation" }
  - { src: ./coatue/iphone-alerts.png, kind: iphone, alt: "iPhone: alerts and notifications" }
  - { src: ./coatue/iphone-research.png, kind: iphone, alt: "iPhone: reading research" }
  - { src: ./coatue/iphone-search-start.jpg, kind: iphone, alt: "iPhone: starting a search from content types and stock filters" }
  - { src: ./coatue/iphone-search-autocomplete.jpg, kind: iphone, alt: "iPhone: search suggestions across research, notes, hashtags, tickers and Smartlists" }
  - { src: ./coatue/iphone-search-results.jpg, kind: iphone, alt: "iPhone: search results filtered to top firms' upgrades and downgrades" }
  - { src: ./coatue/iphone-find-in-document.jpg, kind: iphone, alt: "iPhone: finding a keyword inside a research report" }
  - { src: ./coatue/iphone-stock-detail.jpg, kind: iphone, alt: "iPhone: stock detail with company info, chart and news" }
  - { src: ./coatue/iphone-settings.jpg, kind: iphone, alt: "iPhone: settings for read items, offline documents, alerts and excluded research" }
  - { src: ./coatue/system-color.png, kind: system, alt: "Design system: primary and secondary colors" }
  - { src: ./coatue/system-forms.png, kind: system, alt: "Design system: form elements" }
  - { src: ./coatue/system-icons.png, kind: system, alt: "Design system: custom, pixel-fitted icons" }
  - { src: ./coatue/system-icons-2.png, kind: system, alt: "Design system: more icons" }
  - { src: ./coatue/system-physics.png, kind: system, alt: "Design system: application physics" }
  - { src: ./coatue/process-iterations.png, kind: process, alt: "Iterations on the iPad app, from an activity feed to channels" }
  - { src: ./coatue/process-idea-feed.png, kind: process, alt: "Early idea: an activity feed" }
  - { src: ./coatue/process-idea-meetings.png, kind: process, alt: "Early idea: research grouped by meeting" }
  - { src: ./coatue/process-idea-channels.png, kind: process, alt: "Early idea: channels" }
---

## My role

I was the lead product designer on Mosaic, a platform for investors to manage their entire
investment lifecycle and make better investment decisions. Mosaic was available on the web,
with companion apps for iPhone and iPad.

During my 2.5 years at Coatue, I worked closely with the investment team and engineers across
iOS, frontend, backend, and data science to develop Mosaic. I also collaborated with our CTO and
co-founder on quarterly product strategy and roadmaps.

I implemented a quantitative, data-driven design process to identify and validate new solutions,
alongside weekly qualitative user research with investors on both coasts.

## What is Coatue?

Coatue is a hedge fund and venture capital firm investing in the technology sector. Its notable
private investments include Lyft, Didi, Box, Reddit, HotelTonight, Lime, Jet.com, Uber, and
Snapchat.

## Learn more about Coatue

Visit [Coatue's website](https://www.coatue.com/) to learn more about the company.
