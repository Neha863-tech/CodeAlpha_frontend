/**
 * ============================================================================
 * CALCULATOR — script.js
 * ----------------------------------------------------------------------------
 * ENGINEERING NOTES (for the interview writeup):
 *
 * 1. STATE MACHINE, NOT DOM SCRAPING
 *    All arithmetic state (`calcState`) lives in one plain object. The screen
 *    never gets read back to figure out "what number are we on" — every
 *    button handler mutates state, then a single `render()` call projects
 *    that state onto the DOM. This is what makes chained operations
 *    (5 + 5 + 5) and the "overwrite next digit" behavior tractable: they're
 *    just state transitions, not string surgery on the displayed text.
 *
 * 2. FLOATING-POINT PRECISION
 *    JavaScript's IEEE-754 floats can't represent most decimals exactly
 *    (0.1 + 0.2 === 0.30000000000000004). `roundResult()` scales the value
 *    up by 10^10, rounds to the nearest integer, then scales back down —
 *    which snaps away the trailing float noise while still preserving up
 *    to 10 real decimal places of precision for legitimate results.
 *
 * 3. EVENT DELEGATION
 *    One click listener on #keypad, not fourteen listeners on fourteen
 *    buttons. `event.target.closest('.key')` resolves which button was hit,
 *    and its `data-action` / `data-value` attributes drive a single
 *    dispatch switch — adding a new key later means adding a button with
 *    the right data-attributes, not wiring a new listener.
 *
 * 4. KEYBOARD PARITY
 *    The physical keyboard doesn't get its own parallel logic path — a
 *    keydown handler maps physical keys to the SAME data-action/data-value
 *    vocabulary the click handler uses, then calls the identical dispatch
 *    function. Mouse and keyboard are just two input adapters over one
 *    engine.
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. STATE
     ========================================================================== */
  const calcState = {
    currentOperand: '0',   // the number currently being typed / just computed
    previousOperand: null, // the number "banked" before the pending operator
    operator: null,        // '+' | '−' | '×' | '÷' | null
    overwrite: true,       // true = next digit press starts a fresh number
    error: false,          // true after a division-by-zero, locks input until clear
    justEvaluated: false,  // true right after "=", used to render the trailing "12 + 8 =" line
    lastExpression: ''     // cached formula text shown briefly after "="
  };

  const els = {
    keypad: document.getElementById('keypad'),
    expression: document.getElementById('expression'),
    output: document.getElementById('output')
  };

  /* ==========================================================================
     2. FLOATING-POINT SAFE MATH
     ========================================================================== */

  /** Rounds to 10 decimal places to eliminate IEEE-754 representation noise
   *  (0.1 + 0.2 -> 0.30000000000000004 becomes 0.3) while leaving genuine
   *  precision intact for results that actually need many decimal places. */
  function roundResult(value) {
    return Math.round((value + Number.EPSILON) * 1e10) / 1e10;
  }

  /** Formats a numeric string for display: thousands separators on the
   *  integer part, decimal part left exactly as typed (so "12." doesn't
   *  lose its trailing dot while the user is still mid-entry, and trailing
   *  zeros like "12.50" aren't stripped while typing). */
  function formatNumberForDisplay(rawValue) {
    if (rawValue === null || rawValue === undefined || rawValue === '') return '';
    if (rawValue === 'Error') return 'Error';

    const isNegative = rawValue.toString().startsWith('-');
    const unsigned = rawValue.toString().replace('-', '');
    const [intPart, decimalPart] = unsigned.split('.');

    const formattedInt = intPart === '' ? '0' : Number(intPart).toLocaleString('en-US');
    const sign = isNegative ? '-' : '';

    if (decimalPart === undefined) return `${sign}${formattedInt}`;
    return `${sign}${formattedInt}.${decimalPart}`;
  }

  /* ==========================================================================
     3. ENGINE — pure state transitions, no DOM access in here
     ========================================================================== */

  function clearAll() {
    calcState.currentOperand = '0';
    calcState.previousOperand = null;
    calcState.operator = null;
    calcState.overwrite = true;
    calcState.error = false;
    calcState.justEvaluated = false;
    calcState.lastExpression = '';
  }

  function inputDigit(digit) {
    if (calcState.error) clearAll();
    resetTrailingStateIfNeeded();

    if (calcState.overwrite) {
      calcState.currentOperand = digit === '0' ? '0' : digit;
      calcState.overwrite = false;
      return;
    }

    // Edge case: no meaningful leading zeros ("007" -> "7").
    if (calcState.currentOperand === '0') {
      calcState.currentOperand = digit;
    } else {
      calcState.currentOperand += digit;
    }
  }

  function inputDecimal() {
    if (calcState.error) clearAll();
    resetTrailingStateIfNeeded();

    if (calcState.overwrite) {
      calcState.currentOperand = '0.';
      calcState.overwrite = false;
      return;
    }
    // Edge case: guard against a second decimal point in one number.
    if (calcState.currentOperand.includes('.')) return;
    calcState.currentOperand += '.';
  }

  function toggleSign() {
    if (calcState.error) return;
    if (calcState.currentOperand === '0') return; // signing zero is a no-op
    calcState.currentOperand = calcState.currentOperand.startsWith('-')
      ? calcState.currentOperand.slice(1)
      : `-${calcState.currentOperand}`;
  }

  function deleteLastChar() {
    if (calcState.error) { clearAll(); return; }
    if (calcState.overwrite) return; // nothing has been typed for this operand yet

    calcState.currentOperand = calcState.currentOperand.slice(0, -1);
    if (calcState.currentOperand === '' || calcState.currentOperand === '-') {
      calcState.currentOperand = '0';
      calcState.overwrite = true;
    }
  }

  /** Runs the pending operator against previousOperand/currentOperand.
   *  Returns a numeric result, or sets calcState.error and returns null
   *  on divide-by-zero. */
  function compute() {
    const prev = parseFloat(calcState.previousOperand);
    const curr = parseFloat(calcState.currentOperand);
    if (Number.isNaN(prev) || Number.isNaN(curr)) return curr;

    switch (calcState.operator) {
      case '+': return roundResult(prev + curr);
      case '−': return roundResult(prev - curr);
      case '×': return roundResult(prev * curr);
      case '÷':
        // Edge case: division by zero handled explicitly rather than
        // letting JS produce Infinity/NaN and leaking that into the UI.
        if (curr === 0) {
          calcState.error = true;
          return null;
        }
        return roundResult(prev / curr);
      default: return curr;
    }
  }

  /** Called when an operator button is pressed. Chains naturally: if an
   *  operator is already pending AND the user has typed a new operand,
   *  it evaluates the pending expression first, then queues the new
   *  operator on top of that running result (5 + 5 + 5 -> 15). If the
   *  user presses a second operator in a row without typing a digit in
   *  between, it simply swaps the pending operator instead of stacking
   *  ("++" edge case) or computing prematurely. */
  function chooseOperator(op) {
    if (calcState.error) return;

    if (calcState.operator !== null && !calcState.overwrite) {
      const result = compute();
      if (calcState.error) return; // divide-by-zero mid-chain
      calcState.currentOperand = String(result);
    }

    calcState.previousOperand = calcState.currentOperand;
    calcState.operator = op;
    calcState.overwrite = true;
    calcState.justEvaluated = false;
  }

  function evaluate() {
    if (calcState.error) return;
    if (calcState.operator === null || calcState.previousOperand === null) return; // nothing queued

    const expressionText = `${formatNumberForDisplay(calcState.previousOperand)} ${calcState.operator} ${formatNumberForDisplay(calcState.currentOperand)} =`;
    const result = compute();

    if (calcState.error) return; // leave state as-is; render() shows "Error"

    calcState.currentOperand = String(result);
    calcState.previousOperand = null;
    calcState.operator = null;
    calcState.overwrite = true;
    calcState.justEvaluated = true;
    calcState.lastExpression = expressionText;
  }

  /** The formula line should clear itself the moment the user starts a
   *  fresh calculation after an "=" result, rather than lingering. */
  function resetTrailingStateIfNeeded() {
    if (calcState.justEvaluated) {
      calcState.justEvaluated = false;
      calcState.lastExpression = '';
    }
  }

  /* ==========================================================================
     4. RENDER — the only place that touches the DOM's text content
     ========================================================================== */
  function render() {
    if (calcState.error) {
      els.output.textContent = 'Error';
      els.expression.textContent = 'Cannot divide by zero';
      applyLengthTier('Error');
      return;
    }

    els.output.textContent = formatNumberForDisplay(calcState.currentOperand);

    if (calcState.operator !== null) {
      els.expression.textContent = `${formatNumberForDisplay(calcState.previousOperand)} ${calcState.operator}`;
    } else if (calcState.justEvaluated) {
      els.expression.textContent = calcState.lastExpression;
    } else {
      els.expression.textContent = '';
    }

    applyLengthTier(els.output.textContent);
  }

  /** Overflow protection: shrink the display's font size in discrete steps
   *  based on how many characters are showing. A plain CSS clamp() only
   *  responds to viewport width, not content length, so this measurement
   *  has to happen in JS. */
  function applyLengthTier(text) {
    const length = text.length;
    let tier = null;
    if (length > 14) tier = 'xl';
    else if (length > 10) tier = 'lg';
    else if (length > 8) tier = 'md';

    if (tier) els.output.setAttribute('data-length-tier', tier);
    else els.output.removeAttribute('data-length-tier');
  }

  /* ==========================================================================
     5. DISPATCH — translates a data-action/data-value pair into an engine
     call. Both the click handler and the keyboard handler funnel through
     this single function, guaranteeing mouse and keyboard behave identically.
     ========================================================================== */
  function dispatch(action, value) {
    switch (action) {
      case 'number': inputDigit(value); break;
      case 'decimal': inputDecimal(); break;
      case 'operator': chooseOperator(value); break;
      case 'equals': evaluate(); break;
      case 'clear': clearAll(); break;
      case 'delete': deleteLastChar(); break;
      case 'sign': toggleSign(); break;
      default: return;
    }
    render();
  }

  /* ==========================================================================
     6. EVENT WIRING — mouse (delegated) + keyboard
     ========================================================================== */

  // Single delegated listener for the entire keypad (see file header, note #3).
  els.keypad.addEventListener('click', (event) => {
    const button = event.target.closest('.key');
    if (!button) return;
    dispatch(button.dataset.action, button.dataset.value);
  });

  // Maps a physical KeyboardEvent.key to the same {action, value, selector}
  // vocabulary the on-screen buttons use, so one dispatch() call serves both.
  function resolveKeyBinding(key) {
    if (/^[0-9]$/.test(key)) {
      return { action: 'number', value: key, selector: `[data-action="number"][data-value="${key}"]` };
    }
    const map = {
      '.': { action: 'decimal', value: undefined, selector: '[data-action="decimal"]' },
      '+': { action: 'operator', value: '+', selector: '[data-value="+"]' },
      '-': { action: 'operator', value: '−', selector: '[data-value="−"]' },
      '*': { action: 'operator', value: '×', selector: '[data-value="×"]' },
      '/': { action: 'operator', value: '÷', selector: '[data-value="÷"]' },
      'Enter': { action: 'equals', value: undefined, selector: '[data-action="equals"]' },
      '=': { action: 'equals', value: undefined, selector: '[data-action="equals"]' },
      'Backspace': { action: 'delete', value: undefined, selector: '[data-action="delete"]' },
      'Escape': { action: 'clear', value: undefined, selector: '[data-action="clear"]' }
    };
    return map[key] || null;
  }

  document.addEventListener('keydown', (event) => {
    const binding = resolveKeyBinding(event.key);
    if (!binding) return;

    event.preventDefault(); // stop "/" from opening browser quick-find, etc.
    dispatch(binding.action, binding.value);

    // Bridge physical <-> digital input: flash the matching on-screen key
    // with the same .is-active styling a mouse :active click produces.
    const buttonEl = els.keypad.querySelector(binding.selector);
    if (buttonEl) {
      buttonEl.classList.add('is-active');
      window.setTimeout(() => buttonEl.classList.remove('is-active'), 130);
    }
  });

  /* ==========================================================================
     7. INIT
     ========================================================================== */
  render();
})();
