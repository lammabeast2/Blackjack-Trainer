// Global variables
let deck = [], player = [], dealer = [];
let mode = 'free'; // 'free' or 'practice'

// Card mapping to images
const ranks = ['2','3','4','5','6','7','8','9','0','J','Q','K','A']; // 0=10
const suits = ['H','D','C','S']; // Hearts, Diamonds, Clubs, Spades

// Build a standard 52-card deck
function buildDeck() {
    deck = [];
    for (let s of suits) {
        for (let r of ranks) {
            deck.push(r+s);
        }
    }
    deck = shuffle(deck);
}

// Shuffle deck
function shuffle(array) {
    for (let i=array.length-1; i>0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Draw a card from the deck
function draw() {
    if (deck.length === 0) buildDeck();
    return deck.pop();
}

// Calculate hand value
function value(hand) {
    let total = 0, aces = 0;
    for (let c of hand) {
        let rank = c[0];
        if (rank === '0') rank = '10'; // 10 card
        if (['J','Q','K'].includes(rank)) total += 10;
        else if (rank === 'A') { total += 11; aces++; }
        else total += parseInt(rank);
    }
    while (total > 21 && aces) { total -= 10; aces--; }
    return total;
}

// Show hands visually
function show() {
    const dealerDiv = document.getElementById('dealer-cards');
    const playerDiv = document.getElementById('player-cards');
    dealerDiv.innerHTML = '';
    playerDiv.innerHTML = '';

    dealer.forEach(card => {
        const img = document.createElement('img');
        img.src = `https://deckofcardsapi.com/static/img/${card}.png`;
        dealerDiv.appendChild(img);
    });

    player.forEach(card => {
        const img = document.createElement('img');
        img.src = `https://deckofcardsapi.com/static/img/${card}.png`;
        playerDiv.appendChild(img);
    });

    document.getElementById('dealer-value').innerText = "Value: " + value(dealer);
    document.getElementById('player-value').innerText = "Value: " + value(player);
}

// Start new game
function newGame(selectedMode='free') {
    mode = selectedMode;
    buildDeck();
    player = [draw(), draw()];
    dealer = [draw(), draw()];
    document.getElementById('result').innerText = '';
    show();
}

// Player actions
function hit() {
    player.push(draw());
    if (value(player) > 21) {
        document.getElementById('result').innerText = "Bust!";
    }
    show();
}

function stand() {
    while (value(dealer) < 17) dealer.push(draw());
    const pv = value(player), dv = value(dealer);
    let msg = '';

    if (dv > 21) msg = "Dealer Bust! You Win!";
    else if (pv > dv) msg = "You Win!";
    else if (pv < dv) msg = "Dealer Wins!";
    else msg = "Push";

    // Practice Mode check
    if (mode === 'practice') {
        const advice = basicStrategy(player, dealer[0]);
        if (advice !== 'stand' && pv <= 21) msg += `\nBasic Strategy Suggests: ${advice.toUpperCase()}`;
    }

    document.getElementById('result').innerText = msg;
    show();
}

// Basic Strategy Helper (simplified version)
function basicStrategy(playerHand, dealerCard) {
    const playerTotal = value(playerHand);
    const dealerValueMap = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'0':10,'J':10,'Q':10,'K':10,'A':11};
    const dealerVal = dealerValueMap[dealerCard[0]];

    if (playerTotal >= 17) return 'stand';
    if (playerTotal <= 11) return 'hit';
    if (playerTotal >= 12 && playerTotal <= 16) {
        if (dealerVal >= 7) return 'hit';
        else return 'stand';
    }
    return 'stand';
}

// Initialize default game
newGame();
