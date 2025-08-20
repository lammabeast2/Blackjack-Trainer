function renderCardImages(hand, divId) {
  const div = document.getElementById(divId);
  div.innerHTML = "";
  hand.forEach(cardCode => {
    const img = document.createElement("img");
    img.src = `cards/${cardCode}.png`;
    img.width = 60;
    img.height = 90;
    img.style.margin = "3px";
    div.appendChild(img);
  });
}
