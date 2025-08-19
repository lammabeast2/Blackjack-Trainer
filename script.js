// =============================
// Blackjack Trainer JS
// =============================

// Card Ranks & Suits
const suits = ["H","D","C","S"];
const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
let mode = "free";

// Game State
let shoe = [];
let playerHands = []; // Array of hands for splits
let dealerHand = [];
let currentHandIndex = 0;
let runningCount = 0;

// =============================
// Build & Shuffle 6 decks
function buildShoe() {
  shoe = [];
  for (let d=0; d<6; d++) {
    for (let s of suits) {
      for (let r of ranks) {
        shoe.push(r+s);
      }
    }
  }
  shuffle(shoe);
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// =============================
// Drawing & Values
function drawCard() {
  if (shoe.length === 0) buildShoe();
  let card = shoe.pop();
  updateCount(card);
  return card;
}
function cardValue(card) {
  let rank = card.slice(0,-1);
  if (["J","Q","K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank);
}
function handValue(hand) {
  let total = 0, aces = 0;
  for (let c of hand) {
    total += cardValue(c);
    if (c.startsWith("A")) aces++;
  }
  while (total>21 && aces>0) { total -= 10; aces--; }
  return total;
}

// =============================
// New Game
function newGame(selectedMode) {
  mode = selectedMode;
  buildShoe();
  playerHands = [[drawCard(), drawCard()]];
  currentHandIndex = 0;
  dealerHand = [drawCard(), drawCard()];
  render();
  document.getElementById("result").textContent = "";
}

// =============================
// Player Actions
function hit() {
  let hand = playerHands[currentHandIndex];
  hand.push(drawCard());
  render();
  if (handValue(hand)>21) {
    nextHandOrEnd("Bust!");
  }
}
function stand() {
  nextHandOrEnd("Stand");
}
function double() {
  let hand = playerHands[currentHandIndex];
  if (hand.length ===2) {
    hand.push(drawCard());
    nextHandOrEnd("Double");
  } else {
    alert("Double only allowed on first 2 cards!");
  }
}
function split() {
  let hand = playerHands[currentHandIndex];
  if (hand.length===2 && hand[0].slice(0,-1)===hand[1].slice(0,-1)) {
    let newHand = [hand.pop(), drawCard()];
    hand.push(drawCard());
    playerHands.splice(currentHandIndex+1,0,newHand);
    render();
  } else {
    alert("Cannot split!");
  }
}

// =============================
// Handle Hands & Dealer
function nextHandOrEnd(action) {
  if (mode==="practice") {
    document.getElementById("result").textContent = `${action} | ${strategyAdvice(playerHands[currentHandIndex], dealerHand[0])}`;
  }
  if (currentHandIndex<playerHands.length-1) {
    currentHandIndex++;
    render();
  } else {
    dealerPlay();
  }
}

// Dealer plays
function dealerPlay() {
  while (handValue(dealerHand)<17 || (handValue(dealerHand)===17 && dealerHasSoft17(dealerHand))) {
    dealerHand.push(drawCard());
  }
  let results="";
  playerHands.forEach((hand,i)=>{
    let pv = handValue(hand);
    let dv = handValue(dealerHand);
    if (pv>21) results+=`Hand ${i+1}: Bust! `;
    else if (dv>21 || pv>dv) results+=`Hand ${i+1}: Win! `;
    else if (pv===dv) results+=`Hand ${i+1}: Push. `;
    else results+=`Hand ${i+1}: Lose. `;
  });
  document.getElementById("result").textContent = results;
  render();
}

function dealerHasSoft17(hand){
  let total=0, aces=0;
  for(let c of hand){
    total+=cardValue(c);
    if(c.startsWith("A")) aces++;
  }
  return total===17 && aces>0;
}

// =============================
// Rendering
function render() {
  renderCardImages(playerHands[currentHandIndex], "player-cards");
  renderCardImages(dealerHand, "dealer-cards");
  document.getElementById("player-value").textContent = "Total: "+handValue(playerHands[currentHandIndex]);
  document.getElementById("dealer-value").textContent = "Total: "+handValue(dealerHand);
  document.getElementById("running-count").textContent = runningCount;
  document.getElementById("true-count").textContent = (runningCount/(shoe.length/52)).toFixed(2);
}

function renderHand(divId, hand){
  const div=document.getElementById(divId);
  div.innerHTML="";
  for(let c of hand){
    const img=document.createElement("img");
    img.src=`cards/${c}.png`;
    img.width=60;
    div.appendChild(img);
  }
}

// =============================
// Basic Strategy Advice (simplified)
function strategyAdvice(hand,dealerCard){
  let pv = handValue(hand);
  let dr = dealerCard.slice(0,-1);
  if(pv>=17) return "Stand.";
  if(pv<=11) return "Hit.";
  if(pv===12 && ["4","5","6"].includes(dr)) return "Stand.";
  if(pv>=13 && pv<=16 && ["2","3","4","5","6"].includes(dr)) return "Stand.";
  return "Hit.";
}

// Render Strategy Chart
function renderStrategyChart(){
  let html="<p>Basic Strategy Chart placeholder: hard totals, soft totals, splits.</p>";
  document.getElementById("strategy-chart").innerHTML=html;
}

// =============================
// Card Counting
function updateCount(card){
  let rank=card.slice(0,-1);
  if(["2","3","4","5","6"].includes(rank)) runningCount++;
  else if(["10","J","Q","K","A"].includes(rank)) runningCount--;
}
function renderCountingChart(){
  document.getElementById("counting-chart").innerHTML=`
    <table border="1"><tr><th>Card</th><th>Hi-Lo Count</th></tr>
    <tr><td>2-6</td><td>+1</td></tr>
    <tr><td>7-9</td><td>0</td></tr>
    <tr><td>10,Ace</td><td>-1</td></tr>
    </table>
  `;
}

// =============================
// Tabs
function showTab(tabName){
  document.querySelectorAll('.tab').forEach(tab=>tab.style.display="none");
  document.getElementById(tabName).style.display="block";
}

// =============================
// Init
window.onload=function(){
  renderStrategyChart();
  renderCountingChart();
  newGame("free");
  showTab("game");
};
