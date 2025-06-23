function processScholarAlerts() {
  const query = 'from:scholaralerts-noreply@google.com';
  const threads = GmailApp.search(query);
  const articles = new Map(); // key: title, value: { url, snippet, reasons: Set<string> }

  const articleRegex = /<a[^>]+href="([^"]+)"[^>]*class="gse_alrt_title"[^>]*>(.*?)<\/a>[\s\S]*?<div[^>]+class="gse_alrt_sni"[^>]*>([\s\S]*?)<\/div>/g;

  threads.forEach(thread => {
    const reason = thread.getFirstMessageSubject().trim();
    thread.getMessages().forEach(msg => {
      const html = msg.getBody();
      let match;
      while ((match = articleRegex.exec(html)) !== null) {
        const url = decodeEntities(match[1]);
        const title = decodeEntities(match[2].trim());
        const snippet = decodeEntities(match[3].replace(/<br\s*\/?>/gi, ' ').trim());

        if (!articles.has(title)) {
          articles.set(title, {
            url,
            snippet,
            reasons: new Set([reason])
          });
        } else {
          articles.get(title).reasons.add(reason);
        }
      }
    });
  });

  if (articles.size === 0) {
    Logger.log("No articles found.");
    return;
  }

  // Compose HTML email
  let htmlBody = "<p>Here are your deduplicated Google Scholar alerts:</p>";
  for (const [title, { url, snippet, reasons }] of articles.entries()) {
    htmlBody += `<h3><a href="${url}">${title}</a></h3>`;
    htmlBody += `<p><em>${[...reasons].join("; ")}</em></p>`;
    htmlBody += `<p>${snippet}</p>`;
  }

  GmailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    "Weekly Google Scholar Summary",
    "Your email client does not support HTML. Please view this message in a web browser.",
    { htmlBody: htmlBody }
  );

  // Move threads to trash after successful send
  threads.forEach(thread => thread.moveToTrash());
}

// Decode HTML entities
function decodeEntities(text) {
  return text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&nbsp;/g, ' ');
}
