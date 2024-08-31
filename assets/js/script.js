const selectMoneda = document.getElementById("selectMoneda")
const botonBuscar = document.getElementById("botonBuscar")
const entrada = document.getElementById("inputCLP")
const cargando = document.getElementById("cargando")
const spanOffline = document.getElementById("offline")
const cambioMoneda = ['uf','dolar','euro','utm','libra_cobre','bitcoin']
const signos = ["USD", "€", "UF", "UTM"]
const arrayError = ['Error: El valor ingresado no es valido', 'Error: No se pudo obtener el valor de la moneda', 'Error: Seleccione tipo de moneda','No se pudo conectar con la API, obteniendo datos de manera offline']
const offline = {
    "version": "1.7.0",
    "autor": "mindicador.cl",
    "fecha": "2022-08-04T20:00:00.000Z",
    "uf": {
        "codigo": "uf",
        "nombre": "Unidad de fomento (UF)",
        "unidad_medida": "Pesos",
        "fecha": "2022-08-04T04:00:00.000Z",
        "valor": 33455.92
    },
    "ivp": {
        "codigo": "ivp",
        "nombre": "Indice de valor promedio (IVP)",
        "unidad_medida": "Pesos",
        "fecha": "2022-08-04T04:00:00.000Z",
        "valor": 34000.48
    },
    "dolar": {
        "codigo": "dolar",
        "nombre": "Dólar observado",
        "unidad_medida": "Pesos",
        "fecha": "2022-08-04T04:00:00.000Z",
        "valor": 907.82
    },
    "dolar_intercambio": {
        "codigo": "dolar_intercambio",
        "nombre": "Dólar acuerdo",
        "unidad_medida": "Pesos",
        "fecha": "2014-11-13T03:00:00.000Z",
        "valor": 758.87
    },
    "euro": {
        "codigo": "euro",
        "nombre": "Euro",
        "unidad_medida": "Pesos",
        "fecha": "2022-08-04T04:00:00.000Z",
        "valor": 922.21
    },
    "ipc": {
        "codigo": "ipc",
        "nombre": "Indice de Precios al Consumidor (IPC)",
        "unidad_medida": "Porcentaje",
        "fecha": "2022-06-01T04:00:00.000Z",
        "valor": 0.9
    },
    "utm": {
        "codigo": "utm",
        "nombre": "Unidad Tributaria Mensual (UTM)",
        "unidad_medida": "Pesos",
        "fecha": "2022-08-01T04:00:00.000Z",
        "valor": 58772
    },
    "imacec": {
        "codigo": "imacec",
        "nombre": "Imacec",
        "unidad_medida": "Porcentaje",
        "fecha": "2022-06-01T04:00:00.000Z",
        "valor": 3.7
    },
    "tpm": {
        "codigo": "tpm",
        "nombre": "Tasa Política Monetaria (TPM)",
        "unidad_medida": "Porcentaje",
        "fecha": "2022-08-04T04:00:00.000Z",
        "valor": 9.75
    },
    "libra_cobre": {
        "codigo": "libra_cobre",
        "nombre": "Libra de Cobre",
        "unidad_medida": "Dólar",
        "fecha": "2022-08-04T04:00:00.000Z",
        "valor": 3.54
    },
    "tasa_desempleo": {
        "codigo": "tasa_desempleo",
        "nombre": "Tasa de desempleo",
        "unidad_medida": "Porcentaje",
        "fecha": "2022-06-01T04:00:00.000Z",
        "valor": 7.81
    },
    "bitcoin": {
        "codigo": "bitcoin",
        "nombre": "Bitcoin",
        "unidad_medida": "Dólar",
        "fecha": "2022-08-01T04:00:00.000Z",
        "valor": 23298.94
    }
}
let resultado = document.getElementById("resultado")
let divResultado = document.getElementById("divResultado")

let grafico
let data
let signo
let inputCLP
let valorMonedaHoy

window.addEventListener('load', function(){
    traerDatos()
});

botonBuscar.addEventListener('click', async function(){
    cargando.style.display = 'block'
    inputCLP = parseFloat(entrada.value)
    let moneda = selectMoneda.value

    if (!inputCLP || isNaN(inputCLP)) {
        mostrarResultado(null, 0);
        cargando.style.display = 'none';
        return;
    }

    switch (moneda) {
        case 'uf':
            signo = signos[2];
            break;
        case 'utm':
            signo = signos[3];
            break;
        case 'euro':
            signo = signos[1];
            break;
        default:
            signo = signos[0];
    }

    await crearGrafico(moneda)
    valorMonedaHoy = getDatosHoy()
    mostrarResultado(valorMonedaHoy, 1)    
    cargando.style.display = 'none'
});

