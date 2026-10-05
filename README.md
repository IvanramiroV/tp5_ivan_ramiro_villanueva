# Trabajo Práctico 05

## Descripción

El proyecto consiste en una página web que permite a los estudiantes consultar las salas de estudio de una biblioteca y realizar reservas de manera temporal.

La aplicación fue desarrollada utilizando Node.js, Express y EJS.

El objetivo del trabajo es comprender cómo se procesan las solicitudes mediante los middleware y cómo cada uno interviene antes de que el servidor envíe una respuesta.

## Instalación

Para instalar todas las dependencias necesarias del proyecto se debe ejecutar:

```bash
npm install
```

## Ejecución

Para iniciar el servidor:

```bash
npm start
```

Para comprobar si existen errores de sintaxis:

```bash
npm run check
```

## Rutas principales

* `GET /`: permite acceder a la página principal.
* `GET /estado`: muestra información sobre el funcionamiento del servicio.
* `GET /reservas`: muestra las reservas existentes.
* `GET /reservas/nueva`: abre el formulario para realizar una reserva.
* `GET /reservas/:id`: busca una reserva mediante su ID. Si no existe, muestra un error 404.
* `POST /reservas`: recibe los datos del formulario, los valida y registra una nueva reserva.

## Pipeline de middleware

Los middleware son funciones que se ejecutan en un determinado orden cuando llega una petición.

En este proyecto se utilizan los siguientes:

1. Morgan: registra las solicitudes que llegan al servidor y las muestra en la consola.
2. identificarSolicitud: asigna un ID a cada petición, por ejemplo `BIB-0001`.
3. medirDuracion: calcula cuánto tiempo tarda el servidor en responder.
4. expressLayouts: permite organizar las plantillas de las páginas.
5. express.static: permite utilizar archivos estáticos, como los archivos CSS.
6. express.urlencoded y express.json: permiten interpretar los datos enviados por el usuario.
7. Las rutas y el router de reservas: se encargan de procesar las diferentes solicitudes.
8. Middleware 404: se utiliza cuando la dirección solicitada no coincide con ninguna ruta existente.

## Respuestas sobre el funcionamiento

### Diferencia entre los tipos de middleware

Los middleware incorporados son herramientas que ya vienen con Express, como `express.json()` y `express.static()`.

Los middleware de terceros son librerías externas que se instalan mediante npm, como Morgan.

Los middleware personalizados son funciones creadas para este proyecto, como `identificarSolicitud` y `medirDuracion`.

### ¿Para qué se utiliza next()?

`next()` permite que la petición continúe con el siguiente middleware. Se utiliza cuando la función actual terminó su tarea y no necesita enviar una respuesta.

### ¿Por qué los parsers se ejecutan antes de validar los datos?

Los parsers permiten interpretar la información que envía el usuario. De esta forma, los datos quedan disponibles en `req.body` y luego pueden ser revisados por el middleware de validación.

### Diferencia entre alcance global, de router y de ruta

El middleware utilizado con `app.use()` puede aplicarse a las distintas solicitudes de la aplicación.

El middleware utilizado con `router.use()` se aplica solamente a las rutas que pertenecen a ese router, por ejemplo las relacionadas con `/reservas`.

En cambio, un middleware colocado directamente en una ruta solamente se ejecuta cuando se accede a esa ruta determinada.

### ¿Por qué se utiliza el evento finish?

El evento `finish` permite saber cuándo terminó de enviarse la respuesta al cliente. Esto permite calcular el tiempo total que tardó la petición.

### ¿Para qué sirve montar el router de reservas?

El router permite organizar mejor todas las rutas relacionadas con las reservas. De esta manera, se agrupan bajo `/reservas` y las rutas internas quedan más simples.

### ¿Qué diferencia hay entre el POST 302 y el GET posterior?

El código 302 indica que se debe realizar una redirección. Después de crear una reserva correctamente, el navegador realiza un nuevo `GET /reservas` para mostrar el listado actualizado.

### ¿Por qué las reservas nuevas se pierden al reiniciar el servidor?

Las reservas se guardan solamente en la memoria del programa. No se utiliza una base de datos ni archivos para almacenarlas de forma permanente.

Por eso, cuando el servidor se reinicia, las reservas nuevas desaparecen y vuelven a estar disponibles las cuatro reservas iniciales.

## Validación

Antes de guardar una reserva, el servidor comprueba que los datos ingresados sean correctos.

Se verifica que los campos no estén vacíos, que el email contenga `@`, que la sala y el turno sean opciones válidas y que la cantidad de personas sea un número entero entre 1 y 6.

Si existe algún error, se devuelve un estado 400 y se muestra nuevamente el formulario con el mensaje correspondiente.

Los datos que ya había ingresado el usuario se mantienen para evitar que tenga que completar nuevamente todo el formulario.

Si los datos son correctos, la reserva se guarda en memoria.

## Pruebas realizadas

Se probaron las principales funciones de la aplicación.

Se verificó el funcionamiento de la página de inicio, el estado del servicio, el listado de reservas, el formulario de creación, los datos válidos e inválidos, el detalle de una reserva y las rutas inexistentes.

También se comprobó que los errores de validación devuelvan correctamente el estado 400.

## Persistencia temporal

Las reservas se almacenan temporalmente en la memoria RAM.

Mientras el servidor está funcionando, las nuevas reservas permanecen disponibles. Al reiniciar la aplicación, esas reservas desaparecen y se recuperan las cuatro reservas iniciales.

## Diagramas obligatorios

### POST válido

1. Se recibe un `POST /reservas`.
2. Morgan registra la petición.
3. `identificarSolicitud` asigna un ID.
4. `medirDuracion` comienza a controlar el tiempo.
5. `express.urlencoded` interpreta los datos enviados.
6. La petición llega al `reservasRouter`.
7. Se ejecuta `prepararAreaReservas`.
8. `validarReserva` comprueba los datos.
9. Como los datos son correctos, continúa el proceso.
10. `crearReserva` guarda la reserva en memoria.
11. El servidor responde con un código 302 y redirige a `/reservas`.
12. Al finalizar, `finish` permite registrar el ID, el estado y la duración.

### POST inválido

1. Se recibe un `POST /reservas`.
2. Morgan registra la petición.
3. `identificarSolicitud` asigna un ID.
4. `medirDuracion` comienza a controlar el tiempo.
5. `express.urlencoded` interpreta los datos enviados.
6. La petición llega al `reservasRouter`.
7. Se ejecuta `prepararAreaReservas`.
8. `validarReserva` revisa los datos.
9. Se encuentra un error en la información ingresada.
10. Se responde con un estado 400.
11. Se vuelve a mostrar el formulario con el mensaje de error.
12. El proceso termina en `validarReserva` y no llega a `crearReserva`.
