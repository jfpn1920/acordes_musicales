// ===== REFERENCIAS A LOS ELEMENTOS DEL HTML =====
const tarjetas = document.querySelectorAll('.tarjeta');   // las cinco tarjetas
const resumen = document.getElementById('resumen');       // cuántos acordes dominas
const inputNota = document.getElementById('nota');        // notas de práctica
// ===== DATOS DE LOS ACORDES =====
// Un número por cuerda, de la más grave (6ª) a la más aguda (1ª):
// -1 = no se toca | 0 = cuerda al aire | 1, 2, 3... = traste donde va el dedo
const acordes = {
    do:  [-1, 3, 2, 0, 1, 0],
    re:  [-1, -1, 0, 2, 3, 2],
    mim: [0, 2, 2, 0, 0, 0],
    sol: [3, 2, 0, 0, 0, 3],
    lam: [-1, 0, 2, 2, 1, 0]
};
// Frecuencias (Hz) de las seis cuerdas al aire: Mi, La, Re, Sol, Si, Mi
const CUERDAS_AL_AIRE = [82.41, 110, 146.83, 196, 246.94, 329.63];
// ===== CLAVE DE LOCALSTORAGE =====
const CLAVE = 'acordes_estado';
// ===== ESTADO POR DEFECTO =====
// dominados: ids de acordes dominados | practicas: veces practicado | nota: texto libre
const estadoInicial = { dominados: [], practicas: {}, nota: '' };
// ===== LEER EL ESTADO GUARDADO =====
function leerEstado() {
    try {
        const guardado = localStorage.getItem(CLAVE);
        // Si hay datos guardados los usamos; si no, partimos del estado inicial
        return guardado ? { ...estadoInicial, ...JSON.parse(guardado) } : { ...estadoInicial };
    } catch (error) {
      return { ...estadoInicial }; // si algo falla, empezamos desde cero
    }
}
// Al cargar la página recuperamos todo lo guardado
let estado = leerEstado();
// ===== GUARDAR EL ESTADO =====
function guardarEstado() {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
}
// ===== CREAR EL DIAGRAMA SVG DE UN ACORDE =====
function crearDiagrama(trastes) {
    let svg = '<svg viewBox="0 0 100 125" role="img" aria-label="Diagrama del acorde">';
    svg += '<rect class="cejuela" x="15" y="30" width="70" height="4"/>';  // cejuela (borde superior)
    // Cuatro trastes (líneas horizontales)
    for (let i = 1; i <= 4; i++) {
        svg += `<line class="traste" x1="15" x2="85" y1="${30 + i * 20}" y2="${30 + i * 20}"/>`;
    }
    // Seis cuerdas (líneas verticales) y sus marcas
    trastes.forEach((traste, i) => {
        const x = 15 + i * 14;  // posición horizontal de la cuerda
        svg += `<line class="cuerda" x1="${x}" x2="${x}" y1="30" y2="110"/>`;
        if (traste === -1) svg += `<text class="marca" x="${x}" y="24">×</text>`;              // no se toca
        else if (traste === 0) svg += `<circle class="abierta" cx="${x}" cy="20" r="4"/>`;     // al aire
        else svg += `<circle class="punto" cx="${x}" cy="${30 + (traste - 0.5) * 20}" r="6"/>`; // dedo
    });
    return svg + '</svg>';
}
// ===== HACER SONAR UN ACORDE (Web Audio) =====
let audio;  // se crea la primera vez que se pulsa "Escuchar"
function sonar(id) {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    acordes[id].forEach((traste, cuerda) => {
        if (traste === -1) return;  // las cuerdas que no se tocan no suenan
        // Cada traste sube la nota un semitono: frecuencia = base × 2^(traste/12)
        const frecuencia = CUERDAS_AL_AIRE[cuerda] * 2 ** (traste / 12);
        const inicio = audio.currentTime + cuerda * 0.06;  // las cuerdas suenan una tras otra
        const oscilador = audio.createOscillator();
        const volumen = audio.createGain();
        oscilador.type = 'triangle';
        oscilador.frequency.value = frecuencia;
        // El volumen sube rápido y se apaga poco a poco, como una cuerda
        volumen.gain.setValueAtTime(0.0001, inicio);
        volumen.gain.exponentialRampToValueAtTime(0.15, inicio + 0.02);
        volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 1.6);
        oscilador.connect(volumen).connect(audio.destination);
        oscilador.start(inicio);
        oscilador.stop(inicio + 1.7);
    });
}
// ===== REGISTRAR PRÁCTICA Y MARCAR DOMINADO =====
function practicar(id) {
    estado.practicas[id] = (estado.practicas[id] || 0) + 1;
    guardarEstado();
    dibujarPantalla();
}
function alternarDominado(id, marcado) {
    if (marcado) estado.dominados.push(id);                          // lo agregamos
    else estado.dominados = estado.dominados.filter(d => d !== id);  // lo quitamos
    guardarEstado();
    dibujarPantalla();
}
// ===== ACTUALIZAR TODO LO QUE SE VE EN PANTALLA =====
function dibujarPantalla() {
    tarjetas.forEach(tarjeta => {
        const id = tarjeta.dataset.id;
        const dominado = estado.dominados.includes(id);
        tarjeta.classList.toggle('dominado', dominado);
        tarjeta.querySelector('[data-dominado]').checked = dominado;
        tarjeta.querySelector('.veces').textContent = estado.practicas[id] || 0;
    });
    resumen.textContent = `Dominas ${estado.dominados.length} de ${tarjetas.length} acordes.`;
}
// ===== EVENTOS =====
// Un solo "click" en el documento detecta qué botón se pulsó
document.addEventListener('click', evento => {
    const boton = evento.target.closest('button');
    if (!boton) return;
    const id = boton.closest('.tarjeta')?.dataset.id;
    if (boton.matches('[data-sonar]')) sonar(id);
    if (boton.matches('[data-practica]')) practicar(id);
});
// Casillas "Ya lo domino" de cada tarjeta
tarjetas.forEach(tarjeta => {
    tarjeta.querySelector('[data-dominado]').addEventListener('change', evento => {
        alternarDominado(tarjeta.dataset.id, evento.target.checked);
    });
});
// La nota se guarda mientras se escribe
inputNota.addEventListener('input', () => {
    estado.nota = inputNota.value;
    guardarEstado();
});
// ===== INICIO: se ejecuta al cargar o refrescar la página =====
tarjetas.forEach(t => { t.querySelector('.diagrama').innerHTML = crearDiagrama(acordes[t.dataset.id]); });
inputNota.value = estado.nota;  // recupera la nota escrita
dibujarPantalla();              // recupera acordes dominados y prácticas