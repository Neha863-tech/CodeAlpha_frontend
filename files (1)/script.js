(function () {
  'use strict';
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

  function roundResult(value) {
    return Math.round((value + Number.EPSILON) * 1e10) / 1e10;
  }

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
  function compute() {
    const prev = parseFloat(calcState.previousOperand);
    const curr = parseFloat(calcState.currentOperand);
    if (Number.isNaN(prev) || Number.isNaN(curr)) return curr;

    switch (calcState.operator) {
      case '+': return roundResult(prev + curr);
      case '−': return roundResult(prev - curr);
      case '×': return roundResult(prev * curr);
      case '÷':
        if (curr === 0) {
          calcState.error = true;
          return null;
        }
        return roundResult(prev / curr);
      default: return curr;
    }
  }
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

  function resetTrailingStateIfNeeded() {
    if (calcState.justEvaluated) {
      calcState.justEvaluated = false;
      calcState.lastExpression = '';
    }
  }
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
  function applyLengthTier(text) {
    const length = text.length;
    let tier = null;
    if (length > 14) tier = 'xl';
    else if (length > 10) tier = 'lg';
    else if (length > 8) tier = 'md';

    if (tier) els.output.setAttribute('data-length-tier', tier);
    else els.output.removeAttribute('data-length-tier');
  }
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

  els.keypad.addEventListener('click', (event) => {
    const button = event.target.closest('.key');
    if (!button) return;
    dispatch(button.dataset.action, button.dataset.value);
  });

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
    const buttonEl = els.keypad.querySelector(binding.selector);
    if (buttonEl) {
      buttonEl.classList.add('is-active');
      window.setTimeout(() => buttonEl.classList.remove('is-active'), 130);
    }
  });
  render();
})();
