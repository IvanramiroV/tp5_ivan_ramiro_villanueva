const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "views");
app.use(expressLayouts);
app.set("layout", "layouts/main");

// 1. Morgan (terceros)
app.use(morgan("dev"));

// 2. Middleware personalizado global: Identificador de solicitud
let secuenciaSolicitudes = 0;
const identificarSolicitud = (req, res, next) => {
  secuenciaSolicitudes++;
  res.locals.solicitudId = `BIB-${String(secuenciaSolicitudes).padStart(4, "0")}`;
  next();
};
app.use(identificarSolicitud);

// 3. Middleware personalizado global: Medición de duración con finish
const medirDuracion = (req, res, next) => {
  const tiempoInicio = Date.now();
  res.on("finish", () => {
    const duracionMs = Date.now() - tiempoInicio;
    console.log(`finish: ID=${res.locals.solicitudId} | Método=${req.method} | URL=${req.originalUrl} | Estado=${res.statusCode} | Duración=${duracionMs}ms`);
  });
  next();
};
app.use(medirDuracion);

// 4. Middlewares incorporados (parsers y estáticos)
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Datos iniciales en memoria (4 reservas propias)
let listadoReservas = [
  { id: 1, estudiante: "Lucas Navarro", email: "lucas.n@mail.com", sala: "Sala Norte", fecha: "2026-10-15", turno: "Mañana", personas: 3 },
  { id: 2, estudiante: "Sofía Medina", email: "sofia.m@mail.com", sala: "Sala Sur", fecha: "2026-10-15", turno: "Tarde", personas: 2 },
  { id: 3, estudiante: "Mateo Figueroa", email: "mateo.f@mail.com", sala: "Sala Multimedia", fecha: "2026-10-16", turno: "Noche", personas: 5 },
  { id: 4, estudiante: "Agustina Paz", email: "agus.paz@mail.com", sala: "Sala Norte", fecha: "2026-10-17", turno: "Mañana", personas: 1 }
];
let contadorId = 5;

const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
const turnosPermitidos = ["Mañana", "Tarde", "Noche"];

// Rutas de aplicación
app.get("/", (req, res) => {
  res.render("reservas/inicio", { titulo: "Inicio - Salas de Estudio" });
});

app.get("/estado", (req, res) => {
  res.json({
    servicio: "activo",
    reservas: listadoReservas.length,
    solicitudId: res.locals.solicitudId
  });
});

// Router de reservas montado bajo /reservas
const reservasRouter = express.Router();

// Middleware de área del router
const prepararAreaReservas = (req, res, next) => {
  res.locals.seccion = "Reservas de salas";
  next();
};
reservasRouter.use(prepararAreaReservas);

// Middleware de validación para el POST
const validarReserva = (req, res, next) => {
  let { estudiante, email, sala, fecha, turno, personas } = req.body;

  estudiante = estudiante ? estudiante.trim() : "";
  email = email ? email.trim() : "";
  sala = sala ? sala.trim() : "";
  fecha = fecha ? fecha.trim() : "";
  turno = turno ? turno.trim() : "";
  const cantidadPersonas = Number(personas);

  let errorMensaje = null;

  if (!estudiante) {
    errorMensaje = "El nombre del estudiante es obligatorio.";
  } else if (!email || !email.includes("@")) {
    errorMensaje = "Debe ingresar un correo electrónico válido que contenga '@'.";
  } else if (!salasPermitidas.includes(sala)) {
    errorMensaje = "La sala seleccionada no se encuentra permitida.";
  } else if (!fecha) {
    errorMensaje = "Debe especificar una fecha válida.";
  } else if (!turnosPermitidos.includes(turno)) {
    errorMensaje = "El turno seleccionado no es válido.";
  } else if (isNaN(cantidadPersonas) || !Number.isInteger(cantidadPersonas) || cantidadPersonas < 1 || cantidadPersonas > 6) {
    errorMensaje = "La cantidad de personas debe ser un número entero comprendido entre 1 y 6.";
  }

  if (errorMensaje) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva Reserva",
      error: errorMensaje,
      valores: req.body
    });
  }

  req.reservaValidada = {
    estudiante,
    email,
    sala,
    fecha,
    turno,
    personas: cantidadPersonas
  };
  next();
};

const crearReserva = (req, res) => {
  const nuevaReserva = {
    id: contadorId++,
    ...req.reservaValidada
  };
  listadoReservas.push(nuevaReserva);
  res.redirect("/reservas");
};

reservasRouter.get("/", (req, res) => {
  res.render("reservas/lista", { titulo: "Listado de Reservas", reservas: listadoReservas });
});

reservasRouter.get("/nueva", (req, res) => {
  res.render("reservas/nueva", { titulo: "Nueva Reserva" });
});

reservasRouter.get("/:id", (req, res) => {
  const idBuscado = Number(req.params.id);
  const reservaEncontrada = listadoReservas.find(r => r.id === idBuscado);

  if (!reservaEncontrada) {
    return res.status(404).render("no-encontrado", {
      titulo: "No encontrada",
      mensaje: "La reserva consultada no existe en el sistema."
    });
  }

  res.render("reservas/detalle", { titulo: "Detalle de Reserva", reserva: reservaEncontrada });
});

reservasRouter.post("/", validarReserva, crearReserva);

app.use("/reservas", reservasRouter);

// Middleware 404 final (al final del pipeline)
app.use((req, res) => {
  res.status(404).render("no-encontrado", {
    titulo: "Página no encontrada",
    mensaje: "La dirección solicitada no existe."
  });
});

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});