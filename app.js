/**
 * SISTEMA DE CONTROL DE ACCESO RESIDENCIAL - APP LOGIC (SUPABASE CLOUD & XAMPP DUAL)
 */

class ControlAccesoApp {
  constructor() {
    this.apiBase = 'api';
    this.supabase = null;
    this.modoConexion = 'DEMO'; // 'SUPABASE', 'XAMPP', 'DEMO'
    
    this.accesos = [];
    this.residentes = [];
    this.visitantes = [];

    // Cargar credenciales guardadas de Supabase si existen
    this.supabaseUrl = localStorage.getItem('SUPABASE_URL') || '';
    this.supabaseKey = localStorage.getItem('SUPABASE_ANON_KEY') || '';

    this.init();
  }

  async init() {
    this.setupTabs();
    this.setDefaultFechaEntrada();
    this.initSupabaseClient();
    await this.syncAll();
  }

  initSupabaseClient() {
    if (this.supabaseUrl && this.supabaseKey && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
        this.modoConexion = 'SUPABASE';
      } catch (e) {
        console.warn('⚠️ Error al inicializar Supabase:', e);
        this.supabase = null;
      }
    }
  }

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

  // SINCRONIZAR DATOS SEGÚN MODO DE CONEXIÓN
  async syncAll() {
    if (this.modoConexion === 'SUPABASE' && this.supabase) {
      const exito = await this.syncFromSupabase();
      if (exito) return;
    }

    // Intentar XAMPP PHP API
    const exitoXampp = await this.syncFromXampp();
    if (!exitoXampp) {
      // Fallback a modo Demo Local en memoria
      this.modoConexion = 'DEMO';
      this.cargarDatosDemoMock();
      this.setConnectionStatus('DEMO', '⚡ Modo Demo');
      document.getElementById('alert-db-error').style.display = 'block';
    }
  }

  // ☁️ 1. CONEXIÓN SUPABASE CLOUD (POSTGRESQL)
  async syncFromSupabase() {
    try {
      // Fetch Residentes
      const { data: resData, error: resErr } = await this.supabase
        .from('residentes')
        .select('*')
        .order('numero_casa', { ascending: true });

      if (resErr) throw resErr;
      this.residentes = resData || [];

      // Fetch Visitantes
      const { data: visData, error: visErr } = await this.supabase
        .from('visitantes')
        .select('*')
        .order('nombre', { ascending: true });

      if (visErr) throw visErr;
      this.visitantes = visData || [];

      // Fetch Accesos con JOIN a residentes y visitantes
      const { data: accData, error: accErr } = await this.supabase
        .from('accesos')
        .select(`
          id,
          motivo,
          fecha_entrada,
          fecha_salida,
          estado,
          observaciones,
          residente_id,
          visitante_id,
          residentes (nombre, numero_casa, telefono),
          visitantes (nombre, identificacion, tipo_visitante, telefono)
        `)
        .order('fecha_entrada', { ascending: false });

      if (accErr) throw accErr;

      // Mapear respuesta relacional
      this.accesos = (accData || []).map(a => ({
        id: a.id,
        residente_id: a.residente_id,
        visitante_id: a.visitante_id,
        visitante_nombre: a.visitantes?.nombre || 'Desconocido',
        visitante_id_doc: a.visitantes?.identificacion || 'N/A',
        tipo_visitante: a.visitantes?.tipo_visitante || 'Visita General',
        residente_nombre: a.residentes?.nombre || 'Desconocido',
        numero_casa: a.residentes?.numero_casa || 'N/A',
        motivo: a.motivo,
        fecha_entrada: a.fecha_entrada,
        fecha_salida: a.fecha_salida,
        estado: a.estado,
        observaciones: a.observaciones
      }));

      this.modoConexion = 'SUPABASE';
      this.setConnectionStatus('SUPABASE', '☁️ Supabase Nube');
      document.getElementById('alert-db-error').style.display = 'none';
      this.populateSelectResidentes();
      this.renderAll();
      return true;

    } catch (error) {
      console.warn('⚠️ Supabase sync error:', error);
      return false;
    }
  }

  // 🔌 2. CONEXIÓN XAMPP PHP API
  async syncFromXampp() {
    try {
      const res = await fetch(`${this.apiBase}/accesos.php`);
      if (!res.ok) throw new Error('XAMPP Offline');
      const json = await res.json();
      
      if (json.status === 'success') {
        this.accesos = json.data;

        const resR = await fetch(`${this.apiBase}/residentes.php`);
        const jsonR = await resR.json();
        this.residentes = jsonR.data || [];

        const resV = await fetch(`${this.apiBase}/visitantes.php`);
        const jsonV = await resV.json();
        this.visitantes = jsonV.data || [];

        this.modoConexion = 'XAMPP';
        this.setConnectionStatus('XAMPP', '🔌 XAMPP Local');
        document.getElementById('alert-db-error').style.display = 'none';
        this.populateSelectResidentes();
        this.renderAll();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // ⚡ 3. MOCK DEMO LOCAL
  cargarDatosDemoMock() {
    if (this.residentes.length === 0) {
      this.residentes = [
        { id: 1, nombre: 'Carlos Mendoza García', numero_casa: 'Casa 101', telefono: '555-123-4567', correo: 'carlos.mendoza@email.com' },
        { id: 2, nombre: 'María Elena López', numero_casa: 'Casa 102', telefono: '555-987-6543', correo: 'maria.lopez@email.com' },
        { id: 3, nombre: 'Roberto Fernández', numero_casa: 'Depto 201-A', telefono: '555-456-7890', correo: 'roberto.f@email.com' },
        { id: 4, nombre: 'Laura Sofía Ramírez', numero_casa: 'Casa 205', telefono: '555-321-6548', correo: 'laura.ramirez@email.com' },
        { id: 5, nombre: 'Jorge Alberto Torres', numero_casa: 'Depto 304-B', telefono: '555-789-1234', correo: 'jorge.torres@email.com' }
      ];
    }

    if (this.visitantes.length === 0) {
      this.visitantes = [
        { id: 1, nombre: 'Ana Patricia Gómez', identificacion: 'INE-84729104', telefono: '555-111-2233', tipo_visitante: 'Familiar' },
        { id: 2, nombre: 'Fernando Silva Ruiz', identificacion: 'LIC-92837129', telefono: '555-444-5566', tipo_visitante: 'Proveedor' },
        { id: 3, nombre: 'Técnico Paquetetrack (Luis Pérez)', identificacion: 'GAB-10293847', telefono: '555-777-8899', tipo_visitante: 'Servicio/Mantenimiento' },
        { id: 4, nombre: 'Claudia Ramos Morales', identificacion: 'INE-55443322', telefono: '555-999-0011', tipo_visitante: 'Visita General' },
        { id: 5, nombre: 'Ricardo Morales Vega', identificacion: 'INE-11223344', telefono: '555-666-7788', tipo_visitante: 'Familiar' }
      ];
    }

    if (this.accesos.length === 0) {
      this.accesos = [
        { id: 1, residente_id: 1, visitante_id: 1, visitante_nombre: 'Ana Patricia Gómez', visitante_id_doc: 'INE-84729104', tipo_visitante: 'Familiar', residente_nombre: 'Carlos Mendoza García', numero_casa: 'Casa 101', motivo: 'Reunión familiar', fecha_entrada: '2026-08-14T08:00', fecha_salida: '2026-08-14T12:00', estado: 'SALIDO', observaciones: 'Vehículo Sentra' },
        { id: 2, residente_id: 2, visitante_id: 2, visitante_nombre: 'Fernando Silva Ruiz', visitante_id_doc: 'LIC-92837129', tipo_visitante: 'Proveedor', residente_nombre: 'María Elena López', numero_casa: 'Casa 102', motivo: 'Entrega paquete', fecha_entrada: '2026-08-14T09:30', fecha_salida: '', estado: 'EN FRACCIONAMIENTO', observaciones: 'Camioneta Carga' }
      ];
    }

    this.populateSelectResidentes();
    this.renderAll();
  }

  setConnectionStatus(modo, text) {
    const statusBox = document.getElementById('connection-status-indicator');
    const statusText = document.getElementById('connection-status-text');

    if (modo === 'SUPABASE') {
      statusBox.className = 'connection-status connected';
      statusText.textContent = text;
    } else if (modo === 'XAMPP') {
      statusBox.className = 'connection-status connected';
      statusText.textContent = text;
    } else {
      statusBox.className = 'connection-status disconnected';
      statusText.textContent = text;
    }
  }

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
    this.renderMetrics();
    this.renderTablaAccesos();
    this.renderTablaDashboardRecent();
    this.renderTablaResidentes();
    this.renderTablaVisitantes();
  }

  renderMetrics() {
    const dentro = this.accesos.filter(a => a.estado === 'EN FRACCIONAMIENTO').length;
    const salidos = this.accesos.filter(a => a.estado === 'SALIDO').length;

    document.getElementById('stat-dentro').textContent = dentro;
    document.getElementById('stat-salidos').textContent = salidos;
    document.getElementById('stat-total-hoy').textContent = this.accesos.length;
    document.getElementById('stat-residentes').textContent = this.residentes.length;
  }

  renderTablaAccesos() {
    const tbody = document.getElementById('tabla-accesos-body');
    tbody.innerHTML = '';

    if (!this.accesos || this.accesos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay registros de accesos.</td></tr>`;
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

  filtrarAccesos() {
    const q = document.getElementById('input-busqueda').value.toLowerCase().trim();
    const estado = document.getElementById('filtro-estado').value;

    const filtrados = this.accesos.filter(a => {
      const matchText = !q || 
        (a.visitante_nombre && a.visitante_nombre.toLowerCase().includes(q)) ||
        (a.numero_casa && a.numero_casa.toLowerCase().includes(q)) ||
        (a.residente_nombre && a.residente_nombre.toLowerCase().includes(q)) ||
        (a.motivo && a.motivo.toLowerCase().includes(q));

      const matchEstado = estado === 'TODOS' || a.estado === estado;
      return matchText && matchEstado;
    });

    const tbody = document.getElementById('tabla-accesos-body');
    tbody.innerHTML = '';
    
    filtrados.forEach(acceso => {
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

  // GUARDAR ENTRADA (SUPABASE / XAMPP / DEMO)
  async guardarRegistro(event) {
    event.preventDefault();

    const nombreVisitante = document.getElementById('input-nombre-visitante').value;
    const identificacion = document.getElementById('input-identificacion').value;
    const telefonoVis = document.getElementById('input-telefono-visitante').value;
    const residenteId = parseInt(document.getElementById('select-residente').value);
    const tipoVisitante = document.getElementById('select-tipo-visitante').value;
    const motivo = document.getElementById('input-motivo').value;
    const fechaEntrada = document.getElementById('input-fecha-entrada').value;
    const fechaSalida = document.getElementById('input-fecha-salida').value;
    const observaciones = document.getElementById('input-observaciones').value;

    const estado = fechaSalida ? 'SALIDO' : 'EN FRACCIONAMIENTO';

    if (this.modoConexion === 'SUPABASE' && this.supabase) {
      try {
        // 1. Buscar o crear visitante en Supabase
        let { data: visExist } = await this.supabase
          .from('visitantes')
          .select('id')
          .eq('nombre', nombreVisitante)
          .single();

        let visitanteId = visExist?.id;

        if (!visitanteId) {
          const { data: newVis, error: vErr } = await this.supabase
            .from('visitantes')
            .insert([{ nombre: nombreVisitante, identificacion: identificacion, telefono: telefonoVis, tipo_visitante: tipoVisitante }])
            .select()
            .single();

          if (vErr) throw vErr;
          visitanteId = newVis.id;
        }

        // 2. Insertar acceso
        const { error: aErr } = await this.supabase
          .from('accesos')
          .insert([{
            residente_id: residenteId,
            visitante_id: visitanteId,
            motivo: motivo,
            fecha_entrada: fechaEntrada,
            fecha_salida: fechaSalida || null,
            estado: estado,
            observaciones: observaciones
          }]);

        if (aErr) throw aErr;

        alert('☁️ Registro guardado con éxito en Supabase Nube.');
        document.getElementById('form-registro').reset();
        this.setDefaultFechaEntrada();
        await this.syncAll();
        this.irATab('accesos');
        return;
      } catch (e) {
        alert('❌ Error al guardar en Supabase: ' + e.message);
        return;
      }
    }

    if (this.modoConexion === 'XAMPP') {
      try {
        const payload = {
          nombre_visitante: nombreVisitante, identificacion: identificacion,
          telefono_visitante: telefonoVis, residente_id: residenteId,
          tipo_visitante: tipoVisitante, motivo: motivo,
          fecha_entrada: fechaEntrada, fecha_salida: fechaSalida, observaciones: observaciones
        };

        const res = await fetch(`${this.apiBase}/accesos.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.status === 'success') {
          alert('✅ Registro guardado en MySQL.');
          document.getElementById('form-registro').reset();
          this.setDefaultFechaEntrada();
          await this.syncAll();
          this.irATab('accesos');
          return;
        }
      } catch (e) {}
    }

    // Demo local
    const newId = this.accesos.length > 0 ? Math.max(...this.accesos.map(a => a.id)) + 1 : 1;
    const residente = this.residentes.find(r => r.id === residenteId) || { nombre: 'Residente', numero_casa: 'Casa' };

    this.accesos.unshift({
      id: newId, residente_id: residenteId, visitante_id: 99,
      visitante_nombre: nombreVisitante, visitante_id_doc: identificacion, tipo_visitante: tipoVisitante,
      residente_nombre: residente.nombre, numero_casa: residente.numero_casa,
      motivo: motivo, fecha_entrada: fechaEntrada, fecha_salida: fechaSalida, estado: estado, observaciones: observaciones
    });

    alert('⚡ Registro guardado en Modo Demo.');
    document.getElementById('form-registro').reset();
    this.setDefaultFechaEntrada();
    this.renderAll();
    this.irATab('accesos');
  }

  // MARCAR SALIDA
  async marcarSalida(id) {
    if (!confirm(`¿Confirmar salida del folio #${id}?`)) return;
    const nowISO = new Date().toISOString();

    if (this.modoConexion === 'SUPABASE' && this.supabase) {
      try {
        const { error } = await this.supabase
          .from('accesos')
          .update({ fecha_salida: nowISO, estado: 'SALIDO' })
          .eq('id', id);

        if (error) throw error;
        await this.syncAll();
        return;
      } catch (e) {
        alert('❌ Error al actualizar en Supabase: ' + e.message);
        return;
      }
    }

    if (this.modoConexion === 'XAMPP') {
      try {
        await fetch(`${this.apiBase}/accesos.php`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id, accion: 'marcar_salida' })
        });
        await this.syncAll();
        return;
      } catch (e) {}
    }

    const acceso = this.accesos.find(a => a.id === id);
    if (acceso) {
      acceso.fecha_salida = nowISO;
      acceso.estado = 'SALIDO';
      this.renderAll();
    }
  }

  // MODAL CONFIGURACIÓN SUPABASE
  abrirModalSupabase() {
    document.getElementById('input-supabase-url').value = this.supabaseUrl;
    document.getElementById('input-supabase-key').value = this.supabaseKey;
    document.getElementById('modal-supabase').style.display = 'flex';
  }

  guardarConfigSupabase(event) {
    event.preventDefault();
    const url = document.getElementById('input-supabase-url').value.trim();
    const key = document.getElementById('input-supabase-key').value.trim();

    if (url && key) {
      localStorage.setItem('SUPABASE_URL', url);
      localStorage.setItem('SUPABASE_ANON_KEY', key);
      this.supabaseUrl = url;
      this.supabaseKey = key;
      this.initSupabaseClient();
      this.cerrarModales();
      this.syncAll();
      alert('☁️ Credenciales de Supabase guardadas exitosamente.');
    }
  }

  limpiarConfigSupabase() {
    localStorage.removeItem('SUPABASE_URL');
    localStorage.removeItem('SUPABASE_ANON_KEY');
    this.supabaseUrl = '';
    this.supabaseKey = '';
    this.supabase = null;
    this.modoConexion = 'DEMO';
    this.cerrarModales();
    this.syncAll();
    alert('⚡ Supabase desconectado. Modo Demo activado.');
  }

  // MODALES EDITAR ACCESO / RESIDENTE / VISITANTE
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
    const id = document.getElementById('edit-acceso-id').value;
    const motivo = document.getElementById('edit-acceso-motivo').value;
    const fSalida = document.getElementById('edit-acceso-fecha-salida').value;
    const estado = document.getElementById('edit-acceso-estado').value;
    const obs = document.getElementById('edit-acceso-observaciones').value;

    if (this.modoConexion === 'SUPABASE' && this.supabase) {
      try {
        const { error } = await this.supabase
          .from('accesos')
          .update({ motivo: motivo, fecha_salida: fSalida || null, estado: estado, observaciones: obs })
          .eq('id', id);

        if (error) throw error;
        this.cerrarModales();
        await this.syncAll();
        return;
      } catch (e) {
        alert('❌ Error: ' + e.message);
        return;
      }
    }

    this.cerrarModales();
  }

  async eliminarAcceso(id) {
    if (!confirm(`¿Eliminar folio #${id}?`)) return;

    if (this.modoConexion === 'SUPABASE' && this.supabase) {
      try {
        const { error } = await this.supabase.from('accesos').delete().eq('id', id);
        if (error) throw error;
        await this.syncAll();
        return;
      } catch (e) {
        alert('❌ Error: ' + e.message);
        return;
      }
    }

    if (this.modoConexion === 'XAMPP') {
      try {
        await fetch(`${this.apiBase}/accesos.php?id=${id}`, { method: 'DELETE' });
        await this.syncAll();
        return;
      } catch (e) {}
    }

    this.accesos = this.accesos.filter(a => a.id !== id);
    this.renderAll();
  }

  // RESIDENTES & VISITANTES CRUD
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
    const casa = document.getElementById('residente-casa').value;
    const nombre = document.getElementById('residente-nombre').value;
    const tel = document.getElementById('residente-telefono').value;
    const correo = document.getElementById('residente-correo').value;

    if (this.modoConexion === 'SUPABASE' && this.supabase) {
      try {
        if (id) {
          await this.supabase.from('residentes').update({ numero_casa: casa, nombre: nombre, telefono: tel, correo: correo }).eq('id', id);
        } else {
          await this.supabase.from('residentes').insert([{ numero_casa: casa, nombre: nombre, telefono: tel, correo: correo }]);
        }
        this.cerrarModales();
        await this.syncAll();
        return;
      } catch (e) {
        alert('❌ Error: ' + e.message);
        return;
      }
    }

    this.cerrarModales();
  }

  async eliminarResidente(id) {
    if (!confirm(`¿Eliminar residente #${id}?`)) return;
    if (this.modoConexion === 'SUPABASE' && this.supabase) {
      await this.supabase.from('residentes').delete().eq('id', id);
      await this.syncAll();
    }
  }

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
    const nombre = document.getElementById('visitante-nombre').value;
    const idDoc = document.getElementById('visitante-identificacion').value;
    const tel = document.getElementById('visitante-telefono').value;
    const tipo = document.getElementById('visitante-tipo').value;

    if (this.modoConexion === 'SUPABASE' && this.supabase) {
      try {
        if (id) {
          await this.supabase.from('visitantes').update({ nombre: nombre, identificacion: idDoc, telefono: tel, tipo_visitante: tipo }).eq('id', id);
        } else {
          await this.supabase.from('visitantes').insert([{ nombre: nombre, identificacion: idDoc, telefono: tel, tipo_visitante: tipo }]);
        }
        this.cerrarModales();
        await this.syncAll();
        return;
      } catch (e) {
        alert('❌ Error: ' + e.message);
        return;
      }
    }

    this.cerrarModales();
  }

  async eliminarVisitante(id) {
    if (!confirm(`¿Eliminar visitante #${id}?`)) return;
    if (this.modoConexion === 'SUPABASE' && this.supabase) {
      await this.supabase.from('visitantes').delete().eq('id', id);
      await this.syncAll();
    }
  }

  cerrarModales() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.style.display = 'none');
  }

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
