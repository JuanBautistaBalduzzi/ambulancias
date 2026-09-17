const cards = Array.from(document.querySelectorAll('.side-card'));
const sections = Array.from(document.querySelectorAll('.artboard'));

function setActive(targetId) {
  cards.forEach((card) => {
    card.classList.toggle('active', card.dataset.target === targetId);
  });
}

cards.forEach((card) => {
  card.addEventListener('click', () => {
    const targetId = card.dataset.target;
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(targetId);
  });
});

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    setActive(entry.target.id);
  }
}, { threshold: 0.45 });

sections.forEach((section) => observer.observe(section));

const modalTriggers = Array.from(document.querySelectorAll('[data-open-modal]'));
const closeTriggers = Array.from(document.querySelectorAll('[data-close-modal]'));

function getModal(modalId) {
  if (!modalId) return null;
  return document.getElementById(modalId);
}

function openModal(modalId) {
  const modal = getModal(modalId);
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  const firstInput = modal.querySelector('input, select, textarea, button');
  if (firstInput instanceof HTMLElement) {
    firstInput.focus();
  }
}

function closeModal(modal) {
  if (!(modal instanceof HTMLElement)) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');

  const hasOpenModal = document.querySelector('.modal-overlay.open');
  if (!hasOpenModal) {
    document.body.classList.remove('modal-open');
  }
}

modalTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    openModal(trigger.getAttribute('data-open-modal'));
  });
});

closeTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const modal = trigger.closest('.modal-overlay');
    closeModal(modal);
  });
});

document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal(overlay);
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openedModal = document.querySelector('.modal-overlay.open');
  if (openedModal instanceof HTMLElement) {
    closeModal(openedModal);
  }
});

function renderWizardStep(form, step) {
  const totalSteps = Number(form.getAttribute('data-total-steps') || '1');
  const safeStep = Math.min(Math.max(step, 1), totalSteps);
  form.setAttribute('data-current-step', String(safeStep));

  const panels = Array.from(form.querySelectorAll('[data-step-panel]'));
  panels.forEach((panel) => {
    const panelStep = Number(panel.getAttribute('data-step-panel'));
    panel.classList.toggle('active', panelStep === safeStep);
  });

  const modal = form.closest('.modal-overlay');
  if (modal) {
    const indicators = Array.from(modal.querySelectorAll('[data-step-indicator]'));
    indicators.forEach((indicator) => {
      const indicatorStep = Number(indicator.getAttribute('data-step-indicator'));
      indicator.classList.toggle('active', indicatorStep === safeStep);
    });
  }

  const prevBtn = form.querySelector('[data-step-prev]');
  const nextBtn = form.querySelector('[data-step-next]');
  const submitBtn = form.querySelector('[data-submit-wizard]');

  if (prevBtn instanceof HTMLElement) {
    prevBtn.toggleAttribute('disabled', safeStep === 1);
  }
  if (nextBtn instanceof HTMLElement) {
    nextBtn.toggleAttribute('hidden', safeStep === totalSteps);
  }
  if (submitBtn instanceof HTMLElement) {
    submitBtn.toggleAttribute('hidden', safeStep !== totalSteps);
  }
}

const wizardForms = Array.from(document.querySelectorAll('[data-wizard]'));
wizardForms.forEach((form) => {
  const initialStep = Number(form.getAttribute('data-current-step') || '1');
  renderWizardStep(form, initialStep);

  const nextButton = form.querySelector('[data-step-next]');
  const prevButton = form.querySelector('[data-step-prev]');

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const current = Number(form.getAttribute('data-current-step') || '1');
      renderWizardStep(form, current + 1);
    });
  }

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      const current = Number(form.getAttribute('data-current-step') || '1');
      renderWizardStep(form, current - 1);
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const modal = form.closest('.modal-overlay');
    closeModal(modal);
  });
});

