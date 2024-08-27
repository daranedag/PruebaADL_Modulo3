const selectMoneda = document.getElementById("selectMoneda")
const botonBuscar = document.getElementById("botonBuscar")
const entrada = document.getElementById("inputCLP")
let resultado = document.getElementById("resultado")
let divResultado = document.getElementById("divResultado")
let grafico

window.addEventListener('load', function(){
    llenarSelect()
});

botonBuscar.addEventListener('click', async function(){
    let inputCLP = parseInt(entrada.value)
    let moneda = selectMoneda.value

    if(isNaN(inputCLP)){
        resultado.innerHTML = "Error: El valor ingresado no es valido"
        divResultado.classList.remove("alert-success")
        divResultado.classList.add("alert-danger")
        return;
    }

    await crearGrafico(moneda)
    let valorMonedaHoy = await getDatosHoy()

    if(isNaN(valorMonedaHoy)){
        divResultado.classList.remove("alert-success")
        divResultado.classList.add("alert-danger")
        resultado.innerHTML = "Error: No se pudo obtener el valor de la moneda"
    }
    else{
        divResultado.classList.remove("alert-danger")
        divResultado.classList.add("alert-success")
        resultado.innerHTML = "Resultado: "+ (inputCLP * valorMonedaHoy).toFixed(2)
        resultado.style='font-weight: bold'
    }
});

async function getDatosHoy(){
    try{
        const result = await fetch("https://mindicador.cl/api/")
        const data = await result.json()
        for(let key in data){
            if(typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])){
                if(data[key].codigo == selectMoneda.value){
                    return parseFloat(data[key].valor)
                }
            }
        }
        return NaN;
    }catch(error){
        resultado.innerHTML = "Error al obtener datos:"+ error
        divResultado.classList.remove("alert-success")
        divResultado.classList.add("alert-danger")
        return NaN
    }
}

async function llenarSelect(){
    try{
        const result = await fetch("https://mindicador.cl/api/")
        const data = await result.json()
        const cambioMoneda = ['uf','dolar','dolar_intercambio','euro','utm','libra_cobre','bitcoin']
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
    catch(error){
        console.log("Error al llenar select")
    }
}

async function crearGrafico(tipoInd){
    let datos = []
    let fechaActual = new Date()
    
    if(grafico){
        grafico.destroy()
    }
    while(datos.length < 10){
        if(esDiaLaboral(fechaActual)){
            const result = await fetch(`https://mindicador.cl/api/${tipoInd}/${formatearFecha(fechaActual)}`)
            const data = await result.json()
            if(data.serie && data.serie.length > 0){
                datos.push({
                    'fecha': formatearFecha(fechaActual), 
                    'valor': data.serie[0].valor
                });
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
    };
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

async function llamarOffline(){
    const result = await fetch("./assets/mindicador.json")
    const data = await result.json()
    return data
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