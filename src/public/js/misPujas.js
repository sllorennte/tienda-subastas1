document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });
  }

  const listaContenedor = document.getElementById('lista-pujas');
  const sinPujasMsg = document.getElementById('sin-pujas');

  cargarPujas();

  async function cargarPujas() {
    try {
      const res = await fetch('/api/pujas/mias', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('No se pudo obtener las pujas');
      const pujas = await res.json();

      if (!Array.isArray(pujas) || pujas.length === 0) {
        sinPujasMsg.style.display = 'block';
        listaContenedor.innerHTML = '';
        return;
      }

      sinPujasMsg.style.display = 'none';
      listaContenedor.innerHTML = '';

      pujas.forEach(puja => {
        const fechaStr = new Date(puja.fechaPuja).toLocaleString();
        const precioInicial = puja.producto?.precioInicial?.toFixed(2) || '0.00';

        const col = document.createElement('div');
        col.className = 'col-md-4';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm';
        card.setAttribute('data-id', puja._id);
        card.setAttribute('data-producto', puja.producto?._id || '');
        card.setAttribute('data-precio-inicial', precioInicial);

        card.innerHTML = `
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${puja.producto?.titulo || 'Sin título'}</h5>
            <p class="card-text text-muted small mb-1">Tu puja: € <span class="monto-texto">${puja.cantidad.toFixed(2)}</span></p>
            <p class="card-text"><small class="puja-fecha text-secondary">${fechaStr}</small></p>
            <p class="card-text mb-1"><strong>Precio inicial:</strong> € ${precioInicial}</p>
            <p class="card-text mb-3"><strong>Estado:</strong> ${puja.producto?.estado || 'Desconocido'}</p>
            <div class="mt-auto d-flex justify-content-between puja-acciones">
              <button class="btn btn-sm btn-outline-primary btn-editar">Editar</button>
              <button class="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>
            </div>
          </div>
        `;

        col.appendChild(card);
        listaContenedor.appendChild(col);
      });

      asignarHandlers();
    } catch (err) {
      console.error(err);
      sinPujasMsg.textContent = 'Error al cargar tus pujas.';
      sinPujasMsg.style.display = 'block';
    }
  }

  function asignarHandlers() {
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async () => {
        const card = btn.closest('.card');
        const pujaId = card.getAttribute('data-id');

        try {
          const res = await fetch(`/api/pujas/${pujaId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
            card.parentElement.remove();
            if (listaContenedor.children.length === 0) {
              sinPujasMsg.style.display = 'block';
            }
          } else {
            console.warn('Puja no encontrada para eliminar:', pujaId);
          }
        } catch (err) {
          console.error('Error al eliminar la puja', err);
        }
      });
    });

    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.card');
        iniciarEdicion(card);
      });
    });
  }

  function iniciarEdicion(card) {
    if (card.classList.contains('editando')) return;
    card.classList.add('editando');

    const montoTextoElem = card.querySelector('.monto-texto');
    const montoOriginal = parseFloat(montoTextoElem.textContent);
    const precioInicial = parseFloat(card.getAttribute('data-precio-inicial'));
    const fechaElem = card.querySelector('.puja-fecha');
    const acciones = card.querySelector('.puja-acciones');

    montoTextoElem.style.display = 'none';
    acciones.style.display = 'none';

    const edicion = document.createElement('div');
    edicion.className = 'd-flex align-items-center gap-2 mt-3';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = (precioInicial + 0.01).toFixed(2);
    input.step = '0.01';
    input.value = montoOriginal.toFixed(2);
    input.className = 'form-control form-control-sm w-50';

    const btnGuardar = document.createElement('button');
    btnGuardar.textContent = 'Guardar';
    btnGuardar.className = 'btn btn-sm btn-success';

    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.className = 'btn btn-sm btn-secondary';

    edicion.appendChild(input);
    edicion.appendChild(btnGuardar);
    edicion.appendChild(btnCancelar);
    acciones.parentElement.appendChild(edicion);

    btnCancelar.addEventListener('click', () => {
      card.classList.remove('editando');
      edicion.remove();
      montoTextoElem.style.display = 'inline';
      acciones.style.display = 'flex';
    });

    btnGuardar.addEventListener('click', async () => {
      const nuevoValor = parseFloat(input.value);
      if (isNaN(nuevoValor) || nuevoValor <= precioInicial) {
        input.classList.add('is-invalid');
        return;
      }

      const pujaId = card.getAttribute('data-id');
      const productoId = card.getAttribute('data-producto');

      try {
        if (pujaId) {
          const resDel = await fetch(`/api/pujas/${pujaId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!resDel.ok) {
            console.warn('No se encontró la puja para eliminar:', pujaId);
          }
        }

        const resNew = await fetch('/api/pujas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            producto: productoId,
            cantidad: nuevoValor
          })
        });

        if (!resNew.ok) throw new Error('No se pudo guardar la nueva puja');
        const nueva = await resNew.json();

        card.setAttribute('data-id', nueva.puja._id);
        montoTextoElem.textContent = nueva.puja.cantidad.toFixed(2);
        fechaElem.textContent = new Date(nueva.puja.fechaPuja).toLocaleString();

        card.classList.remove('editando');
        edicion.remove();
        montoTextoElem.style.display = 'inline';
        acciones.style.display = 'flex';
      } catch (err) {
        console.error('Error al actualizar puja', err);
        input.classList.add('is-invalid');
      }
    });
  }
});
