const express = require('express');
const path = require('path');
const fs = require('fs');
const { IgApiClient } = require('instagram-private-api');
const bodyParser = require('body-parser');

const app = express();
const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Generate session endpoint
app.post('/generate', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'Username and password required.' });
  }

  const ig = new IgApiClient();
  try {
    // setup device & login
    ig.state.generateDevice(username);
    await ig.account.login(username, password);

    // serialize state
    const serialized = await ig.state.serialize();

    // create filename unique per username + timestamp
    const fname = `${username.replace(/[^a-z0-9_-]/gi, '_')}-session.json`;
    const filePath = path.join(SESSIONS_DIR, fname);
    fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2));

    return res.json({
      ok: true,
      message: '✅ session.json generated successfully!',
      filename: fname
    });
  } catch (err) {
    console.error('Login failed:', err);
    // Provide safe error message
    return res.status(500).json({ ok: false, message: 'Login failed: ' + (err.message || 'unknown error') });
  }
});

// Download endpoint
app.get('/download', (req, res) => {
  const fname = req.query.file;
  if (!fname) return res.status(400).send('Missing file query parameter.');

  const safeName = path.basename(fname); // avoid path traversal
  const filePath = path.join(SESSIONS_DIR, safeName);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found.');

  res.download(filePath, safeName, (err) => {
    if (err) console.error('Download error', err);
  });
});

// Health / index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
