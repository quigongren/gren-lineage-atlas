// Robust base URL for GitHub Pages (handles local preview too)
const BASE = document.querySelector('base')?.href || (location.pathname.replace(/[^/]+$/, ''));

// For the smoke test we use a local JSON file in /data/
// Later, swap DATA_URL to your published Google Sheet CSV (see snippet below)
const DATA_URL = `${BASE}data/people_public.json`;

function drawTree(data) {
  // Convert flat people -> a tiny demo hierarchy; adjust to your data structure later
  const root = d3.hierarchy(data);

  const width = document.getElementById('tree').clientWidth;
  const height = document.getElementById('tree').clientHeight;

  const svg = d3.select('#tree').append('svg')
    .attr('width', width)
    .attr('height', height);

  const layout = d3.tree().size([height - 40, width - 100]);
  const treeRoot = layout(root);

  // links
  svg.append('g')
    .selectAll('path')
    .data(treeRoot.links())
    .enter().append('path')
    .attr('class', 'link')
    .attr('d', d3.linkHorizontal()
      .x(d => d.y + 50)
      .y(d => d.x + 20));

  // nodes
  const g = svg.append('g')
    .selectAll('g')
    .data(treeRoot.descendants())
    .enter().append('g')
    .attr('transform', d => `translate(${d.y + 50}, ${d.x + 20})`);

  g.append('circle').attr('r', 6);
  g.append('text')
    .attr('dx', 10)
    .attr('dy', 4)
    .text(d => d.data.name || '(unknown)');
}

async function boot() {
  try {
    const res = await fetch(DATA_URL, { mode: 'cors' });
    if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}`);
    const data = await res.json();
    drawTree(data);
  } catch (err) {
    console.error('Boot error:', err);
    const el = document.getElementById('tree');
    el.innerHTML = `<pre style="padding:1rem;color:#b00;white-space:pre-wrap;">${String(err)}</pre>`;
  }
}

document.addEventListener('DOMContentLoaded', boot);
