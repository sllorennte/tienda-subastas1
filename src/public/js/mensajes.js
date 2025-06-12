import { mostrarNotificacion } from './notificacion.js';

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return window.location.href = 'login.html';
  }

  const listaMensajes = document.getElementById('lista-mensajes');
  const sinMensajes = document.getElementById('no-mensajes');
  const modal = new bootstrap.Modal(document.getElementById('modal-respuesta'));
  const inputRespuesta = document.getElementById('input-respuesta');
  const btnEnviarRespuesta = document.getElementById('btn-enviar-respuesta');
  let mensajeIdSeleccionado = null;

  try {
    const res = await fetch('/api/mensajes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar mensajes');
    const mensajes = await res.json();

    if (!Array.isArray(mensajes) || mensajes.length === 0) {
      sinMensajes.style.display = 'block';
      return;
    }

    sinMensajes.style.display = 'none';

    mensajes.forEach(m => {
      const card = document.createElement('div');
      card.className = 'card shadow-sm mb-3';

      const fechaFormateada = new Date(m.fecha).toLocaleString();

      card.innerHTML = `
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>De: ${m.remitente.username}</strong>
            <small class="text-muted">${fechaFormateada}</small>
          </div>
          <p class="card-text">${m.texto}</p>
          <button data-id="${m._id}" class="btn btn-outline-primary btn-sm btn-responder">Responder</button>
        </div>
      `;
      listaMensajes.appendChild(card);
    });

    document.querySelectorAll('.btn-responder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        mensajeIdSeleccionado = e.currentTarget.dataset.id;
        inputRespuesta.value = '';
        modal.show();
      });
    });

    btnEnviarRespuesta.addEventListener('click', async () => {
      const texto = inputRespuesta.value.trim();
      if (!texto) {
        mostrarNotificacion('Debes escribir una respuesta antes de enviarla.', 'warning');
        return;
      }

      try {
        const res = await fetch(`/api/mensajes/${mensajeIdSeleccionado}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ texto })
        });

        if (res.ok) {
          modal.hide();
          mostrarNotificacion('Respuesta enviada correctamente.', 'success');
        } else {
          mostrarNotificacion('Error al enviar la respuesta.', 'danger');
        }
      } catch (err) {
        console.error('Error al enviar la respuesta:', err);
        mostrarNotificacion('Error de red al enviar la respuesta.', 'danger');
      }
    });

  } catch (err) {
    console.error(err);
    sinMensajes.textContent = 'Error al cargar tus mensajes.';
    sinMensajes.style.display = 'block';
  }
});
