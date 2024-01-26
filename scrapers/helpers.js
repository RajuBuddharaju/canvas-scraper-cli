import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import { Readable } from "stream";

const exported = {
  async newPage(browser, cookies, url) {
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.goto(url);
    return page;
  },

  stripInvalid(string) {
    return string.replaceAll(/[/\\?%*:|"<>]/g, "-");
  },

  async downloadFile(url, cookies, dir, backupName) {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Cookie: cookies
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join("; "),
      },
    });

    let filename = backupName;
    const contentDisposition = response.headers.get("content-disposition");
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+?)"/);
      if (match) {
        filename = match[1];
      }
    }

    const fileStream = fs.createWriteStream(path.join(dir, filename));
    await response.body.pipe(fileStream);
    return !(filename === backupName);
  },

  async downloadFiles(urls, cookies, dir) {
    let problematic = [];

    for (let i = 0; i < urls.length; i++) {
      let success = await this.downloadFile(
        urls[i],
        cookies,
        `${dir}`,
        `download_${i}.txt`
      );
      if (!success) problematic.push(urls[i]);
    }

    return problematic;
  },

  async writeFile(dir, filename, data) {
    const textStream = Readable.from(data);
    const fileStream = fs.createWriteStream(path.join(dir, filename));
    await textStream.pipe(fileStream);
  },
};

export default exported;
