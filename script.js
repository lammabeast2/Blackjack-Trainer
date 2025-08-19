/* script.js - Full blackjack trainer with detailed basic-strategy chart + Hi-Lo
   Assumes your index.html contains:
   - dealer-cards, player-cards, dealer-value, player-value
   - dealBtn, hitBtn, standBtn, doubleBtn, splitBtn
   - coach (container), coachText (text inside coach)
   - result, bankroll, bet
   - rc, tc (for running & true count)
   - reference (container for strategy + counting charts)
   - input radios name="mode" to select free/practice
*/

// ------------------ CONFIG ------------------
const NUM_DECKS = 6;
const CARD_BASE = "https://deckofcardsapi.com/static/img/"; // filenames like "AH.png" or "10H.png"
const HI_LO = { '2':1,'3':1,'4':1,'5':1,'6':1,'7':0,'8':0,'9':0,'10':-1,'J':-1,'Q':-1,'K':-1,'A':-1 };

// ------------------ STATE ------------------
let shoe = [];          // card codes like "AH", "10D"
let player = [];        // player's hand (array)
let dealer = [];        // dealer's hand (array), dealer[1] is hole until reveal
let dealerHoleHidden = true;
let bankroll = 1000;
let currentBet = 10;
let runningCount = 0;
let mode = 'free';      // 'free' or 'practice'

// ------------------ UTIL ------------------
const $ = id => document.getElementById(id);
const safeText = (id, txt) => { const e = $(id); if (e) e.innerText = txt; };

