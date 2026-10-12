document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('items-body');
    const btnAgregarItem = document.getElementById('btn-agregar-item');

    if (!tableBody || !btnAgregarItem) return;

    let itemIndex = document.querySelectorAll('.item-row').length || 0;

    const CATEGORIAS = [
        { value: 'mano_obra',  label: 'Mano de Obra' },
        { value: 'material',   label: 'Material' },
        { value: 'equipo',     label: 'Equipo' },
        { value: 'servicio',   label: 'Servicio' },
        { value: 'transporte', label: 'Transporte' },
        { value: 'otros',      label: 'Otros' }
    ];

    function opcionesCategorias(seleccionada) {
        return CATEGORIAS.map(c =>
            `<option value="${c.value}" ${c.value === seleccionada ? 'selected' : ''}>${c.label}</option>`
        ).join('');
    }

    // Función para crear una nueva fila
    function crearFila(datos) {
        datos = datos || {};
        const tr = document.createElement('tr');
        tr.className = 'item-row align-middle';
        tr.innerHTML = `
            <td>
                <select name="items[${itemIndex}][categoria]" class="form-select form-select-sm item-categoria">
                    ${opcionesCategorias(datos.categoria || 'material')}
                </select>
            </td>
            <td>
                <input type="number" step="0.01" min="0" name="items[${itemIndex}][cantidad]" class="form-control form-control-sm item-cantidad" value="${datos.cantidad || 1}" required>
            </td>
            <td>
                <input type="text" name="items[${itemIndex}][descripcion]" class="form-control form-control-sm item-descripcion" placeholder="Descripción del ítem" value="${(datos.descripcion || '').replace(/"/g, '&quot;')}" required>
            </td>
            <td>
                <div class="input-group input-group-sm">
                    <span class="input-group-text">$</span>
                    <input type="number" step="0.01" min="0" name="items[${itemIndex}][precio_unitario]" class="form-control item-precio" value="${datos.precio_unitario || '0.00'}" required>
                </div>
            </td>
            <td class="text-end fw-bold">
                $<span class="item-total-text">0.00</span>
            </td>
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-item" tabindex="-1">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        itemIndex++;
        return tr;
    }

    // Agregar nueva fila al hacer clic
    btnAgregarItem.addEventListener('click', function() {
        const nuevaFila = crearFila();
        tableBody.appendChild(nuevaFila);
        document.dispatchEvent(new CustomEvent('itemsChanged'));
    });

    // Agregar fila de Mano de Obra rápido
    const btnManoObra = document.getElementById('btn-agregar-mano-obra');
    if (btnManoObra) {
        btnManoObra.addEventListener('click', function() {
            const nuevaFila = crearFila({ categoria: 'mano_obra', descripcion: 'Mano de Obra' });
            tableBody.appendChild(nuevaFila);
            const inputPrecio = nuevaFila.querySelector('.item-precio');
            if (inputPrecio) {
                inputPrecio.focus();
                inputPrecio.select();
            }
            document.dispatchEvent(new CustomEvent('itemsChanged'));
        });
    }

    // Eliminar fila (delegación de eventos)
    tableBody.addEventListener('click', function(e) {
        if (e.target.closest('.btn-eliminar-item')) {
            const filas = document.querySelectorAll('.item-row');
            if (filas.length > 1) {
                e.target.closest('tr').remove();
                document.dispatchEvent(new CustomEvent('itemsChanged'));
            } else {
                Swal.fire('Atención', 'El documento debe tener al menos un ítem.', 'warning');
            }
        }
    });

    // Exponer crearFila globalmente para que editor-documento pueda pre-poblar
    window.crearFilaItem = crearFila;

    // Si la tabla está vacía al cargar, agregar una fila por defecto
    if (document.querySelectorAll('.item-row').length === 0) {
        tableBody.appendChild(crearFila());
    }
});
