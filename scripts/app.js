const images = window.pipotronicImages || [];
const segmentPools = window.pipotronicSegments || [];

const imageElement = document.getElementById('pipotronic-image');
const messageContainer = document.getElementById('pipotronic-text');
const rerollButton = document.getElementById('reroll-button');
const shareButton = document.getElementById('share-button');
const shareFeedback = document.querySelector('.share-feedback');

let currentImageUrl = '';
let currentSegments = new Array(segmentPools.length).fill('');

imageElement.addEventListener('load', () => {
  imageElement.dataset.loaded = 'true';
});

imageElement.addEventListener('click', () => {
  setRandomImage(true);
});

function getRandomItem(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return undefined;
  }

  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

function pickRandomFromPool(pool, previousValue) {
  if (!Array.isArray(pool) || pool.length === 0) {
    return '';
  }

  if (pool.length === 1) {
    return pool[0];
  }

  let candidate = getRandomItem(pool);
  let guard = 0;

  while (candidate === previousValue && guard < 10) {
    candidate = getRandomItem(pool);
    guard += 1;
  }

  return candidate;
}

function setRandomImage(avoidSame = false) {
  if (!images.length) {
    return;
  }

  let candidate = getRandomItem(images);
  let guard = 0;

  while (
    avoidSame &&
    images.length > 1 &&
    candidate === currentImageUrl &&
    guard < 10
  ) {
    candidate = getRandomItem(images);
    guard += 1;
  }

  currentImageUrl = candidate;
  imageElement.dataset.loaded = 'false';
  imageElement.src = candidate;
}

function randomizeAllSegments({ avoidSame = false } = {}) {
  currentSegments = segmentPools.map((pool, index) =>
    pickRandomFromPool(pool, avoidSame ? currentSegments[index] : undefined)
  );
}

function randomizeSegment(index) {
  if (index < 0 || index >= segmentPools.length) {
    return;
  }

  currentSegments[index] = pickRandomFromPool(
    segmentPools[index],
    currentSegments[index]
  );
}

function renderMessage({ animate = true, focusIndex = null } = {}) {
  if (animate) {
    messageContainer.classList.remove('is-visible');
  }

  messageContainer.innerHTML = '';

  if (!currentSegments.length) {
    messageContainer.textContent = 'Aucun segment disponible.';
    messageContainer.classList.add('is-visible');
    return;
  }

  let focusButton = null;

  currentSegments.forEach((segment, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'message-segment';
    button.dataset.index = String(index);
    button.textContent = segment;
    button.title = 'Clique pour régénérer ce segment';

    if (index === focusIndex) {
      focusButton = button;
    }

    messageContainer.appendChild(button);
  });

  if (animate) {
    requestAnimationFrame(() => {
      messageContainer.classList.add('is-visible');
      if (focusButton) {
        focusButton.focus({ preventScroll: true });
      }
    });
  } else {
    messageContainer.classList.add('is-visible');
    if (focusButton) {
      focusButton.focus({ preventScroll: true });
    }
  }
}

function rerollAll() {
  shareFeedback.textContent = '';
  setRandomImage(true);
  randomizeAllSegments({ avoidSame: true });
  renderMessage({ animate: true });
}

function handleSegmentClick(event) {
  const button = event.target.closest('.message-segment');

  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);

  if (Number.isNaN(index)) {
    return;
  }

  randomizeSegment(index);
  renderMessage({ animate: false, focusIndex: index });
}

async function handleShare() {
  shareFeedback.textContent = '';

  try {
    await navigator.clipboard.writeText(window.location.href);
    shareFeedback.textContent = 'Lien copié !';
  } catch (error) {
    shareFeedback.textContent = 'Impossible de copier automatiquement';
  }
}

function shouldSkipSpaceShortcut(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest('button') || target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

rerollButton.addEventListener('click', rerollAll);
shareButton.addEventListener('click', handleShare);
messageContainer.addEventListener('click', handleSegmentClick);

document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') {
    return;
  }

  if (shouldSkipSpaceShortcut(event.target)) {
    return;
  }

  event.preventDefault();
  rerollAll();
});

function initialize() {
  setRandomImage(false);
  randomizeAllSegments();
  renderMessage({ animate: true });
}

document.addEventListener('DOMContentLoaded', initialize);
