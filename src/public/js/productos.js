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

  const listaProductos   = document.getElementById('lista-productos');
  const sinProductosMsg  = document.getElementById('sin-productos');
  const formFiltros      = document.getElementById('form-filtros');
  const btnLimpiar       = document.getElementById('btn-limpiar');

  const inputPrecioMin   = document.getElementById('precio-min');
  const inputPrecioMax   = document.getElementById('precio-max');
  const inputFechaExp    = document.getElementById('fecha-expiracion');
  const selectCategoria  = document.getElementById('categoria');

  let todosProductos = [];

  cargarTodosProductos();

  async function cargarTodosProductos() {
    try {
      const res = await fetch('/api/productos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al obtener productos');

      const data = await res.json();
      todosProductos = Array.isArray(data.productos) ? data.productos : [];
      poblarSelectCategorias(todosProductos);
      mostrarListado(todosProductos);
    } catch (err) {
      console.error(err);
      sinProductosMsg.textContent = 'Error al cargar productos. Intenta recargar la página.';
      sinProductosMsg.classList.remove('d-none');
    }
  }

  function poblarSelectCategorias(productos) {
    const categoriasSet = new Set();
    productos.forEach(p => {
      if (p.categoria) categoriasSet.add(p.categoria);
    });

    selectCategoria.innerHTML = '<option value="">-- Todas --</option>';
    categoriasSet.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      selectCategoria.appendChild(opt);
    });
  }

  function mostrarListado(productos) {
    listaProductos.innerHTML = '';

    if (!Array.isArray(productos) || productos.length === 0) {
      sinProductosMsg.classList.remove('d-none');
      return;
    }

    sinProductosMsg.classList.add('d-none');

    productos.forEach(p => {
      const imagen = (Array.isArray(p.imagenes) && p.imagenes.length)
        ? p.imagenes[0]
        : 'css/placeholder.png';

      const fechaExpStr = new Date(p.fechaExpiracion).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });

      const col = document.createElement('div');
      col.className = 'col-md-4';

      col.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${imagen}" class="card-img-top" alt="${p.titulo}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title text-primary">${p.titulo}</h5>
            <p class="card-text text-muted">${p.descripcion || ''}</p>
            <ul class="list-unstyled small mb-3">
              <li><strong>Precio inicial:</strong> €${p.precioInicial.toFixed(2)}</li>
              <li><strong>Categoría:</strong> ${p.categoria || '—'}</li>
              <li><strong>Caduca:</strong> ${fechaExpStr}</li>
            </ul>
            <a href="producto.html?id=${p._id}" class="btn btn-outline-primary mt-auto">Ver subasta</a>
          </div>
        </div>
      `;
      listaProductos.appendChild(col);
    });
  }

  formFiltros.addEventListener('submit', e => {
    e.preventDefault();

    const vMin = parseFloat(inputPrecioMin.value) || 0;
    const vMax = parseFloat(inputPrecioMax.value) || Infinity;
    const fechaExpFiltro = inputFechaExp.value ? new Date(inputFechaExp.value) : null;
    const catFiltro = selectCategoria.value;

    const filtrados = todosProductos.filter(p => {
      const precio = parseFloat(p.precioInicial);
      const fechaExp = new Date(p.fechaExpiracion);
      const cat = p.categoria || '';

      if (precio < vMin || precio > vMax) return false;
      if (fechaExpFiltro && fechaExp > fechaExpFiltro) return false;
      if (catFiltro && cat !== catFiltro) return false;

      return true;
    });

    mostrarListado(filtrados);
  });

  btnLimpiar.addEventListener('click', () => {
    inputPrecioMin.value = '';
    inputPrecioMax.value = '';
    inputFechaExp.value  = '';
    selectCategoria.value = '';
    mostrarListado(todosProductos);
  });
});
