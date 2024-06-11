// const express = require('express');
// const path = require('path');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware para servir archivos estáticos desde el directorio 'public'
// //app.use(express.static(path.join(__dirname, 'public')));

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// // Ruta para manejar cualquier otra solicitud
// app.use((req, res) => {
//   res.status(404).send('404 - Not Found');
// });

// // Iniciar el servidor
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');

// Función para buscar un contenedor en Google Tag Manager
async function findContainer(accountPath, containerName) {
  try {
    const auth = await authenticate({
      scopes: ['https://www.googleapis.com/auth/tagmanager.readonly'],
    });
    const tagmanager = google.tagmanager({ version: 'v2', auth });
    const res = await tagmanager.accounts.containers.list({
      parent: accountPath,
    });
    const containers = res.data.container || [];
    const container = containers.find(container => container.name === containerName);
    if (container) {
      return container;
    } else {
      throw new Error(`No se pudo encontrar el contenedor '${containerName}'.`);
    }
  } catch (err) {
    console.error('Error al buscar el contenedor:', err.message);
    throw err;
  }
}

// Uso de la función findContainer()
const accountPath = 'accounts/6228833093'; // Reemplaza con la ruta de tu cuenta
const containerName = 'Greetings'; // Reemplaza con el nombre de tu contenedor
findContainer(accountPath, containerName)
  .then(container => {
    console.log('Contenedor encontrado:', container);
  })
  .catch(err => {
    console.error('Error:', err.message);
  });


