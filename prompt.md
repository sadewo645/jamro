# Prompt: Dynamic Web Platform for Palm Oil Plantation & Mill Operations

You are a senior full-stack developer tasked with creating a dynamic web application for a palm oil plantation and processing mill. The platform must unify plantation field data, factory performance monitoring, and operational guidance for leadership. The system receives real-world measurements from a companion data collection app used by field supervisors (mandors). Treat all incoming data as live and continuously updating: values recorded daily should appear in the UI within 30 seconds (simulate by allowing the data producer to compress 1 day into 30 seconds). All data lives in a central database that the web app reads.

## Core Modules & Requirements

### 1. Harvest & Plantation Monitoring
- **Hierarchy Management**: Support creation and display of Afdeling (estate divisions) and their Blocks. Each Afdeling and Block has a unique code. Users can add new Afdeling/Block nodes, which triggers automatic data pipelines and UI cards.
- **Dashboard Layout**: Display Afdeling summaries in individual container cards. Each card includes KPIs such as harvest tonnage, CPO yield, PKO/kernel output, and aggregated statistics. Provide drill-down views for individual Blocks with detailed metrics.
- **Environmental Indicators**: Visualize real-time averages for rainfall, soil condition, temperature, humidity, and other agronomic indicators per Afdeling/Block. Include line and bar charts to show trends across day, month, and year timeframes.
- **Logistics Tracking**: Integrate transportation tracking for harvested bunches—vehicle routes, delivery timestamps, and throughput indicators.
- **Data Freshness**: Ensure UI clearly communicates that data is sourced from real-time measurements sent by mandors. Build API endpoints or data polling to refresh metrics without page reloads.

### 2. Mill & Station Monitoring
- **Station KPIs**: Present real-time indicators for each mill station (sterilization, threshing, pressing, clarification, kernel recovery, etc.). Each station card shows status lights, throughput, downtime, and efficiency metrics.
- **Dynamic Updates**: Reflect the same compressed time simulation (1 day = 30 seconds) for testing. Display historical charts for hour/day/month/year ranges.

### 3. Cultivation Guidance & Knowledge Base
- **Guidance Library**: Reserve a structured content area for plantation cultivation guides (content provided separately). Allow categorization and markdown-friendly formatting.
- **Norma HK (Labor Norms)**:
  - Maintain editable labor norm values for every job in plantation and mill.
  - Restrict editing to users logged in as Directors (use role-based access control).
  - Provide secure login options: “Worker” vs. “Developer/Director.” For now, accept the developer access code `123456` to unlock full admin controls.
- **Cost of Production (Cost Production / “Chost Produksi”)**:
  - Track operational expenses derived from data producer app: labor wages tied to HK norms, fertilizer applications, maintenance, new Afdeling setup, etc.
  - Automatically generate default cost categories whenever a new Afdeling is created.

## Technical Expectations
- Build a responsive, modern UI with clear visual hierarchy.
- Implement modular components for Afdeling cards, block details, charts, station indicators, and admin forms.
- Provide API contracts or mock data models representing the real-time data feed (fields, update frequency, endpoints).
- Use robust state management to handle streaming updates (web sockets, polling, or event-driven architecture).
- Ensure secure authentication and role-based authorization for sensitive panels (Norma HK editor, cost controls).
- Document assumptions for data schema, update cadence, and integration with the data producer app.

## Deliverables
1. High-fidelity UI/UX mockups or component library preview.
2. Database schema design and API specification for all dynamic data (Afdeling, Blocks, harvest metrics, station readings, HK norms, costs).
3. Implementation plan covering frontend stack, backend services, real-time update mechanism, and deployment considerations.
4. Demo script or automated seed data flow that simulates the accelerated data timeline (1 day condensed into 30 seconds).

Use this prompt to guide the full development lifecycle, from design to implementation. The resulting web platform should empower plantation leadership with holistic oversight of field operations, mill performance, and strategic decision-making.
