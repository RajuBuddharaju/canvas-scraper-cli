import fs from "fs";
import helpers from "../helpers.js";

const exported = {
  /**
   * Gets the assignments from the current page
   * @param {Page} page page to get assignments from
   * @returns {Promise<Array<object>>} array of assignments
   */
  async getAssignments(page) {
    return await page.evaluate(() => {
      let assignmentList = Array.from(
        document.querySelectorAll("#ag-list > ul .assignment .ig-info")
      );

      assignmentList = assignmentList.map((assignment) => {
        let url = assignment.querySelector("a").href;
        let name = assignment.querySelector("a").innerText;
        let grade;
        try {
          grade = assignment.querySelector(".score-display").innerText;
        } catch (e) {
          grade = "NA";
        }

        return { url, name, grade };
      });
      return assignmentList;
    });
  },

  /**
   * Prints a summary of the scraping process
   * @param {Array<object>} assignments array of assignments
   * @param {object} problematic object containing problematic assignment names and their files that failed to download
   */
  async printSummary(assignments, problematic) {
    console.log("--- ASSIGNMENTS SCRAPING SUMMARY ---");
    console.log(`TOTAL ASSIGNMENTS: ${assignments.length}`);
    if (Object.keys(problematic).length > 0) {
      console.log("WARNING: Some files could not be downloaded");
      for (let assignment of Object.keys(problematic)) {
        console.log(`ASSIGNMENT ${assignment}`);
        for (let file of problematic[assignment]) {
          console.log(`  ${file}`);
        }
      }
    }
  },

  /**
   * Scrapes an assignment description
   * @param {page} page page to scrape from
   * @param {string} dir directory to save to
   * @returns {Promise<Array<string>>} array of problematic files
   */
  async scrapeDescription(page, cookies, dir) {
    // print assignment preview
    fs.mkdirSync(`${dir}`);
    await page.pdf({
      path: `${dir}/.ASSIGNMENT.pdf`,
      format: "Letter",
    });

    // gather links to files embeded in assignment description
    let dLinks = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("#assignment_show .description a")
      )
        .map((a) => a.href)
        .filter((url) => url.includes("download?download"));
    });

    // download files and return problematic ones
    return await helpers.downloadFiles(dLinks, cookies, dir);
  },

  /**
   * Scrapes an assignment submission
   * @param {page} page page to scrape from
   * @param {Array<object>} cookies cookies to use
   * @param {string} dir directory to save to
   * @returns {Promise<Array<string>>} array of problematic files
   */
  async scrapeSubmission(page, cookies, dir) {
    // gather links to files submitted by student
    let sLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".content a"))
        .map((a) => a.href)
        .filter((url) => url.includes("?download"));
    });

    // download files and return problematic ones
    return await helpers.downloadFiles(sLinks, cookies, dir);
  },

  /**
   * Scrapes an assignment's comments
   * @param {page} page page to scrape from
   * @param {Array<object>} cookies cookies to use
   * @param {string} dir directory to save to
   * @returns {Promise<boolean>} whether or not the comments were scraped successfully
   */
  async scrapeComments(page, dir) {
    let comments = await page.evaluate(() => {
      let comments = document.querySelector(".content > .comments");
      return comments.innerText;
    });
    await helpers.writeFile(dir, ".COMMENTS.txt", comments);
    return true;
  },
};

export default exported;
