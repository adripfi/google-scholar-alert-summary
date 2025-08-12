function processScholarAlerts() {
  const query = 'from:scholaralerts-noreply@google.com';
  const MAX_THREADS = 250;
  const threads = GmailApp.search(query, 0, MAX_THREADS);
  const articles = new Map(); // key: title, value: { url, snippet, reasons: Set<string>, authors: string }

  // Regex to extract title, URL, snippet, and now authors.
  const articleRegex = /<h3[^>]*>[\s\S]*?(?:<span[^>]+class="gs_alrt_label"[^>]*>\[(.*?)\]<\/span>)?[\s\S]*?<a[^>]+href="([^"]+)"[^>]*class="gse_alrt_title"[^>]*>(.*?)<\/a>[\s\S]*?<div[^>]+style="color:#006621[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div[^>]+class="gse_alrt_sni"[^>]*>([\s\S]*?)<\/div>/g;
  
  threads.forEach(thread => {
    const reason = thread.getFirstMessageSubject().trim();
    thread.getMessages().forEach(msg => {
      const html = msg.getBody();
      let match;
      while ((match = articleRegex.exec(html)) !== null) {
        const url = decodeEntities(match[2]);
        const title = decodeEntities(match[3].trim());
        const authors = decodeEntities(match[4].trim()).replace(/<[^>]*>?/g, ''); // Extract authors and strip HTML
        const snippet = decodeEntities(match[5].replace(/<br\s*\/?>/gi, ' ').trim());
        Logger.log(title);

        if (!articles.has(title)) {
          articles.set(title, {
            url,
            snippet,
            reasons: new Set([reason]),
            authors
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

  // --- MODIFIED HTML GENERATION WITH GOOGLE SCHOLAR LAYOUT ---
  let htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
          
          body { 
            font-family: 'Inter', arial, sans-serif; 
            font-size: 13px;
            line-height: 1.6; 
            color: #222;
            background-color: #ffffff; 
            padding: 20px;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
          }
          .header { 
            text-align: left;
            margin-bottom: 20px; 
          }
          h1 { 
            font-size: 20px; 
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #2c3e50;
          }
          .alert-reason {
            font-style: italic;
            font-size: 11px;
            color: #7f8c8d;
            margin-bottom: 10px;
          }
          .article-block {
            margin-bottom: 30px; /* Increased space between articles */
          }
          .article-title {
            font-weight: normal; 
            margin: 0;
            font-size: 17px;
            line-height: 22px;
          }
          .article-title a {
            color: #1a0dab;
            text-decoration: none;
          }
          .article-title a:hover {
            text-decoration: underline;
          }
          .article-authors {
            color: #006621;
            line-height: 18px;
            margin-top: 5px;
            font-size: 13px;
          }
          .article-snippet {
            line-height: 17px;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Weekly Google Scholar Summary</h1>
            <p>Here are your deduplicated Google Scholar alerts.</p>
          </div>
  `;

  for (const [title, { url, snippet, reasons, authors }] of articles.entries()) {
    htmlBody += `
      <div class="article-block">
        <p class="alert-reason">Alert Reason: ${[...reasons].join(" • ")}</p>
        <h3 class="article-title"><a href="${url}">${title}</a></h3>
        <p class="article-authors">${authors}</p>
        <div class="article-snippet">${snippet}</div>
      </div>
    `;
  }

  htmlBody += `
        </div>
      </body>
    </html>
  `;

  GmailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    "Weekly Google Scholar Summary",
    "Your email client does not support HTML. Please view this message in a web browser.",
    { htmlBody: htmlBody }
  );

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
