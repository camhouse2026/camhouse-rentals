# CamHouse Rentals — sitio web

Catálogo de renta de equipo audiovisual con pre-cotización en línea, panel administrativo y pagos con **Wompi El Salvador**, listo para publicar en **Netlify**.

## Qué incluye

| Parte | Ruta | Descripción |
|---|---|---|
| Inicio + catálogo | `/` | Catálogo organizado por categorías (Cámaras, Ópticas, Iluminación, Gripería, Kits) con búsqueda y filtro por marca. |
| Ficha de equipo | `/producto.html?id=…` | Galería, precio por día, características, qué incluye, video. |
| Mi cotización | (panel lateral) | Lista de equipos, fechas de retiro/devolución, días, IVA y total estimado. Se envía con datos del cliente. |
| Seguimiento | `/cotizacion.html?c=…&k=…` | El cliente ve el estado, el detalle y el botón **Pagar con Wompi** cuando hay enlace. |
| Retorno de pago | `/gracias.html` | Página a la que Wompi redirige después del pago. |
| Panel | `/admin/` | Cotizaciones, equipos (con subida de fotos) y ajustes. |

### Flujo de una renta

1. El cliente arma su lista, elige fechas y envía la pre-cotización (recibe un código `CH-1001`).
2. CamHouse la ve en **Panel → Cotizaciones**: ajusta cantidades, precios, días, descuento; el panel avisa si hay posible conflicto de disponibilidad con otras rentas confirmadas en las mismas fechas.
3. Cambia el estado a **Confirmada**, guarda y presiona **Generar enlace Wompi** (anticipo o total).
4. Envía el enlace por WhatsApp o correo con un clic. El cliente también lo ve en su página de seguimiento.
5. Cuando Wompi aprueba el pago, el **webhook** marca el pago como recibido y la cotización pasa a *Anticipo pagado* o *Pagada*.
6. También se pueden registrar pagos manuales (efectivo/transferencia).

## Publicar en Netlify

1. Suba esta carpeta a un repositorio (GitHub) y en Netlify elija **Add new site → Import an existing project**. (O arrastre la carpeta con `netlify deploy --prod` desde la CLI.)
2. Configuración de build: ya viene en `netlify.toml` (carpeta publicada: `public`, funciones en `netlify/functions`). Netlify instala `@netlify/blobs` automáticamente.
3. En **Site configuration → Environment variables** agregue:

| Variable | Obligatoria | Valor |
|---|---|---|
| `ADMIN_PASSWORD` | Sí | Contraseña del panel `/admin/` |
| `ADMIN_TOKEN_SECRET` | Recomendada | Texto largo aleatorio para firmar sesiones |
| `BREVO_API_KEY` | Para correos | Clave API de Brevo (gratis, 300 correos/día). Sin ella el sitio no envía correos al cliente. |
| `EMAIL_FROM` | Para correos | Remitente verificado en Brevo (ej. hello@addictboutiquecreativa.com). Si falta, usa el correo de Ajustes. |
| `WOMPI_CLIENT_ID` | Para pagos reales | **App ID** del aplicativo en el panel de Wompi |
| `WOMPI_CLIENT_SECRET` | Para pagos reales | **API Secret** del mismo aplicativo |

4. Vuelva a publicar (Deploys → Trigger deploy) para que tome las variables.
5. **Correos al cliente (Brevo):** cree una cuenta en brevo.com, verifique el remitente (Senders & IP → Add sender) y copie la clave en SMTP & API → API Keys. El sitio envía: confirmación de pre-cotización, aviso al confirmar/generar enlace de pago (automático y con el botón "Enviar cotización por correo" del panel), copia del pagaré firmado, recibo de pago y la página "Mis cotizaciones" (el cliente escribe su correo y recibe sus enlaces).
6. **Aviso interno por Netlify Forms:** en Netlify → *Forms* habilite la detección de formularios; aparecerá el formulario `pre-cotizacion`. En *Form notifications* agregue el correo de CamHouse.
7. Entre a `/admin/` → **Ajustes** y complete el WhatsApp (con 503), correo, dirección, IVA y % de anticipo sugerido.

