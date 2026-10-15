//-------------------------------------//
//--|funcionalidad_acordes_musicales|--//
//-------------------------------------//
const tarjetas = document.querySelectorAll(".tarjeta");
const resumen = document.getElementById("resumen");
const inputNota = document.getElementById("nota");
const acordes = {
    do: [-1, 3, 2, 0, 1, 0],
    re: [-1, -1, 0, 2, 3, 2],
    mim: [0, 2, 2, 0, 0, 0],
    sol: [3, 2, 0, 0, 0, 3],
    lam: [-1, 0, 2, 2, 1, 0]
};
const CUERDAS_AL_AIRE = [82.41, 110, 146.83, 196, 246.94, 329.63];
//--------------------------//
//--|almacenamiento_local|--//
//--------------------------//
const CLAVE = "acordes_estado";
function nuevoEstado() {
    return { dominados: [], practicas: {}, nota: "" };
}
function leerEstado() {
    try {
        const guardado = localStorage.getItem(CLAVE);
        if (guardado) {
            return JSON.parse(guardado);
        }
        return nuevoEstado();
    } catch (error) {
        return nuevoEstado();
    }
}
function guardarEstado() {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
}
let estado = leerEstado();
//---------------------//
//--|diagrama_acorde|--//
//---------------------//
function crearDiagrama(trastes) {
    let svg = '<svg viewBox="0 0 100 125">';
    svg += '<rect class="cejuela" x="15" y="30" width="70" height="4"/>';
    for (let i = 1; i <= 4; i++) {
        const y = 30 + i * 20;
        svg += '<line class="traste" x1="15" x2="85" y1="' + y + '" y2="' + y + '"/>';
    }
    for (let i = 0; i < trastes.length; i++) {
        const traste = trastes[i];
        const x = 15 + i * 14;
        svg += '<line class="cuerda" x1="' + x + '" x2="' + x + '" y1="30" y2="110"/>';
        if (traste === -1) {
            svg += '<text class="marca" x="' + x + '" y="24">×</text>';
        } else if (traste === 0) {
            svg += '<circle class="abierta" cx="' + x + '" cy="20" r="4"/>';
        } else {
            const y = 30 + (traste - 0.5) * 20;
            svg += '<circle class="punto" cx="' + x + '" cy="' + y + '" r="6"/>';
        }
    }
    svg += "</svg>";
    return svg;
}
//-------------------//
//--|sonido_acorde|--//
//-------------------//
let audio;
function sonar(id) {
    if (!audio) {
        audio = new AudioContext();
    }
    const trastes = acordes[id];
    for (let cuerda = 0; cuerda < trastes.length; cuerda++) {
        const traste = trastes[cuerda];
        if (traste !== -1) {
            const frecuencia = CUERDAS_AL_AIRE[cuerda] * Math.pow(2, traste / 12);
            const inicio = audio.currentTime + cuerda * 0.06;
            const oscilador = audio.createOscillator();
            const volumen = audio.createGain();
            oscilador.type = "triangle";
            oscilador.frequency.value = frecuencia;
            volumen.gain.setValueAtTime(0.0001, inicio);
            volumen.gain.exponentialRampToValueAtTime(0.15, inicio + 0.02);
            volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 1.6);
            oscilador.connect(volumen);
            volumen.connect(audio.destination);
            oscilador.start(inicio);
            oscilador.stop(inicio + 1.7);
        }
    }
}
//-----------------------//
//--|acciones_tarjetas|--//
//-----------------------//
function practicar(id) {
    if (!estado.practicas[id]) {
        estado.practicas[id] = 0;
    }
    estado.practicas[id]++;
    guardarEstado();
    dibujarPantalla();
}
function alternarDominado(id, marcado) {
    if (marcado) {
        estado.dominados.push(id);
    } else {
        estado.dominados = estado.dominados.filter((d) => d !== id);
    }
    guardarEstado();
    dibujarPantalla();
}
//--------------//
//--|pantalla|--//
//--------------//
function dibujarPantalla() {
    tarjetas.forEach((tarjeta) => {
        const id = tarjeta.dataset.id;
        const dominado = estado.dominados.includes(id);
        tarjeta.classList.toggle("dominado", dominado);
        tarjeta.querySelector("[data-dominado]").checked = dominado;
        tarjeta.querySelector(".veces").textContent = estado.practicas[id] || 0;
    });
    resumen.textContent = "Dominas " + estado.dominados.length + " de " + tarjetas.length + " acordes.";
}
//-------------//
//--|eventos|--//
//-------------//
tarjetas.forEach((tarjeta) => {
    const id = tarjeta.dataset.id;
    tarjeta.querySelector("[data-sonar]").addEventListener("click", () => sonar(id));
    tarjeta.querySelector("[data-practica]").addEventListener("click", () => practicar(id));
    tarjeta.querySelector("[data-dominado]").addEventListener("change", (evento) => {
        alternarDominado(id, evento.target.checked);
    });
});
inputNota.addEventListener("input", () => {
    estado.nota = inputNota.value;
    guardarEstado();
});
//--------------//
//--|arranque|--//
//--------------//
tarjetas.forEach((tarjeta) => {
    tarjeta.querySelector(".diagrama").innerHTML = crearDiagrama(acordes[tarjeta.dataset.id]);
});
inputNota.value = estado.nota;
dibujarPantalla();