import fs from "fs";
import helpers from "../helpers.js";
import aHelpers from "./helpers.js";

const scrapeAssignment = async (browser, cookies, assignment, dir) => {
  assignment.name = helpers.stripInvalid(assignment.name);
  assignment.grade = helpers.stripInvalid(assignment.grade);
  console.log(`NOTE: ASSIGNMENT ${assignment.name} | STARTING SCRAPING`);

  // create assignment directory
  const ASSIGNMENT_PATH = `${dir}/ASSIGNMENTS/${assignment.name} (${assignment.grade})`;
  fs.mkdirSync(ASSIGNMENT_PATH);

  const page = await helpers.newPage(browser, cookies, assignment.url);
  // scrape comments
  try {
    await aHelpers.scrapeComments(page, ASSIGNMENT_PATH);
  } catch (e) {
    console.log(
      `ERROR: ASSIGNMENT ${assignment.name} | COULD NOT WRITE COMMENTS`
    );
    console.log(e);
  }

  // scrape description
  let problematic = [];
  try {
    problematic = problematic.concat(
      await aHelpers.scrapeDescription(
        page,
        cookies,
        `${ASSIGNMENT_PATH}/.ASSIGNMENT`
      )
    );
  } catch (e) {
    console.log(
      `ERROR: ASSIGNMENT ${assignment.name} | COULD NOT SCRAPE DESCRIPTION`
    );
    console.log(e);
  }

  // scrape submissions
  try {
    problematic = problematic.concat(
      await aHelpers.scrapeSubmission(page, cookies, ASSIGNMENT_PATH)
    );
  } catch (e) {
    console.log(
      `ERROR: ASSIGNMENT ${assignment.name} | COULD NOT SCRAPE SUBMISSIONS`
    );
    console.log(e);
  }

  // print warnings if any files could not be downloaded
  if (problematic.length > 0) {
    console.log(`WARNING: ASSIGNMENT ${assignment.name} | COULD NOT DOWNLOAD`);
    for (let file of problematic) console.log(`  ${file}`);
  }

  console.log(`NOTE: ASSIGNMENT ${assignment.name} | DONE SCRAPING`);
  page.close();
  return problematic;
};

const scrapeAssignments = async (browser, cookies, url, dir) => {
  console.log("=== SCRAPING ASSIGNMENTS ===");
  fs.mkdirSync(`${dir}/ASSIGNMENTS`);
  const page = await helpers.newPage(browser, cookies, `${url}/assignments`);
  await page.pdf({
    path: `${dir}/ASSIGNMENTS/.ASSIGNMENTS.pdf`,
    format: "Letter",
  });

  // wait for grades to load in
  let submissionsURL = `${url.replace(
    "/courses",
    "/api/v1/courses"
  )}/students/submissions?per_page=50`;
  try {
    await page.waitForResponse(submissionsURL, { timeout: 5000 });
  } catch (e) {
    console.log(
      "WARNING: COULD NOT GET SUBMISSIONS REQUEST, CONTINUING ANYWAY..."
    );
  }

  // get list of assignments
  let assignments;
  try {
    assignments = await aHelpers.getAssignments(page);
  } catch (e) {
    console.log("FAILURE: COULD NOT GET LIST OF ASSIGNMENTS");
    console.log(e);
    await page.close();
    return;
  }

  // scrape assignments
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

  // print summary
  try {
    aHelpers.printSummary(assignments, problematicTotal);
  } catch (e) {
    console.log("FAILURE: COULD NOT PRINT SUMMARY");
    console.log(e);
  }

  await page.close();
};

export default scrapeAssignments;