### Wompi

- Sin `WOMPI_CLIENT_ID`/`WOMPI_CLIENT_SECRET` el sitio trabaja en **modo prueba**: los enlaces son simulados y al abrirlos se marca el pago como aprobado. Sirve para mostrar el flujo completo antes de conectar la cuenta.
- Con credenciales, cada enlace se crea vía `POST https://api.wompi.sv/EnlacePago` y lleva su `urlWebhook` (`https://SU-DOMINIO/api/wompi/webhook`) y `urlRedirect` (`/gracias.html`). Opcionalmente registre la misma URL de webhook en el aplicativo dentro del panel de Wompi.
- El webhook valida el encabezado `wompi_hash` (HMAC-SHA256 del cuerpo con el API Secret) y, si no coincide, confirma la transacción consultando `TransaccionCompra/{id}` en Wompi.
- Recomendación: hacer una primera transacción con un aplicativo de pruebas de Wompi antes de pasar a producción.

## Reglas de negocio configurables (Panel → Ajustes)

- **Descuento por días:** hasta tres tramos (ej. 3+ días → 10 %, 7+ días → 20 %). Se aplica automáticamente sobre el equipo; en cada cotización el panel permite ajustarlo.
- **Técnico de CamHouse:** los equipos marcados "Sale únicamente con técnico de CHR" (Panel → Equipos) muestran el aviso en el sitio y agregan el cargo por día a la cotización. Vienen marcados de inicio: Venice, FX9 y FX9 kit, Dana Dolly, Nanlux Evoke 2400B y Roadrunner; ajústelos según el criterio de CamHouse.
- **Accesorios de iluminación:** subcategoría dentro de Iluminación. Agregue los accesorios desde Panel → Equipos (categoría Iluminación, subcategoría "Accesorios de iluminación").
- **Cláusulas:** texto editable que se publica en `/terminos.html`; el cliente debe aceptarlas para enviar la pre-cotización (queda registrada la fecha de aceptación).
- **Pagaré con firma electrónica:** una vez confirmada la cotización, el cliente firma desde su enlace (nombre, firma dibujada, declaración). Se guarda la firma, fecha/hora, IP y navegador, y el monto (valor de reposición de los equipos, editable por cotización; por defecto 30 días de renta de cada equipo si no se define "Valor de reposición" en la ficha). El pago con Wompi se habilita solo después de la firma. El texto del pagaré es editable en Ajustes.

> Nota legal: la firma electrónica simple registrada por el sitio sirve como evidencia del consentimiento del cliente, pero no sustituye una firma electrónica certificada ni la revisión del texto del pagaré y las cláusulas por un abogado en El Salvador. Recomendamos validarlos antes de usarlos con clientes.

## Datos

- Todo se guarda en **Netlify Blobs** (sin base de datos externa): catálogo, cotizaciones, ajustes y fotos subidas desde el panel.
- La primera vez que el sitio arranca, el catálogo se carga desde `data/seed-products.json` (83 equipos tomados del sitio actual, con fotos optimizadas en `public/img/products`). Desde ahí, los cambios se hacen en el panel.
- Precios en USD por día. Días = diferencia entre devolución y retiro (mínimo 1). El panel permite ajustar los días cobrados manualmente (por ejemplo, tarifa de fin de semana).

## Desarrollo local

```bash
npm install
npm i -g netlify-cli
echo "ADMIN_PASSWORD=prueba123" > .env
netlify dev        # http://localhost:8888
```

## Estructura

```
public/                  Sitio estático (HTML, CSS, JS, imágenes)
  admin/                 Panel administrativo
  assets/js/common.js    Encabezado, pie, carrito/cotización, utilidades
netlify/functions/
  public.mjs             /api/products, /api/settings, /api/quotes, /api/img
  admin.mjs              /api/admin/* (protegido con contraseña)
  wompi-webhook.mjs      /api/wompi/webhook
  lib/                   Datos (Blobs), autenticación, cliente de Wompi
data/seed-products.json  Inventario inicial
```
