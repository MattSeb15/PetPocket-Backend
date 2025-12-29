const citaCtl = require('./src/infrastructure/http/controller/cita.controller.js');

// Mock de req y res
const req = {};
const res = {
    json: (data) => {
        console.log('=== RESPUESTA DEL ENDPOINT ===');
        console.log(JSON.stringify(data, null, 2));
        process.exit(0);
    },
    status: (code) => {
        return {
            json: (data) => {
                console.log(`=== ERROR ${code} ===`);
                console.log(JSON.stringify(data, null, 2));
                process.exit(1);
            }
        };
    }
};

// Ejecutar el controlador
console.log('Ejecutando mostrarCitas...\n');
citaCtl.mostrarCitas(req, res);
