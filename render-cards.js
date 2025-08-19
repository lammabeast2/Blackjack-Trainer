// =============================
// Card Image Renderer Helper
// =============================

// This function takes a hand array and a div ID, and renders the correct images
function renderCardImages(hand, divId) {
  const div = document.getElementById(divId);
  div.innerHTML = ""; // clear previous cards

  hand.forEach(cardCode => {
    const img = document.createElement("img");

    // Adjust this path if your cards are in a different folder
    img.src = `cards/${cardCode}.png`; 
    img.width = 60; // adjust size for iPhone
    img.height = 90;
    img.style.borderRadius = "5px";
    img.style.margin = "3px";

    div.appendChild(img);
  });
}

// Example usage: replace your old renderHand calls
// renderCardImages(playerHand, "player-cards");
// renderCardImages(dealerHand, "dealer-cards");
