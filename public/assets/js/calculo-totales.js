document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('items-body');
    if (!tableBody) return;

    const toggleItbms      = document.getElementById('incluir_itbms');
    const inputItbmsPct    = document.getElementById('itbms_porcentaje');
    const toggleAbono      = document.getElementById('toggle_abono');
    const inputAbonoPct    = document.getElementById('abono_porcentaje');
    const selectAbonoBase  = document.getElementById('abono_base');
    const toggleManoObra   = document.getElementById('toggle_mano_obra');
    const inputManoObraMto = document.getElementById('mano_obra_monto');

    // UI elements
    const uiBreakdown      = document.getElementById('ui-breakdown');
    const uiSubNeto        = document.getElementById('ui-subtotal-neto');
    const uiItbmsMonto     = document.getElementById('ui-itbms-monto');
    const uiItbmsCont      = document.getElementById('ui-itbms-container');
    const uiAbonoMonto     = document.getElementById('ui-abono-monto');
    const uiAbonoLabel     = document.getElementById('ui-abono-label');
    const uiAbonoCont      = document.getElementById('ui-abono-container');
    const uiSaldoMonto     = document.getElementById('ui-saldo-monto');
    const uiSaldoLabel     = document.getElementById('ui-saldo-label');
    const uiSaldoCont      = document.getElementById('ui-saldo-container');
    const uiTotal          = document.getElementById('ui-total-general');

    const CATEGORY_LABELS = {
        'mano_obra':  'Mano de Obra',
        'material':   'Materiales',
        'equipo':     'Equipos',
        'servicio':   'Servicios',
        'transporte': 'Transporte',
        'otros':      'Otros'
    };

    function fmt(n) { return parseFloat(n).toFixed(2); }

    function calcularTotales() {
        const subtotales = {};

        document.querySelectorAll('.item-row').forEach(function (row) {
            const cat      = row.querySelector('.item-categoria')?.value || 'material';
            const cantidad = parseFloat(row.querySelector('.item-cantidad')?.value) || 0;
            const precio   = parseFloat(row.querySelector('.item-precio')?.value)   || 0;
            const totalFila = cantidad * precio;

            const span = row.querySelector('.item-total-text');
            if (span) span.textContent = fmt(totalFila);

            if (!subtotales[cat]) subtotales[cat] = 0;
            subtotales[cat] += totalFila;
        });

        // Render breakdown
        if (uiBreakdown) {
            uiBreakdown.innerHTML = '';
            let order = ['mano_obra', 'material', 'equipo', 'servicio', 'transporte', 'otros'];
            order.forEach(cat => {
                if (subtotales[cat] && subtotales[cat] > 0) {
                    const label = CATEGORY_LABELS[cat] || cat;
                    const icon = cat === 'mano_obra' ? 'fa-helmet-safety' :
                                 cat === 'material'  ? 'fa-boxes-stacked' :
                                 cat === 'equipo'    ? 'fa-microchip' :
                                 cat === 'servicio'  ? 'fa-wrench' :
                                 cat === 'transporte'? 'fa-truck' : 'fa-ellipsis';
                    uiBreakdown.innerHTML += `
                        <div class="d-flex justify-content-between mb-2 small text-muted">
                            <span><i class="fa-solid ${icon} me-1 text-secondary"></i> ${label}:</span>
                            <span class="fw-semibold">$${fmt(subtotales[cat])}</span>
                        </div>
                    `;
                }
            });
        }

        const subtotalNeto = Object.values(subtotales).reduce((a, b) => a + b, 0);

        // Mano de Obra manual (toggle)
        let manoObraManual = 0;
        if (toggleManoObra && toggleManoObra.checked) {
            manoObraManual = parseFloat(inputManoObraMto?.value) || 0;
            if (inputManoObraMto) inputManoObraMto.disabled = false;
        } else {
            if (inputManoObraMto) inputManoObraMto.disabled = true;
        }

        const subtotalConManoObra = subtotalNeto + manoObraManual;

        // ITBMS
        let itbmsMonto = 0;
        if (toggleItbms && toggleItbms.checked) {
            const pct   = parseFloat(inputItbmsPct?.value) || 0;
            itbmsMonto  = subtotalConManoObra * (pct / 100);
            if (uiItbmsCont)   uiItbmsCont.style.display  = 'flex';
            if (inputItbmsPct) inputItbmsPct.disabled = false;
        } else {
            if (uiItbmsCont)   uiItbmsCont.style.display  = 'none';
            if (inputItbmsPct) inputItbmsPct.disabled = true;
        }

        const totalGeneral = subtotalConManoObra + itbmsMonto;

        // Abono
        if (toggleAbono && toggleAbono.checked) {
            const abonoPct  = parseFloat(inputAbonoPct?.value) || 50;
            const isManoObraBase = selectAbonoBase && selectAbonoBase.value === 'mano_obra';
            const manoObraTotal = (subtotales['mano_obra'] || 0) + manoObraManual;
            const baseCalc = isManoObraBase ? manoObraTotal : totalGeneral;

            const abonoAmt  = baseCalc * (abonoPct / 100);
            const saldoAmt  = totalGeneral - abonoAmt;

            const tagText = isManoObraBase ? 'Mano de Obra' : 'inicial';
            if (uiAbonoLabel) uiAbonoLabel.textContent = `Abono ${tagText} (${abonoPct}%):`;
            if (uiSaldoLabel) uiSaldoLabel.textContent = `Saldo restante (${100 - abonoPct}%):`;
            if (uiAbonoMonto) uiAbonoMonto.textContent = fmt(abonoAmt);
            if (uiSaldoMonto) uiSaldoMonto.textContent = fmt(saldoAmt);
            if (uiAbonoCont)  uiAbonoCont.style.display  = 'flex';
            if (uiSaldoCont)  uiSaldoCont.style.display  = 'flex';
            if (inputAbonoPct) inputAbonoPct.disabled = false;
            if (selectAbonoBase) selectAbonoBase.disabled = false;
        } else {
            if (uiAbonoCont)   uiAbonoCont.style.display  = 'none';
            if (uiSaldoCont)   uiSaldoCont.style.display  = 'none';
            if (inputAbonoPct) inputAbonoPct.disabled = true;
            if (selectAbonoBase) selectAbonoBase.disabled = true;
        }

        // Actualizar UI
        if (uiSubNeto)    uiSubNeto.textContent    = fmt(subtotalConManoObra);
        if (uiItbmsMonto) uiItbmsMonto.textContent = fmt(itbmsMonto);
        if (uiTotal)      uiTotal.textContent      = fmt(totalGeneral);
    }

    // Delegación de eventos en tabla
    tableBody.addEventListener('input', function (e) {
        if (e.target.classList.contains('item-cantidad') || e.target.classList.contains('item-precio')) {
            calcularTotales();
        }
    });
    tableBody.addEventListener('change', function (e) {
        if (e.target.classList.contains('item-categoria')) calcularTotales();
    });

    // Evento personalizado de editor-items.js
    document.addEventListener('itemsChanged', calcularTotales);

    // Toggles generales
    if (toggleItbms)      toggleItbms.addEventListener('change', calcularTotales);
    if (inputItbmsPct)    inputItbmsPct.addEventListener('input', calcularTotales);
    if (toggleAbono)      toggleAbono.addEventListener('change', calcularTotales);
    if (inputAbonoPct)    inputAbonoPct.addEventListener('input', calcularTotales);
    if (selectAbonoBase)  selectAbonoBase.addEventListener('change', calcularTotales);
    if (toggleManoObra)   toggleManoObra.addEventListener('change', calcularTotales);
    if (inputManoObraMto) inputManoObraMto.addEventListener('input', calcularTotales);

    // Cálculo inicial
    calcularTotales();
});
