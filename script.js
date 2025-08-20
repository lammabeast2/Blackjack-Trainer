// =============================
// Blackjack Trainer JS
// =============================

// Ranks & Suits
const suits = ["H","D","C","S"];
const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

let mode="free"; // free or practice
let shoe=[];
let playerHands=[];
let dealerHand=[];
let currentHandIndex=0;
let runningCount=0;
let chips=1000;

// =============================
// Build & Shuffle 6 decks
function buildShoe(){
  shoe=[];
  for(let d=0; d<6; d++){
    for(let s of suits){
      for(let r of ranks){
        shoe.push(r+s);
      }
    }
  }
  shuffle(shoe);
}
function shuffle(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i],array[j]]=[array[j],array[i]];
  }
}

// =============================
// Draw & Value
function drawCard(){
  if(shoe.length===0) buildShoe();
  let card=shoe.pop();
  updateCount(card);
  return card;
}
function cardValue(card){
  let rank=card.slice(0,-1);
  if(["J","Q","K"].includes(rank)) return 10;
  if(rank==="A") return 11;
  return parseInt(rank);
}
function handValue(hand){
  let total=0, aces=0;
  for(let c of hand){
    total+=cardValue(c);
    if(c.startsWith("A")) aces++;
  }
  while(total>21 && aces>0){ total-=10; aces--; }
  return total;
}

// =============================
// Game Logic
function deal(){
  buildShoe();
  playerHands=[[drawCard(),drawCard()]];
  currentHandIndex=0;
  dealerHand=[drawCard(),drawCard()];
  render();
  document.getElementById("result").textContent="";
  document.getElementById("chips").textContent="Chips: "+chips;
}

function hit(){
  let hand=playerHands[currentHandIndex];
  hand.push(drawCard());
  render();
  if(handValue(hand)>21){
    feedback("Bust!");
    nextHandOrEnd();
  }else{
    if(mode==="practice") feedback(strategyAdvice(hand,dealerHand[0]));
  }
}

function stand(){ nextHandOrEnd("Stand"); }

function double(){
  let hand=playerHands[currentHandIndex];
  if(hand.length===2){
    hand.push(drawCard());
    chips-=100; // example bet deduction
    nextHandOrEnd("Double");
  }else alert("Double only on first 2 cards!");
}

function split(){
  let hand=playerHands[currentHandIndex];
  if(hand.length===2 && hand[0].slice(0,-1)===hand[1].slice(0,-1)){
    let newHand=[hand.pop(),drawCard()];
    hand.push(drawCard());
    playerHands.splice(currentHandIndex+1,0,newHand);
    render();
  }else alert("Cannot split!");
}

// =============================
// Next Hand / Dealer Play
function nextHandOrEnd(action){
  if(mode==="practice") feedback(action+" | "+strategyAdvice(playerHands[currentHandIndex],dealerHand[0]));
  if(currentHandIndex<playerHands.length-1){
    currentHandIndex++;
    render();
  }else dealerPlay();
}

function dealerPlay(){
  while(handValue(dealerHand)<17 || (handValue(dealerHand)===17 && dealerHasSoft17(dealerHand))){
    dealerHand.push(drawCard());
  }
  let results="";
  playerHands.forEach((hand,i)=>{
    let pv=handValue(hand), dv=handValue(dealerHand);
    if(pv>21) results+=`Hand ${i+1}: Bust! `;
    else if(dv>21 || pv>dv) results+=`Hand ${i+1}: Win! `;
    else if(pv===dv) results+=`Hand ${i+1}: Push. `;
    else results+=`Hand ${i+1}: Lose. `;
  });
  document.getElementById("result").textContent=results;
  render();
}

function dealerHasSoft17(hand){
  let total=0, aces=0;
  for(let c of hand){ total+=cardValue(c); if(c.startsWith("A")) aces++; }
  return total===17 && aces>0;
}

// =============================
// Render Hands
function render(){
  renderCards(playerHands[currentHandIndex],"player-cards");
  renderCards(dealerHand,"dealer-cards");
  document.getElementById("player-value").textContent="Total: "+handValue(playerHands[currentHandIndex]);
  document.getElementById("dealer-value").textContent="Total: "+handValue(dealerHand);
  document.getElementById("running-count").textContent=runningCount;
  document.getElementById("true-count").textContent=(runningCount/(shoe.length/52)).toFixed(2);
  document.getElementById("chips").textContent="Chips: "+chips;

  // Practice Mode: 10% chance quiz
  if(mode==="practice" && Math.random()<0.1){
    let user=prompt("What is the running card count?");
    if(parseInt(user)===runningCount){ chips+=100; alert("Correct! +100 chips"); }
    else{ chips-=100; alert("Incorrect! -100 chips"); }
  }
}

function renderCards(hand,divId){
  const div=document.getElementById(divId);
  div.innerHTML="";
  for(let c of hand){
    const img=document.createElement("img");
    img.src=`cards/${c}.png`;
    img.width=60;
    img.height=90;
    img.style.margin="3px";
    div.appendChild(img);
  }
}

// =============================
// Strategy Feedback
function strategyAdvice(hand,dealerCard){
  let pv=handValue(hand);
  let dr=dealerCard.slice(0,-1);
  if(pv>=17) return "Stand";
  if(pv<=11) return "Hit";
  if(pv===12 && ["4","5","6"].includes(dr)) return "Stand";
  if(pv>=13 && pv<=16 && ["2","3","4","5","6"].includes(dr)) return "Stand";
  return "Hit";
}

function feedback(msg){ document.getElementById("result").textContent=msg; }

// =============================
// Card Counting
function updateCount(card){
  let rank=card.slice(0,-1);
  if(["2","3","4","5","6"].includes(rank)) runningCount++;
  else if(["10","J","Q","K","A"].includes(rank)) runningCount--;
}

function renderStrategyChart(){
  document.getElementById("strategy-chart").innerHTML="<p>Basic Strategy: Hard/Soft Totals and Splits.</p>";
  document.getElementById("counting-chart").innerHTML=`<table border="1"><tr><th>Card</th><th>Hi-Lo Value</th></tr>
  <tr><td>2-6</td><td>+1</td></tr>
  <tr><td>7-9</td><td>0</td></tr>
  <tr><td>10,A</td><td>-1</td></tr></table>`;
}

// =============================
// Tabs
function showTab(tabName){
  document.querySelectorAll(".tab").forEach(t=>t.style.display="none");
  document.getElementById(tabName).style.display="block";
}

// =============================
// Init
window.onload=function(){
  renderStrategyChart();
  deal();
  showTab("game");
};
