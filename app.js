const NOTES = window.SWING_NOTES;
const POSITIONS = Array.from({length:10},(_,i)=>i+1);

const state = {
  value:1,
  dataset:"drawings",
  playing:false,
  timer:null
};

const $ = id => document.getElementById(id);
const els = {
  slider:$("positionSlider"), positionReadout:$("positionReadout"),
  positionName:$("positionName"), blendReadout:$("blendReadout"),
  foBase:$("foBase"), foNext:$("foNext"), dtlBase:$("dtlBase"), dtlNext:$("dtlNext"),
  foLabel:$("foLabel"), dtlLabel:$("dtlLabel"),
  foNotes:$("foNotes"), dtlNotes:$("dtlNotes"),
  foStatus:$("foStatus"), dtlStatus:$("dtlStatus"),
  prevBtn:$("prevBtn"), nextBtn:$("nextBtn"), playBtn:$("playBtn"),
  snapBtn:$("snapBtn"), resetBtn:$("resetBtn"),
  pButtons:$("pButtons"), showLabels:$("showLabels"), showNotes:$("showNotes"),
  speedSelect:$("speedSelect"), jumpSize:$("jumpSize"),
  drawingsBtn:$("drawingsBtn"), photosBtn:$("photosBtn"),
  helpBtn:$("helpBtn"), helpDialog:$("helpDialog")
};

function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function ext(){ return state.dataset === "drawings" ? "png" : "jpg"; }
function pathFor(p,view){ return `images/${state.dataset}/p${p}-${view}.${ext()}`; }

function getPhase(value){
  const r=Math.round(value);
  if(Math.abs(value-r)<0.005) return `P${r}`;
  return `P${Math.floor(value)} → P${Math.ceil(value)}`;
}

function setPair(a,b,lower,upper,view,mix,status){
  a.src=pathFor(lower,view);
  b.src=pathFor(upper,view);
  a.style.opacity=1-mix;
  b.style.opacity=mix;
  status.textContent = state.dataset === "drawings" ? "Cropped drawing" : "Aligned photo";
}

function renderNotes(container,p,view){
  const n=NOTES[p][view];
  const viewName=view==="fo" ? "Face-On notes" : "Down-The-Line notes";
  container.innerHTML = `
    <h3>${viewName}</h3>
    <ul>${n.bullets.map(x=>`<li>${x}</li>`).join("")}</ul>
    <p class="why"><strong>Why it matters:</strong> ${n.why}</p>`;
}

function update(){
  const v=Number(state.value);
  const lower=clamp(Math.floor(v),1,10);
  const upper=clamp(Math.ceil(v),1,10);
  const mix=lower===upper ? 0 : v-lower;
  setPair(els.foBase,els.foNext,lower,upper,"fo",mix,els.foStatus);
  setPair(els.dtlBase,els.dtlNext,lower,upper,"dtl",mix,els.dtlStatus);

  const phase=getPhase(v);
  els.positionReadout.textContent=phase;
  els.blendReadout.textContent=`Position ${v.toFixed(2)}`;
  els.foLabel.textContent=phase;
  els.dtlLabel.textContent=phase;

  const nearest=clamp(Math.round(v),1,10);
  els.positionName.textContent=NOTES[nearest].name;
  renderNotes(els.foNotes,nearest,"fo");
  renderNotes(els.dtlNotes,nearest,"dtl");

  const labels=els.showLabels.checked ? "block":"none";
  els.foLabel.style.display=labels; els.dtlLabel.style.display=labels;

  const notesDisplay=els.showNotes.checked ? "block":"none";
  els.foNotes.style.display=notesDisplay; els.dtlNotes.style.display=notesDisplay;

  [...els.pButtons.querySelectorAll("button")].forEach(btn=>{
    btn.classList.toggle("active-p",Number(btn.dataset.p)===nearest);
    btn.style.outline=Number(btn.dataset.p)===nearest ? "2px solid var(--accent)" : "none";
  });
}

function setValue(v){
  state.value=clamp(Number(v),1,10);
  els.slider.value=state.value;
  update();
}

function switchDataset(name){
  state.dataset=name;
  els.drawingsBtn.classList.toggle("active",name==="drawings");
  els.photosBtn.classList.toggle("active",name==="photos");
  update();
}

function stop(){
  state.playing=false;
  els.playBtn.textContent="Play";
  if(state.timer){ clearInterval(state.timer); state.timer=null; }
}

function play(){
  if(state.playing){ stop(); return; }
  state.playing=true; els.playBtn.textContent="Pause";
  const interval=Number(els.speedSelect.value);
  state.timer=setInterval(()=>{
    let next=Number(state.value)+0.02;
    if(next>10) next=1;
    setValue(next);
  },interval);
}

POSITIONS.forEach(p=>{
  const b=document.createElement("button");
  b.textContent=`P${p}`; b.dataset.p=p;
  b.addEventListener("click",()=>setValue(p));
  els.pButtons.appendChild(b);
});

els.slider.addEventListener("input",e=>setValue(e.target.value));
els.prevBtn.addEventListener("click",()=>setValue(Number(state.value)-Number(els.jumpSize.value)));
els.nextBtn.addEventListener("click",()=>setValue(Number(state.value)+Number(els.jumpSize.value)));
els.snapBtn.addEventListener("click",()=>setValue(Math.round(state.value)));
els.resetBtn.addEventListener("click",()=>{ stop(); setValue(1); });
els.playBtn.addEventListener("click",play);
els.showLabels.addEventListener("change",update);
els.showNotes.addEventListener("change",update);
els.speedSelect.addEventListener("change",()=>{ if(state.playing){ stop(); play(); }});
els.drawingsBtn.addEventListener("click",()=>switchDataset("drawings"));
els.photosBtn.addEventListener("click",()=>switchDataset("photos"));
els.helpBtn.addEventListener("click",()=>els.helpDialog.showModal());

document.addEventListener("keydown",e=>{
  if(e.target.matches("input,select,button")) return;
  if(e.key==="ArrowLeft"){ e.preventDefault(); setValue(Number(state.value)-Number(els.jumpSize.value)); }
  if(e.key==="ArrowRight"){ e.preventDefault(); setValue(Number(state.value)+Number(els.jumpSize.value)); }
  if(e.key.toLowerCase()==="p"){ e.preventDefault(); play(); }
  if(e.key.toLowerCase()==="s"){ e.preventDefault(); setValue(Math.round(state.value)); }
  if(e.key.toLowerCase()==="r"){ e.preventDefault(); stop(); setValue(1); }
});

update();
