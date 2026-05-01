export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

function headersBase() {
  return {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'origin': 'https://www.savethevideo.com',
    'referer': 'https://www.savethevideo.com/',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  };
}

async function allDownloader(url) {
  const createRes = await fetch('https://api.v02.savethevideo.com/tasks', {
    method: 'POST',
    headers: headersBase(),
    body: JSON.stringify({ type: 'info', url }),
  });

  const createJson = await createRes.json();
  if (!createJson?.id) throw new Error('Gagal membuat task');

  const taskId = createJson.id;
  let result = null;

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1500));

    const checkRes = await fetch(`https://api.v02.savethevideo.com/tasks/${taskId}`, {
      method: 'GET',
      headers: headersBase(),
    });

    const checkJson = await checkRes.json();
    if (checkJson?.state === 'completed') {
      result = checkJson?.result?.[0] || null;
      break;
    }
  }

  if (!result) throw new Error('Timeout / result kosong');
  return result;
}

function normalize(url, result) {
  const downloadsRaw = result.downloads || result.links || (result.url ? [{ url: result.url }] : []);
  const downloads = Array.isArray(downloadsRaw)
    ? downloadsRaw
        .map((d) => ({
          url: d.url || d.download_url || d.href,
          quality: d.quality || d.label || d.resolution || 'best',
          mime: d.mime || d.type || 'video/mp4',
          size: d.size || d.filesize || '',
        }))
        .filter((d) => d.url)
    : [];

  return {
    source: url,
    title: result.title || result.name || result.filename || 'Video',
    thumbnail: result.thumbnail || result.thumb || result.image || '',
    platform: result.platform || 'auto',
    duration: result.duration || result.length || '',
    downloads,
    raw: result,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ ok: false, error: 'URL tidak valid' });
    }

    const result = await allDownloader(url);
    const data = normalize(url, result);

    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
}