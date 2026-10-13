const CLAVE_EDICIONES = "inventario_ediciones";

function obtenerEdiciones() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_EDICIONES)) || {};
  } catch (error) {
    return {};
  }
}

function guardarEdicion(id, datos) {
  const ediciones = obtenerEdiciones();
  ediciones[id] = datos;
  try {
    localStorage.setItem(CLAVE_EDICIONES, JSON.stringify(ediciones));
  } catch (error) {
    // Si el navegador no permite guardar, el cambio solo se pierde al recargar.
  }
}

function obtenerProducto(id) {
  const base = productos.find(function (item) {
    return item.id === id;
  });
  if (!base) {
    return null;
  }
  const edicion = obtenerEdiciones()[id];
  return edicion ? Object.assign({}, base, edicion) : base;
}

function iniciarDetalle() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));
  const producto = obtenerProducto(id);
  const mensaje = document.getElementById("mensaje-vacio");
  const panel = document.getElementById("panel-detalle");

  if (!producto) {
    mensaje.hidden = false;
    panel.hidden = true;
    return;
  }

  document.getElementById("d-nombre").textContent = producto.nombre;
  document.getElementById("d-categoria").textContent = producto.categoria;
  document.getElementById("d-precio").textContent = formatoPrecio(producto.precio);
  document.getElementById("d-cantidad").textContent = producto.cantidad;
  document.getElementById("d-estado").textContent = producto.estado;
  mensaje.hidden = true;
  panel.hidden = false;
}

function validarProducto(nombre, precio, cantidad, estado, categoria) {
  if (nombre === "" || precio === "" || cantidad === "" || estado === "" || categoria === "") {
    return "Completa los campos obligatorios.";
  }
  if (isNaN(Number(precio)) || Number(precio) <= 0) {
    return "El precio debe ser un número positivo.";
  }
  if (isNaN(Number(cantidad)) || Number(cantidad) < 0 || !Number.isInteger(Number(cantidad))) {
    return "La cantidad disponible no puede ser un número negativo.";
  }
  return "";
}

function iniciarRegistro() {
  const boton = document.getElementById("btn-guardar");
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));
  const productoEditar = id ? obtenerProducto(id) : null;

  if (productoEditar) {
    const categoriaActual = categorias.find(function (item) {
      return item.nombre === productoEditar.categoria;
    });
    document.querySelector("h1").textContent = "Editar producto";
    document.querySelector(".resumen").textContent = "Modifica los datos del producto y guarda los cambios.";
    boton.textContent = "Guardar cambios";
    document.getElementById("nombreProducto").value = productoEditar.nombre;
    document.getElementById("precioProducto").value = productoEditar.precio;
    document.getElementById("cantidadProducto").value = productoEditar.cantidad;
    document.getElementById("estadoProducto").value = productoEditar.estado;
    document.getElementById("categoriaProducto").value = categoriaActual ? categoriaActual.id : "";
  }

  boton.addEventListener("click", function () {
    const nombre = document.getElementById("nombreProducto").value.trim();
    const precio = document.getElementById("precioProducto").value.trim();
    const cantidad = document.getElementById("cantidadProducto").value.trim();
    const estado = document.getElementById("estadoProducto").value;
    const categoriaId = Number(document.getElementById("categoriaProducto").value);

    const error = validarProducto(nombre, precio, cantidad, estado, categoriaId ? "ok" : "");
    if (error !== "") {
      alert(error);
      return;
    }

    if (productoEditar) {
      const categoria = categorias.find(function (item) {
        return item.id === categoriaId;
      });
      guardarEdicion(id, {
        nombre: nombre,
        precio: Number(precio),
        cantidad: Number(cantidad),
        estado: estado,
        categoria: categoria.nombre
      });
      alert("El producto ha sido actualizado correctamente.");
      window.location.href = "productos.html";
      return;
    }

    alert("Producto registrado correctamente.");
  });
}

function normalizarTexto(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function iniciarListado() {
  const tabla = document.querySelector(".tabla");
  const filas = Array.from(tabla.querySelectorAll("tr[data-id]"));
  const buscador = document.getElementById("buscador");
  const filtroEstado = document.getElementById("filtro-estado");
  const contador = document.getElementById("contador");
  const mensaje = document.getElementById("mensaje-vacio");
  let textoBusqueda = "";

  // Refleja en la tabla los productos que fueron editados (Requerimiento 2).
  filas.forEach(function (fila) {
    const producto = obtenerProducto(Number(fila.dataset.id));
    if (!producto) {
      return;
    }
    const celdas = fila.cells;
    const activo = producto.estado === "Activo" || producto.estado === "Disponible";
    celdas[1].textContent = producto.nombre;
    celdas[2].textContent = producto.categoria;
    celdas[3].textContent = formatoPrecio(producto.precio);
    celdas[4].textContent = producto.cantidad;
    celdas[5].innerHTML = "";
    const badge = document.createElement("span");
    badge.className = activo ? "badge-activo" : "badge-inactivo";
    badge.textContent = producto.estado;
    celdas[5].appendChild(badge);
  });

  function esActivo(fila) {
    const estado = normalizarTexto(fila.cells[5].textContent.trim());
    return estado === "activo" || estado === "disponible";
  }

  function aplicarFiltros() {
    const estadoElegido = filtroEstado.value;
    let porEstado = 0;
    let visibles = 0;

    filas.forEach(function (fila) {
      const coincideEstado =
        estadoElegido === "todos" ||
        (estadoElegido === "activos" && esActivo(fila)) ||
        (estadoElegido === "inactivos" && !esActivo(fila));
      const coincideTexto = normalizarTexto(fila.cells[1].textContent).indexOf(textoBusqueda) !== -1;

      if (coincideEstado) {
        porEstado++;
      }
      const mostrar = coincideEstado && coincideTexto;
      fila.hidden = !mostrar;
      if (mostrar) {
        visibles++;
      }
    });

    tabla.hidden = visibles === 0;
    if (visibles === 0) {
      mensaje.textContent = porEstado === 0
        ? "No hay productos registrados con este estado"
        : "No se encontraron productos que coincidan con la búsqueda";
      mensaje.hidden = false;
      contador.textContent = "Mostrando 0 productos";
    } else {
      mensaje.hidden = true;
      contador.textContent = "Mostrando " + visibles + (visibles === 1 ? " producto" : " productos");
    }
  }

  document.getElementById("form-busqueda").addEventListener("submit", function (evento) {
    evento.preventDefault();
    textoBusqueda = normalizarTexto(buscador.value.trim());
    aplicarFiltros();
  });

  document.getElementById("btn-limpiar").addEventListener("click", function () {
    buscador.value = "";
    textoBusqueda = "";
    aplicarFiltros();
    buscador.focus();
  });

  buscador.addEventListener("input", function () {
    if (buscador.value.trim() === "") {
      textoBusqueda = "";
      aplicarFiltros();
    }
  });

  filtroEstado.addEventListener("change", aplicarFiltros);

  aplicarFiltros();
}

function formatoPrecio(valor) {
  return "$" + Number(valor).toLocaleString("es-CO");
}

if (document.getElementById("detalle-producto")) {
  iniciarDetalle();
}

if (document.getElementById("form-producto")) {
  iniciarRegistro();
}

if (document.getElementById("form-busqueda")) {
  iniciarListado();
}
