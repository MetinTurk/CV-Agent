// Self-contained heuristic extractor for job posting pages. Designed to be
// passed as the `func` argument to chrome.scripting.executeScript: the function
// is serialized and executed inside the target tab, so it must not reference
// any closure variables.
export function extractJobPosting() {
  function clean(value) {
    if (value === null || value === undefined) return null;
    const text = String(value).replace(/\s+/g, " ").trim();
    return text.length === 0 ? null : text;
  }

  function clip(value, max) {
    if (typeof value !== "string") return value;
    return value.length > max ? value.slice(0, max) : value;
  }

  function detectSite() {
    const host = (window.location.hostname || "").toLowerCase();
    if (host.includes("linkedin.com")) return "linkedin";
    if (host.includes("indeed.")) return "indeed";
    if (host.includes("kariyer.net")) return "kariyer-net";
    return "generic";
  }

  function detectLanguage(text) {
    if (!text) return "unknown";
    const sample = text.toLowerCase().slice(0, 4000);
    const trMarkers = [
      "ve", "için", "olan", "şirket", "iş", "deneyim", "gereken",
      "tercih", "çalışan", "aranıyor", "nitelikler", "sorumluluklar",
    ];
    const enMarkers = [
      "the", "and", "for", "with", "experience", "skills", "team",
      "work", "responsibilities", "requirements",
    ];
    const score = (markers) =>
      markers.reduce(
        (sum, word) => sum + (sample.includes(" " + word + " ") ? 1 : 0),
        0
      );
    const trHits = score(trMarkers);
    const enHits = score(enMarkers);
    if (trHits === 0 && enHits === 0) return "unknown";
    return trHits >= enHits ? "tr" : "en";
  }

  function detectWorkplace(text, location) {
    const haystack = ((text || "") + " " + (location || "")).toLowerCase();
    if (/(uzaktan|remote|home[- ]?office|work from home|tamamen uzaktan)/i.test(haystack)) {
      return "remote";
    }
    if (/(hibrit|hybrid)/i.test(haystack)) {
      return "hybrid";
    }
    if (/(ofiste|on[- ]?site|in[- ]?office|yüz yüze|on the job site)/i.test(haystack)) {
      return "onsite";
    }
    return "unknown";
  }

  function htmlToText(html) {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return clean(tmp.textContent) || "";
  }

  function getMeta(name) {
    const selectors = [
      "meta[name=\"" + name + "\"]",
      "meta[property=\"" + name + "\"]",
      "meta[property=\"og:" + name + "\"]",
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        const value = clean(el.getAttribute("content"));
        if (value) return value;
      }
    }
    return null;
  }

  function getJobPostingFromJsonLd() {
    const nodes = document.querySelectorAll('script[type="application/ld+json"]');
    for (const node of nodes) {
      const raw = node.textContent;
      if (!raw) continue;
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== "object") continue;
        const type = candidate["@type"];
        const isPosting =
          type === "JobPosting" ||
          (Array.isArray(type) && type.includes("JobPosting"));
        if (isPosting) return candidate;
        if (Array.isArray(candidate["@graph"])) {
          for (const graphNode of candidate["@graph"]) {
            const graphType = graphNode?.["@type"];
            if (
              graphType === "JobPosting" ||
              (Array.isArray(graphType) && graphType.includes("JobPosting"))
            ) {
              return graphNode;
            }
          }
        }
      }
    }
    return null;
  }

  function dedupe(items, maxItemLength) {
    const seen = new Set();
    const out = [];
    for (const item of items) {
      const trimmed = clean(item);
      if (trimmed === null) continue;
      if (trimmed.length < 3) continue;
      const clipped = trimmed.length > maxItemLength
        ? trimmed.slice(0, maxItemLength)
        : trimmed;
      if (seen.has(clipped)) continue;
      seen.add(clipped);
      out.push(clipped);
    }
    return out;
  }

  function listFromContainer(container, maxItems, maxItemLength) {
    if (!container) return [];
    const items = [];
    container.querySelectorAll("li").forEach((li) => {
      const text = clean(li.textContent);
      if (text) items.push(text);
    });
    return dedupe(items, maxItemLength).slice(0, maxItems);
  }

  function findSectionByHeading(pattern) {
    const headings = document.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, strong, b, p, span"
    );
    for (const heading of headings) {
      const text = (heading.textContent || "").toLowerCase();
      if (!pattern.test(text)) continue;
      // direct sibling list
      let cursor = heading.nextElementSibling;
      while (cursor) {
        if (cursor.tagName === "UL" || cursor.tagName === "OL") return cursor;
        if (cursor.querySelector && cursor.querySelector("li")) return cursor;
        if (/^H[1-6]$/.test(cursor.tagName)) break;
        cursor = cursor.nextElementSibling;
      }
      // parent's next sibling
      const parent = heading.parentElement;
      const parentNext = parent?.nextElementSibling;
      if (parentNext?.querySelector?.("li")) return parentNext;
    }
    return null;
  }

  function pickTextBySelectors(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = clean(el?.textContent);
      if (text) return text;
    }
    return null;
  }

  function pickHtmlBySelectors(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = clean(el.innerText || el.textContent);
        if (text) return text;
      }
    }
    return null;
  }

  function extractLocationFromJsonLd(jobLocation) {
    if (!jobLocation) return null;
    const list = Array.isArray(jobLocation) ? jobLocation : [jobLocation];
    const formatted = [];
    for (const entry of list) {
      if (!entry) continue;
      const address = entry.address || entry;
      if (typeof address === "string") {
        const value = clean(address);
        if (value) formatted.push(value);
        continue;
      }
      const parts = [
        address.addressLocality,
        address.addressRegion,
        address.addressCountry?.name || address.addressCountry,
      ]
        .map(clean)
        .filter(Boolean);
      if (parts.length > 0) formatted.push(parts.join(", "));
    }
    return formatted.length > 0 ? formatted[0] : null;
  }

  const sourceUrl = window.location.href;
  const sourceSite = detectSite();
  const jsonLd = getJobPostingFromJsonLd();

  let title = null;
  let companyName = null;
  let location = null;
  let employmentType = null;
  let descriptionText = "";
  let requirements = [];
  let responsibilities = [];
  let benefits = [];
  let seniority = null;

  if (jsonLd) {
    title = clean(jsonLd.title);
    const org = jsonLd.hiringOrganization;
    if (typeof org === "string") {
      companyName = clean(org);
    } else if (org && typeof org === "object") {
      companyName = clean(org.name);
    }
    location = extractLocationFromJsonLd(jsonLd.jobLocation);
    if (Array.isArray(jsonLd.employmentType)) {
      employmentType = clean(jsonLd.employmentType.join(", "));
    } else {
      employmentType = clean(jsonLd.employmentType);
    }
    if (jsonLd.description) {
      descriptionText = htmlToText(jsonLd.description);
    }
    if (jsonLd.experienceRequirements) {
      seniority = clean(
        typeof jsonLd.experienceRequirements === "string"
          ? jsonLd.experienceRequirements
          : jsonLd.experienceRequirements.description
      );
    }
  }

  if (sourceSite === "linkedin") {
    title = title || pickTextBySelectors([
      ".top-card-layout__title",
      ".jobs-unified-top-card__job-title",
      "[class*='top-card'] h1",
      "h1",
    ]);
    companyName = companyName || pickTextBySelectors([
      ".topcard__org-name-link",
      ".jobs-unified-top-card__company-name",
      "[class*='top-card'] a[href*='/company/']",
    ]);
    location = location || pickTextBySelectors([
      ".topcard__flavor--bullet",
      ".jobs-unified-top-card__bullet",
      "[class*='top-card'] .topcard__flavor",
    ]);
    if (!descriptionText) {
      descriptionText = pickHtmlBySelectors([
        ".description__text",
        ".jobs-description__content",
        ".jobs-description-content__text",
        "[class*='jobs-description']",
      ]) || "";
    }
  } else if (sourceSite === "kariyer-net") {
    title = title || pickTextBySelectors([
      "[class*='positionTitle']",
      "[data-testid*='title']",
      "h1",
    ]);
    companyName = companyName || pickTextBySelectors([
      "[class*='companyName']",
      "[data-testid*='company']",
      "a[href*='/firma/']",
    ]);
    location = location || pickTextBySelectors([
      "[class*='location']",
      "[data-testid*='location']",
    ]);
    if (!descriptionText) {
      descriptionText = pickHtmlBySelectors([
        "[class*='jobDetail']",
        "[class*='description']",
        "[data-testid*='description']",
        "main",
      ]) || "";
    }
  } else if (sourceSite === "indeed") {
    title = title || pickTextBySelectors([
      "h1[data-testid='jobsearch-JobInfoHeader-title']",
      ".jobsearch-JobInfoHeader-title",
      "h1",
    ]);
    companyName = companyName || pickTextBySelectors([
      "[data-testid='inlineHeader-companyName']",
      ".jobsearch-CompanyInfoContainer a",
      "[data-company-name]",
    ]);
    location = location || pickTextBySelectors([
      "[data-testid='inlineHeader-companyLocation']",
      ".jobsearch-JobInfoHeader-subtitle div",
    ]);
    if (!descriptionText) {
      descriptionText = pickHtmlBySelectors([
        "#jobDescriptionText",
        ".jobsearch-jobDescriptionText",
      ]) || "";
    }
  }

  if (!title) {
    title = clean(document.querySelector("h1")?.textContent) || getMeta("og:title") || clean(document.title);
  }
  if (!companyName) {
    companyName = getMeta("og:site_name");
  }
  if (!descriptionText || descriptionText.length < 200) {
    const candidate = document.querySelector("main, article, [role='main']") || document.body;
    descriptionText = clean(candidate?.innerText || candidate?.textContent) || descriptionText;
  }

  const requirementsRoot = findSectionByHeading(
    /(aranan nitelikler|gereksinimler|qualifications|requirements|nitelikler|aradığımız|adayda)/i
  );
  if (requirementsRoot) requirements = listFromContainer(requirementsRoot, 20, 240);

  const responsibilitiesRoot = findSectionByHeading(
    /(sorumluluklar|responsibilities|görev|duties|what you'?ll do|iş tanımı|pozisyonun)/i
  );
  if (responsibilitiesRoot) {
    responsibilities = listFromContainer(responsibilitiesRoot, 20, 280);
  }

  const benefitsRoot = findSectionByHeading(
    /(yan haklar|benefits|perks|sunduklarımız|imkanlar|sunduğumuz|ne sunuyoruz)/i
  );
  if (benefitsRoot) benefits = listFromContainer(benefitsRoot, 12, 240);

  if (descriptionText.length > 24000) {
    descriptionText = descriptionText.slice(0, 24000);
  }

  const language = detectLanguage(descriptionText);
  const workplaceType = detectWorkplace(descriptionText, location);

  return {
    sourceUrl: clip(sourceUrl, 4096),
    sourceSite,
    title: title ? clip(title, 240) : null,
    companyName: companyName ? clip(companyName, 180) : null,
    location: location ? clip(location, 180) : null,
    employmentType: employmentType ? clip(employmentType, 120) : null,
    workplaceType,
    descriptionText,
    requirements,
    responsibilities,
    benefits,
    seniority: seniority ? clip(seniority, 120) : null,
    language,
    extractedAt: new Date().toISOString(),
  };
}
