// ---- Cards de exemplo ----
const sampleCards = [
  {id:1,name:'Blue-Eyes Dummy',atk:3000,def:2500},
  {id:2,name:'Dark Magician Dummy',atk:2500,def:2100},
  {id:3,name:'Red-Eyes Dummy',atk:2400,def:2000},
  {id:4,name:'Kobold',atk:700,def:500},
  {id:5,name:'Goblin Scout',atk:1200,def:800},
  {id:6,name:'Knight',atk:1800,def:1600}
];

function createDeck(){
  const deck = [];
  for(let i=0;i<20;i++){
    const base = sampleCards[i % sampleCards.length];
    deck.push({...base, uid:`${base.id}-${i}-${Math.random().toString(36).slice(2,8)}`});
  }
  return shuffle(deck);
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

// ---- Estado do jogo ----
const state = {
  players:[createPlayer(), createPlayer()],
  turn:0 // 0 = jogador
};

function createPlayer(){
  return {lp:8000, deck:createDeck(), hand:[], field:[]};
}

// ---- Helpers DOM ----
const el = id => document.getElementById(id);
function log(s){
  const l = el('log');
  l.innerHTML += `<div>${s}</div>`;
  l.scrollTop = l.scrollHeight;
}

function render(){
  for(let p=0;p<2;p++){
    el(`lp-${p}`).textContent = state.players[p].lp;
    el(`deck-${p}`).textContent = state.players[p].deck.length;
    el(`hand-count-${p}`).textContent = state.players[p].hand.length;

    const handEl = el(`hand-${p}`);
    handEl.innerHTML = '';
    state.players[p].hand.forEach(card =>{
      const c = document.createElement('div');
      c.className='card';
      c.innerHTML = `<div style='font-size:13px'>${card.name}</div><div style='font-weight:700;text-align:center'>ATK:${card.atk}</div>`;
      if(p===0) c.onclick = ()=> playCardFromHand(0,card.uid);
      handEl.appendChild(c);
    });

    const fieldEl = el(`field-${p}`);
    fieldEl.innerHTML = '';
    state.players[p].field.forEach(card =>{
      const c = document.createElement('div');
      c.className='card';
      c.innerHTML = `<div style='font-size:13px'>${card.name}</div><div style='font-weight:700;text-align:center'>ATK:${card.atk}</div>`;
      fieldEl.appendChild(c);
    });
  }

  el('turn-player').textContent = state.turn===0 ? 'Jogador' : 'Oponente';
}

// ---- Ações ----
function draw(playerIndex){
  const p = state.players[playerIndex];
  if(p.deck.length===0){ log(`Jogador ${playerIndex} tentou comprar, mas deck vazio.`); return; }
  const card = p.deck.pop();
  p.hand.push(card);
  log(`${playerIndex===0?'Você':'Oponente'} comprou ${card.name}`);
  render();
}

function playCardFromHand(playerIndex, uid){
  const p = state.players[playerIndex];
  const idx = p.hand.findIndex(c=>c.uid===uid);
  if(idx===-1) return;
  const card = p.hand.splice(idx,1)[0];
  p.field.push(card);
  log(`${playerIndex===0?'Você':'Oponente'} invocou ${card.name} (ATK ${card.atk}).`);
  render();
}

function playRandomMonster(playerIndex){
  const p = state.players[playerIndex];
  if(p.hand.length===0){ log('Sem cartas na mão para jogar.'); return; }
  const i = Math.floor(Math.random()*p.hand.length);
  playCardFromHand(playerIndex, p.hand[i].uid);
}

function attack(attackerIndex=0, attackerSlot=0, defenderSlot=0){
  const attacker = state.players[attackerIndex];
  const defender = state.players[1-attackerIndex];
  if(attacker.field.length<=attackerSlot){ log('Ataque inválido.'); return; }
  const atkCard = attacker.field[attackerSlot];

  if(defender.field.length>0){
    const defCard = defender.field[defenderSlot];
    log(`${atkCard.name}(${atkCard.atk}) ataca ${defCard.name}(${defCard.atk})`);

    if(atkCard.atk>defCard.atk){
      const diff = atkCard.atk - defCard.atk;
      defender.field.splice(defenderSlot,1);
      defender.lp -= diff;
      log(`${defCard.name} destruído. Oponente perde ${diff} LP.`);

    } else if(atkCard.atk<defCard.atk){
      const diff = defCard.atk - atkCard.atk;
      attacker.field.splice(attackerSlot,1);
      attacker.lp -= diff;
      log(`${atkCard.name} destruído. Você perde ${diff} LP.`);

    } else {
      attacker.field.splice(attackerSlot,1);
      defender.field.splice(defenderSlot,1);
      log('Ambos destruídos (empate).');
    }

  } else {
    defender.lp -= atkCard.atk;
    log(`${atkCard.name} atacou diretamente causando ${atkCard.atk} dano!`);
  }

  checkWin();
  render();
}

function checkWin(){
  for(let p=0;p<2;p++){
    if(state.players[p].lp<=0){
      log(`${p===0?'Você perdeu!':'Oponente perdeu!'} Fim de jogo.`);
      disableButtons(true);
    }
  }
}

function disableButtons(disabled){
  ['btn-draw','btn-play-random','btn-attack','btn-endturn'].forEach(id=>{
    el(id).disabled = disabled;
  });
}

function nextTurn(){
  state.turn = 1 - state.turn;
  log(`Turno: ${state.turn===0?'Você':'Oponente'}`);
  render();
  if(state.turn===1) aiPlay();
}

function aiPlay(){
  draw(1);
  setTimeout(()=>{
    if(state.players[1].hand.length>0) playRandomMonster(1);
    setTimeout(()=>{
      if(state.players[1].field.length>0){ attack(1,0,0); }
      state.turn = 0;
      render();
      log('Seu turno.');
    },400);
  },400);
}

function newGame(){
  state.players[0] = createPlayer();
  state.players[1] = createPlayer();
  disableButtons(false);
  el('log').innerHTML='';
  for(let i=0;i<5;i++){ draw(0); draw(1); }
  render();
}

// ---- Eventos ----
el('btn-new').onclick = ()=> newGame();
el('btn-draw').onclick = ()=> draw(0);
el('btn-play-random').onclick = ()=> playRandomMonster(0);
el('btn-attack').onclick = ()=> attack(0,0,0);
el('btn-endturn').onclick = ()=> nextTurn();

// Auto iniciar
newGame();
