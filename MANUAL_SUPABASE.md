# Manual de Configuración y Migración a Supabase (Nube)

**Sistema de Control de Acceso Residencial en la Nube**  
*Acceso global desde cualquier parte del mundo 24/7*

---

## ⚡ Paso 1: Crear Tu Cuenta Gratuita en Supabase (2 minutos)

1. Entra a [supabase.com](https://supabase.com/) y haz clic en **Start your project** o **Sign in with GitHub**.
2. Haz clic en **New Project**.
3. Ingresa los datos:
   - **Name:** `control-acceso-residencial`
   - **Database Password:** (Escribe una contraseña segura o genera una).
   - **Region:** Selecciona la más cercana (ejemplo: *US East (N. Virginia)* o *US West (Oregon)*).
4. Haz clic en **Create new project** y espera 1 minuto a que se cree la base de datos en la nube.

---

## 🗄️ Paso 2: Importar las Tablas en Supabase

1. En el panel izquierdo de tu proyecto en Supabase, haz clic en el icono **SQL Editor** (`>_`).
2. Haz clic en **New Query**.
3. Copia todo el contenido del archivo [`database/schema_supabase.sql`](file:///d:/Practica%20BD/database/schema_supabase.sql) de tu proyecto.
4. Pégalo en el editor y haz clic en **Run** (o presiona `Ctrl + Enter`).
5. ¡Listo! Verás el mensaje `Success. No rows returned`. Se habrán creado las tablas `residentes`, `visitantes` y `accesos` en la nube con sus políticas de acceso.

---

## 🔑 Paso 3: Obtener las Credenciales de Supabase

1. En el menú lateral de Supabase, ve a **Project Settings** (el icono de engranaje ⚙️) $\rightarrow$ **API**.
2. Copia los siguientes dos valores:
   - **Project URL** (ejemplo: `https://xyzwhatever.supabase.co`)
   - **Project API Keys** $\rightarrow$ **`anon` `public`** (un token largo).

---

## 🌐 Paso 4: Conectar la Aplicación Web

1. Abre tu página web en el navegador: [http://localhost/Practica BD/](http://localhost/Practica%20BD/) o tu enlace de GitHub Pages.
2. En la barra superior derecha, haz clic en el botón **`⚙️ Conectar Supabase`**.
3. Pega tu **Supabase URL** y tu **Supabase Anon Key**.
4. Haz clic en **Guardar y Conectar**.
5. Verás cómo el indicador cambia a **`☁️ Supabase Nube`** en color verde.

---

## 🚀 Paso 5: Publicar en GitHub Pages para Acceso Global Gratis

1. En tu repositorio de GitHub (`https://github.com/Maurivldz09/BDaccesos`), ve a **Settings** $\rightarrow$ **Pages**.
2. En **Source**, selecciona `Deploy from a branch` $\rightarrow$ Branch: `main` / Folder: `/(root)`.
3. Haz clic en **Save**.
4. En 1 minuto tendrás tu enlace público global:  
   `https://Maurivldz09.github.io/BDaccesos/`

¡Cualquier persona en el mundo podrá ingresar desde su celular o computadora y registrar o consultar accesos en tiempo real!
