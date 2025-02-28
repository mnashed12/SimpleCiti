function hoverSticker(stickerNum) {
  const bubble = document.querySelector(`.sticker${stickerNum} .bubble`);
  bubble.innerHTML = `Sticker ${stickerNum} Info: More Details`;  // Update bubble content
}

function removeHoverEffect(stickerNum) {
  const bubble = document.querySelector(`.sticker${stickerNum} .bubble`);
  bubble.innerHTML = `Sticker ${stickerNum} Info`;  // Reset bubble content if needed
}
