const fs = require('fs/promises');
const path = require('path');

const TOKENS_FILE = path.join(__dirname, '..', 'reviewTokens.json');

async function readTokens() {
  try {
    const raw = await fs.readFile(TOKENS_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    if (err instanceof SyntaxError) {
      const wrapped = new Error(`Invalid JSON in reviewTokens.json: ${err.message}`);
      wrapped.cause = err;
      throw wrapped;
    }
    throw err;
  }
}

async function writeTokens(tokens) {
  try {
    await fs.writeFile(TOKENS_FILE, `${JSON.stringify(tokens, null, 2)}\n`, 'utf8');
  } catch (err) {
    const wrapped = new Error(`Failed to write reviewTokens.json: ${err.message}`);
    wrapped.cause = err;
    throw wrapped;
  }
}

async function appendToken(record) {
  const tokens = await readTokens();
  tokens.push(record);
  await writeTokens(tokens);
}

async function markTokenUsed(tokenValue) {
  const tokens = await readTokens();
  const idx = tokens.findIndex((t) => t && t.token === tokenValue);
  if (idx === -1) return false;
  tokens[idx] = { ...tokens[idx], used: true };
  await writeTokens(tokens);
  return true;
}

module.exports = { readTokens, appendToken, writeTokens, markTokenUsed, TOKENS_FILE };
