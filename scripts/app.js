// Gren Lineage Atlas – live data adapter for published Google Sheets CSVs
// Uses D3 v7. Expects an element #tree with visible height (e.g., 100vh).

// ---- 1) YOUR PUBLISHED TAB URLS (from your message) ----
const PEOPLE_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRX3lbO4eCerwTUee0Z_DhiBDgNdEiOGFPRTZBm14sF_qK30oIEkziLypDTN-kADsI60YZDr6zo7v48/pub?gid=0&single=true&output=csv";
const RELS_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRX3lbO4eCerwTUee0Z_DhiBDgNdEiOGFPRTZBm14sF_qK30oIEkziLypDTN-kADsI60YZDr6zo7v48/pub?gid=1803841139&single=true&output=csv";
const EVENTS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRX3lbO4eCerwTUee0Z_DhiBDgNdEiOGFPRTZBm14sF_qK30oIEkziLypDTN-kADsI60YZDr6zo7v48/pub?gid=180128693&single=true&output=csv"; // reserved for timeline

// ---- 2) UTILITIES ----
function showError(err) {
  console.error(err);
  const el = document.getElementById('tree');
  if (el) {
    el.insertAdjacentHTML('beforeend',
      `<div style="padding:1rem;color:#b00020;background:#fff0f0;border-top:1px solid #e5c6c6;white-space:pre-wrap;">
         <strong>Error:</strong> ${String(err)}
       </div>`);
  }
}

// Fetch CSV via D3 (robust to CORS when “Publish to web” is used)
async function getCSV(url) {
  try {
    return await d3.csv(url);
  } catch (e) {
    throw new Error(`CSV fetch failed: ${url}\n${e}`);
  }
}

// Clean string (tolerate header variations/spaces)
const norm = s => (s || "").trim();

// ---- 3) BUILD HIERARCHY FROM TABLES ----
// people: [{id, name, given_name, surname, ...}]
// relationships: [{relationship_type,parent/.., person1_id, person2_id}, ...] where parent edges are PARENT -> CHILD
function buildHierarchy(peopleRows, relRows) {
  // Index people
  const peopleById = new Map();
  peopleRows.forEach(p => {
    const id = norm(p.id);
    if (!id) return;
    const name = norm(p.name) ||
                 [norm(p.given_name), norm(p.surname)].filter(Boolean).join(' ') ||
                 id;
    peopleById.set(id, { id, name, raw: p, children: [], _hasParent: false });
  });

  // Parent relationships: we accept either direction, but prefer:
  // relationship_type === "parent" with person1_id = parent, person2_id = child.
  relRows.forEach(r => {
    const type = norm(r.relationship_type).toLowerCase();
    if (type !== "parent") return;
    const p1 = norm(r.person1_id); // parent
    const p2 = norm(r.person2_id); // child

    const parent = peopleById.get(p1);
    const child  = peopleById.get(p2);
    if (parent && child) {
      parent.children.push(child);
      child._hasParent = true;
    }
  });

  // Roots = those without parent
  const roots = [...peopleById.values()].filter(p => !p._hasParent);

  // If no relationships present, make a single fake root and hang everyone off it
  if (!roots.length) {
    const fakeRoot = { id: "ROOT", name: "Family", children: [] };
    fakeRoot.children = [...peopleById.values()];
    return fakeRoot;
  }

  // If multiple roots, create a virtual root
  if (roots.length > 1) {
    return { id: "ROOT", name: "Family", children: roots };
  }

  return roots[0];
}

// ---- 4) DRAW TREE ----
function drawTree(rootData) {
  const el = document.getElementById('tree');
  if (!el) throw new Error("Missing #tree container.");

  const width  = el.clientWidth  || window.innerWidth;
  const height = el.clientHeight || Math.max(600, window.innerHeight * 0.9);

  const root = d3.hierarchy(rootData);
  const treeLayout = d3.tree().size([height - 40, width - 140]);
  const troot = treeLayout(root);

  const svg = d3.select(el).append('svg')
    .attr('width', width)
    .attr('height', height);

  // Links
  svg.append('g')
    .attr('fill', 'none')
    .attr('stroke', '#999')
    .selectAll('path')
    .data(troot.links())
    .join('path')
    .attr('d', d3.linkHorizontal()
      .x(d => d.y + 80)
      .y(d => d.x + 20)
    );

  // Nodes
  const node = svg.append('g')
    .selectAll('g')
    .data(troot.descendants())
    .join('g')
    .attr('transform', d => `translate(${d.y + 80}, ${d.x + 20})`);

  node.append('circle')
    .attr('r', 6)
    .attr('fill', '#e0e0e0')
    .attr('stroke', '#333');

  node.append('text')
    .attr('dx', 10)
    .attr('dy', 4)
    .text(d => d.data.name || '(unknown)');
}

// ---- 5) BOOT ----
async function boot() {
  try {
    // Load people + relationships; events reserved for timeline
    const [people, rels] = await Promise.all([
      getCSV(PEOPLE_CSV),
      getCSV(RELS_CSV),
      // getCSV(EVENTS_CSV) // ready when timeline hook is added
    ]);

    // Build hierarchy and render
    const rootData = buildHierarchy(people, rels);
    drawTree(rootData);
  } catch (err) {
    showError(err);
  }
}

document.addEventListener('DOMContentLoaded', boot);