function ranksSuits(){
  return { ranks: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'], suits: ['H','D','C','S'] };
}
function shuffle(a){
  for (let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function makeShoe(numDecks=NUM_DECKS){
  const {ranks,suits} = ranksSuits();
  shoe = [];
  for (let d=0; d<numDecks; d++){
    for (const r of ranks) for (const s of suits) shoe.push(r + s);
  }
  shuffle(shoe);
  runningCount = 0;
}
function draw(){
  if (!shoe || shoe.length === 0) makeShoe();
  return shoe.pop();
}
function imageFor(code){ return CARD_BASE + code + ".png"; }
function rankOf(code){ return code.length === 3 ? code.slice(0,2) : code[0]; } // '10H' -> '10'
function handValue(hand){
  let total=0, aces=0;
  for (const c of hand){
    const r = rankOf(c);
    if (r === 'A'){ total += 11; aces++; }
    else if (['J','Q','K'].includes(r)) total += 10;
    else total += parseInt(r,10);
  }
  while (total>21 && aces){ total -= 10; aces--; }
  return total;
}
function isBlackjack(hand){ return hand.length===2 && handValue(hand)===21; }

// ------------------ FULL BASIC STRATEGY TABLE (S17, DAS) ------------------
// We'll use explicit charts: PAIRS, SOFT, HARD similar to pro charts.
// Actions: 'H' Hit, 'S' Stand, 'D' Double (if allowed), 'P' Split
const PAIRS = {
  'A': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'P',9:'P',10:'P','A':'P'},
  '10':{2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S','A':'S'},
  '9': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'S',8:'P',9:'P',10:'S','A':'S'},
  '8': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'P',9:'P',10:'P','A':'P'},
  '7': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H','A':'H'},
  '6': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'H',8:'H',9:'H',10:'H','A':'H'},
  '5': {2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H','A':'H'},
  '4': {2:'H',3:'H',4:'H',5:'P',6:'P',7:'H',8:'H',9:'H',10:'H','A':'H'},
  '3': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H','A':'H'},
  '2': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H','A':'H'},
};

const SOFT = {
  13:{2:'H',3:'H',4:'H',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H','A':'H'}, // A2 => soft13
  14:{2:'H',3:'H',4:'H',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H','A':'H'},
  15:{2:'H',3:'H',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H','A':'H'},
  16:{2:'H',3:'H',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H','A':'H'},
  17:{2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H','A':'H'},
  18:{2:'S',3:'D',4:'D',5:'D',6:'D',7:'S',8:'S',9:'H',10:'H','A':'H'},
  19:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S','A':'S'},
  20:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S','A':'S'},
};

const HARD = {
  5:{2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H','A':'H'},
  6:{2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H','A':'H'},
  7:{2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H','A':'H'},
  8:{2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H','A':'H'},
  9:{2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H','A':'H'},
  10:{2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H','A':'H'},
  11:{2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'D','A':'H'},
  12:{2:'H',3:'H',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H','A':'H'},
  13:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H','A':'H'},
  14:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H','A':'H'},
  15:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H','A':'H'},
  16:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H','A':'H'},
  17:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S','A':'S'},
};

// ------------------ RENDERING THE FULL CHART ------------------
function renderStrategyChart(){
  const ref = $('reference');
  if (!ref) return;

  // Build three sections: Pairs, Soft, Hard
  const container = document.createElement('div');
  container.style.color = 'white';

  // Dealer headers 2..10,A
  const dealerCols = ['2','3','4','5','6','7','8','9','10','A'];

  // Helper to create table from a matrix object
  function makeTable(title, rowsMap, rowKeys, showRowLabelAs){
    const sect = document.createElement('div');
    sect.style.margin = '10px 0';
    const h = document.createElement('h3'); h.innerText = title; h.style.color = '#ffd166';
    sect.appendChild(h);

    const table = document.createElement('table');
    table.style.margin = '6px auto';
    table.style.borderCollapse = 'collapse';
    table.style.background = 'white';
    table.style.color = 'black';
    table.style.minWidth = '90%';
    // header
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    ['Player'].concat(dealerCols).forEach(txt=>{
      const th = document.createElement('th');
      th.innerText = txt;
      th.style.padding = '6px';
      th.style.border = '1px solid #ccc';
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const rk of rowKeys){
      const tr = document.createElement('tr');
      const td0 = document.createElement('td');
      td0.innerText = showRowLabelAs ? showRowLabelAs(rk) : rk;
      td0.style.padding = '6px';
      td0.style.border = '1px solid #ccc';
      tr.appendChild(td0);

      for (const dc of dealerCols){
        const td = document.createElement('td');
        td.style.padding = '6px';
        td.style.border = '1px solid #ccc';
        // lookup
        const chartRow = rowsMap[rk];
        const action = chartRow ? (chartRow[dc] || chartRow['10'] || 'H') : 'H';
        td.innerText = action;
        // color-code
        if (action === 'H') td.style.background = '#ffdddd';
        else if (action === 'S') td.style.background = '#ddffdd';
        else if (action === 'D') td.style.background = '#fff0b3';
        else if (action === 'P') td.style.background = '#cce5ff';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    sect.appendChild(table);
    return sect;
  }

  // Pairs: rowKeys A,10,9..2
  const pairKeys = ['A','10','9','8','7','6','5','4','3','2'];
  const pairsTable = makeTable('Pairs (split)', PAIRS, pairKeys, rk => (rk === '10' ? '10s' : rk + ',' + rk));
  container.appendChild(pairsTable);

  // Soft totals: soft13..soft20 (A2..A9 -> totals 13..20)
  const softKeys = [13,14,15,16,17,18,19,20];
  const softTable = makeTable('Soft totals (A,x)', SOFT, softKeys, rk => 'A+' + (rk - 11));
  container.appendChild(softTable);

  // Hard totals: 5..17
  const hardKeys = [5,6,7,8,9,10,11,12,13,14,15,16,17];
  const hardTable = makeTable('Hard totals', HARD, hardKeys, rk => rk.toString());
  container.appendChild(hardTable);

  // replace any existing strategy area
  // we'll clear reference and append counting later
  ref.innerHTML = '';
  ref.appendChild(container);
}

// ------------------ CARD COUNTING DISPLAY ------------------
function renderCountingPanel(){
  const ref = $('reference');
  if (!ref) return;
  // counting section appended after strategy table
  const counting = document.createElement('div');
  counting.style.margin = '12px auto';
  counting.style.color = 'white';

  const h = document.createElement('h3'); h.innerText = 'Card Counting (Hi-Lo)'; h.style.color = '#ffd166';
  counting.appendChild(h);

  const tbl = document.createElement('table');
  tbl.style.margin = '6px auto';
  tbl.style.borderCollapse = 'collapse';
  tbl.style.background = 'white';
  tbl.style.color = 'black';
  tbl.style.minWidth = '60%';

  const tbody = document.createElement('tbody');
  [['2–6', '+1'], ['7–9','0'], ['10,J,Q,K,A','-1']].forEach(row=>{
    const tr = document.createElement('tr');
    const td1 = document.createElement('td'); td1.innerText = row[0]; td1.style.padding='6px'; td1.style.border='1px solid #ccc';
    const td2 = document.createElement('td'); td2.innerText = row[1]; td2.style.padding='6px'; td2.style.border='1px solid #ccc';
    tr.appendChild(td1); tr.appendChild(td2);
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  counting.appendChild(tbl);

  // live counters (rc, tc)
  const counters = document.createElement('div');
  counters.style.marginTop = '8px';
  counters.innerHTML = `<div style="font-size:16px">Running Count: <span id="rc_display">${runningCount>=0?'+':''}${runningCount}</span> &nbsp; | &nbsp; True Count: <span id="tc_display">0.00</span></div>`;
  counting.appendChild(counters);

  // append to ref (below strategy)
  ref.appendChild(counting);

  // set initial values
  updateCountDisplays();
}

function updateCountDisplays(){
  const rcEl = $('rc') || $('rc_display');
  if (rcEl) rcEl.innerText = (runningCount>=0?'+':'') + runningCount;
  const tcEl = $('tc') || $('tc_display');
  if (tcEl){
    const decksRem = Math.max(0.25, shoe.length / 52);
    const tc = runningCount / decksRem;
    tcEl.innerText = tc.toFixed(2);
  }
}

// ------------------ STRATEGY LOOKUP & EXPLANATIONS ------------------
function lookupStrategy(hand, dealerUp, canDouble=true, canSplit=true){
  // Determine if pair
  if (hand.length === 2 && rankOf(hand[0]) === rankOf(hand[1]) && canSplit){
    const pr = rankOf(hand[0]);
    const row = PAIRS[pr === '10' ? '10' : pr] || PAIRS['10'];
    const action = row[rankOf(dealerUp)] || row['10'] || 'H';
    return action;
  }
  // Soft?
  const hasA = hand.some(c => rankOf(c) === 'A');
  const total = handValue(hand);
  if (hasA && total <= 21){
    // soft totals chart expects totals 13..20
    if (SOFT[total]){
      const action = SOFT[total][rankOf(dealerUp)] || SOFT[total]['10'] || 'H';
      return action;
    }
  }
  // Hard
  const hRow = HARD[total] || HARD[17];
  const action = hRow[rankOf(dealerUp)] || hRow['10'] || 'H';
  return action;
}

function explanationFor(action, handBefore, dealerUp){
  const total = handValue(handBefore);
  const d = rankOf(dealerUp);
  if (action === 'H') return `Hit: Your ${total} vs dealer ${d} is a weaker combination; hitting increases chance to improve your hand.`;
  if (action === 'S') return `Stand: Your ${total} vs dealer ${d} is likely strong enough; standing avoids busting and lets dealer play into risk.`;
  if (action === 'D') return `Double: Your ${total} vs dealer ${d} is a high EV situation to double for one extra card.`;
  if (action === 'P') return `Split: Splitting pairs (like ${rankOf(handBefore[0])}) creates two hands and is statistically favorable against dealer ${d}.`;
  return '';
}

// ------------------ GAME FLOW & COACH ------------------
function startRound(selectedMode='free'){
  mode = selectedMode;
  currentBet = Math.max(1, parseInt(($('bet') && $('bet').value) || 10, 10));
  if (!shoe || shoe.length < 52) makeShoe();
  player = []; dealer = []; dealerHoleHidden = true;
  // deal sequence: P, D up, P, D hole (do not count hole yet)
  const p1 = draw(); player.push(p1); runningCount += HI_LO[rankOf(p1)];
  const dUp = draw(); dealer.push(dUp); runningCount += HI_LO[rankOf(dUp)];
  const p2 = draw(); player.push(p2); runningCount += HI_LO[rankOf(p2)];
  const dHole = draw(); dealer.push(dHole); // hidden card -> do not count to RC yet
  safeText('result',''); safeText('coachText','');
  render();
  enableActions(true);
  updateCountDisplays();
}

function render(){
  // dealer
  const dwrap = $('dealer-cards');
  if (dwrap){
    dwrap.innerHTML = '';
    dealer.forEach((c,i)=>{
      if (i===1 && dealerHoleHidden){
        const back = document.createElement('div'); back.className='card-back';
        dwrap.appendChild(back);
      } else {
        const img = document.createElement('img'); img.className='card-img'; img.src=imageFor(c); img.alt=c;
        dwrap.appendChild(img);
      }
    });
  }
  // show dealer total
  if ($('dealer-value')) $('dealer-value').innerText = dealerHoleHidden ? `Total: ${handValue([dealer[0]])} + ?` : `Total: ${handValue(dealer)}`;

  // player
  const pwrap = $('player-cards');
  if (pwrap){ pwrap.innerHTML = ''; player.forEach(c=>{ const img=document.createElement('img'); img.className='card-img'; img.src=imageFor(c); img.alt=c; pwrap.appendChild(img); }); }
  if ($('player-value')) $('player-value').innerText = `Total: ${handValue(player)}`;

  safeText('bankroll', bankroll);
  updateCountDisplays();
}

function enableActions(inRound){
  const hit = $('hitBtn'), stand=$('standBtn'), dbl=$('doubleBtn'), sp=$('splitBtn');
  if (!hit) return;
  hit.disabled = !inRound;
  stand.disabled = !inRound;
  dbl.disabled = !inRound || player.length !== 2;
  sp.disabled = !inRound || player.length !== 2 || rankOf(player[0]) !== rankOf(player[1]);
}

function playerHit(){
  const before = [...player];
  const action = 'H';
  const card = draw(); player.push(card); runningCount += HI_LO[rankOf(card)];
  // coach: compare recommended for BEFORE hand
  if (mode === 'practice'){
    const rec = lookupStrategy(before, dealer[0], true, true);
    const explain = rec === action ? `Good — ${actionToWord(action)} was correct. ${explanationFor(rec,before,dealer[0])}` :
                                     `Incorrect — You did ${actionToWord(action)} but recommended: ${actionToWord(rec)}.\n${explanationFor(rec,before,dealer[0])}`;
    safeText('coachText', explain);
  } else safeText('coachText','');
  render();
  if (handValue(player) > 21) revealAndSettle();
}

function playerStand(){
  const before = [...player];
  const action = 'S';
  if (mode === 'practice'){
    const rec = lookupStrategy(before, dealer[0], true, true);
    const explain = rec === action ? `Good — ${actionToWord(action)} was correct. ${explanationFor(rec,before,dealer[0])}` :
                                     `Incorrect — You did ${actionToWord(action)} but recommended: ${actionToWord(rec)}.\n${explanationFor(rec,before,dealer[0])}`;
    safeText('coachText', explain);
  } else safeText('coachText','');
  revealAndSettle();
}

function playerDouble(){
  const before = [...player];
  const action = 'D';
  // one card then stand
  const card = draw(); player.push(card); runningCount += HI_LO[rankOf(card)];
  if (mode === 'practice'){
    const rec = lookupStrategy(before, dealer[0], true, true);
    const explain = rec === action ? `Good — Double was recommended. ${explanationFor(rec,before,dealer[0])}` :
                                     `Incorrect — You doubled but recommended: ${actionToWord(rec)}.\n${explanationFor(rec,before,dealer[0])}`;
    safeText('coachText', explain);
  } else safeText('coachText','');
  revealAndSettle();
}

function playerSplit(){
  alert("Split feature coming soon. For now practice with single hands.");
}

// reveal dealer hole, then play dealer, update RC and settle result
function revealAndSettle(){
  // reveal hole card and count it
  if (dealerHoleHidden){
    runningCount += HI_LO[rankOf(dealer[1])];
    dealerHoleHidden = false;
  }
  // dealer hits to 17 (stand on soft 17)
  while (handValue(dealer) < 17) {
    const c = draw(); dealer.push(c); runningCount += HI_LO[rankOf(c)];
  }
  // settle bets (simple bankroll handling)
  const pv = handValue(player), dv = handValue(dealer);
  let text = '';
  if (isBlackjack(player) && !isBlackjack(dealer)){
    text = 'Blackjack! You win 3:2';
    bankroll += Math.floor(currentBet * 1.5);
  } else if (isBlackjack(dealer) && !isBlackjack(player)){
    text = 'Dealer Blackjack — you lose';
    bankroll -= currentBet;
  } else if (pv > 21){
    text = 'Bust — you lose';
    bankroll -= currentBet;
  } else if (dv > 21){
    text = 'Dealer busts — you win';
    bankroll += currentBet;
  } else if (pv > dv){
    text = 'You win';
    bankroll += currentBet;
  } else if (pv < dv){
    text = 'You lose';
    bankroll -= currentBet;
  } else text = 'Push';

  safeText('result', text);
  enableActions(false);
  render();
}

// ------------------ ACTION & HELPERS ------------------
function actionToWord(a){ return ({H:'Hit',S:'Stand',D:'Double',P:'Split'})[a] || a; }

// ------------------ INITIAL RENDER OF REFERENCE ------------------
function buildReference(){
  renderStrategyChart();
  renderCountingPanel();
}

// ------------------ WIRING ------------------
function wire(){
  const deal = $('dealBtn'), hit=$('hitBtn'), stand=$('standBtn'), dbl=$('doubleBtn'), sp=$('splitBtn');
  if (deal) deal.addEventListener('click', ()=> {
    const sel = document.querySelector('input[name="mode"]:checked');
    const selVal = sel ? sel.value : 'free';
    startRound(selVal);
  });
  if (hit) hit.addEventListener('click', playerHit);
  if (stand) stand.addEventListener('click', playerStand);
  if (dbl) dbl.addEventListener('click', playerDouble);
  if (sp) sp.addEventListener('click', playerSplit);

  // initial UI
  makeShoe();
  buildReference();
  render();
  enableActions(false);
}

// start on DOM ready
document.addEventListener('DOMContentLoaded', wire);
