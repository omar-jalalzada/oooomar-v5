/**
 * The dial panel.
 *
 * In the original sketch these inputs *were* the state: `P` was read out of the DOM and
 * the letter-drag gesture worked by writing an input's value and dispatching an event.
 * That made the panel load-bearing. Now it's a view — the markup is generated from
 * DIAL_GROUPS, an input writes through `setDial`, and a change from anywhere else comes
 * back through the subscription. Nothing here is required for the field to run.
 *
 * The markup is built at runtime rather than written out below it, so DIAL_GROUPS stays
 * the only place a dial is declared. When this was an Astro component the same markup was
 * generated at build time from the same array.
 */
import {
  DIAL_GROUPS, P, SPECS, dialText, format, onDialChange, resetDials, setDial,
} from './dials.js';

/** Builds the panel's contents, then wires it in both directions. */
export function mountPanel() {
  const panel = document.getElementById('dials');
  if (!panel) return;

  const head = document.createElement('div');
  head.innerHTML =
    '<h1>Bar field dials</h1>' +
    '<div class="sub">crisp at rest \u00b7 alive on contact</div>' +
    // What the field is doing right now, as opposed to what it is set to. The frame loop
    // writes these through refs.mode / refs.fps.
    '<div class="readout"><span id="mode">z-space</span><span class="fps" id="fps">\u2014</span></div>';
  while (head.firstChild) panel.appendChild(head.firstChild);

  for (const group of DIAL_GROUPS) {
    const el = document.createElement('div');
    el.className = 'group';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = group.title;
    el.appendChild(title);

    for (const dial of group.dials) {
      const row = document.createElement('div');
      row.className = dial.kind === 'range' ? 'row' : 'toggle';

      const label = document.createElement('label');
      label.setAttribute('for', dial.id);
      label.textContent = dial.label;
      row.appendChild(label);

      if (dial.kind === 'range') {
        const val = document.createElement('span');
        val.className = 'val';
        val.dataset.for = dial.id;
        row.appendChild(val);
      }

      const input = document.createElement('input');
      input.id = dial.id;
      if (dial.kind === 'range') {
        input.type = 'range';
        input.min = String(dial.min);
        input.max = String(dial.max);
        input.step = dial.stepText;
        input.value = String(dial.value);
      } else {
        input.type = 'checkbox';
        input.checked = Boolean(dial.value);
      }
      row.appendChild(input);
      el.appendChild(row);
    }
    panel.appendChild(el);
  }

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML =
    '<button class="reset" id="copyDials" type="button">Copy dials</button>' +
    '<button class="reset" id="reset" type="button">Reset dials</button>';
  panel.appendChild(actions);

  wire(panel);
}

function wire(panel) {
  const inputs = new Map();
  panel.querySelectorAll('input').forEach((el) => inputs.set(el.id, el));

  function paint(id) {
    const el = inputs.get(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = P[id];
    else el.value = String(P[id]);
    const val = panel.querySelector(`.val[data-for="${id}"]`);
    if (val) val.textContent = format(id);
  }

  // Both directions. An input writes through to the dial; a change from anywhere else —
  // dragging a letter, hitting reset — comes back here. Without the return path the
  // sliders would silently disagree with the field the first time you dragged the O.
  inputs.forEach((el, id) => {
    const write = () => {
      if (el.type === 'checkbox') setDial(id, el.checked);
      else setDial(id, Number(el.value));
      // Repaint from `P` rather than from the input, so the readout shows the snapped
      // value the field is actually using.
      paint(id);
    };
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', write);
  });

  onDialChange(paint);
  for (const id of Object.keys(SPECS)) paint(id);

  document.getElementById('reset')?.addEventListener('click', resetDials);

  const copyBtn = document.getElementById('copyDials');
  copyBtn?.addEventListener('click', async () => {
    const text = dialText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // The clipboard API refuses when the document isn't focused, which happens often
      // enough while poking at a panel. The old selection-based path has no such rule.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    copyBtn.textContent = 'Copied';
    window.setTimeout(() => { copyBtn.textContent = 'Copy dials'; }, 1300);
  });

  // The panel covers the right edge, so the mark is centred in the area that's actually
  // visible rather than in the viewport — see measureViewport in field.js.
  const toggle = document.getElementById('panelToggle');
  toggle?.addEventListener('click', () => {
    const closed = document.body.classList.toggle('panel-closed');
    toggle.textContent = closed ? 'Show dials' : 'Hide dials';
    toggle.setAttribute('aria-expanded', String(!closed));
  });
}
