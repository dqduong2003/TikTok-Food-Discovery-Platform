import axios from 'axios';
import fs from 'fs';
import path from 'path';

export async function downloadTempVideo(url: string, filename: string): Promise<string> {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  
    const filePath = path.join(tempDir, `${filename}.mp4`);
    const writer = fs.createWriteStream(filePath);
  
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
}