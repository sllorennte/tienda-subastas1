// public/js/producto.js

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Verificar token o redirigir
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // 2) Cerrar sesión
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }

  // 3) User ID desde el payload JWT
  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.id;

  // 4) ID de producto en la query string
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    alert('ID de producto no especificado');
    return;
  }

  // ————————————————————————————————————— DOM ELEMENTS —————————————————————————————————————
  const tituloEl           = document.getElementById('titulo');
  const breadcrumbEl       = document.getElementById('titulo-breadcrumb');
  const descripcionTextEl  = document.getElementById('descripcion-texto');
  const estadoEl           = document.getElementById('estado-subasta');
  const pujaActualEl       = document.getElementById('puja-actual');
  const precioReservaEl    = document.getElementById('precio-reserva');
  const listaPujasUl       = document.getElementById('lista-pujas');

  const formPuja           = document.getElementById('form-puja');
  const inputCantidad      = document.getElementById('cantidad');
  const btnMaxPuja         = document.getElementById('btn-max-puja');
  const errorPujaEl        = document.getElementById('error-puja');

  const imagenPrincipalEl  = document.getElementById('imagen-principal');
  const thumbnailsEl       = document.getElementById('thumbnails');

  const listaResenasDiv    = document.getElementById('lista-reseñas');
  const formResena         = document.getElementById('form-reseña');
  const selectCalificacion = document.getElementById('calificacion');
  const textareaComentario = document.getElementById('comentario');
  const errorResenaEl      = document.getElementById('error-reseña');

  const tabButtons = document.querySelectorAll('.tabs-nav button[data-tab]');
  const tabPanes   = document.querySelectorAll('.tab-pane');
  const btnContactar = document.getElementById('btn-contactar-vendedor');

  // 5) Lógica de pestañas
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  let producto = null;
  let pujas     = [];

  // 6) Mostrar galería
  function showGallery(images) {
    imagenPrincipalEl.innerHTML = '';
    thumbnailsEl.innerHTML      = '';

    if (!images || images.length === 0) {
      const noImg = document.createElement('div');
      noImg.textContent = 'Sin imagen';
      noImg.style.color = '#666';
      noImg.style.padding = '2rem';
      imagenPrincipalEl.appendChild(noImg);
      return;
    }

    const mainImg = document.createElement('img');
    mainImg.src   = images[0];
    mainImg.alt   = producto.titulo;
    imagenPrincipalEl.appendChild(mainImg);

    images.forEach((url, idx) => {
      const thumb = document.createElement('img');
      thumb.src   = url;
      thumb.alt   = `${producto.titulo} miniatura`;
      if (idx === 0) thumb.classList.add('active');
      thumb.addEventListener('click', () => {
        mainImg.src = url;
        thumbnailsEl.querySelectorAll('img').forEach(i => i.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumbnailsEl.appendChild(thumb);
    });
  }

  // 7) Actualizar cuenta atrás
  function updateTime() {
    if (!producto) return;
    const fin   = new Date(producto.fechaExpiracion);
    const now   = new Date();
    const diff  = fin - now;
    if (diff <= 0) {
      estadoEl.textContent = 'Subasta cerrada';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    estadoEl.textContent = `Cierra en ${d}d ${h}h ${m}m ${s}s`;
  }

  // 8) Cargar datos del producto
  async function loadProduct() {
    try {
      const res = await fetch(`/api/productos/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      producto = await res.json();

      // Rellenar UI
      tituloEl.textContent          = producto.titulo;
      if (breadcrumbEl) breadcrumbEl.textContent = producto.titulo;
      descripcionTextEl.textContent = producto.descripcion || '';
      showGallery(producto.imagenes);
      updateTime();
      setInterval(updateTime, 1000);

      // Contactar por email
      if (btnContactar && producto.vendedor?.email) {
        btnContactar.addEventListener('click', () => {
          const subj = encodeURIComponent(`Consulta sobre "${producto.titulo}"`);
          window.location.href = `mailto:${producto.vendedor.email}?subject=${subj}`;
        });
      }
    } catch (err) {
      alert('No se pudo cargar el producto.');
      console.error(err);
    }
  }

  // 9) Cargar pujas
  async function loadPujas() {
    try {
      const res = await fetch(`/api/pujas?producto=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      pujas = await res.json();

      // Lista
      listaPujasUl.innerHTML = '';
      pujas.forEach(p => {
        const li = document.createElement('li');
        li.textContent = `€${p.cantidad.toFixed(2)} – ${p.pujador.username} (${new Date(p.fechaPuja).toLocaleString()})`;
        listaPujasUl.appendChild(li);
      });

      // Monto actual
      if (pujas.length) {
        const max = Math.max(...pujas.map(p => p.cantidad));
        pujaActualEl.textContent = `€ ${max.toFixed(2)}`;
      } else {
        pujaActualEl.textContent = `€ ${producto.precioInicial.toFixed(2)}`;
      }
    } catch {
      if (producto) {
        pujaActualEl.textContent = `€ ${producto.precioInicial.toFixed(2)}`;
      }
    }
  }

  // 10) Enviar nueva puja
  formPuja.addEventListener('submit', async e => {
    e.preventDefault();
    errorPujaEl.textContent = '';

    const val = parseFloat(inputCantidad.value);
    if (!val || val <= 0) {
      errorPujaEl.textContent = 'Ingresa una cantidad válida.';
      return;
    }
    const max = pujas.length
      ? Math.max(...pujas.map(p => p.cantidad))
      : producto.precioInicial;
    if (val <= max) {
      errorPujaEl.textContent = `La puja debe ser > €${max.toFixed(2)}.`;
      return;
    }

    try {
      const resp = await fetch('/api/pujas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ producto: id, pujador: userId, cantidad: val })
      });
      const js = await resp.json();
      if (!resp.ok) throw new Error(js.error || 'Error al pujar.');
      inputCantidad.value = '';
      await loadPujas();
    } catch (err) {
      errorPujaEl.textContent = err.message;
    }
  });

  // 11) Botón “Máx”
  btnMaxPuja.addEventListener('click', () => {
    const max = pujas.length
      ? Math.max(...pujas.map(p => p.cantidad))
      : producto.precioInicial;
    inputCantidad.value = (max + 1).toFixed(2);
    errorPujaEl.textContent = '';
  });

  // 12) Cargar reseñas
  async function loadResenas() {
    try {
      const res = await fetch(`/api/resenas?producto=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const arr = await res.json();

      listaResenasDiv.innerHTML = '';
      if (!arr.length) {
        listaResenasDiv.innerHTML = '<p class="sin-reseñas">Aún no hay reseñas.</p>';
        return;
      }

      arr.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      arr.forEach(r => {
        const card = document.createElement('div');
        card.className = 'reseña-card';
        const fecha = new Date(r.fecha).toLocaleString('es-ES');
        const stars = '★★★★★'.slice(0, r.calificacion) + '☆☆☆☆☆'.slice(r.calificacion);
        card.innerHTML = `
          <div class="reseña-header">
            <strong class="usuario">${r.usuario.username}</strong>
            <span class="reseña-rating">${stars}</span>
          </div>
          <p class="reseña-comentario">${r.comentario}</p>
          <div class="reseña-fecha">${fecha}</div>
        `;
        listaResenasDiv.appendChild(card);
      });
    } catch {
      listaResenasDiv.innerHTML = '<p class="texto-error">Error al cargar reseñas.</p>';
    }
  }

  // 13) Enviar nueva reseña
  formResena.addEventListener('submit', async e => {
    e.preventDefault();
    errorResenaEl.textContent = '';

    const cal = parseInt(selectCalificacion.value);
    const com = textareaComentario.value.trim();
    if (!cal || cal < 1 || cal > 5) {
      errorResenaEl.textContent = 'Selecciona una calificación válida.';
      return;
    }
    if (com.length < 5) {
      errorResenaEl.textContent = 'El comentario debe tener al menos 5 caracteres.';
      return;
    }

    try {
      const resp = await fetch('/api/resenas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ producto: id, calificacion: cal, comentario: com })
      });
      const js = await resp.json();
      if (!resp.ok) throw new Error(js.error || 'Error al enviar reseña.');
      selectCalificacion.value = '';
      textareaComentario.value = '';
      await loadResenas();
    } catch (err) {
      errorResenaEl.textContent = err.message;
    }
  });

  // 14) Inicializar todo
  await loadProduct();
  await loadPujas();
  await loadResenas();
});
