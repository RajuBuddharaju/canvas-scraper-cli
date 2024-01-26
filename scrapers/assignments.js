import fs from "fs";
import helpers from "./helpers.js";

const scrapeAssignment = async (browser, cookies, assignment, dir) => {
  console.log(`SCRAPING ASSIGNMENT: ${assignment.name}`);
  assignment.name = assignment.name.replaceAll(/[/\\?%*:|"<>]/g, "-");
  assignment.grade = assignment.grade.replaceAll(/[/\\?%*:|"<>]/g, "-");

  const ASSIGNMENT_PATH = `${dir}/ASSIGNMENTS/${assignment.name} (${assignment.grade})`;
  fs.mkdirSync(ASSIGNMENT_PATH);

  console.log(
    "Creating page, setting cookies, and navigating to assignment..."
  );
  const page = await helpers.newPage(browser, cookies, assignment.url);

  fs.mkdirSync(`${ASSIGNMENT_PATH}/.ASSIGNMENT`);
  await page.pdf({
    path: `${ASSIGNMENT_PATH}/.ASSIGNMENT/.ASSIGNMENT.pdf`,
    format: "Letter",
  });

  let descriptionLinks = await page.evaluate(() => {
    let links = Array.from(
      document.querySelectorAll("#assignment_show .description a")
    );
    return links
      .map((a) => a.href)
      .filter((url) => url.includes("download?download"));
  });
  console.log(descriptionLinks);

  console.log("Downloading assignment description files...");
  for (let i = 0; i < descriptionLinks.length; i++)
    await helpers.downloadFile(
      descriptionLinks[i],
      cookies,
      `${ASSIGNMENT_PATH}/.ASSIGNMENT`,
      `download_${i}.txt`
    );

  console.log("Downloading assignment submission...");
  let submissionLink = await page.evaluate(() => {
    let links = Array.from(document.querySelectorAll(".content a"));
    return links.map((a) => a.href).filter((url) => url.includes("?download"));
  });
  for (let i = 0; i < submissionLink.length; i++)
    await helpers.downloadFile(
      submissionLink[i],
      cookies,
      `${ASSIGNMENT_PATH}`,
      `download_${i}.txt`
    );

  console.log("Saving comments...");
  let comments = await page.evaluate(() => {
    let comments = document.querySelector(".content > .comments");
    return comments.innerText;
  });
  await helpers.writeFile(ASSIGNMENT_PATH, ".COMMENTS.txt", comments);

  page.close();
};

const scrapeAssignments = async (browser, cookiesRaw, url, dir) => {
  console.log("SCRAPING ASSIGNMENTS");
  fs.mkdirSync(`${dir}/ASSIGNMENTS`);

  console.log("Creating page and setting cookies...");
  const cookies = cookiesRaw.default;
  const page = await helpers.newPage(browser, cookies, `${url}/assignments`);

  console.log("Taking screenshot...");
  await page.screenshot({ path: `${dir}/page_preview.png` });

  console.log("Getting assignment links...");
  const assignments = await page.evaluate(() => {
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

  for (const assignment of assignments) {
    try {
      await scrapeAssignment(browser, cookies, assignment, dir);
    } catch (e) {
      console.log(e);
    }
  }

  await page.close();
};

export default scrapeAssignments;
