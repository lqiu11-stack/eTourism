const path = require('path');
const fs = require('fs');

const DATA_PATH = path.join(__dirname, '../data/experiences.json');

function loadExperiences() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

const getAllExperiences = async (req, res) => {
  try {
    const experiences = loadExperiences();
    res.json(experiences);
  } catch (err) {
    console.error('[getAllExperiences]', err);
    res.status(500).json({ error: 'Failed to load experiences' });
  }
};

const getExperienceLocationById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid experience id' });
    }
    const experiences = loadExperiences();
    const experience = experiences.find((e) => e.id === id);
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    res.json({
      id: experience.id,
      title: experience.title,
      location_name: experience.location_name,
      latitude: experience.latitude,
      longitude: experience.longitude,
    });
  } catch (err) {
    console.error('[getExperienceLocationById]', err);
    res.status(500).json({ error: 'Failed to load experience location' });
  }
};

module.exports = { getAllExperiences, getExperienceLocationById };
