const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const app = express();

require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
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

// Ruta para actualizar la tabla en GTM
app.post('/update-gtm-table', async (req, res) => {
  const { inputId, outputId } = req.body;
  try {
    const gtm = google.tagmanager({ version: 'v2', auth: oAuth2Client });
    const containers = await gtm.accounts.containers.list({
      parent: `accounts/${process.env.GTM_ACCOUNT_ID}`,
    });
    const container = containers.data.container.find(c => c.containerId === process.env.GTM_CONTAINER_ID);
    const containerVersion = await gtm.accounts.containers.versions.list({
      parent: `accounts/${process.env.GTM_ACCOUNT_ID}/containers/${container.containerId}`,
    });
    const latestVersion = containerVersion.data.containerVersion[0];

    const variable = latestVersion.variable.find(v => v.name === process.env.GTM_VARIABLE_NAME);
    variable.parameter.push({ key: 'input', value: inputId });
    variable.parameter.push({ key: 'output', value: outputId });

    await gtm.accounts.containers.versions.publish({
      path: `accounts/${process.env.GTM_ACCOUNT_ID}/containers/${container.containerId}/versions/${latestVersion.containerVersionId}`,
    });

    res.status(200).json({ message: 'Table updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});


