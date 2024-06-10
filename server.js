const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuración de OAuth2
const oAuth2Client = new google.auth.OAuth2(
  '305681698109-d8r1urok95d2t48qdsm27to81r9psmlo.apps.googleusercontent.com',
  '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',
  'https://prueba-q44y.onrender.com/oauth2callback'
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
    const containerVersion = await gtm.accounts.containers.versions.latest({
      accountId: '6228833093',
      containerId: '183956141',
    });

    const variable = containerVersion.data.variable.find(v => v.name === 'varprueba');
    variable.parameter.push({ key: 'input', value: inputId });
    variable.parameter.push({ key: 'output', value: outputId });

    await gtm.accounts.containers.versions.update({
      accountId: '6228833093',
      containerId: '183956141',
      containerVersionId: containerVersion.data.containerVersionId,
      resource: containerVersion.data,
    });

    res.status(200).json({ message: 'Table updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});


