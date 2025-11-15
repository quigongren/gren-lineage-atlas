// Gren Lineage Atlas — public viewer bootstrap
const state = { people: {}, events: [], rels: [] };

async function loadData() {
  const [people, events, rels] = await Promise.all([
    fetch('data/people.json').then(r=>r.json()),
    fetch('data/events.json').then(r=>r.json()),
    fetch('data/rels.json').then(r=>r.json()),
  ]);
  state.people = Object.fromEntries(people.map(p => [p.uid, p]));
  state.events = events;
  state.rels = rels;
  buildTree();
}

function buildTree() {
  const parentSet = new Set(), childSet = new Set();
  const rels = state.rels;
  rels.forEach(r => { childSet.add(r.child_uid); parentSet.add(r.parent_uid); });
  let roots = [...parentSet].filter(uid => !childSet.has(uid));
  if(roots.length === 0 && Object.keys(state.people).length) roots = [Object.keys(state.people)[0]];

  const toNode = (uid) => {
    const p = state.people[uid]; if(!p) return null;
    const label = p.is_living ? (p.display_name || 'Private (Living)') : (p.display_name || '—');
    return { name: label, description: p.birth_year?`b. ${p.birth_year}`:'', id: uid, children: childrenOf(uid).map(toNode) };
  };
  const childrenOf = (parentUid) => [...new Set(rels.filter(r => r.parent_uid===parentUid).map(r => r.child_uid))];

  const nodes = roots.map(toNode).filter(Boolean);
  dTree.init(nodes, {
    target: "#tree",
    height: 520, width: 900,
    callbacks: { nodeClick: (name, extra)=> openProfile(extra.id) }
  });
}

function openProfile(uid){
  const p = state.people[uid]; if(!p) return;
  document.getElementById('profile').hidden=false;
  document.querySelector('.profile-placeholder').style.display='none';
  document.getElementById('p_name').textContent = p.display_name || 'Private (Living)';
  document.getElementById('tab-summary').innerHTML = [
    p.birth_year?`<div><strong>Born:</strong> ${p.birth_year}</div>`:'',
    p.death_year?`<div><strong>Died:</strong> ${p.death_year}</div>`:'',
    p.branch?`<div><strong>Branch:</strong> ${p.branch}</div>`:'',
    (p.tags&&p.tags.length)?`<div><strong>Tags:</strong> ${p.tags.join(', ')}</div>`:''
  ].join('');
  const se = p.socio||{};
  document.getElementById('tab-socio').innerHTML = [
    se.occupation?`<div><strong>Occupation:</strong> ${se.occupation}</div>`:'',
    se.education?`<div><strong>Education:</strong> ${se.education}</div>`:'',
    se.property?`<div><strong>Property:</strong> ${se.property}</div>`:''
  ].join('') || '—';
  document.getElementById('tab-history').innerHTML = (p.history_notes||[]).map(n=>`<div>• ${n}</div>`).join('') || '—';
  const mig = p.migration||[];
  document.getElementById('tab-migration').innerHTML = mig.length? mig.map(m=>`<div>${m.when||''} — ${m.from||''} → ${m.to||''}</div>`).join('') : '—';
  const src = p.sources||[];
  document.getElementById('tab-sources').innerHTML = src.length? src.map(s=>`<div>• ${s.label||''}</div>`).join('') : '—';
  const dna = p.dna||{};
  document.getElementById('tab-dna').innerHTML = dna.evidence? `<div>${dna.evidence}</div>` : '—';
}

// tabs
document.addEventListener('click', (e)=>{
  if(e.target.classList.contains('tab')){
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tabpane').forEach(p=>p.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById(`tab-${e.target.dataset.tab}`).classList.add('active');
  }
  if(e.target.id==='closeProfile'){
    document.getElementById('profile').hidden=true;
    document.querySelector('.profile-placeholder').style.display='block';
  }
});

loadData();
