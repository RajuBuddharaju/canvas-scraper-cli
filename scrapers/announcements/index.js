import axios from 'axios';
import { getCanvasBaseUrl } from '../helpers.js';  // Only import getCanvasBaseUrl

// Function to scrape announcements for a specific course
async function scrapeAnnouncements(browser, cookies, url, dir) {
  const baseUrl = getCanvasBaseUrl();
  const announcementsUrl = `${url}/discussion_topics?only_announcements=true`;

  try {
    // Use puppeteer to set cookies for the browser
    const page = await browser.newPage();
    await page.setCookie(...cookies);  // Automatically setting the cookies in the page

    // Directly format the cookies into the Axios request headers
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Use axios for API request
    const response = await axios.get(announcementsUrl, {
      headers: {
        'Cookie': cookieHeader  // Directly set the cookies in the request headers
      }
    });

    if (response.status !== 200) {
      throw new Error(`Request failed with status code ${response.status}`);
    }

    const announcements = response.data.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      posted_at: announcement.posted_at,
      message: announcement.message,
      url: announcement.html_url,
    }));

    console.log(`Scraped ${announcements.length} announcements.`);
    return announcements;
  } catch (error) {
    console.error(`Error fetching announcements for course ${url}:`, error.message);
    return [];
  }
}

export default scrapeAnnouncements;