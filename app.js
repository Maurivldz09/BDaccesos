/**
 * SISTEMA DE CONTROL DE ACCESO RESIDENCIAL - CLIENT LOGIC (XAMPP CONNECTED)
 * Conexión nativa mediante API REST PHP (PDO + MySQL)
 */

class ControlAccesoApp {
  constructor() {
    this.apiBase = 'api';
    this.accesos = [];
    this.residentes = [];
    this.visitantes = [];
    this.dbConnected = false;

    this.init();
  }

  async init() {
    this.setupTabs();
    this.setDefaultFechaEntrada();
    await this.syncAll();
  }

  // CONFIGURACIÓN DE PESTAÑAS (TABS)
  setupTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        const tabId = item.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(tab => {
          tab.classList.remove('active');
        });
        document.getElementById(`tab-${tabId}`).classList.add('active');
      });
    });
  }

  irATab(tabId) {
    const item = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (item) item.click();
  }

  // NAVEGACIÓN Y SINCRONIZACIÓN DE DATOS DESDE MYSQL (XAMPP)
  async syncAll() {
    try {
      await Promise.all([
        this.fetchStats(),
        this.fetchResidentes(),
        this.fetchVisitantes(),
        this.fetchAccesos()
      ]);
      
      this.setConnectionStatus(true);
      document.getElementById('alert-db-error').style.display = 'none';
      this.renderAll();
    } catch (error) {
      console.warn('⚠️ Error conectando con API MySQL en XAMPP:', error);
      this.setConnectionStatus(false);
      document.getElementById('alert-db-error').style.display = 'block';
    }
  }

  setConnectionStatus(connected) {
    this.dbConnected = connected;
    const statusBox = document.getElementById('connection-status-indicator');
    const statusText = document.getElementById('connection-status-text');

    if (connected) {
      statusBox.className = 'connection-status connected';
      statusText.textContent = 'MySQL Conectado';
    } else {
      statusBox.className = 'connection-status disconnected';
      statusText.textContent = 'Sin Conexión XAMPP';
    }
  }

  // 1. FETCH ESTADÍSTICAS
  async fetchStats() {
    try {
      const res = await fetch(`${this.apiBase}/stats.php`);
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      if (json.status === 'success') {
        document.getElementById('stat-dentro').textContent = json.data.dentro;
        document.getElementById('stat-salidos').textContent = json.data.salidos_hoy;
        document.getElementById('stat-total-hoy').textContent = json.data.total_hoy;
        document.getElementById('stat-residentes').textContent = json.data.total_residentes;
      }
    } catch (e) {
      throw e;
    }
  }

  // 2. FETCH RESIDENTES
  async fetchResidentes() {
    try {
      const res = await fetch(`${this.apiBase}/residentes.php`);
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      if (json.status === 'success') {
        this.residentes = json.data;
        this.populateSelectResidentes();
        this.renderTablaResidentes();
      }
    } catch (e) {
      throw e;
    }
  }

  // 3. FETCH VISITANTES
  async fetchVisitantes() {
    try {
      const res = await fetch(`${this.apiBase}/visitantes.php`);
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      if (json.status === 'success') {
        this.visitantes = json.data;
        this.renderTablaVisitantes();
      }
    } catch (e) {
      throw e;
    }
  }

  // 4. FETCH ACCESOS (BITÁCORA)
  async fetchAccesos(query = '', estado = 'TODOS') {
    try {
      const url = `${this.apiBase}/accesos.php?q=${encodeURIComponent(query)}&estado=${encodeURIComponent(estado)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      if (json.status === 'success') {
        this.accesos = json.data;
        this.renderTablaAccesos();
        this.renderTablaDashboardRecent();
      }
    } catch (e) {
      throw e;
    }
  }

  // LLENAR SELECT DE RESIDENTES
  populateSelectResidentes() {
    const select = document.getElementById('select-residente');
    select.innerHTML = '<option value="">-- Seleccione una Casa o Departamento --</option>';
    this.residentes.forEach(r => {
      select.innerHTML += `<option value="${r.id}">${r.numero_casa} - ${r.nombre}</option>`;
    });
  }

  setDefaultFechaEntrada() {
    const now = new Date();
    const nowISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('input-fecha-entrada').value = nowISO;
  }

  renderAll() {
    this.renderTablaAccesos();
    this.renderTablaDashboardRecent();
    this.renderTablaResidentes();
    this.renderTablaVisitantes();
  }

  // RENDERIZAR TABLA PRINCIPAL DE ACCESOS
  renderTablaAccesos() {
    const tbody = document.getElementById('tabla-accesos-body');
    tbody.innerHTML = '';

    if (!this.accesos || this.accesos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay registros de accesos encontrados.</td></tr>`;
      return;
    }

    this.accesos.forEach(acceso => {
      const fEntrada = this.formatFecha(acceso.fecha_entrada);
      const fSalida = acceso.fecha_salida ? this.formatFecha(acceso.fecha_salida) : '<span style="color:var(--text-dim)">En Fraccionamiento</span>';

      const esDentro = acceso.estado === 'EN FRACCIONAMIENTO';
      const statusBadge = esDentro 
        ? `<span class="status-badge dentro"><span class="status-dot"></span> EN FRACCIONAMIENTO</span>`
        : `<span class="status-badge salido"><span class="status-dot"></span> SALIDO</span>`;

      const btnMarcarSalida = esDentro 
        ? `<button class="btn btn-success" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="app.marcarSalida(${acceso.id})">✔ Marcar Salida</button>`
        : '';

      tbody.innerHTML += `
        <tr>
          <td><strong>#${acceso.id}</strong></td>
          <td>
            <strong>${this.escapeHTML(acceso.visitante_nombre)}</strong><br>
            <small style="color:var(--text-muted)">${acceso.visitante_id_doc} (${acceso.tipo_visitante})</small>
          </td>
          <td>
            <strong style="color:var(--primary)">${acceso.numero_casa}</strong><br>
            <small style="color:var(--text-muted)">${this.escapeHTML(acceso.residente_nombre)}</small>
          </td>
          <td>${this.escapeHTML(acceso.motivo)}</td>
          <td>${fEntrada}</td>
          <td>${fSalida}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${btnMarcarSalida}
              <button class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="app.abrirEditarAcceso(${acceso.id})">✏️</button>
              <button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="app.eliminarAcceso(${acceso.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  // RENDERIZAR TABLA RECIENTES EN DASHBOARD (TOP 5)
  renderTablaDashboardRecent() {
    const tbody = document.getElementById('tabla-dashboard-recent-body');
    tbody.innerHTML = '';

    const recientes = (this.accesos || []).slice(0, 5);

    if (recientes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay registros recientes.</td></tr>`;
      return;
    }

    recientes.forEach(acceso => {
      const fEntrada = this.formatFecha(acceso.fecha_entrada);
      const fSalida = acceso.fecha_salida ? this.formatFecha(acceso.fecha_salida) : '<span style="color:var(--text-dim)">Dentro</span>';

      const esDentro = acceso.estado === 'EN FRACCIONAMIENTO';
      const statusBadge = esDentro 
        ? `<span class="status-badge dentro"><span class="status-dot"></span> EN FRACCIONAMIENTO</span>`
        : `<span class="status-badge salido"><span class="status-dot"></span> SALIDO</span>`;

      const btnMarcarSalida = esDentro 
        ? `<button class="btn btn-success" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.marcarSalida(${acceso.id})">Registrar Salida</button>`
        : `<span style="color:var(--text-dim); font-size:0.8rem;">Completado</span>`;

      tbody.innerHTML += `
        <tr>
          <td><strong>#${acceso.id}</strong></td>
          <td><strong>${this.escapeHTML(acceso.visitante_nombre)}</strong></td>
          <td><strong style="color:var(--primary)">${acceso.numero_casa}</strong> (${this.escapeHTML(acceso.residente_nombre)})</td>
          <td>${this.escapeHTML(acceso.motivo)}</td>
          <td>${fEntrada}</td>
          <td>${fSalida}</td>
          <td>${statusBadge}</td>
          <td>${btnMarcarSalida}</td>
        </tr>
      `;
    });
  }

  // RENDERIZAR RESIDENTES
  renderTablaResidentes() {
    const tbody = document.getElementById('tabla-residentes-body');
    tbody.innerHTML = '';

    this.residentes.forEach(r => {
      tbody.innerHTML += `
        <tr>
          <td>#${r.id}</td>
          <td><span style="color:var(--primary); font-weight:700;">${r.numero_casa}</span></td>
          <td><strong>${this.escapeHTML(r.nombre)}</strong></td>
          <td>${r.telefono || 'N/A'}</td>
          <td>${r.correo || 'N/A'}</td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.abrirModalResidente(${r.id})">✏️</button>
              <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.eliminarResidente(${r.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  // RENDERIZAR VISITANTES
  renderTablaVisitantes() {
    const tbody = document.getElementById('tabla-visitantes-body');
    tbody.innerHTML = '';

    this.visitantes.forEach(v => {
      tbody.innerHTML += `
        <tr>
          <td>#${v.id}</td>
          <td><strong>${this.escapeHTML(v.nombre)}</strong></td>
          <td>${v.identificacion}</td>
          <td>${v.telefono || 'N/A'}</td>
          <td><span class="status-badge dentro" style="font-size:0.7rem;">${v.tipo_visitante}</span></td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.abrirModalVisitante(${v.id})">✏️</button>
              <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.eliminarVisitante(${v.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  // FILTRAR ACCESOS
  async filtrarAccesos() {
    const q = document.getElementById('input-busqueda').value;
    const estado = document.getElementById('filtro-estado').value;
    await this.fetchAccesos(q, estado);
  }

  // GUARDAR REGISTRO DE ACCESO (POST EN MYSQL)
  async guardarRegistro(event) {
    event.preventDefault();

    const payload = {
      nombre_visitante: document.getElementById('input-nombre-visitante').value,
      identificacion: document.getElementById('input-identificacion').value,
      telefono_visitante: document.getElementById('input-telefono-visitante').value,
      residente_id: parseInt(document.getElementById('select-residente').value),
      tipo_visitante: document.getElementById('select-tipo-visitante').value,
      motivo: document.getElementById('input-motivo').value,
      fecha_entrada: document.getElementById('input-fecha-entrada').value,
      fecha_salida: document.getElementById('input-fecha-salida').value,
      observaciones: document.getElementById('input-observaciones').value
    };

    try {
      const res = await fetch(`${this.apiBase}/accesos.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.status === 'success') {
        alert('✅ Entrada de visitante registrada exitosamente en MySQL.');
        document.getElementById('form-registro').reset();
        this.setDefaultFechaEntrada();
        await this.syncAll();
        this.irATab('accesos');
      } else {
        alert('❌ Error al guardar: ' + json.message);
      }
    } catch (e) {
      alert('❌ Error de conexión al guardar el registro.');
    }
  }

  // MARCAR SALIDA (PUT EN MYSQL)
  async marcarSalida(id) {
    if (!confirm(`¿Confirmar salida del visitante folio #${id}?`)) return;

    try {
      const res = await fetch(`${this.apiBase}/accesos.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, accion: 'marcar_salida' })
      });

      const json = await res.json();
      if (json.status === 'success') {
        await this.syncAll();
      } else {
        alert('❌ Error: ' + json.message);
      }
    } catch (e) {
      alert('❌ Error al actualizar en el servidor.');
    }
  }

  // EDITAR ACCESO
  abrirEditarAcceso(id) {
    const acceso = this.accesos.find(a => parseInt(a.id) === parseInt(id));
    if (!acceso) return;

    document.getElementById('edit-acceso-id').value = acceso.id;
    document.getElementById('edit-acceso-motivo').value = acceso.motivo;
    document.getElementById('edit-acceso-fecha-salida').value = acceso.fecha_salida ? acceso.fecha_salida.replace(' ', 'T').slice(0, 16) : '';
    document.getElementById('edit-acceso-estado').value = acceso.estado;
    document.getElementById('edit-acceso-observaciones').value = acceso.observaciones || '';

    document.getElementById('modal-editar-acceso').style.display = 'flex';
  }

  async guardarEdicionAcceso(event) {
    event.preventDefault();

    const payload = {
      id: document.getElementById('edit-acceso-id').value,
      motivo: document.getElementById('edit-acceso-motivo').value,
      fecha_salida: document.getElementById('edit-acceso-fecha-salida').value,
      estado: document.getElementById('edit-acceso-estado').value,
      observaciones: document.getElementById('edit-acceso-observaciones').value
    };

    try {
      const res = await fetch(`${this.apiBase}/accesos.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.status === 'success') {
        this.cerrarModales();
        await this.syncAll();
      } else {
        alert('❌ Error: ' + json.message);
      }
    } catch (e) {
      alert('❌ Error al guardar edición.');
    }
  }

  // ELIMINAR ACCESO (DELETE EN MYSQL)
  async eliminarAcceso(id) {
    if (!confirm(`¿Eliminar permanentemente el folio de acceso #${id} de la base de datos MySQL?`)) return;

    try {
      const res = await fetch(`${this.apiBase}/accesos.php?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.status === 'success') {
        await this.syncAll();
      } else {
        alert('❌ Error al eliminar: ' + json.message);
      }
    } catch (e) {
      alert('❌ Error de conexión al eliminar.');
    }
  }

  // CRUD RESIDENTES
  abrirModalResidente(id = null) {
    const modal = document.getElementById('modal-residente');
    const titulo = document.getElementById('modal-residente-titulo');
    
    if (id) {
      const r = this.residentes.find(item => parseInt(item.id) === parseInt(id));
      if (r) {
        titulo.innerHTML = '<span>✏️</span> Editar Residente';
        document.getElementById('residente-id').value = r.id;
        document.getElementById('residente-casa').value = r.numero_casa;
        document.getElementById('residente-nombre').value = r.nombre;
        document.getElementById('residente-telefono').value = r.telefono || '';
        document.getElementById('residente-correo').value = r.correo || '';
      }
    } else {
      titulo.innerHTML = '<span>🏘️</span> Registrar Nuevo Residente';
      document.getElementById('form-residente').reset();
      document.getElementById('residente-id').value = '';
    }

    modal.style.display = 'flex';
  }

  async guardarResidente(event) {
    event.preventDefault();
    const id = document.getElementById('residente-id').value;

    const payload = {
      id: id,
      numero_casa: document.getElementById('residente-casa').value,
      nombre: document.getElementById('residente-nombre').value,
      telefono: document.getElementById('residente-telefono').value,
      correo: document.getElementById('residente-correo').value
    };

    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(`${this.apiBase}/residentes.php`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.status === 'success') {
        this.cerrarModales();
        await this.syncAll();
      } else {
        alert('❌ Error: ' + json.message);
      }
    } catch (e) {
      alert('❌ Error al guardar residente.');
    }
  }

  async eliminarResidente(id) {
    if (!confirm(`¿Eliminar residente #${id}? Se eliminarán también sus accesos asociados en cascada.`)) return;

    try {
      const res = await fetch(`${this.apiBase}/residentes.php?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.status === 'success') {
        await this.syncAll();
      } else {
        alert('❌ Error al eliminar: ' + json.message);
      }
    } catch (e) {
      alert('❌ Error al conectar.');
    }
  }

  // CRUD VISITANTES
  abrirModalVisitante(id = null) {
    const modal = document.getElementById('modal-visitante');
    const titulo = document.getElementById('modal-visitante-titulo');

    if (id) {
      const v = this.visitantes.find(item => parseInt(item.id) === parseInt(id));
      if (v) {
        titulo.innerHTML = '<span>✏️</span> Editar Visitante';
        document.getElementById('visitante-id').value = v.id;
        document.getElementById('visitante-nombre').value = v.nombre;
        document.getElementById('visitante-identificacion').value = v.identificacion;
        document.getElementById('visitante-telefono').value = v.telefono || '';
        document.getElementById('visitante-tipo').value = v.tipo_visitante;
      }
    } else {
      titulo.innerHTML = '<span>👤</span> Registrar Nuevo Visitante';
      document.getElementById('form-visitante').reset();
      document.getElementById('visitante-id').value = '';
    }

    modal.style.display = 'flex';
  }

  async guardarVisitante(event) {
    event.preventDefault();
    const id = document.getElementById('visitante-id').value;

    const payload = {
      id: id,
      nombre: document.getElementById('visitante-nombre').value,
      identificacion: document.getElementById('visitante-identificacion').value,
      telefono: document.getElementById('visitante-telefono').value,
      tipo_visitante: document.getElementById('visitante-tipo').value
    };

    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(`${this.apiBase}/visitantes.php`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.status === 'success') {
        this.cerrarModales();
        await this.syncAll();
      } else {
        alert('❌ Error: ' + json.message);
      }
    } catch (e) {
      alert('❌ Error al guardar visitante.');
    }
  }

  async eliminarVisitante(id) {
    if (!confirm(`¿Eliminar visitante #${id}?`)) return;

    try {
      const res = await fetch(`${this.apiBase}/visitantes.php?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.status === 'success') {
        await this.syncAll();
      } else {
        alert('❌ Error al eliminar: ' + json.message);
      }
    } catch (e) {
      alert('❌ Error al conectar.');
    }
  }

  cerrarModales() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.style.display = 'none');
  }

  // EXPORTAR BITÁCORA A CSV
  exportarCSV() {
    if (!this.accesos || this.accesos.length === 0) {
      alert('No hay registros de accesos para exportar.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Folio,Visitante,Identificacion,Tipo Visitante,Residente,Casa,Motivo,Fecha Entrada,Fecha Salida,Estado\n";

    this.accesos.forEach(a => {
      const fila = [
        a.id,
        `"${a.visitante_nombre}"`,
        `"${a.visitante_id_doc}"`,
        `"${a.tipo_visitante}"`,
        `"${a.residente_nombre}"`,
        `"${a.numero_casa}"`,
        `"${a.motivo}"`,
        `"${a.fecha_entrada}"`,
        `"${a.fecha_salida || ''}"`,
        `"${a.estado}"`
      ].join(",");
      csvContent += fila + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bitacora_accesos_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatFecha(fechaISO) {
    if (!fechaISO) return '';
    const date = new Date(fechaISO);
    return date.toLocaleString('es-MX', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Inicializar app globalmente
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new ControlAccesoApp();
});
