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

      const fechaExp = new Date(p.fechaExpiracion);
      const fechaExpStr = fechaExp.toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });

      const card = document.createElement('article');
      card.className = 'product-card';

      card.innerHTML = `
        <div class="product-card__media">
          <img src="${imagen}" alt="${p.titulo}">
        </div>
        <div class="product-card__body">
          <h3>${p.titulo}</h3>
          <p>${p.descripcion ? p.descripcion : 'Sin descripción disponible.'}</p>
          <div class="product-card__meta">
            <span><strong>Inicial:</strong> €${Number(p.precioInicial).toFixed(2)}</span>
            <span><strong>Caduca:</strong> ${fechaExpStr}</span>
            <span><strong>Categoría:</strong> ${p.categoria || '—'}</span>
            <span><strong>Pujas:</strong> ${Array.isArray(p.pujas) ? p.pujas.length : 0}</span>
          </div>
          <div class="product-card__actions">
            <a href="producto.html?id=${p._id}" class="btn btn-primary">Ver detalles de la subasta</a>
          </div>
        </div>
      `;

      listaProductos.appendChild(card);
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