document.querySelectorAll('.screen-subnav').forEach((subnav) => {
  const links = Array.from(subnav.querySelectorAll('a[href^="#"]'));
  if (!links.length) return;

  const targets = links
    .map((link) => document.getElementById((link.getAttribute('href') || '').slice(1)))
    .filter(Boolean);

  function setSubnavActive(id) {
    links.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  }

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = (link.getAttribute('href') || '').slice(1);
      const target = document.getElementById(targetId);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSubnavActive(targetId);
    });
  });

  const subObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      setSubnavActive(entry.target.id);
    });
  }, { threshold: 0.35 });

  targets.forEach((target) => subObserver.observe(target));
});

const billingTabButtons = Array.from(document.querySelectorAll('[data-billing-view-btn]'));
function setBillingView(target) {
  if (!target) return;
  document.querySelectorAll('[data-billing-view-btn]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-billing-view-btn') === target);
  });

  document.querySelectorAll('[data-billing-view-panel]').forEach((panel) => {
    panel.toggleAttribute('hidden', panel.getAttribute('data-billing-view-panel') !== target);
  });
}

billingTabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.getAttribute('data-billing-view-btn');
    setBillingView(target);
  });
});

const generateSummaryBtn = document.querySelector('[data-generate-summary]');
const consolidateBtn = document.querySelector('[data-consolidate-billing]');
const periodFromInput = document.querySelector('[data-period-from]');
const periodToInput = document.querySelector('[data-period-to]');
const summaryPeriodNode = document.querySelector('[data-summary-period]');
const summaryTotalNode = document.querySelector('[data-summary-total]');
const summaryCasesNode = document.querySelector('[data-summary-cases]');
const billingHistoryTable = document.querySelector('[data-billing-history-table]');
const billingFeedback = document.querySelector('[data-billing-feedback]');

function formatPeriod() {
  const from = periodFromInput instanceof HTMLInputElement ? periodFromInput.value : '';
  const to = periodToInput instanceof HTMLInputElement ? periodToInput.value : '';
  if (!from || !to) return 'Periodo sin definir';
  return `${from} al ${to}`;
}

if (generateSummaryBtn) {
  generateSummaryBtn.addEventListener('click', () => {
    if (summaryPeriodNode) summaryPeriodNode.textContent = formatPeriod();
    if (summaryTotalNode) summaryTotalNode.textContent = '$594.000';
    if (summaryCasesNode) summaryCasesNode.textContent = '24 servicios';
    if (billingFeedback) {
      billingFeedback.textContent = 'Resumen listo para confirmar. Si aceptas, se consolida automaticamente en el historico.';
    }
    openModal('modal-fact-summary');
  });
}

if (consolidateBtn) {
  consolidateBtn.addEventListener('click', () => {
    if (!billingHistoryTable) return;
    const row = document.createElement('div');
    row.className = 'table-row-compact';
    row.setAttribute('data-history-row', 'true');
    row.setAttribute('data-id', `#${Math.floor(Math.random() * 9000) + 1000}`);
    row.setAttribute('data-provider', 'Resumen multi proveedor');
    row.setAttribute('data-period', formatPeriod());
    row.setAttribute('data-total', '$594.000');
    row.setAttribute('data-cases', '24 servicios');
    row.innerHTML = '<strong>Nueva liquidacion</strong><span>Resumen multi proveedor</span><span>$594.000</span><span>Consolidado</span><span class="status ok">Emitida</span>';
    attachHistoryRowClick(row);
    billingHistoryTable.prepend(row);
    setBillingView('historico');
    if (billingFeedback) {
      billingFeedback.textContent = 'Facturacion consolidada. Ya puedes abrirla desde el historico para ver el detalle completo.';
    }
    closeModal(document.getElementById('modal-fact-summary'));
  });
}

function attachHistoryRowClick(row) {
  row.addEventListener('click', () => {
    const id = row.getAttribute('data-id') || 'N/A';
    const provider = row.getAttribute('data-provider') || 'N/A';
    const period = row.getAttribute('data-period') || 'N/A';
    const total = row.getAttribute('data-total') || 'N/A';
    const cases = row.getAttribute('data-cases') || 'N/A';

    const idNode = document.querySelector('[data-detail-id]');
    const providerNode = document.querySelector('[data-detail-provider]');
    const periodNode = document.querySelector('[data-detail-period]');
    const totalNode = document.querySelector('[data-detail-total]');
    const casesNode = document.querySelector('[data-detail-cases]');

    if (idNode) idNode.textContent = id;
    if (providerNode) providerNode.textContent = provider;
    if (periodNode) periodNode.textContent = period;
    if (totalNode) totalNode.textContent = total;
    if (casesNode) casesNode.textContent = cases;

    openModal('modal-fact-detail');
  });
}