function llenarSelect(data){
    let html=``
    for(let key in data){
        if(typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])){
            if(cambioMoneda.includes(data[key].codigo)){
                html+=`<option value="${data[key].codigo}">${data[key].nombre}</option>`
            }                
        }
    }
    selectMoneda.innerHTML+=html
}

function mostrarResultado(val, tipo){
    if(isNaN(val)){
        divResultado.classList.remove("alert-success")
        divResultado.classList.add("alert-danger")
        resultado.innerHTML = arrayError[tipo]
    }
    else{
        divResultado.classList.remove("alert-danger")
        divResultado.classList.add("alert-success")
        resultado.innerHTML = "Resultado: "+ (inputCLP / val).toFixed(2) + " "+signo
    }
}

function getDatosHoy(){
    const monedaSeleccionada = selectMoneda.value;
    if (data[monedaSeleccionada]) {
        return parseFloat(data[monedaSeleccionada].valor);
    }
    return NaN;
}

async function traerDatos(){
    try {
        const response = await fetch('https://mindicador.cl/api/');
        if (!response.ok) {
            throw new Error("No se pudo obtener datos en línea");
        }
        data = await response.json();
        llenarSelect(data);
    } catch (error) {
        console.error(error);
        data = offline;
        spanOffline.innerHTML = arrayError[3];
        llenarSelect(data);
    }
}

async function crearGrafico(tipoInd){
    let datos = []
    let fechaActual = new Date()
    
    if(grafico){
        grafico.destroy()
    }

    if (data === offline) {
        divResultado.classList.remove("alert-success");
        divResultado.classList.add("alert-danger");
        resultado.innerHTML = "No se puede generar el gráfico por conexión con la API.";
        return;
    }

    if(tipoInd != '0'){
        while(datos.length < 10){
            if(esDiaLaboral(fechaActual)){
                try {
                    const result = await fetch(`https://mindicador.cl/api/${tipoInd}/${formatearFecha(fechaActual)}`);
                    if (!result.ok){
                        divResultado.classList.remove("alert-success");
                        divResultado.classList.add("alert-danger");
                        resultado.innerHTML = "No se puede generar el gráfico por conexión con la API.";
                        throw new Error('Error al obtener datos del API.');
                    }                    
                    const data = await result.json();
                    if (data.serie && data.serie.length > 0) {
                        datos.push({
                            'fecha': formatearFecha(fechaActual), 
                            'valor': data.serie[0].valor
                        });
                    }
                }
                catch (error) {
                    console.error("Error al obtener los datos del API para el gráfico:", error);
                    divResultado.classList.remove("alert-success");
                    divResultado.classList.add("alert-danger");
                    resultado.innerHTML = "No se pudo generar el gráfico por conexión con la API.";
                    return;
                }
            }
            fechaActual.setDate(fechaActual.getDate()-1)
        }

        datos.reverse()
        const etiquetas = datos.map(item => item.fecha)
        const valores = datos.map(item => item.valor)

        const plugin = {
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart, args, options) => {
            const {ctx} = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || '#99ffff';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
            }
        }
        
        const contexto = document.getElementById("grafico").getContext('2d')
        grafico = new Chart(contexto, {
            type: 'line',
            data: {
                labels: etiquetas,
                datasets: [{
                    label: 'Valor',
                    data: valores,
                    borderColor: 'rgb(255, 0, 0)',
                    backgroundColor: 'rgb(200, 200, 200)',
                    borderWidth: 2
                }]
            },
            plugins: [plugin],
            options:{
                plugins: {
                    customCanvasBackgroundColor: {
                    color: 'white',
                    }
                },
                scales:{
                    x:{
                        title:{
                            display: true,
                            text: 'Fecha'
                        }
                    },
                    y:{
                        title:{
                            display: true,
                            text: 'Valor'
                        },
                        beginAtZero: false
                    }
                }
            }
        });
    }
    else{
        divResultado.classList.remove("alert-success")
        divResultado.classList.add("alert-danger")
        resultado.innerHTML = arrayError[2]
    }
}

function formatearFecha(fecha){
    let dia = fecha.getDate()
    let mes = fecha.getMonth() + 1
    let anio = fecha.getFullYear()
    dia = dia < 10 ? '0' + dia : dia
    mes = mes < 10 ? '0' + mes : mes
    return `${dia}-${mes}-${anio}`
}

function esDiaLaboral(fecha) {
    const dia = fecha.getDay();
    return dia !== 0 && dia !== 6;
}