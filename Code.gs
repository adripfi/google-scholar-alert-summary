function processScholarAlerts() {
  const query = 'from:scholaralerts-noreply@google.com';
  // Set the maximum number of threads to process in one execution.
  const MAX_THREADS = 250;
  const threads = GmailApp.search(query, 0, MAX_THREADS);
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
        // Logger.log(title);

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

  // --- MODIFIED HTML GENERATION ---
  let htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
          
          body { 
            font-family: 'Inter', sans-serif; 
            line-height: 1.6; 
            color: #000000; /* Pure black font color */
            background-color: #f4f4f9; 
            padding: 20px; 
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background-color: #fff; 
            border-radius: 8px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            padding: 20px; 
          }
          .header { 
            text-align: left; /* Aligned left */
            padding-bottom: 0; 
            margin-bottom: 20px; 
          }
          h1 { 
            color: #2c3e50; 
            font-size: 24px; 
            margin-top: 0; 
          }
          .article-card { 
            border: 1px solid #ddd; 
            border-radius: 6px; 
            padding: 15px; 
            margin-bottom: 15px; 
            transition: box-shadow 0.3s ease; 
          }
          .article-card:hover { 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
          }
          .article-title a { 
            font-size: 18px; 
            font-weight: 600; 
            color: #3498db; 
            text-decoration: none; 
          }
          .article-title a:hover { 
            text-decoration: underline; 
          }
          .reasons { 
            font-style: italic; 
            color: #7f8c8d; 
            font-size: 12px; 
            margin-top: 5px; 
          }
          .snippet { 
            color: #555; 
            margin-top: 10px; 
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
  for (const [title, { url, snippet, reasons }] of articles.entries()) {
    htmlBody += `
      <div class="article-card">
        <h3 class="article-title"><a href="${url}">${title}</a></h3>
        <p class="reasons">${[...reasons].join(" • ")}</p>
        <p class="snippet">${snippet}</p>
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
