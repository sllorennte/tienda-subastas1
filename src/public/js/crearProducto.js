// js/crearProducto.js
import { mostrarNotificacion } from './notificacion.js';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.id;

  const form = document.getElementById('form-crear-producto');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const precioInicialRaw = document.getElementById('precioInicial').value;
    const imagenesRaw = document.getElementById('imagenes').value.trim();
    const fechaExpiracionRaw = document.getElementById('fechaExpiracion').value;

    if (!titulo) {
      mostrarNotificacion('El campo "Título" es obligatorio.', 'warning');
      return;
    }

    if (!precioInicialRaw) {
      mostrarNotificacion('Debes indicar un "Precio inicial".', 'warning');
      return;
    }

    const precioInicial = parseFloat(precioInicialRaw);
    if (isNaN(precioInicial) || precioInicial < 0) {
      mostrarNotificacion('El "Precio inicial" debe ser un número positivo.', 'warning');
      return;
    }

    if (!fechaExpiracionRaw) {
      mostrarNotificacion('La "Fecha de expiración" es obligatoria.', 'warning');
      return;
    }

    const fechaExpiracion = new Date(fechaExpiracionRaw);
    if (isNaN(fechaExpiracion.getTime()) || fechaExpiracion <= new Date()) {
      mostrarNotificacion('La "Fecha de expiración" debe ser una fecha válida y futura.', 'warning');
      return;
    }

    let imagenes = [];
    if (imagenesRaw) {
      imagenes = imagenesRaw
        .split(',')
        .map(nombre => nombre.trim())
        .filter(nombre => nombre);

      const invalidas = imagenes.filter(nombre => !/\.(jpe?g|png|gif)$/i.test(nombre));
      if (invalidas.length) {
        mostrarNotificacion(`Estos nombres no son válidos (deben terminar en .jpg, .png o .gif): ${invalidas.join(', ')}`, 'warning');
        return;
      }
    }

    const payloadBody = {
      titulo,
      descripcion,
      precioInicial,
      imagenes: imagenesRaw,
      vendedor: userId,
      fechaExpiracion: fechaExpiracion.toISOString()
    };

    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payloadBody)
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarNotificacion(data.error || 'Error desconocido al crear el producto.', 'danger');
        return;
      }

      mostrarNotificacion('Producto creado con éxito', 'success');
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      mostrarNotificacion('Error de red o servidor, inténtalo de nuevo.', 'danger');
    }
  });
});
