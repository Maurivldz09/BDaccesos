# Manual de Instalación y Despliegue en XAMPP

**Sistema Formal de Control de Acceso Residencial**  
*Tecnologías: PHP 8.x, MySQL / MariaDB, JavaScript ES6+, HTML5, CSS3*

---

## 📋 Pasos Rápidos para Desplegar en Tu Computadora

### Paso 1: Descargar e Iniciar XAMPP
1. Si no tienes XAMPP instalado, descárgalo de [apachefriends.org](https://www.apachefriends.org/).
2. Abre el **XAMPP Control Panel**.
3. Haz clic en **Start** junto a **Apache** y **MySQL**. Los módulos se pondrán en color verde.

---

### Paso 2: Copiar la Carpeta del Proyecto a `htdocs`
1. Abre tu Explorador de Archivos en Windows.
2. Copia la carpeta `Practica BD` a la siguiente ruta:
   ```
   C:\xampp\htdocs\Practica BD
   ```

---

### Paso 3: Crear la Base de Datos e Importar el Esquema SQL
1. En tu navegador web, entra a: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
2. En el menú superior, haz clic en **Importar** (o *Import*).
3. Haz clic en **Seleccionar archivo** y busca el archivo SQL ubicado en:
   ```
   C:\xampp\htdocs\Practica BD\database\schema.sql
   ```
4. Desplázate hacia abajo y haz clic en **Importar**. 
5. Se creará automáticamente la base de datos `control_fraccionamiento` con las 3 tablas relacionales (`residentes`, `visitantes`, `accesos`) y datos de prueba.

---

### Paso 4: Abrir el Sistema en Tu Navegador
1. Ingresa a la siguiente dirección en tu navegador:
   ```
   http://localhost/Practica BD/
   ```
2. ¡Listo! El indicador en la esquina inferior izquierda mostrará **🟢 MySQL Conectado**.

---

## 🛠️ Estructura de las API REST Creadas (`api/`)

- `api/db.php`: Conexión segura con MySQL mediante PDO.
- `api/accesos.php`: Endpoint para registrar entradas, marcar salidas (`UPDATE`), consultar bitácora (`SELECT`) y eliminar accesos (`DELETE`).
- `api/residentes.php`: Catálogo completo de residentes.
- `api/visitantes.php`: Catálogo completo de visitantes.
- `api/stats.php`: Métricas en tiempo real del dashboard.
