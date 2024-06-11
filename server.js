const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuración de OAuth2
const oAuth2Client = new google.auth.OAuth2(
  '305681698109-qe2crqmglgm92fh4vk86gqseg5qosdma.apps.googleusercontent.com',
  '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',
  'https://prueba-q44y.onrender.com/oauth2callback'
  //'https://prueba-q44y.onrender.com/oauth2callback'
);

// Servir el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para la autenticación
app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/tagmanager.edit.containers'],
  });
  res.redirect(authUrl);
});

//-------------------
// Inicializar el cliente de Google Tag Manager
const gtm = google.tagmanager({ version: 'v2', auth: oAuth2Client });

async function getContainerName() {
  try {
    // Obtener la información del contenedor
    const container = await gtm.accounts.containers.get({
      path: 'accounts/6228833093/containers/183956141'
    });

    // Extraer el nombre del contenedor
    const containerName = container.data.name;

    console.log('Nombre del contenedor:', containerName);
  } catch (error) {
    console.error('Error al obtener el nombre del contenedor:', error);
  }
}
// Llamar a la función para obtener el nombre del contenedor
getContainerName();
//---------------------
// Ruta de redirección para el callback de OAuth
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  res.send('Autenticación exitosa. Ahora puedes cerrar esta ventana.');
});

// Ruta para actualizar la tabla en GTM
app.post('/update-gtm-table', async (req, res) => {
  const { inputId, outputId } = req.body;
  try {
    const gtm = google.tagmanager({ version: 'v2', auth: oAuth2Client });
    console.log('hola');
    // Obtener la última versión del contenedor
    const container = await gtm.accounts.containers.get({
      path: 'accounts/6228833093/containers/183956141'
      //path: 'accounts/6228833093/containers/183956141'
      //accountId: '6228833093',
      //containerId: '183956141'
      
    });
    const latestVersion = container.data.containerVersionId;
    console.log('hola2');
    console.log(latestVersion);
    // Actualizar la versión del contenedor con los nuevos valores
    const updatedContainer = await gtm.accounts.containers.versions.update({
      path: 'container/accounts/6228833093/containers/183956141/workspaces/5/variables',
      requestBody: {
        ...container.data,
        variable: container.data.variable.map(v => {
          if (v.name === 'varprueba') {
            v.parameter.push({ key: 'input', value: inputId });
            v.parameter.push({ key: 'output', value: outputId });
          }
          return v;
        })
      }
    });

    res.status(200).json({ message: 'Table updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});


