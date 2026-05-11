const MAP_ID = '1ejA2cCn-2LVKAZxJbjlqmUHlbMc0JoY';

const CAT_MAP = {
  'Restaurants':       'restaurants',
  'Bars & Parties':    'bars',
  'Beaches':           'beaches',
  'Coffee & Breakfast':'coffee',
  'Gyms':              'gyms',
  'Activities':        'activities',
  'Massage Places':    'massage',
};

function parseKml(kml) {
  const places = [];
  const folderRe = /<Folder>([\s\S]*?)<\/Folder>/g;
  const nameRe   = /<name>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/name>/;
  const pmRe     = /<Placemark>([\s\S]*?)<\/Placemark>/g;
  const coordRe  = /<coordinates>\s*([\d.,\s-]+?)\s*<\/coordinates>/;

  let fm;
  while ((fm = folderRe.exec(kml)) !== null) {
    const folder = fm[1];
    const folderName = (nameRe.exec(folder) || [])[1]?.trim();
    const cat = CAT_MAP[folderName];
    if (!cat) continue;

    let pm;
    const localPmRe = new RegExp(pmRe.source, 'g');
    while ((pm = localPmRe.exec(folder)) !== null) {
      const c = pm[1];
      const name = (nameRe.exec(c) || [])[1]?.trim();
      const coordStr = (coordRe.exec(c) || [])[1]?.trim();
      if (!name || !coordStr) continue;
      const parts = coordStr.split(',');
      const lng = parseFloat(parts[0]), lat = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) places.push({ name, lat, lng, cat });
    }
  }
  return places;
}

module.exports = async function handler(req, res) {
  try {
    const url = `https://www.google.com/maps/d/kml?forcekml=1&mid=${MAP_ID}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error('KML fetch ' + r.status);
    const kml = await r.text();
    const places = parseKml(kml);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ places, ts: Date.now() });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
