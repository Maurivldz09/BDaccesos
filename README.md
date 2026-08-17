# 🛡️ Sistema de Control de Acceso Residencial (Full-Stack Supabase & PHP)

![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.x-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-Corporate_Slate-1572B6?style=for-the-badge&logo=css3&logoColor=white)

Sistema web administrativo y de monitoreo en tiempo real para casetas de seguridad y administración de fraccionamientos residenciales. Permite la gestión centralizada de entradas, salidas, catálogos de residentes y visitantes frecuentes, con persistencia relacional en **Supabase (PostgreSQL Cloud)** y respaldo local **MySQL / XAMPP**.

---

## 🌐 Demo en Vivo (GitHub Pages)

👉 **[https://Maurivldz09.github.io/BDaccesos/](https://Maurivldz09.github.io/BDaccesos/)**

---

## 🌟 Características Principales

- **Dashboard de Control Operativo:** Indicadores en tiempo real de ocupación dentro del fraccionamiento, salidas del día y accesos totales.
- **Registro Rápido en Caseta:** Captura de datos de visitante, identificación (INE/Licencia), residencia destino, motivo y observaciones del vehículo (placas, marca).
- **Bitácora General de Accesos:** Búsqueda en tiempo real, filtrado por estado (`EN FRACCIONAMIENTO` / `SALIDO`), registro de salida con 1 clic y exportación de reportes a **CSV / Excel**.
- **Gestión de Residentes & Visitantes:** Módulos CRUD completos para administración de condomínios y directorio de visitas.
- **Arquitectura Nube / Híbrida:** Conexión directa a **Supabase (PostgreSQL)** en la nube con respaldo para API REST PHP local.

---

## 🗄️ Modelo de Base de Datos Relacional

El sistema utiliza una estructura relacional normalizada compuesta por 3 tablas principales:

```
+------------------+         +--------------------+         +-------------------+
|    residentes    |         |      accesos       |         |    visitantes     |
+------------------+         +--------------------+         +-------------------+
| PK id            |<-------1| FK residente_id    |         | PK id             |
|    nombre        |        N| FK visitante_id    |1------->|    nombre         |
|    numero_casa   |         |    motivo          |N        |    identificacion |
|    telefono      |         |    fecha_entrada   |         |    telefono       |
|    correo        |         |    fecha_salida    |         |    tipo_visitante |
+------------------+         |    estado          |         +-------------------+
                             +--------------------+
```

---

## 🛠️ Despliegue e Instalación

### Opción 1: Nube con Supabase (Recomendado)
1. Importa el script `database/schema_supabase.sql` en tu proyecto de **Supabase (PostgreSQL)**.
2. Abre la aplicación en [GitHub Pages](https://Maurivldz09.github.io/BDaccesos/).

### Opción 2: Servidor Local (XAMPP + MySQL)
1. Clona este repositorio:
   ```bash
   git clone https://github.com/Maurivldz09/BDaccesos.git
   ```
2. Coloca la carpeta en `C:\xampp\htdocs\Practica BD`.
3. Inicia **Apache** y **MySQL** en XAMPP.
4. Importa `database/schema.sql` en **phpMyAdmin**.
5. Abre en tu navegador: `http://localhost/Practica BD/`.

---

## 📂 Estructura del Proyecto

```
├── index.html                   # Dashboard e interfaz web principal
├── styles.css                   # Sistema de diseño Corporate Slate Gray
├── app.js                       # Cliente JS (Supabase & REST API)
├── MANUAL_SUPABASE.md           # Guía de despliegue en la nube
├── MANUAL_INSTALACION_XAMPP.md  # Guía de despliegue local XAMPP
├── database/
│   ├── schema_supabase.sql      # Script DDL/DML para PostgreSQL (Supabase)
│   └── schema.sql               # Script DDL/DML para MySQL
└── api/
    ├── db.php                   # Conexión PDO a MySQL
    ├── accesos.php              # REST API para Bitácora
    ├── residentes.php           # REST API para Residentes
    ├── visitantes.php           # REST API para Visitantes
    └── stats.php                # REST API para Estadísticas
```

---

## 📄 Licencia
Este proyecto es de código abierto bajo la licencia MIT.
