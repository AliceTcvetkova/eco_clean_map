(function () {
  var figures = document.querySelectorAll(".case-figure img");
  if (!figures.length) return;

  var lightbox = document.createElement("div");
  lightbox.className = "case-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.hidden = true;

  lightbox.innerHTML =
    '<button type="button" class="case-lightbox__close" aria-label="Close">&times;</button>' +
    '<div class="case-lightbox__stage">' +
    '  <img class="case-lightbox__img" src="" alt="">' +
    "</div>" +
    '<p class="case-lightbox__caption"></p>';

  document.body.appendChild(lightbox);

  var stage = lightbox.querySelector(".case-lightbox__stage");
  var img = lightbox.querySelector(".case-lightbox__img");
  var caption = lightbox.querySelector(".case-lightbox__caption");
  var closeBtn = lightbox.querySelector(".case-lightbox__close");
  var lastFocus = null;

  function getCaption(figureImg) {
    var figure = figureImg.closest(".case-figure");
    if (!figure) return "";
    var cap = figure.querySelector("figcaption");
    if (!cap) return figureImg.alt || "";
    var clone = cap.cloneNode(true);
    var note = clone.querySelector(".case-figure__note");
    if (note) note.remove();
    return clone.textContent.trim();
  }

  function open(figureImg) {
    lastFocus = document.activeElement;
    img.src = figureImg.currentSrc || figureImg.src;
    img.alt = figureImg.alt;
    caption.textContent = getCaption(figureImg);
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("case-lightbox-open");
    closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("case-lightbox-open");
    img.removeAttribute("src");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  figures.forEach(function (figureImg) {
    figureImg.tabIndex = 0;
    figureImg.setAttribute("role", "button");
    figureImg.setAttribute("aria-label", "Enlarge image: " + (figureImg.alt || "case diagram"));

    figureImg.addEventListener("click", function () {
      open(figureImg);
    });

    figureImg.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(figureImg);
      }
    });
  });

  closeBtn.addEventListener("click", close);

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox || e.target === stage) close();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !lightbox.hidden) close();
  });
})();