document.querySelectorAll('[data-history-row]').forEach((row) => attachHistoryRowClick(row));

const operatorCaseButtons = Array.from(document.querySelectorAll('[data-select-case]'));
const operatorMobileButtons = Array.from(document.querySelectorAll('[data-select-mobile]'));
const selectedCaseNode = document.querySelector('[data-selected-case]');
const selectedMobileNode = document.querySelector('[data-selected-mobile]');
const selectedEtaNode = document.querySelector('[data-selected-eta]');
const assignButton = document.querySelector('[data-assign-case]');
const assignFeedback = document.querySelector('[data-assign-feedback]');
const confirmAssignmentButton = document.querySelector('[data-confirm-assignment]');
const modalCaseNode = document.querySelector('[data-modal-case]');
const modalCaseTimeNode = document.querySelector('[data-modal-case-time]');
const modalMobileNode = document.querySelector('[data-modal-mobile]');
const modalMobileZoneNode = document.querySelector('[data-modal-mobile-zone]');
const modalEtaNode = document.querySelector('[data-modal-eta]');
const modalSummaryNode = document.querySelector('[data-modal-summary]');
const modalFinalStateNode = document.querySelector('[data-modal-final-state]');
const modalFinalTransferNode = document.querySelector('[data-modal-final-transfer]');
const transferStatusNode = document.querySelector('[data-transfer-status]');
const transferNoteNode = document.querySelector('[data-transfer-note]');
const transferOptionButtons = Array.from(document.querySelectorAll('[data-transfer-option]'));

let currentCase = null;
let currentMobile = null;
let requiresTransfer = false;

function updateOperatorSelection() {
  if (selectedCaseNode) {
    selectedCaseNode.textContent = currentCase ? `${currentCase.name} (${currentCase.zone})` : 'Sin seleccionar';
  }
  if (selectedMobileNode) {
    selectedMobileNode.textContent = currentMobile ? `${currentMobile.id} (${currentMobile.zone})` : 'Sin seleccionar';
  }
  if (selectedEtaNode) {
    selectedEtaNode.textContent = currentMobile ? currentMobile.eta : '--';
  }
}

function updateTransferUI() {
  transferOptionButtons.forEach((button) => {
    const isYes = button.getAttribute('data-transfer-option') === 'yes';
    button.classList.toggle('is-active', requiresTransfer === isYes);
  });

  if (transferStatusNode) {
    transferStatusNode.textContent = requiresTransfer ? 'Traslado requerido' : 'Sin traslado';
  }
  if (transferNoteNode) {
    transferNoteNode.textContent = requiresTransfer
      ? 'Completar hospital destino e ida y vuelta si corresponde.'
      : 'No aplica hospital destino ni ida y vuelta.';
  }
  if (modalFinalTransferNode) {
    modalFinalTransferNode.textContent = requiresTransfer ? 'Si' : 'No';
  }
}

function prepareOperatorModalFromSelection() {
  if (!currentCase) return false;

  requiresTransfer = currentCase.name.toLowerCase().includes('traslado');

  if (!currentMobile) {
    currentMobile = {
      id: 'A-14',
      eta: '8 min',
      zone: 'Centro',
    };
  }

  if (modalCaseNode) {
    modalCaseNode.textContent = `${currentCase.name} - Zona ${currentCase.zone}`;
  }
  if (modalCaseTimeNode) {
    modalCaseTimeNode.textContent = currentCase.time;
  }
  if (modalMobileNode) {
    modalMobileNode.textContent = currentMobile.id;
  }
  if (modalMobileZoneNode) {
    modalMobileZoneNode.textContent = currentMobile.zone;
  }
  if (modalEtaNode) {
    modalEtaNode.textContent = currentMobile.eta;
  }
  if (modalSummaryNode) {
    modalSummaryNode.textContent = `Movil ${currentMobile.id} para ${currentCase.name}`;
  }
  if (modalFinalStateNode) {
    modalFinalStateNode.textContent = 'Pendiente de confirmacion';
  }

  updateTransferUI();

  const operatorWizard = document.querySelector('#modal-operador-step [data-wizard]');
  if (operatorWizard) {
    renderWizardStep(operatorWizard, 1);
  }

  updateOperatorSelection();
  return true;
}

operatorCaseButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const row = button.closest('[data-case-row]');
    if (!row) return;

    currentCase = {
      id: row.getAttribute('data-case-id') || '',
      name: row.getAttribute('data-case-name') || 'Caso',
      zone: row.getAttribute('data-case-zone') || '-',
      time: row.getAttribute('data-case-time') || '-',
    };

    document.querySelectorAll('[data-case-row]').forEach((item) => item.classList.remove('is-selected'));
    row.classList.add('is-selected');
    updateOperatorSelection();

    if (assignFeedback) {
      assignFeedback.textContent = `Caso seleccionado: ${currentCase.name}. Ahora elige un movil activo.`;
    }

    if (prepareOperatorModalFromSelection()) {
      openModal('modal-operador-step');
    }
  });
});

operatorMobileButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const row = button.closest('[data-mobile-row]');
    if (!row) return;

    currentMobile = {
      id: row.getAttribute('data-mobile-id') || '',
      eta: row.getAttribute('data-mobile-eta') || '--',
      zone: row.getAttribute('data-mobile-zone') || '-',
    };

    document.querySelectorAll('[data-mobile-row]').forEach((item) => item.classList.remove('is-selected'));
    row.classList.add('is-selected');
    updateOperatorSelection();

    if (assignFeedback) {
      assignFeedback.textContent = `Movil seleccionado: ${currentMobile.id}. Puedes confirmar la asignacion cuando quieras.`;
    }
  });
});

transferOptionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    requiresTransfer = button.getAttribute('data-transfer-option') === 'yes';
    updateTransferUI();
  });
});

if (assignButton) {
  assignButton.addEventListener('click', () => {
    if (!currentCase) {
      if (assignFeedback) {
        assignFeedback.textContent = 'Para asignar, selecciona primero un caso entrante.';
      }
      return;
    }

    if (prepareOperatorModalFromSelection()) {
      openModal('modal-operador-step');
    }
  });
}

if (confirmAssignmentButton) {
  confirmAssignmentButton.addEventListener('click', () => {
    if (!currentCase || !currentMobile) {
      if (assignFeedback) {
        assignFeedback.textContent = 'No se pudo confirmar: falta seleccionar caso o movil.';
      }
      return;
    }

    if (assignFeedback) {
      assignFeedback.textContent = `Caso ${currentCase.name} asignado a ${currentMobile.id} con ETA ${currentMobile.eta}. Traslado: ${requiresTransfer ? 'si' : 'no'}. Estado actualizado a Asignado.`;
    }

    if (modalFinalStateNode) {
      modalFinalStateNode.textContent = 'Asignado';
    }

    const selectedRow = document.querySelector(`[data-case-id="${currentCase.id}"]`);
    if (selectedRow) {
      const button = selectedRow.querySelector('[data-select-case]');
      if (button) {
        button.textContent = 'Asignado';
        button.setAttribute('disabled', 'true');
      }
    }

    closeModal(document.getElementById('modal-operador-step'));
  });
}

document.querySelectorAll('[data-tab-group]').forEach((group) => {
  const buttons = Array.from(group.querySelectorAll('[data-tab-target]'));
  const panels = Array.from(group.querySelectorAll('[data-tab-panel]'));
  if (!buttons.length || !panels.length) return;

  function activateTab(target) {
    buttons.forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-tab-target') === target);
    });
    panels.forEach((panel) => {
      panel.toggleAttribute('hidden', panel.getAttribute('data-tab-panel') !== target);
    });
  }

  const initial = buttons.find((button) => button.classList.contains('active'))?.getAttribute('data-tab-target')
    || buttons[0].getAttribute('data-tab-target');
  if (initial) activateTab(initial);

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-tab-target');
      if (!target) return;
      activateTab(target);
    });
  });
});
