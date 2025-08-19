/* script.js
   Works with index.html above:
   - realistic card images from deckofcardsapi
   - Free vs Practice mode
   - hide dealer hole until reveal
   - disable/enable controls correctly
*/

// ----- config -----
const RANKS = ['2','3','4','5','6','7','8','9','0','J','Q','K','A']; // '0' == 10 in deckofcardsapi filenames
const SUITS = ['H','D','C','S'];
const CARD_BASE = "https://deckofcardsapi.com/static/img/"; // card images: e.g. "AH.png" or "0H.png" (10 uses '0')
let deck = [];
let player = [];
let dealer = [];
let dealerHoleHidden = true;
let banker = {
  bankroll: 1000
};

// ----- DOM -----
const el = id => document.getElementById(id);
const dealBtn = el('dealBtn'), hitBtn = el('hitBtn'), standBtn = el('standBtn'),
      doubleBtn = el('doubleBtn'), splitBtn = el('splitBtn'), coach = el('coach'),
      coachText = el('coachText'), resultEl = el('result'), bankrollEl = el('bankroll'),
      betEl = el('bet');

// ----- helpers -----
function buildDeck(numDecks=1){
  deck = [];
  for (let d=0; d<numDecks; d++){
    for (let s of SUITS){
      for (let r of RANKS) deck.push(r + s);
    }
  }
  shuffle(deck);
}
function shuffle(a){
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function draw(){
  if (deck.length === 0) buildDeck(1);
  return deck.pop();
}
function cardImageUrl(code){
  // code example: 'AH','0S' -> url: CARD_BASE + code + '.png'
  return CARD_BASE + code + ".png";
}
function handValue(hand){
  let total=0, aces=0;
  for (const c of hand){
    const r = c[0]; // '0' is 10
    if (r === 'A') { total += 11; aces++; }
    else if (['J','Q','K'].includes(r)) total += 10;
    else if (r === '0') total += 10;
    else total += parseInt(r,10);
  }
  while (total>21 && aces){ total -= 10; aces--; }
  return total;
}
function isBlackjack(hand){ return hand.length===2 && handValue(hand)===21; }

// ----- UI -----
function render(){
  // dealer cards
  const dwrap = el('dealer-cards'); dwrap.innerHTML = '';
  dealer.forEach((c,i)=>{
    if (i===1 && dealerHoleHidden){
      // show back card
      const back = document.createElement('div');
      back.className = 'card-back';
      dwrap.appendChild(back);
    } else {
      const img = document.createElement('img');
      img.className = 'card-img';
      img.src = cardImageUrl(c);
      img.alt = c;
      dwrap.appendChild(img);
    }
  });
  el('dealer-value').innerText = dealerHoleHidden ? `Total: ${handValue([dealer[0]])} + ?` : `Total: ${handValue(dealer)}`;

  // player cards
  const pwrap = el('player-cards'); pwrap.innerHTML = '';
  player.forEach(c=>{
    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = cardImageUrl(c);
    img.alt = c;
    pwrap.appendChild(img);
  });
  el('player-value').innerText = `Total: ${handValue(player)}`;

  // buttons logic
  const inRound = player.length>0 && !allDone();
  hitBtn.disabled = !inRound;
  standBtn.disabled = !inRound;
  doubleBtn.disabled = !(inRound && player.length===2);
  splitBtn.disabled = !(inRound && player.length===2 && player[0][0]===player[1][0]);

  // coach visibility & bankroll
  bankrollEl.innerText = banker.bankroll;
  const mode = document.querySelector('input[name="mode"]:checked').value;
  coach.style.display = mode === 'practice' && inRound ? 'block' : 'none';
  if (mode === 'practice' && inRound) {
    coachText.innerText = getCoachText();
  } else {
    coachText.innerText = '—';
  }
}

function allDone(){
  // round is done when dealerHoleHidden == false and actions finished (we'll control)
  // we'll consider done when hit/stand disabled
  return false; // keep simple; actions managed by enable/disable
}

// ----- game flow -----
function startDeal(){
  // new round
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const bet = Math.max(1, parseInt(betEl.value||'10',10));
  // Prepare deck if small
  if (deck.length < 15) buildDeck(6); // use 6 decks for more realistic shoe
  player = [];
  dealer = [];
  dealerHoleHidden = true;
  resultEl.innerText = '';

  // initial deal: P, D up, P, D hole(hidden)
  player.push(draw()); player.push(draw());
  dealer.push(draw()); dealer.push(draw());

  render();
  // enable actions
  hitBtn.disabled = false; standBtn.disabled = false;
  doubleBtn.disabled = (player.length!==2);
  splitBtn.disabled = !(player.length===2 && player[0][0]===player[1][0]);
}

function doHit(){
  player.push(draw());
  render();
  if (handValue(player) > 21){
    // player busts: reveal dealer hole and settle
    revealDealerAndSettle();
  }
}

function doDouble(){
  // draw one more for player then stand
  player.push(draw());
  render();
  revealDealerAndSettle();
}

function doSplit(){
  // simple implementation: not full splitting support; give alert for now
  alert("Split is not fully implemented in this demo.");
}

function doStand(){
  revealDealerAndSettle();
}

// reveal hole and let dealer play, then settle
function revealDealerAndSettle(){
  dealerHoleHidden = false;
  // reveal hole card count doesn't need to update since images are always available
  // Dealer hits to 17 (stand on soft 17)
  while (handValue(dealer) < 17){
    dealer.push(draw());
  }
  // settle
  const pval = handValue(player), dval = handValue(dealer);
  let res = '';
  if (isBlackjack(player) && !isBlackjack(dealer)) {
    res = 'Blackjack! You win 3:2';
    banker.bankroll += Math.floor(parseInt(betEl.value||10,10) * 1.5);
  } else if (isBlackjack(dealer) && !isBlackjack(player)) {
    res = 'Dealer has Blackjack — you lose';
    banker.bankroll -= parseInt(betEl.value||10,10);
  } else if (pval > 21) {
    res = 'Bust — you lose';
    banker.bankroll -= parseInt(betEl.value||10,10);
  } else if (dval > 21) {
    res = 'Dealer busts — you win';
    banker.bankroll += parseInt(betEl.value||10,10);
  } else if (pval > dval) {
    res = 'You win';
    banker.bankroll += parseInt(betEl.value||10,10);
  } else if (pval < dval) {
    res = 'You lose';
    banker.bankroll -= parseInt(betEl.value||10,10);
  } else {
    res = 'Push';
  }

  resultEl.innerText = res;
  render();
  // disable action buttons (round over)
  hitBtn.disabled = true; standBtn.disabled = true; doubleBtn.disabled = true; splitBtn.disabled = true;
}

// ----- Basic strategy helper (simple) -----
function getCoachText(){
  // simplified basic strategy for single-hand coaching
  const dealerUp = dealer[0];
  const dealerNum = valueOfUpcard(dealerUp);
  const pTotal = handValue(player);
  // very simple rules:
  if (pTotal >= 17) return 'Stand';
  if (pTotal <= 11) return 'Hit';
  if (pTotal >= 12 && pTotal <= 16){
    if (dealerNum >= 7) return 'Hit';
    return 'Stand';
  }
  return 'Stand';
}
function valueOfUpcard(card){
  const r = card[0];
  if (r === 'A') return 11;
  if (r === '0') return 10;
  if (['J','Q','K'].includes(r)) return 10;
  return parseInt(r,10);
}

// ----- wire events -----
dealBtn.addEventListener('click', startDeal);
hitBtn.addEventListener('click', doHit);
standBtn.addEventListener('click', doStand);
doubleBtn.addEventListener('click', doDouble);
splitBtn.addEventListener('click', doSplit);

// initial render & build shoe
buildDeck(6);
render();
