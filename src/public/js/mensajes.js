// public/js/mensajes.js

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return window.location.href = 'login.html';
  }

  // Botón “Mensajes” solo redirige aquí, pero podemos volver o cerrar sesión
  document.getElementById('btn-mensajes').addEventListener('click', () => {
    // ya estamos aquí...
  });

  // …y añadir un botón “Cerrar sesión” si no lo tienes
  const li = document.createElement('button');
  // …

  // Cargar mensajes
  try {
    const res = await fetch('/api/mensajes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    const mensajes = await res.json();

    const lista = document.getElementById('lista-mensajes');
    if (mensajes.length === 0) {
      document.getElementById('no-mensajes').style.display = 'block';
      return;
    }

    mensajes.forEach(m => {
      const card = document.createElement('div');
      card.className = 'reseña-card'; // reaprovechamos estilos de tarjeta
      card.innerHTML = `
        <div class="reseña-header">
          <strong>De: ${m.remitente.username}</strong>
          <span class="reseña-fecha">${new Date(m.fecha).toLocaleString()}</span>
        </div>
        <p class="reseña-comentario">${m.texto}</p>
        <button data-id="${m._id}" class="btn-pujar btn-responder">Responder</button>
      `;
      lista.appendChild(card);
    });

    // Manejar “Responder”
    document.querySelectorAll('.btn-responder').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = e.currentTarget.dataset.id;
        const texto = prompt('Escribe tu respuesta:');
        if (!texto) return;
        await fetch(`/api/mensajes/${id}`, {
          method: 'POST',  // podrías crear una ruta /api/mensajes/:id/responder
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ texto })
        });
        alert('Respuesta enviada');
      });
    });

  } catch (err) {
    console.error(err);
    alert('No se pudieron cargar tus mensajes.');
  }
});
