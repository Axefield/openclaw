# Quick Start Guide - HTML Templates

**Get your first branded email sent in 15 minutes**

---

## ⚡ Fast Track: Your First Email

### Step 1: Open `complete-article-example.html`
This file has everything you need for a full article.

### Step 2: Find and Replace These Items

#### Required Replacements:
1. **Article Title** (Line ~75): Change "What the Court Documents Reveal..."
2. **Article Content** (Lines ~120-250): Replace sample text with your content
3. **Donation Links** (Search for `href="#"`): Add your actual donation URLs
4. **Social Links** (Bottom of file): Verify X/Twitter and website URLs

#### Optional Replacements:
- Category badge (Line ~70): Change "EVIDENCE DROP #1" to match your content type
- Author meta (Line ~95): Update date and read time
- P.S. teaser (Near end): Customize for your next article

### Step 3: Test
1. Copy the entire HTML
2. Paste into a new email in your email client OR Substack's HTML editor
3. Send test to yourself
4. Verify all links work

### Step 4: Send! 🚀

---

## 🎨 All Available Images (Ready to Use)

```html
<!-- Main Logo (Color - use on light backgrounds) -->
<img src="https://www.jeffbuongiorno.com/wp-content/uploads/2024/02/jeffforcongresslogo.png" 
     alt="Jeff Buongiorno for Congress" 
     style="max-width: 300px; width: 100%; height: auto;">

<!-- White Logo (use on dark backgrounds) -->
<img src="https://www.jeffbuongiorno.com/wp-content/uploads/2022/08/jeffforcongresslogo_white.png" 
     alt="Jeff Buongiorno for Congress" 
     style="max-width: 300px; width: 100%; height: auto;">

<!-- Portrait (transparent background) -->
<img src="https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/bongiman4sml.png" 
     alt="Jeffrey Buongiorno" 
     style="max-width: 350px; width: 100%; height: auto;">

<!-- Flag Background (use as CSS background) -->
<div style="background-image: url('https://www.jeffbuongiorno.com/wp-content/uploads/2024/06/briflag.png'); 
            background-size: cover; 
            background-position: center;">
    <!-- Your content here -->
</div>
```

---

## 📂 Template Files Explained

### Core Templates (Use these most often)

**1. header-template.html**
- Professional header with logo and slogan
- Copy/paste at top of every email
- Already uses white logo on navy background

**2. donation-cta-section.html**
- Three-tier donation call-to-action
- Copy/paste near end of articles
- UPDATE ALL `href="#"` WITH REAL LINKS

**3. footer-signature.html**
- Professional closer with signature
- Social links and engagement prompt
- Copy/paste at bottom of every email

### Special Purpose Templates

**4. evidence-card.html**
- For court documents and receipts
- Use in Evidence Drop articles
- Customize document details and links

**5. four-pillars-section.html**
- Campaign positioning display
- Use in launch article and about sections
- Content is already written

**6. stats-dashboard.html**
- Financial transparency display
- Use in Weekly Recap articles
- UPDATE ALL NUMBERS WITH REAL DATA

**7. quote-highlight.html**
- Pull quotes in three styles
- Use to break up long articles
- Customize quote text

### Advanced Templates

**8. hero-with-portrait-flag.html**
- Four different hero layouts using portrait and flag
- Perfect for launch article
- Already has all real image URLs

**9. article-hero-section.html**
- Dynamic article intro section
- Category badges for different content types
- Customizable background image

**10. complete-article-example.html**
- **START HERE** - Full article combining multiple templates
- Shows how everything fits together
- Real example you can modify

---

## 🔗 Link Checklist

Before sending ANY email, replace these placeholders:

### Donation Links (Critical!)
```html
<!-- Find and replace ALL instances of: -->
YOUR_CORE_TEAM_LINK_HERE
YOUR_MONTHLY_LINK_HERE
YOUR_ONE_TIME_LINK_HERE
YOUR_DONATION_LINK_HERE

<!-- With your actual donation URLs from WinRed, ActBlue, etc. -->
```

### Social Media Links
```html
<!-- Already correct in templates: -->
https://x.com/JeffBuongiorno  ✅
https://www.jeffbuongiorno.com/  ✅

<!-- Add if you have: -->
YOUR_FACEBOOK_LINK_HERE (update if you have campaign Facebook)
```

### Document Links (for Evidence Drops)
```html
<!-- Replace with actual document URLs: -->
YOUR_DOCUMENT_LINK_HERE
YOUR_ANALYSIS_LINK_HERE
```

---

## 📝 Content Types & Which Templates to Use

### Evidence Drop (Tuesdays)
**Combine:**
1. header-template.html (top)
2. article-hero-section.html (optional hero)
3. Your article text
4. evidence-card.html (for each document)
5. donation-cta-section.html (donation ask)
6. footer-signature.html (closer)

**See:** `examples/EVIDENCE-DROP-EXAMPLE.md` for content

---

### Strategy Brief (Thursdays)
**Combine:**
1. header-template.html (top)
2. Your article text
3. four-pillars-section.html (if discussing positioning)
4. donation-cta-section.html (donation ask)
5. footer-signature.html (closer)

**See:** `examples/STRATEGY-BRIEF-EXAMPLE.md` for content

