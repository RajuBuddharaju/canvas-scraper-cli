import fs from "fs";
import helpers from "./helpers.js";
// import pLimit from "p-limit";

const scrapeAssignment = async (browser, cookies, assignment, dir) => {
  // create assignment directory
  assignment.name = helpers.stripInvalid(assignment.name);
  assignment.grade = helpers.stripInvalid(assignment.grade);
  console.log(`NOTE: ASSIGNMENT ${assignment.name} | STARTING SCRAPING`);
  const ASSIGNMENT_PATH = `${dir}/ASSIGNMENTS/${assignment.name} (${assignment.grade})`;
  fs.mkdirSync(ASSIGNMENT_PATH);

  const page = await helpers.newPage(browser, cookies, assignment.url);

  // print assignment preview
  fs.mkdirSync(`${ASSIGNMENT_PATH}/.ASSIGNMENT`);
  await page.pdf({
    path: `${ASSIGNMENT_PATH}/.ASSIGNMENT/.ASSIGNMENT.pdf`,
    format: "Letter",
  });

  // write comments
  try {
    let comments = await page.evaluate(() => {
      let comments = document.querySelector(".content > .comments");
      return comments.innerText;
    });
    await helpers.writeFile(ASSIGNMENT_PATH, ".COMMENTS.txt", comments);
  } catch (e) {
    console.log(
      `WARNING: ASSIGNMENT ${assignment.name} | COULD NOT WRITE COMMENTS`
    );
  }

  // gather links to files embeded into assignment description
  let dLinks = await page.evaluate(() => {
    let links = Array.from(
      document.querySelectorAll("#assignment_show .description a")
    );
    return links
      .map((a) => a.href)
      .filter((url) => url.includes("download?download"));
  });

  // gather links to download submitted file
  let sLinks = await page.evaluate(() => {
    let links = Array.from(document.querySelectorAll(".content a"));
    return links.map((a) => a.href).filter((url) => url.includes("?download"));
  });

  // download files
  let problematic = await helpers.downloadFiles(
    dLinks,
    cookies,
    `${ASSIGNMENT_PATH}/.ASSIGNMENT`
  );
  problematic = problematic.concat(
    await helpers.downloadFiles(sLinks, cookies, ASSIGNMENT_PATH)
  );
  if (problematic.length > 0) {
    console.log(`WARNING: ASSIGNMENT ${assignment.name} | COULD NOT DOWNLOAD`);
    for (let file of problematic) console.log(`  ${file}`);
  }

  console.log(`NOTE: ASSIGNMENT ${assignment.name} | DONE SCRAPING`);
  page.close();
  return problematic;
};

const scrapeAssignments = async (browser, cookiesRaw, url, dir) => {
  console.log("=== SCRAPING ASSIGNMENTS ===");
  fs.mkdirSync(`${dir}/ASSIGNMENTS`);

  const cookies = cookiesRaw.default;
  const page = await helpers.newPage(browser, cookies, `${url}/assignments`);
  await page.screenshot({ path: `${dir}/page_preview.png` });

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

  let problematicTotal = {};
  for (const assignment of assignments) {
    try {
      let problematic = await scrapeAssignment(
        browser,
        cookies,
        assignment,
        dir
      );
      if (problematic.length > 0)
        problematicTotal[assignment.name] = problematic;
    } catch (e) {
      console.log(`FAILURE: ASSIGNMENT ${assignment.name}`);
      console.log(e);
    }
  }

  console.log("=== ASSIGNMENTS SCRAPING SUMMARY ===");
  console.log(`TOTAL ASSIGNMENTS: ${assignments.length}`);
  if (Object.keys(problematicTotal).length > 0) {
    console.log("WARNING: Some files could not be downloaded");
    for (let assignment of Object.keys(problematicTotal)) {
      console.log(`ASSIGNMENT ${assignment}`);
      for (let file of problematicTotal[assignment]) {
        console.log(`  ${file}`);
      }
    }
  }

  await page.close();
};

export default scrapeAssignments;
