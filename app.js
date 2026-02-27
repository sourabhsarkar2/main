const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const hint = document.getElementById('hint');

const controls = {
  brightness: document.getElementById('brightness'),
  contrast: document.getElementById('contrast'),
  saturation: document.getElementById('saturation'),
  blur: document.getElementById('blur'),
  hue: document.getElementById('hue'),
  opacity: document.getElementById('opacity')
};

const state = {
  image: null,
  overlay: [],
  rotation: 0,
  flipX: 1,
  flipY: 1,
  presetFilter: 'none'
};

const outputIds = {
  brightness: 'brightnessOut',
  contrast: 'contrastOut',
  saturation: 'saturationOut',
  blur: 'blurOut',
  hue: 'hueOut',
  opacity: 'opacityOut'
};

const defaultValues = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  hue: 0,
  opacity: 100
};

Object.keys(controls).forEach((name) => {
  controls[name].addEventListener('input', () => {
    document.getElementById(outputIds[name]).textContent = controls[name].value;
    render();
  });
});

function resetControlValues() {
  for (const [key, value] of Object.entries(defaultValues)) {
    controls[key].value = value;
    document.getElementById(outputIds[key]).textContent = value;
  }
}

function computedFilter() {
  const core = [
    `brightness(${controls.brightness.value}%)`,
    `contrast(${controls.contrast.value}%)`,
    `saturate(${controls.saturation.value}%)`,
    `blur(${controls.blur.value}px)`,
    `hue-rotate(${controls.hue.value}deg)`
  ].join(' ');

  return state.presetFilter === 'none' ? core : `${core} ${state.presetFilter}`;
}

function render() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.image) {
    ctx.restore();
    return;
  }

  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = state.image.width / state.image.height;

  let drawWidth = canvas.width;
  let drawHeight = canvas.height;

  if (imageRatio > canvasRatio) {
    drawHeight = canvas.width / imageRatio;
  } else {
    drawWidth = canvas.height * imageRatio;
  }

  const x = (canvas.width - drawWidth) / 2;
  const y = (canvas.height - drawHeight) / 2;

  ctx.filter = computedFilter();
  ctx.globalAlpha = Number(controls.opacity.value) / 100;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.scale(state.flipX, state.flipY);

  ctx.drawImage(state.image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = 'none';

  state.overlay.forEach((caption) => {
    ctx.font = `${caption.size}px Inter, sans-serif`;
    ctx.fillStyle = caption.color;
    ctx.textAlign = 'center';
    ctx.fillText(caption.text, canvas.width / 2, canvas.height - 42 - caption.offsetY);
  });

  ctx.restore();
}

function loadImage(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();

  img.onload = () => {
    state.image = img;
    hint.textContent = `Editing: ${file.name}`;
    render();
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

document.getElementById('upload').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) loadImage(file);
});

document.getElementById('reset').addEventListener('click', () => {
  state.rotation = 0;
  state.flipX = 1;
  state.flipY = 1;
  state.presetFilter = 'none';
  state.overlay = [];
  resetControlValues();
  render();
});

document.getElementById('rotateLeft').addEventListener('click', () => {
  state.rotation -= 90;
  render();
});

document.getElementById('rotateRight').addEventListener('click', () => {
  state.rotation += 90;
  render();
});

document.getElementById('flipX').addEventListener('click', () => {
  state.flipX *= -1;
  render();
});

document.getElementById('flipY').addEventListener('click', () => {
  state.flipY *= -1;
  render();
});

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    state.presetFilter = button.dataset.filter;
    render();
  });
});

document.getElementById('addCaption').addEventListener('click', () => {
  const text = document.getElementById('captionText').value.trim();
  if (!text) return;

  state.overlay.push({
    text,
    color: document.getElementById('captionColor').value,
    size: Number(document.getElementById('captionSize').value),
    offsetY: state.overlay.length * 42
  });

  document.getElementById('captionText').value = '';
  render();
});

document.getElementById('download').addEventListener('click', () => {
  if (!state.image) return;
  const link = document.createElement('a');
  link.download = `pixelforge-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

resetControlValues();
render();
