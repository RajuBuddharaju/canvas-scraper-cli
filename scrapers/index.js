import scrapeAssignments from "./assignments/index.js";
import scrapeModules from "./modules/index.js";
import scrapeQuizzes from "./quizzes/index.js";
import scrapeAnnouncements from "./announcements/index.js"; 

const scrapers = {
  scrapeAssignments,
  scrapeModules,
  scrapeQuizzes,
  scrapeAnnouncements,
};

export default scrapers;
