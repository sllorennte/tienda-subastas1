// import { mostrarNotificacion } from './notificacion.js'; // Descomenta si usas el sistema de notificaciones

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-login');
  const usuarioInput = document.getElementById('usuario');
  const contrasenaInput = document.getElementById('contrasena');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const usuario = usuarioInput.value.trim();
    const contrasena = contrasenaInput.value;

    if (!usuario) {
      // mostrarNotificacion('El campo "Usuario" es obligatorio.', 'warning');
      return;
    }

    if (!contrasena) {
      // mostrarNotificacion('El campo "Contraseña" es obligatorio.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usuario, password: contrasena })
      });

      const data = await res.json();

      if (!res.ok) {
        // mostrarNotificacion(data.error || 'Credenciales incorrectas.', 'danger');
        return;
      }

      localStorage.setItem('token', data.token);

      const payload = JSON.parse(atob(data.token.split('.')[1]));
      const rol = payload.rol;

      if (rol === 'admin') {
        window.location.href = '/index_admin.html';
      } else if (rol === 'usuario') {
        window.location.href = '/index.html';
      } else {
        window.location.href = '/';
      }

    } catch (err) {
      console.error(err);
      // mostrarNotificacion('Error de red o servidor al iniciar sesión.', 'danger');
    }
  });

  const btnCancelar = document.querySelector('.btn-outline-secondary');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
      usuarioInput.value = '';
      contrasenaInput.value = '';
    });
  }
});
