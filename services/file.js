const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function readFile(filename) {
	try {
		// console.log('readFile', filename);
		if (!fs.existsSync(filename)) {
			return {};
		}
		const data = fs.readFileSync(filename, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Error reading streamers cache:', error.message);
	}
	return {};
}

async function writeFile(filename, data) {
  try {
    const dir = path.dirname(filename);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing streamers cache:', error.message);
  }
}

module.exports = {
	readFile,
	writeFile
};