# Dev Log — December 3, 2025

## Current State

Rebuilt personal website using the `internet-home` Flask app's design as a static GitHub Pages site:
- Migrated neon green terminal aesthetic
- Added profile.jpg as main image
- Created comprehensive timeline from CV data (Jun 2018 – Dec 2025)
- Implemented 5-column grid layout with column-packing algorithm to avoid overlaps

## Timeline Implementation

Manually extracted all experiences and projects from CV LaTeX and placed them on a month-by-month grid using CSS grid positioning. Each box uses `grid-row` spans to match duration and `grid-column` assignments (1–5) to avoid overlaps.

Current approach:
- Hand-coded grid positions in CSS
- Manual tracking of start/end dates
- Static HTML structure

## Plan: Automatic JSON-based Timeline

### Goal
Replace manual timeline placement with data-driven approach using structured JSON.

### Proposed Structure

```json
{
  "experiences": [
    {
      "id": "mako-dev",
      "category": "work",
      "title": "Research Engineer Intern",
      "organization": "Mako Dev",
      "start": "2025-09",
      "end": null,
      "description": "Accelerating GPU inference with AI-written kernels."
    },
    ...
  ],
  "projects": [
    {
      "id": "papertrail",
      "category": "project",
      "title": "PaperTrail",
      "start": "2025-10",
      "end": null,
      "url": "https://papertrail-main.vercel.app/",
      "description": "making you feel good about papers you read this week"
    },
    ...
  ]
}
```

### Categories
- `work`: Full-time/internship positions
- `research`: Academic research roles
- `project`: Side projects and hackathons
- `volunteer`: Mentorship and community work
- `education`: Courses and certifications (future)

### Auto-generation Steps

1. **Data source**: Single `timeline.json` file with all entries
2. **Column packing**: JavaScript function implements greedy algorithm:
   - Sort entries chronologically
   - For each entry, find rightmost available column without overlap
   - Generate inline styles or CSS classes dynamically
3. **Rendering**: Static site generator (11ty, Hugo) or build-time JS script generates HTML
4. **Summary view**: Group by category, show counts, highlight current activities

### Benefits
- Single source of truth for all timeline data
- Easy to add/update/remove entries
- Automatic overlap detection and resolution
- Can generate multiple views (by category, by year, etc.)
- Export to other formats (resume PDF, JSON resume standard)

### Next Steps
1. Extract current timeline data to `timeline.json`
2. Write column-packing algorithm in JS
3. Create build script to generate static HTML
4. Add category filtering/highlighting
5. Consider migrating to static site generator for better templating

### Temporarily Disabled
Life updates section commented out while implementing the automatic system.

