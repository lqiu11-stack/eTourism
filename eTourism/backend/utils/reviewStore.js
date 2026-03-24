const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readReviews() {
  try {
    const raw = await fs.readFile(REVIEWS_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function nextReviewId(list) {
  return list.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
}

async function appendReview(review) {
  await ensureDataDir();
  const list = await readReviews();
  list.push(review);
  await fs.writeFile(REVIEWS_FILE, `${JSON.stringify(list, null, 2)}\n`, 'utf8');
  return review;
}

/** @param {Omit<{id:number,created_at:string},'id'|'created_at'>} fields */
async function createReview(fields) {
  await ensureDataDir();
  const list = await readReviews();
  const id = nextReviewId(list);
  const review = {
    id,
    ...fields,
    created_at: new Date().toISOString(),
  };
  list.push(review);
  await fs.writeFile(REVIEWS_FILE, `${JSON.stringify(list, null, 2)}\n`, 'utf8');
  return review;
}

async function findByExperienceId(experienceId) {
  const list = await readReviews();
  return list
    .filter((r) => Number(r.experience_id) === Number(experienceId))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

module.exports = {
  readReviews,
  appendReview,
  createReview,
  nextReviewId,
  findByExperienceId,
  REVIEWS_FILE,
  DATA_DIR,
};