---

### Call-to-Action / Donation Drive (Saturdays)
**Combine:**
1. header-template.html (top)
2. Your article text
3. donation-cta-section.html (primary focus - customize heavily)
4. footer-signature.html (closer)

**See:** `examples/CTA-DONATION-DRIVE-EXAMPLE.md` for content

---

### Weekly Recap (Sundays)
**Combine:**
1. header-template.html (top)
2. stats-dashboard.html (UPDATE WITH REAL DATA)
3. Your recap text
4. donation-cta-section.html (donation ask)
5. footer-signature.html (closer)

**See:** `examples/WEEKLY-RECAP-EXAMPLE.md` for content

---

### Launch Article (Day 1)
**Combine:**
1. hero-with-portrait-flag.html (use the first hero layout)
2. Your launch story
3. four-pillars-section.html (positioning)
4. donation-cta-section.html (three tiers)
5. footer-signature.html (closer)

**See:** `examples/LAUNCH-ARTICLE-DAY-1.md` for content

---

## 🎨 Brand Colors (Copy/Paste Ready)

```css
Navy Blue: #000033
Campaign Red: #C14644
White: #ffffff
Gray Text: #666666
Light Background: #f8f9fa
Border Gray: #e9ecef
Warning Yellow: #fff3cd
Success Green: #2ecc71
```

---

## 🧪 Testing Checklist

Before sending to your full list:

### Visual Test
- [ ] Open in Chrome (or your browser)
- [ ] Check on mobile (or resize browser window)
- [ ] All images loading?
- [ ] Text readable on all backgrounds?
- [ ] No weird spacing/formatting?

### Link Test
- [ ] Click every button and link
- [ ] Donation links go to correct pages
- [ ] Social links work
- [ ] Document links (if applicable) accessible

### Content Test
- [ ] No "YOUR_*_LINK_HERE" placeholders remaining
- [ ] All sample text replaced with real content
- [ ] Numbers/stats accurate (if using dashboard)
- [ ] Correct date/author info

### Email Test
- [ ] Send test to yourself
- [ ] Check in Gmail
- [ ] Check in Outlook (if possible)
- [ ] Check on phone
- [ ] Verify everything still works

---

## 🚨 Common Mistakes to Avoid

### Mistake 1: Forgetting to Update Links
**Problem:** Buttons go nowhere (still have `href="#"`)

**Fix:** Search entire document for `href="#"` and replace with real URLs

---

### Mistake 2: Text on Flag Background Unreadable
**Problem:** Tried to put text directly on flag image

**Fix:** Always use overlay:
```html
background: linear-gradient(rgba(0, 0, 51, 0.85), rgba(0, 0, 51, 0.85)), 
            url('FLAG_URL_HERE');
```

---

### Mistake 3: Logo Wrong Color for Background
**Problem:** Navy logo on navy background (invisible)

**Fix:** 
- Light backgrounds → Use color logo (.../jeffforcongresslogo.png)
- Dark backgrounds → Use white logo (.../jeffforcongresslogo_white.png)

---

### Mistake 4: Forgot to Update Stats Dashboard Numbers
**Problem:** Weekly recap shows fake data

**Fix:** Search for `$8,340`, `47`, etc. and replace with real numbers from your records

---

### Mistake 5: Missing FEC Disclaimer on Fundraising Content
**Problem:** Could violate campaign finance law

**Fix:** Always include at bottom of donation sections:
```html
<p style="font-size: 12px; opacity: 0.7;">
    Federal law requires us to collect your employer and occupation 
    for donations over $200. Contributions are not tax-deductible. 
    Maximum: $3,300 per election.
</p>
```

---

## 💡 Pro Tips

### Tip 1: Save Your Favorites
After customizing templates, save completed versions as:
- `MY-header-template.html`
- `MY-footer-template.html`

Then just copy/paste your personalized versions.

---

### Tip 2: Batch Content Creation
Write 3-4 articles in one session, then schedule them. Much more efficient than writing one at a time.

---

### Tip 3: Reuse Successful Elements
If a particular CTA or quote gets lots of clicks/shares, save it and use variations in future emails.

---

### Tip 4: Keep a Swipe File
Create a folder with:
- Best headlines
- Successful CTAs
- Good quotes
- High-performing graphics

Reference when creating new content.

---

### Tip 5: Test, Measure, Improve
Track:
- Open rates (by subject line)
- Click rates (by CTA placement/wording)
- Donation conversion (by tier emphasized)

Double down on what works.

---

## 📞 Need Help?

### Documentation
- **README.md** - Full template documentation
- **IMAGE-ASSETS.md** - All images with URLs and usage
- **complete-article-example.html** - See everything in action

### Example Content
- **../examples/** folder - Five complete article examples with actual content

### Implementation
- **../QUICK-START-CHECKLIST.md** - 30-day implementation plan

---

## ✅ Your Next Steps

1. **[ ] Read** `complete-article-example.html` - See how templates combine
2. **[ ] Customize** first article using example content
3. **[ ] Test** by sending to yourself
4. **[ ] Send** your first campaign email!
5. **[ ] Track** results and improve next time

---

**You have everything you need. Now go build something different.**

**Make Elections Constitutional Again** 🇺🇸

